import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    getAccountForService,
    refreshAccountCredits,
    getPoolExhaustedError,
    isInsufficientCreditsError,
    getVideoInsufficientCreditsError,
} from './_lib/accountPool.js';
import { generateVideo, getMonthlyUsage } from './_lib/puterClient.js';
import { createAuditLog } from './_lib/db.js';

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

        // Get account from pool (most credits for video) - only try once
        const { account, error } = await getAccountForService('video');
        console.log('[Video API] Account result:', { hasAccount: !!account, error, accountId: account?.id });

        if (error || !account) {
            console.log('[Video API] Pool exhausted');
            return res.status(503).json(getPoolExhaustedError(language));
        }

        try {
            console.log('[Video API] Calling Puter API...');

            // Store credits before for audit
            const creditsBefore = account.credits_remaining;

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
            let creditsAfter = creditsBefore;
            try {
                const usage = await getMonthlyUsage(account.auth_token);
                creditsAfter = usage.creditsRemaining;
                await refreshAccountCredits(account.id, usage.creditsRemaining);
                console.log('[Video API] Credits refreshed:', usage.creditsRemaining);
            } catch (usageError) {
                console.error('[Video API] Failed to refresh credits:', usageError);
            }

            // Create success audit log
            await createAuditLog({
                account_id: account.id,
                account_email: account.email,
                service: 'video',
                action: 'request',
                credits_before: creditsBefore,
                credits_after: creditsAfter,
                account_status: account.status,
            });

            // Return response
            return res.status(200).json({
                success: true,
                videoUrl: result.videoUrl,
            });
        } catch (apiError: unknown) {
            const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
            console.error('[Video API] Puter API error:', errorMessage);

            // Create error audit log
            await createAuditLog({
                account_id: account.id,
                account_email: account.email,
                service: 'video',
                action: 'error',
                credits_before: account.credits_remaining,
                account_status: account.status,
                error_message: errorMessage,
            });

            // Check if insufficient credits - return error immediately (no retry, no contact info)
            if (isInsufficientCreditsError(errorMessage)) {
                console.log('[Video API] Insufficient credits for video generation');
                return res.status(503).json(getVideoInsufficientCreditsError(language));
            }

            // Other error
            throw apiError;
        }
    } catch (error) {
        console.error('[Video API] Fatal error:', error);
        return res.status(500).json({
            error: true,
            message: error instanceof Error ? error.message : 'Internal server error',
        });
    }
}
