import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    getAccountForService,
    refreshAccountCredits,
    getPoolExhaustedError,
    isInsufficientCreditsError,
} from './_lib/accountPool.js';
import { generateImage, getMonthlyUsage } from './_lib/puterClient.js';

const MAX_RETRIES = 3;

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    console.log('[Image API] Request received:', req.method);

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt, model, language = 'vi' } = req.body;
        console.log('[Image API] Body:', { prompt: prompt?.substring(0, 50), model, language });

        if (!prompt) {
            console.log('[Image API] Missing prompt');
            return res.status(400).json({ error: 'Prompt is required' });
        }


        // Retry loop
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            console.log(`[Image API] Attempt ${attempt + 1}/${MAX_RETRIES}`);

            // Get account from pool (middle credits for image)
            const { account, error } = await getAccountForService('image');
            console.log('[Image API] Account result:', { hasAccount: !!account, error, accountId: account?.id });

            if (error || !account) {
                console.log('[Image API] Pool exhausted');
                return res.status(503).json(getPoolExhaustedError(language));
            }

            try {
                console.log('[Image API] Calling Puter API...');

                // Call Puter AI
                const result = await generateImage(account.auth_token, { prompt, model });
                console.log('[Image API] Puter response received');

                // Refresh credits after successful call
                try {
                    const usage = await getMonthlyUsage(account.auth_token);
                    await refreshAccountCredits(account.id, usage.creditsRemaining);
                    console.log('[Image API] Credits refreshed:', usage.creditsRemaining);
                } catch (usageError) {
                    console.error('[Image API] Failed to refresh credits:', usageError);
                }

                // Return response
                return res.status(200).json({
                    success: true,
                    imageUrl: result.imageUrl,
                });
            } catch (apiError: unknown) {
                const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
                console.error('[Image API] Puter API error:', errorMessage);

                // Check if insufficient credits - retry with another account (don't mark exhausted)
                if (isInsufficientCreditsError(errorMessage)) {
                    console.log(`[Image API] Account ${account.id} has insufficient credits, trying next account`);
                    continue;
                }

                // Other error - throw immediately
                throw apiError;
            }
        }

        // All retries failed - all accounts don't have enough credits
        console.log('[Image API] All retries failed - pool exhausted');
        return res.status(503).json(getPoolExhaustedError(language));
    } catch (error) {
        console.error('[Image API] Fatal error:', error);
        return res.status(500).json({
            error: true,
            message: error instanceof Error ? error.message : 'Internal server error',
        });
    }
}
