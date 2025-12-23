import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    getAccountForService,
    refreshAccountCredits,
    getPoolExhaustedError,
    isInsufficientCreditsError,
} from './_lib/accountPool.js';
import { chat, uploadFile, getMonthlyUsage } from './_lib/puterClient.js';
import { markAccountExhausted } from './_lib/db.js';

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
        const { model, messages, language = 'vi' } = req.body;
        console.log('[Chat API] Body:', { model, messagesCount: messages?.length, language });

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

                // Create a copy of messages to avoid modifying the original during retries
                // and handle any Base64 file uploads
                const processedMessages = await Promise.all(messages.map(async (msg: any) => {
                    if (Array.isArray(msg.content)) {
                        const processedContent = await Promise.all(msg.content.map(async (item: any, itemIndex: number) => {
                            if (item.type === 'file' && item.base64) {
                                console.log('[Chat API] Uploading file for pool account:', item.name);
                                try {
                                    const fileName = buildSafeFileName('chat_pool', item.name, item.mimeType, itemIndex);
                                    const puterPath = await uploadFile(account.auth_token, item.base64, fileName, item.mimeType);
                                    console.log(`[Chat API] File uploaded to: ${puterPath}`);
                                    // Puter REST API expects 'puter_path' property for AI models
                                    return {
                                        type: 'file',
                                        puter_path: puterPath
                                    };
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
                const result = await chat(account.auth_token, { model, messages: processedMessages });
                console.log('[Chat API] Puter response received');

                // Refresh credits after successful call
                try {
                    const usage = await getMonthlyUsage(account.auth_token);
                    await refreshAccountCredits(account.id, usage.creditsRemaining);
                    console.log('[Chat API] Credits refreshed:', usage.creditsRemaining);
                    if (usage.creditsRemaining <= 0) {
                        console.log(`[Chat API] Account ${account.id} credits depleted, marking as exhausted`);
                        await markAccountExhausted(account.id);
                    }
                } catch (usageError) {
                    console.error('[Chat API] Failed to refresh credits:', usageError);
                }

                // Return response
                return res.status(200).json({
                    success: true,
                    response: result.response,
                    usage: result.usage,
                });
            } catch (apiError: unknown) {
                const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
                console.error('[Chat API] Puter API error:', errorMessage);

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
