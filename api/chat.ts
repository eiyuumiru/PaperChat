import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    getAccountForService,
    refreshAccountCredits,
    getPoolExhaustedError,
    isInsufficientCreditsError,
} from '../lib/accountPool';
import { chat, getMonthlyUsage } from '../lib/puterClient';

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
        const { model, messages, language = 'vi' } = req.body;
        console.log('[Chat API] Body:', { model, messagesCount: messages?.length, language });

        if (!model || !messages || !Array.isArray(messages)) {
            console.log('[Chat API] Invalid request body');
            return res.status(400).json({ error: 'Invalid request body' });
        }

        let lastError: Error | null = null;

        // Retry loop
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            console.log(`[Chat API] Attempt ${attempt + 1}/${MAX_RETRIES}`);

            // Get account from pool (low tier for chat)
            const { account, error } = await getAccountForService('chat');
            console.log('[Chat API] Account result:', { hasAccount: !!account, error });

            if (error || !account) {
                console.log('[Chat API] Pool exhausted');
                return res.status(503).json(getPoolExhaustedError(language));
            }

            try {
                console.log('[Chat API] Calling Puter API with auth token:', account.auth_token.substring(0, 10) + '...');

                // Call Puter AI
                const result = await chat(account.auth_token, { model, messages });
                console.log('[Chat API] Puter response received');

                // Refresh credits after successful call
                try {
                    const usage = await getMonthlyUsage(account.auth_token);
                    await refreshAccountCredits(account.id, usage.creditsRemaining);
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
                    // Don't mark as exhausted - account may still work for cheaper services
                    // Just skip and try another account
                    lastError = apiError instanceof Error ? apiError : new Error(errorMessage);
                    continue; // Retry with another account
                }

                // Other error - throw immediately
                throw apiError;
            }
        }

        // All retries failed
        console.log('[Chat API] All retries failed');
        return res.status(503).json({
            error: true,
            code: 'MAX_RETRIES_EXCEEDED',
            message: lastError?.message || 'All accounts exhausted',
        });
    } catch (error) {
        console.error('[Chat API] Fatal error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        return res.status(500).json({
            error: true,
            message: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        });
    }
}

