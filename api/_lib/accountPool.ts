import {
    getAccountWithLeastCredits,
    updateAccountCredits,
    type Account,
} from './db.js';


export type ServiceType = 'chat';

interface AccountResult {
    account: Account | null;
    error?: string;
}

/**
 * Get an account suitable for the given service type
 * Selection logic:
 * - chat: use account with LEAST credits (chat is cheap)
 */
export async function getAccountForService(
    serviceType: ServiceType
): Promise<AccountResult> {
    try {
        let account: Account | null = null;

        if (serviceType === 'chat') {
            account = await getAccountWithLeastCredits();
        }

        if (!account) {
            return {
                account: null,
                error: 'POOL_EXHAUSTED',
            };
        }

        return { account };
    } catch (error) {
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
