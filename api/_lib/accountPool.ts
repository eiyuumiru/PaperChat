import {
    getAccountWithLeastCredits,
    getAccountWithMostCredits,
    getAccountWithMiddleCredits,
    updateAccountCredits,
    markAccountExhausted,
    type Account,
} from './db.js';

// Minimum credits threshold (100K tokens ≈ $0.001)
const MIN_CREDITS_THRESHOLD = 100_000;

export type ServiceType = 'chat' | 'image' | 'video';

interface AccountResult {
    account: Account | null;
    error?: string;
}

/**
 * Get an account suitable for the given service type
 * Selection logic:
 * - chat: use account with LEAST credits (chat is cheap)
 * - image: use account with MIDDLE credits (medium cost)
 * - video: use account with MOST credits (most expensive)
 */
export async function getAccountForService(
    serviceType: ServiceType
): Promise<AccountResult> {
    try {
        let account: Account | null = null;

        switch (serviceType) {
            case 'chat':
                // Chat is cheap - use account with least credits
                account = await getAccountWithLeastCredits();
                break;

            case 'image':
                // Image is medium - use account in the middle
                account = await getAccountWithMiddleCredits();
                break;

            case 'video':
                // Video is expensive - use account with most credits
                account = await getAccountWithMostCredits();
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
 * Note: Does NOT auto-mark as exhausted - only chat API should do that
 */
export async function refreshAccountCredits(
    accountId: number,
    creditsRemaining: number
): Promise<void> {
    await updateAccountCredits(accountId, creditsRemaining);
}

/**
 * Check if error is due to insufficient credits
 */
export function isInsufficientCreditsError(errorMessage: string): boolean {
    const keywords = ['insufficient', 'quota', 'exceeded', 'limit'];
    const lowercased = errorMessage.toLowerCase();
    return keywords.some(k => lowercased.includes(k));
}

/**
 * Generate pool exhausted error response
 */
export function getPoolExhaustedError(language: 'vi' | 'en' = 'vi') {
    return {
        error: true,
        code: 'POOL_EXHAUSTED',
        message:
            language === 'vi'
                ? 'Hệ thống tạm thời hết credits. Vui lòng liên hệ admin qua Discord/Facebook để được hỗ trợ.'
                : 'System temporarily out of credits. Please contact admin via Discord/Facebook for support.',
        contact: {
            discord: 'yukinee_.',
            facebook: 'https://www.facebook.com/yukinee283/',
        },
    };
}

/**
 * Generate video insufficient credits error (no contact info - video is expensive)
 */
export function getVideoInsufficientCreditsError(language: 'vi' | 'en' = 'vi') {
    return {
        error: true,
        code: 'VIDEO_INSUFFICIENT_CREDITS',
        message:
            language === 'vi'
                ? 'Không đủ credits để tạo video. Video tốn rất nhiều credits (~$0.50/video).'
                : 'Insufficient credits for video generation. Video is very expensive (~$0.50/video).',
    };
}
