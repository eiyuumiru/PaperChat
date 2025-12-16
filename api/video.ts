import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    getAccountForService,
    refreshAccountCredits,
    getPoolExhaustedError,
    isInsufficientCreditsError,
} from './_lib/accountPool.js';
import { generateVideo, getMonthlyUsage } from './_lib/puterClient.js';

const MAX_RETRIES = 3;

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    console.log('[Video API] Request received:', req.method);

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt, model, seconds, size, testMode, language = 'vi' } = req.body;
        console.log('[Video API] Body:', { prompt: prompt?.substring(0, 50), model, seconds, size, testMode, language });

        if (!prompt) {
            console.log('[Video API] Missing prompt');
            return res.status(400).json({ error: 'Prompt is required' });
        }

        let lastError: Error | null = null;

        // Retry loop
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            console.log(`[Video API] Attempt ${attempt + 1}/${MAX_RETRIES}`);

            // Get account from pool (most credits for video)
            const { account, error } = await getAccountForService('video');
            console.log('[Video API] Account result:', { hasAccount: !!account, error, accountId: account?.id });

            if (error || !account) {
                console.log('[Video API] Pool exhausted');
                return res.status(503).json(getPoolExhaustedError(language));
            }

            try {
                console.log('[Video API] Calling Puter API...');

                // Call Puter AI
                const result = await generateVideo(account.auth_token, {
                    prompt,
                    model,
                    seconds,
                    size,
                    testMode,
                });
                console.log('[Video API] Puter response received');

                // Refresh credits after successful call
                try {
                    const usage = await getMonthlyUsage(account.auth_token);
                    await refreshAccountCredits(account.id, usage.creditsRemaining);
                    console.log('[Video API] Credits refreshed:', usage.creditsRemaining);
                } catch (usageError) {
                    console.error('[Video API] Failed to refresh credits:', usageError);
                }

                // Return response
                return res.status(200).json({
                    success: true,
                    videoUrl: result.videoUrl,
                });
            } catch (apiError: unknown) {
                const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
                console.error('[Video API] Puter API error:', errorMessage);

                // Check if insufficient credits for this service
                if (isInsufficientCreditsError(errorMessage)) {
                    lastError = apiError instanceof Error ? apiError : new Error(errorMessage);
                    continue;
                }

                // Other error - throw immediately
                throw apiError;
            }
        }

        // All retries failed
        console.log('[Video API] All retries failed');
        return res.status(503).json({
            error: true,
            code: 'MAX_RETRIES_EXCEEDED',
            message: lastError?.message || 'All accounts exhausted',
        });
    } catch (error) {
        console.error('[Video API] Fatal error:', error);
        return res.status(500).json({
            error: true,
            message: error instanceof Error ? error.message : 'Internal server error',
        });
    }
}
