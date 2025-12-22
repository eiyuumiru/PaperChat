import { randomUUID } from 'node:crypto';
// Puter REST API client for server-side usage
// Uses direct HTTP calls instead of Puter.js SDK (which requires browser environment)

const PUTER_API_ORIGIN = 'https://api.puter.com';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | any[];
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

interface DriverCallRequest {
    interface: string;
    driver: string;
    method: string;
    args: Record<string, unknown>;
    auth_token: string;
    test_mode?: boolean;
}

interface DriverCallResponse {
    success?: boolean;
    result?: unknown;
    error?: {
        code?: string;
        message?: string;
    };
    message?: {
        content?: string;
    };
}

/**
 * Make a driver call to Puter API
 */
async function driverCall(
    authToken: string,
    driverInterface: string,
    driverName: string,
    driverMethod: string,
    args: Record<string, unknown>,
    testMode: boolean = false
): Promise<unknown> {
    const requestBody: DriverCallRequest = {
        interface: driverInterface,
        driver: driverName,
        method: driverMethod,
        args,
        auth_token: authToken,
        test_mode: testMode,
    };


    const response = await fetch(`${PUTER_API_ORIGIN}/drivers/call`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'Origin': 'https://puter.com',
            'Referer': 'https://puter.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Puter API] Error response:', response.status, errorText);
        throw new Error(`Puter API error: ${response.status} - ${errorText}`);
    }

    // Check if response is binary (image or video)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.startsWith('image/') || contentType.startsWith('video/')) {
        // Return media as base64 data URL
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = contentType.split(';')[0];
        return { src: `data:${mimeType};base64,${base64}` };
    }

    const data: DriverCallResponse = await response.json();

    if (data.success === false) {
        console.error('[Puter API] Driver call failed:', JSON.stringify(data, null, 2));
        throw new Error(data.error?.message || data.error?.code || JSON.stringify(data.error) || 'Puter driver call failed');
    }

    return data.result !== undefined ? data.result : data;
}

/**
 * Chat with AI model
 */
export async function chat(
    authToken: string,
    options: ChatOptions
): Promise<{ response: string; usage?: unknown }> {
    const result = await driverCall(
        authToken,
        'puter-chat-completion',
        'ai-chat',
        'complete',
        {
            messages: options.messages,
            model: options.model,
        }
    ) as { message?: { content?: string }; usage?: unknown };

    return {
        response: result?.message?.content || '',
        usage: result?.usage,
    };
}

/**
 * Generate image
 */
export async function generateImage(
    authToken: string,
    options: ImageOptions
): Promise<{ imageUrl: string }> {
    const result = await driverCall(
        authToken,
        'puter-image-generation',
        'ai-image',
        'generate',
        {
            prompt: options.prompt,
            model: options.model,
        }
    );

    // Result could be a URL string or base64 data
    let imageUrl: string;
    if (typeof result === 'string') {
        imageUrl = result;
    } else if (result && typeof result === 'object' && 'src' in result) {
        imageUrl = (result as { src: string }).src;
    } else {
        throw new Error('Unexpected image response format');
    }

    return { imageUrl };
}

/**
 * Generate video
 */
export async function generateVideo(
    authToken: string,
    options: VideoOptions
): Promise<{ videoUrl: string }> {
    const model = options.model || 'sora-2';

    // Detect driver based on model name
    let driver = 'openai-video-generation'; // default for sora
    const modelLower = model.toLowerCase();

    if (modelLower.includes('sora')) {
        driver = 'openai-video-generation';
    } else if (
        modelLower.includes('veo') ||
        modelLower.includes('google') ||
        modelLower.includes('kling') ||
        modelLower.includes('kwaivgi') ||
        modelLower.includes('minimax') ||
        modelLower.includes('hailuo') ||
        modelLower.includes('video-01') ||
        modelLower.includes('wan') ||
        modelLower.includes('seedance') ||
        modelLower.includes('bytedance') ||
        modelLower.includes('pixverse') ||
        modelLower.includes('vidu') ||
        model.includes('/')  // Any model with / is likely from Together
    ) {
        driver = 'together-video-generation';
    }

    console.log('[Video API] Using driver:', driver, 'for model:', model);

    const result = await driverCall(
        authToken,
        'puter-video-generation',
        driver,
        'generate',
        {
            prompt: options.prompt,
            model: model,
            seconds: options.seconds || 4,
            size: options.size || '1280x720',
        },
        options.testMode || false
    );

    // Result could be a URL string or video element data
    let videoUrl: string;
    if (typeof result === 'string') {
        videoUrl = result;
    } else if (result && typeof result === 'object' && 'src' in result) {
        videoUrl = (result as { src: string }).src;
    } else {
        throw new Error('Unexpected video response format');
    }

    return { videoUrl };
}

