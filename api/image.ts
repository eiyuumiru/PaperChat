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
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt, model, language = 'vi' } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        let lastError: Error | null = null;

        // Retry loop
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            // Get account from pool (medium tier for image)
            const { account, error } = await getAccountForService('image');

            if (error || !account) {
                return res.status(503).json(getPoolExhaustedError(language));
            }

            try {
                // Call Puter AI
                const result = await generateImage(account.auth_token, { prompt, model });

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
                    imageUrl: result.imageUrl,
                });
            } catch (apiError: unknown) {
                const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);

                // Check if insufficient credits for this service
                if (isInsufficientCreditsError(errorMessage)) {
                    // Don't mark as exhausted - account may still work for cheaper services
                    lastError = apiError instanceof Error ? apiError : new Error(errorMessage);
                    continue;
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
        console.error('Image API error:', error);
        return res.status(500).json({
            error: true,
            message: error instanceof Error ? error.message : 'Internal server error',
        });
    }
}
