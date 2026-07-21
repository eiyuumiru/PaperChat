import { randomUUID } from 'node:crypto';
import { posix as pathPosix } from 'node:path';
// Puter REST API client for server-side usage
// Uses direct HTTP calls instead of Puter.js SDK (which requires browser environment)

const PUTER_API_ORIGIN = 'https://api.puter.com';

const EXTENSION_MIME_MAP: Record<string, string> = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.markdown': 'text/markdown',
    '.csv': 'text/csv',
    '.tsv': 'text/tab-separated-values',
    '.json': 'application/json',
    '.jsonl': 'application/x-ndjson',
    '.yaml': 'text/yaml',
    '.yml': 'text/yaml',
    '.xml': 'application/xml',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.cjs': 'application/javascript',
    '.ts': 'application/typescript',
    '.tsx': 'application/typescript',
    '.jsx': 'application/javascript',
    '.pdf': 'application/pdf',
    '.ipynb': 'application/x-ipynb+json',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.rtf': 'application/rtf',
    '.odt': 'application/vnd.oasis.opendocument.text',
    '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
    '.odp': 'application/vnd.oasis.opendocument.presentation',
    '.epub': 'application/epub+zip',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
};

function inferMimeType(fileName: string): string | null {
    const ext = pathPosix.extname(fileName).toLowerCase();
    return EXTENSION_MIME_MAP[ext] || null;
}

function normalizeMimeType(fileName: string, mimeType: string | undefined | null): string {
    const trimmed = (mimeType || '').trim();
    if (trimmed && trimmed !== 'application/octet-stream') {
        return trimmed;
    }

    return inferMimeType(fileName) || 'application/octet-stream';
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | any[];
}

export interface ChatOptions {
    model: string;
    messages: ChatMessage[];
    [key: string]: any;
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
        throw new Error(`Puter API error: ${response.status}`);
    }

    const data: DriverCallResponse = await response.json();

    if (data.success === false) {
        throw new Error(data.error?.message || data.error?.code || 'Puter driver call failed');
    }

    return data.result !== undefined ? data.result : data;
}

/**
 * Detect credit/quota errors so we can let the account pool handle them
 * (mark exhausted + retry with another account) instead of falling back.
 */
function isLikelyCreditError(errorMessage: string): boolean {
    const lower = errorMessage.toLowerCase();
    return ['insufficient', 'quota', 'exceeded', 'limit'].some((k) => lower.includes(k));
}

/**
 * Convert the internal (Responses-style) content parts produced by the /api/chat
 * handler into the OpenAI Chat Completions format expected by the
 * OpenAI-compatible endpoint. Only used by the fallback path below.
 * Plain string content and already-OpenAI-shaped parts are passed through.
 */
function toOpenAIMessages(messages: ChatMessage[]): unknown[] {
    return messages.map((msg) => {
        if (!Array.isArray(msg.content)) {
            return msg;
        }

        const content = msg.content.map((item: any) => {
            if (!item || typeof item !== 'object') return item;
            switch (item.type) {
                case 'input_text':
                    return { type: 'text', text: item.text ?? '' };
                case 'input_image':
                    return {
                        type: 'image_url',
                        image_url: {
                            url: typeof item.image_url === 'string' ? item.image_url : item.image_url?.url,
                        },
                    };
                case 'input_file':
                    return {
                        type: 'file',
                        file: { filename: item.filename, file_data: item.file_data },
                    };
                default:
                    // Already OpenAI-shaped (text / image_url / file) or unknown — leave as-is.
                    return item;
            }
        });

        return { ...msg, content };
    });
}

/**
 * Fallback chat via Puter's stable OpenAI-compatible endpoint.
 * Uses the same Puter auth token and supports GPT/Claude/Gemini/Grok models.
 * https://api.puter.com/puterai/openai/v1/chat/completions
 */
async function chatViaOpenAI(
    authToken: string,
    model: string,
    messages: ChatMessage[]
): Promise<{ response: string; usage?: unknown }> {
    const response = await fetch(`${PUTER_API_ORIGIN}/puterai/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
            model,
            messages: toOpenAIMessages(messages),
        }),
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Puter OpenAI endpoint error: ${response.status}${errText ? ` - ${errText}` : ''}`);
    }

    const data = await response.json();
    const choice = Array.isArray(data?.choices) ? data.choices[0] : undefined;
    const content = choice?.message?.content;

    let responseText = '';
    if (typeof content === 'string') {
        responseText = content;
    } else if (Array.isArray(content)) {
        responseText = content
            .filter((item: any) => (item?.type === 'text' || item?.type === 'output_text') && item?.text)
            .map((item: any) => item.text)
            .join('');
    }

    return {
        response: responseText,
        usage: data?.usage,
    };
}

/**
 * Chat with AI model.
 *
 * Primary path: the `ai-chat` router driver via /drivers/call (routes to the
 * right provider based on `model`). Because `ai-chat` is undocumented and Puter
 * has changed it before, on a non-credit failure we fall back to the stable
 * OpenAI-compatible endpoint. The fallback only runs when the primary call
 * throws, so the happy path is completely unaffected.
 */
