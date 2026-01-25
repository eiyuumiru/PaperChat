/**
 * API utility for calling backend endpoints (Account Pool mode)
 * This provides an alternative to direct Puter.js calls
 */

// Storage key for account pool setting
const ACCOUNT_POOL_KEY = 'useAccountPool';

// Get account pool setting from localStorage (default: false)
export function getUseAccountPool(): boolean {
    return localStorage.getItem(ACCOUNT_POOL_KEY) === 'true';
}

// Set account pool setting
export function setUseAccountPool(value: boolean): void {
    localStorage.setItem(ACCOUNT_POOL_KEY, value.toString());
}

// For backward compatibility
export const USE_ACCOUNT_POOL = getUseAccountPool();

interface ApiResponse<T> {
    success?: boolean;
    error?: boolean;
    code?: string;
    message?: string;
    response?: string;
    data?: T;
}

interface ChatRequest {
    model: string;
    messages: Array<{ role: string; content: string | any[] }>;
    language?: string;
    [key: string]: any;
}

/**
 * Generic API call function
 */
async function apiCall<T>(
    endpoint: string,
    body: ChatRequest
): Promise<ApiResponse<T>> {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || `API error: ${response.status}`);
    }

    return data;
}

/**
 * Chat API call
 */
export async function chatViaPool(request: ChatRequest): Promise<string> {
    const result = await apiCall<{ response: string }>('/api/chat', request);

    if (result.error) {
        throw new Error(result.message || 'Chat API error');
    }

    return result.response || '';
}
