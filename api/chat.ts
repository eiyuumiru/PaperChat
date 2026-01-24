import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    getAccountForService,
    refreshAccountCredits,
    getPoolExhaustedError,
    isInsufficientCreditsError,
} from './_lib/accountPool.js';
import { chat, uploadFile, getMonthlyUsage } from './_lib/puterClient.js';
import { markAccountExhausted, createAuditLog } from './_lib/db.js';

const MAX_RETRIES = 3;
const MIME_EXTENSION_MAP: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
};

function getExtensionFromName(name?: string): string {
    if (!name) return '';
    const dotIndex = name.lastIndexOf('.');
    if (dotIndex <= 0 || dotIndex >= name.length - 1) return '';
    const ext = name.slice(dotIndex + 1).toLowerCase();
    return /^[a-z0-9]+$/.test(ext) ? ext : '';
}

function getExtensionFromMime(mimeType?: string): string {
    if (!mimeType) return '';
    return MIME_EXTENSION_MAP[mimeType.toLowerCase()] || '';
}

function buildSafeFileName(
    prefix: string,
    name: string | undefined,
    mimeType: string | undefined,
    index: number
): string {
    const ext = getExtensionFromName(name) || getExtensionFromMime(mimeType) || 'bin';
    return `${prefix}_${Date.now()}_${index}.${ext}`;
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    console.log('[Chat API] Request received:', req.method);

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { model, messages, language = 'vi', ...extraParams } = req.body;
        console.log('[Chat API] Request Body:', JSON.stringify(req.body, null, 2));
        console.log('[Chat API] Parameters:', { model, messagesCount: messages?.length, language, extraParams });

        if (!model || !messages || !Array.isArray(messages)) {
            console.log('[Chat API] Invalid request body');
            return res.status(400).json({ error: 'Invalid request body' });
        }


        // Retry loop
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            console.log(`[Chat API] Attempt ${attempt + 1}/${MAX_RETRIES}`);

            // Get account from pool (least credits for chat)
            const { account, error } = await getAccountForService('chat');
            console.log('[Chat API] Account result:', { hasAccount: !!account, error, accountId: account?.id });

            if (error || !account) {
                console.log('[Chat API] Pool exhausted');
                return res.status(503).json(getPoolExhaustedError(language));
            }
            if (account.credits_remaining <= 0) {
                console.log(`[Chat API] Account ${account.id} has no credits, marking as exhausted`);
                await markAccountExhausted(account.id);
                continue;
            }

            try {
                console.log('[Chat API] Processing messages and calling Puter API...');

                // Store credits before for audit
                const creditsBefore = account.credits_remaining;

                // Create a copy of messages and handle any Base64 file uploads
                // Using OpenAI "Responses API" format as required by the openai-completion delegate
                const processedMessages = await Promise.all(messages.map(async (msg: any) => {
                    if (Array.isArray(msg.content)) {
                        const processedContent = await Promise.all(msg.content.map(async (item: any, itemIndex: number) => {
                            if (item.type === 'text') {
                                return {
                                    type: 'input_text',
                                    text: item.text
                                };
                            }
                            if (item.type === 'file' && item.base64) {
                                console.log('[Chat API] Uploading file for pool account:', item.name);
                                try {
                                    const fileName = buildSafeFileName('chat_pool', item.name, item.mimeType, itemIndex);
                                    const puterPath = await uploadFile(account.auth_token, item.base64, fileName, item.mimeType);
                                    console.log(`[Chat API] File uploaded to: ${puterPath}`);
                                    const isImage = item.mimeType?.startsWith('image/');

                                    const rawBase64 = item.base64.includes(',') ? item.base64.split(',')[1] : item.base64;
                                    if (isImage) {
                                        // Realtime API / Responses Beta uses 'image' property for raw base64
                                        return {
                                            type: 'input_image',
                                            image: rawBase64
                                        };
                                    } else {
                                        // Realtime API / Responses Beta uses 'file' property for raw base64
                                        return {
                                            type: 'input_file',
                                            file: rawBase64
                                        };
                                    }
                                } catch (uploadError: any) {
                                    console.error('[Chat API] File upload failed:', uploadError);
                                    throw new Error(`Server-side file upload failed: ${uploadError.message || uploadError.toString()}`);
                                }
                            }
                            return item;
                        }));
                        return { ...msg, content: processedContent };
                    }
                    return msg;
                }));

                // Call Puter AI
                const result = await chat(account.auth_token, {
                    model,
                    messages: processedMessages,
                    vision: true,
                    ...extraParams
                });
                console.log('[Chat API] Puter response received');

                // Refresh credits after successful call
                let creditsAfter = creditsBefore;
                try {
                    const usage = await getMonthlyUsage(account.auth_token);
                    creditsAfter = usage.creditsRemaining;
                    await refreshAccountCredits(account.id, usage.creditsRemaining);
                    console.log('[Chat API] Credits refreshed:', usage.creditsRemaining);
                    if (usage.creditsRemaining <= 0) {
                        console.log(`[Chat API] Account ${account.id} credits depleted, marking as exhausted`);
                        await markAccountExhausted(account.id);
                    }
                } catch (usageError) {
                    console.error('[Chat API] Failed to refresh credits:', usageError);
                }

                // Create success audit log
                await createAuditLog({
                    account_id: account.id,
                    account_email: account.email,
                    service: 'chat',
                    action: 'request',
                    credits_before: creditsBefore,
                    credits_after: creditsAfter,
                    account_status: account.status,
                });

                // Return response
                return res.status(200).json({
                    success: true,
                    response: result.response,
                    usage: result.usage,
                });
            } catch (apiError: unknown) {
                const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
                console.error('[Chat API] Puter API error:', errorMessage);

                // Create error audit log
                await createAuditLog({
                    account_id: account.id,
                    account_email: account.email,
                    service: 'chat',
                    action: 'error',
                    credits_before: account.credits_remaining,
                    account_status: account.status,
                    error_message: errorMessage,
                });

                // Check if insufficient credits for this service
                if (isInsufficientCreditsError(errorMessage)) {
                    console.log(`[Chat API] Account ${account.id} has insufficient credits, marking as exhausted`);
                    // Mark this account as exhausted so next retry picks a different account
                    await markAccountExhausted(account.id);
                    continue; // Retry with another account
                }

                // Other error - throw immediately
                throw apiError;
            }
        }

        // All retries failed - all accounts exhausted
        console.log('[Chat API] All retries failed - pool exhausted');
        return res.status(503).json(getPoolExhaustedError(language));
    } catch (error) {
        console.error('[Chat API] Fatal error:', error);
        return res.status(500).json({
            error: true,
            message: error instanceof Error ? error.message : 'Internal server error',
        });
    }
}