/**
 * Get monthly usage for the account
 */
export async function getMonthlyUsage(
    authToken: string
): Promise<{ creditsRemaining: number; usage: Record<string, unknown> }> {
    // Use metering/usage endpoint
    const response = await fetch(`${PUTER_API_ORIGIN}/metering/usage`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get usage: ${response.status}`);
    }

    const data = await response.json();

    // Use allowanceInfo.remaining for credits (in tokens)
    return {
        creditsRemaining: data.allowanceInfo?.remaining || 0,
        usage: data.usage || {},
    };
}

/**
 * Upload a file to Puter FS using /batch endpoint and mandatory metadata JSONs
 * This matches the exact wire format used by the Puter SDK (v2)
 */
export async function uploadFile(
    authToken: string,
    base64Content: string,
    fileName: string
): Promise<string> {
    const filePath = fileName.startsWith('/') ? fileName : `/${fileName}`;
    const parentPath = filePath.substring(0, filePath.lastIndexOf('/')) || '/';
    const nameOnly = filePath.split('/').pop() || fileName;

    console.log(`[Puter Upload] Uploading to /batch: ${parentPath} + ${nameOnly}`);

    const binaryContent = Buffer.from(base64Content, 'base64');
    const mimeType = (function (name) {
        const ext = name.split('.').pop()?.toLowerCase();
        if (ext === 'png') return 'image/png';
        if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
        if (ext === 'pdf') return 'application/pdf';
        if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        if (ext === 'ipynb') return 'application/x-ipynb+json';
        return 'application/octet-stream';
    })(nameOnly);

    const operationId = randomUUID();

    // Modern FormData for Node.js
    const formData = new FormData();

    // Standard Puter Batch format: 
    // 1. 'operations' field containing a JSON array of operations
    // 2. 'file_N' and 'fileinfo_N' fields matching item_upload_id: N in the operations
    const operations = [{
        op: 'write',
        dedupe_name: false,
        overwrite: true,
        create_missing_ancestors: true,
        operation_id: operationId,
        path: parentPath,
        name: nameOnly,
        item_upload_id: 0
    }];

    formData.append('operations', JSON.stringify(operations));

    // The actual binary data. 
    // IMPORTANT: Puter's /batch endpoint expects the field name to be the item_upload_id (e.g., "0")
    const blob = new Blob([binaryContent], { type: mimeType });
    formData.append('0', blob, nameOnly);

    // Metadata for index 0
    formData.append('fileinfo_0', JSON.stringify({
        name: nameOnly,
        type: mimeType,
        size: binaryContent.length
    }));

    const response = await fetch(`${PUTER_API_ORIGIN}/batch`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Origin': 'https://puter.com',
            'Referer': 'https://puter.com/',
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Puter Upload] Error:', response.status, errorText);
        throw new Error(`Puter upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as any;
    console.log('[Puter Upload] Success:', JSON.stringify(result));

    // Puter returns results in an array for batch calls, usually in a 'results' property
    const results = result.results || (Array.isArray(result) ? result : [result]);
    const writeResult = results[0];

    // Check for APIError structure which uses '$' and 'status'
    if (!writeResult || writeResult.error || writeResult['$']?.includes('APIError') || writeResult.status === 'batch_too_many_files') {
        const errorMsg = writeResult?.error?.message || writeResult?.status || writeResult?.message || 'Unknown batch error';
        console.error('[Puter Upload] Operation failed:', JSON.stringify(writeResult));
        throw new Error(`Puter upload operation failed: ${errorMsg}`);
    }

    return writeResult.path || writeResult.result?.path || filePath;
}
