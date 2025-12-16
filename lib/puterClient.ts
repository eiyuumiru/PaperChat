// Puter.js wrapper for server-side usage
// Note: This uses dynamic import since Puter.js may need special handling in Node.js

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatOptions {
    model: string;
    messages: ChatMessage[];
}

export interface ImageOptions {
    prompt: string;
    model?: string;
}

export interface VideoOptions {
    prompt: string;
    model?: string;
    seconds?: number;
    size?: string;
    testMode?: boolean;
}

/**
 * Initialize Puter client with auth token
 */
async function initPuter(authToken: string) {
    // Dynamic import for server-side
    const init = require('@heyputer/puter.js/src/init.cjs');
    return init({ authToken });
}

/**
 * Chat with AI model
 */
export async function chat(
    authToken: string,
    options: ChatOptions
): Promise<{ response: string; usage?: unknown }> {
    const puter = await initPuter(authToken);

    const response = await puter.ai.chat(options.model, options.messages);

    return {
        response: typeof response === 'string' ? response : response?.message?.content || '',
        usage: response?.usage,
    };
}

/**
 * Generate image
 */
export async function generateImage(
    authToken: string,
    options: ImageOptions
): Promise<{ imageUrl: string }> {
    const puter = await initPuter(authToken);

    const result = await puter.ai.txt2img(options.prompt, options.model);

    return { imageUrl: result };
}

/**
 * Generate video
 */
export async function generateVideo(
    authToken: string,
    options: VideoOptions
): Promise<{ videoUrl: string }> {
    const puter = await initPuter(authToken);

    const result = await puter.ai.txt2vid(options.prompt, {
        model: options.model,
        seconds: options.seconds || 4,
        size: options.size || '1280x720',
        testMode: options.testMode || false,
    });

    return { videoUrl: result };
}

/**
 * Get monthly usage for the account
 */
export async function getMonthlyUsage(
    authToken: string
): Promise<{ creditsRemaining: number; usage: Record<string, unknown> }> {
    const puter = await initPuter(authToken);

    const usageData = await puter.auth.getMonthlyUsage();

    // credits_remaining is in microcents
    return {
        creditsRemaining: usageData.credit_for_period - usageData.total_cost,
        usage: usageData.usage,
    };
}
