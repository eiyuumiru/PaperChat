/**
 * Puter.js Type Definitions
 * Since Puter.js is a pure JavaScript library, we define its types here
 */

interface PuterAIResponse {
    message?: {
        content: unknown;
    };
    choices?: Array<{
        message?: {
            content: unknown;
        };
    }>;
    delta?: {
        content?: unknown;
        text?: unknown;
    };
    content?: unknown;
    text?: unknown;
}

interface PuterFile {
    path: string;
    name?: string;
}

interface PuterImageResponse {
    src?: string;
    url?: string;
    image?: string;
    data?: string;
    success?: boolean;
    error?: Record<string, unknown>;
}

interface PuterAI {
    chat(
        messages: unknown,
        options?: { model: string }
    ): Promise<PuterAIResponse | string>;

    txt2img(
        prompt: string,
        options?: Record<string, unknown>
    ): Promise<PuterImageResponse | HTMLImageElement | string>;

    txt2vid(
        prompt: string,
        options?: {
            model?: string;
            seconds?: number;
            size?: string;
            provider?: 'openai' | 'together';
            test_mode?: boolean;
        } | boolean
    ): Promise<HTMLVideoElement>;
}

interface PuterFS {
    write(name: string, file: File): Promise<PuterFile>;
    delete(path: string): Promise<void>;
}

interface Puter {
    ai: PuterAI;
    fs: PuterFS;
}

declare global {
    interface Window {
        puter: Puter;
    }
}

export type {
    PuterAIResponse,
    PuterFile,
    PuterImageResponse,
    PuterAI,
    PuterFS,
    Puter,
};
