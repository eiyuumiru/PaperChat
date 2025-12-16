import {
    getAccountByTier,
    getAccountWithMinCredits,
    getAnyActiveAccount,
    updateAccountCredits,
    markAccountExhausted,
    type Account,
} from './db.js';

// Credit thresholds in microcents (1 USD = 100,000,000 microcents)
const MICROCENTS_PER_DOLLAR = 100_000_000;
const LOW_TIER_MAX = 0.1 * MICROCENTS_PER_DOLLAR; // < $0.10
const MEDIUM_TIER_MAX = 0.4 * MICROCENTS_PER_DOLLAR; // $0.10 - $0.40
// HIGH_TIER = > $0.40

export type ServiceType = 'chat' | 'image' | 'video';

interface AccountResult {
    account: Account | null;
    error?: string;
}

/**
 * Get an account suitable for the given service type
 * Tier selection:
 * - chat: Low tier (< $0.10)
 * - image: Medium tier ($0.10 - $0.40)
 * - video: High tier (> $0.40)
 * With fallback to other tiers if no suitable account found
 */
export async function getAccountForService(
    serviceType: ServiceType
): Promise<AccountResult> {
    let account: Account | null = null;

    try {
        switch (serviceType) {
            case 'chat':
                // Try low tier first (< $0.10)
                account = await getAccountByTier(0, LOW_TIER_MAX);
                // Fallback: any active account
                if (!account) {
                    account = await getAnyActiveAccount();
                }
                break;

            case 'image':
                // Try medium tier first ($0.10 - $0.40)
                account = await getAccountByTier(LOW_TIER_MAX, MEDIUM_TIER_MAX);
                // Fallback: low tier
                if (!account) {
                    account = await getAccountByTier(0, LOW_TIER_MAX);
                }
                // Fallback: high tier
                if (!account) {
                    account = await getAccountWithMinCredits(MEDIUM_TIER_MAX);
                }
                break;

            case 'video':
                // Try high tier first (> $0.40)
                account = await getAccountWithMinCredits(MEDIUM_TIER_MAX);
                // Fallback: medium tier
                if (!account) {
                    account = await getAccountByTier(LOW_TIER_MAX, MEDIUM_TIER_MAX);
                }
                // Fallback: low tier
                if (!account) {
                    account = await getAccountByTier(0, LOW_TIER_MAX);
                }
                break;
        }

        if (!account) {
            return {
                account: null,
                error: 'POOL_EXHAUSTED',
            };
        }

        return { account };
    } catch (error) {
        console.error('Error getting account for service:', error);
        return {
            account: null,
            error: 'DATABASE_ERROR',
        };
    }
}

/**
 * Refresh account credits after API call
 * Also checks if account should be marked as exhausted
 */
export async function refreshAccountCredits(
    accountId: number,
    creditsRemaining: number
): Promise<void> {
    await updateAccountCredits(accountId, creditsRemaining);

    // Check if account is effectively exhausted (< $0.001)
    // This means no more API calls are possible
    const EXHAUSTED_THRESHOLD = 0.001 * MICROCENTS_PER_DOLLAR; // $0.001
    if (creditsRemaining < EXHAUSTED_THRESHOLD) {
        await markAccountExhausted(accountId);
    }
}

/**
 * Check if error is due to insufficient credits
 * Returns true if should skip this account for current service
 */
export function isInsufficientCreditsError(errorMessage: string): boolean {
    const keywords = ['insufficient', 'quota', 'exceeded', 'limit'];
    const lowercased = errorMessage.toLowerCase();
    return keywords.some(k => lowercased.includes(k));
}

/**
 * NOTE: We do NOT mark account as exhausted on rate limit or insufficient credits
 * for a specific service. The account may still have enough for cheaper services.
 * We only mark exhausted when credits_remaining < threshold (in refreshAccountCredits).
 */

/**
 * Generate pool exhausted error response
 */
export function getPoolExhaustedError(language: 'vi' | 'en' = 'vi') {
    return {
        error: true,
        code: 'POOL_EXHAUSTED',
        message:
            language === 'vi'
                ? 'Hệ thống tạm thời hết credits. Vui lòng liên hệ admin qua Discord/Email để được hỗ trợ.'
                : 'System temporarily out of credits. Please contact admin via Discord/Email for support.',
        contact: {
            discord: 'https://discord.gg/your-server',
            email: 'admin@example.com',
        },
    };
}