export async function chat(
    authToken: string,
    options: ChatOptions
): Promise<{ response: string; usage?: unknown }> {
    const { messages, model, ...extraParams } = options;

    try {
        const result = await driverCall(
            authToken,
            'puter-chat-completion',
            'ai-chat',
            'complete',
            {
                messages,
                model,
                ...extraParams,
            }
        ) as { message?: { content?: string | Array<{ type: string; text?: string }> }; usage?: unknown };

        // Handle content as string or array (Claude returns array format)
        let responseText = '';
        const content = result?.message?.content;
        if (typeof content === 'string') {
            responseText = content;
        } else if (Array.isArray(content)) {
            // Extract text from array format: [{ type: "text", text: "..." }]
            responseText = content
                .filter((item) => item.type === 'text' && item.text)
                .map((item) => item.text)
                .join('');
        }

        return {
            response: responseText,
            usage: result?.usage,
        };
    } catch (primaryError) {
        const message = primaryError instanceof Error ? primaryError.message : String(primaryError);

        // Credit/quota errors must propagate so the pool marks the account
        // exhausted and retries with a different account — never fall back here.
        if (isLikelyCreditError(message)) {
            throw primaryError;
        }

        // Driver failed for another reason (e.g. driver removed/renamed) — try
        // the OpenAI-compatible endpoint as a resilience fallback.
        try {
            return await chatViaOpenAI(authToken, model, messages);
        } catch {
            // Surface the original driver error so pool handling stays accurate.
            throw primaryError;
        }
    }
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

const whoamiCache = new Map<string, { appUid: string | null; fetchedAt: number }>();
const WHOAMI_TTL_MS = 5 * 60 * 1000;

function extractAppUid(payload: any): string | null {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    return (
        payload.app_uid ||
        payload.appId ||
        payload.app_id ||
        payload.appUID ||
        payload.appUid ||
        payload.app?.uid ||
        payload.app?.id ||
        payload.app?.app_uid ||
        null
    );
}

async function getAppUid(authToken: string): Promise<string | null> {
    const envAppUid = process.env.PUTER_APP_UID?.trim();
    if (envAppUid) {
        return envAppUid;
    }

    const cached = whoamiCache.get(authToken);
    const now = Date.now();
    if (cached && now - cached.fetchedAt < WHOAMI_TTL_MS) {
        return cached.appUid;
    }

    try {
        const response = await fetch(`${PUTER_API_ORIGIN}/whoami`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            whoamiCache.set(authToken, { appUid: null, fetchedAt: now });
            return null;
        }

        const data = await response.json();
        const appUid = extractAppUid(data);
        whoamiCache.set(authToken, { appUid: appUid || null, fetchedAt: now });
        return appUid || null;
    } catch (error) {
        whoamiCache.set(authToken, { appUid: null, fetchedAt: now });
        return null;
    }
}

/**
 * Upload a file to Puter FS using /batch endpoint and mandatory metadata JSONs
 * This matches the exact wire format used by the Puter SDK (v2)
 */
export async function uploadFile(
    authToken: string,
    base64Content: string,
    fileName: string,
    mimeType: string = 'application/octet-stream'
): Promise<string> {
    const appUid = await getAppUid(authToken);
    const isAbsolutePath = fileName.startsWith('/') || fileName.startsWith('~/');
    const baseUploadPath = appUid ? `~/AppData/${appUid}/uploads` : '~/Documents/uploads';
    const filePath = isAbsolutePath ? fileName : `${baseUploadPath}/${fileName}`;
    const parentPath = pathPosix.dirname(filePath);
    const finalName = pathPosix.basename(filePath);
    const buffer = Buffer.from(base64Content, 'base64');
    const safeMimeType = normalizeMimeType(fileName, mimeType);

    const operationId = randomUUID();
    const socketId = randomUUID();

    const operation: Record<string, unknown> = {
        op: 'write',
        dedupe_name: false,
        overwrite: true,
        create_missing_ancestors: true,
        operation_id: operationId,
        path: parentPath,
        name: finalName,
        item_upload_id: 0,
    };

    if (appUid) {
        operation.app_uid = appUid;
    }

    const form = new FormData();
    form.append('operation_id', operationId);
    form.append('socket_id', socketId);
    form.append('original_client_socket_id', socketId);
    form.append('fileinfo', JSON.stringify({
        name: finalName,
        type: safeMimeType,
        size: buffer.length,
    }));
    form.append('operation', JSON.stringify(operation));
    form.append('file', new Blob([buffer], { type: safeMimeType }), finalName);

    const response = await fetch(`${PUTER_API_ORIGIN}/batch`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Origin': 'https://puter.work',
            'Referer': 'https://puter.work/',
            'User-Agent': 'puter-js/1.0',
            'Accept': '*/*',
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: form,
    });

    const responseText = await response.text();
    let data: any;
    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        data = responseText;
    }

    if (response.status === 218) {
        const failed = Array.isArray(data?.results)
            ? data.results.find((item: any) => item?.status && item.status !== 200)
            : data;
        throw new Error(`Puter upload failed (strict): ${JSON.stringify(failed)}`);
    }

    if (!response.ok) {
        throw new Error(`Puter batch upload error: ${response.status} - ${responseText}`);
    }

    if (data?.error) {
        throw new Error(data.error?.message || JSON.stringify(data.error));
    }

    const results = data?.results ?? data?.result ?? data;
    const fileResult = Array.isArray(results)
        ? results.find((item: any) => item?.path || item?.result?.path || item?.item?.path) ?? results[results.length - 1]
        : results;
    const puterPath = fileResult?.path || fileResult?.result?.path || fileResult?.item?.path || filePath;

    if (!puterPath || typeof puterPath !== 'string') {
        throw new Error('Puter upload failed: no path returned');
    }

    return puterPath;
}
