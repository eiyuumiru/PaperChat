import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    getAccountForService,
    refreshAccountCredits,
    getPoolExhaustedError,
    isInsufficientCreditsError,
} from './_lib/accountPool.js';
import { chat, getMonthlyUsage } from './_lib/puterClient.js';

const MAX_RETRIES = 3;

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { model, messages, language = 'vi' } = req.body;

        if (!model || !messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        let lastError: Error | null = null;

        // Retry loop
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            // Get account from pool (low tier for chat)
            const { account, error } = await getAccountForService('chat');

            if (error || !account) {
                return res.status(503).json(getPoolExhaustedError(language));
            }

            try {
                // Call Puter AI
                const result = await chat(account.auth_token, { model, messages });

                // Refresh credits after successful call
                try {
                    const usage = await getMonthlyUsage(account.auth_token);
                    await refreshAccountCredits(account.id, usage.creditsRemaining);
                } catch (usageError) {
                    console.error('Failed to refresh credits:', usageError);
                }

                // Return response
                return res.status(200).json({
                    success: true,
                    response: result.response,
                    usage: result.usage,
                });
            } catch (apiError: unknown) {
                const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);

                // Check if insufficient credits for this service
                if (isInsufficientCreditsError(errorMessage)) {
                    lastError = apiError instanceof Error ? apiError : new Error(errorMessage);
                    continue; // Retry with another account
                }

                // Other error - throw immediately
                throw apiError;
            }
        }

        // All retries failed
        return res.status(503).json({
            error: true,
            code: 'MAX_RETRIES_EXCEEDED',
            message: lastError?.message || 'All accounts exhausted',
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({
            error: true,
            message: error instanceof Error ? error.message : 'Internal server error',
        });
    }
}
