/**
 * API utility for calling backend endpoints (Account Pool mode)
 * This provides an alternative to direct Puter.js calls
 */

// Check if we should use the account pool backend
export const USE_ACCOUNT_POOL = (import.meta as unknown as { env: Record<string, string> }).env.VITE_USE_ACCOUNT_POOL === 'true';

interface ApiResponse<T> {
    success?: boolean;
    error?: boolean;
    code?: string;
    message?: string;
    response?: string;
    imageUrl?: string;
    videoUrl?: string;
    data?: T;
}

interface ChatRequest {
    model: string;
    messages: Array<{ role: string; content: string }>;
    language?: string;
}

interface ImageRequest {
    prompt: string;
    model?: string;
    language?: string;
}

interface VideoRequest {
    prompt: string;
    model?: string;
    seconds?: number;
    size?: string;
    testMode?: boolean;
    language?: string;
}

/**
 * Generic API call function
 */
async function apiCall<T>(
    endpoint: string,
    body: ChatRequest | ImageRequest | VideoRequest
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

/**
 * Image generation API call
 */
export async function generateImageViaPool(request: ImageRequest): Promise<string> {
    const result = await apiCall<{ imageUrl: string }>('/api/image', request);

    if (result.error) {
        throw new Error(result.message || 'Image API error');
    }

    return result.imageUrl || '';
}

/**
 * Video generation API call
 */
export async function generateVideoViaPool(request: VideoRequest): Promise<string> {
    const result = await apiCall<{ videoUrl: string }>('/api/video', request);

    if (result.error) {
        throw new Error(result.message || 'Video API error');
    }

    return result.videoUrl || '';
}
