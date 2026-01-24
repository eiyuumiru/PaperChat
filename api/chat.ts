import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    getAccountForService,
    refreshAccountCredits,
    getPoolExhaustedError,
    isInsufficientCreditsError,
} from './_lib/accountPool.js';
import { chat, getMonthlyUsage } from './_lib/puterClient.js';
import { markAccountExhausted, createAuditLog } from './_lib/db.js';
import { parseFileContent } from './_lib/fileParser.js';

const MAX_RETRIES = 3;

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
                // Using OpenAI Responses API format (input_text, input_image, input_file)
                // The Puter delegate requires this specific format
                const processedMessages = await Promise.all(messages.map(async (msg: any) => {
                    if (Array.isArray(msg.content)) {
                        const processedContent: any[] = [];
                        const textParts: string[] = [];

                        for (const item of msg.content) {
                            if (item.type === 'text') {
                                textParts.push(item.text);
                            } else if (item.type === 'file' && item.base64) {
                                // Ensure we have raw base64 data (without data: prefix)
                                const rawBase64 = item.base64.includes(',')
                                    ? item.base64.split(',')[1]
                                    : item.base64;

                                // Use the new file parser
                                const parsed = await parseFileContent(
                                    rawBase64,
                                    item.mimeType || '',
                                    item.name || 'file'
                                );

                                console.log('[Chat API] Parsed file:', item.name, 'type:', parsed.type);

                                switch (parsed.type) {
                                    case 'text':
                                        // Append extracted text to the message
                                        textParts.push(parsed.content || '');
                                        break;
                                    case 'image':
                                        // Pass image as input_image
                                        processedContent.push({
                                            type: 'input_image',
                                            image_url: parsed.dataUri
                                        });
                                        break;
                                    case 'file':
                                        // Pass PDF as input_file
                                        processedContent.push({
                                            type: 'input_file',
                                            filename: item.name || 'document.pdf',
                                            file_data: parsed.dataUri
                                        });
                                        break;
                                    case 'unsupported':
                                        // Throw error for unsupported files
                                        throw new Error(parsed.error || `File type "${item.mimeType}" is not supported.`);
                                }
                            }
                        }

                        // Combine all text parts into a single input_text
                        if (textParts.length > 0) {
                            processedContent.push({
                                type: 'input_text',
                                text: textParts.join('\n\n')
                            });
                        }

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
