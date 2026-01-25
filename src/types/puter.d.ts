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

interface PuterAI {
    chat(
        messages: unknown,
        options?: { model: string; driver?: string }
    ): Promise<PuterAIResponse | string>;
}

interface PuterFS {
    write(name: string, file: File): Promise<PuterFile>;
    delete(path: string): Promise<void>;
}

interface PuterUser {
    username?: string;
    email?: string;
}

interface ApiUsageDetails {
    cost: number;
    count: number;
    units: string;
}

interface UsageData {
    allowanceInfo?: {
        monthUsageAllowance: number;
        remaining: number;
    };
    usage?: Record<string, ApiUsageDetails>;
    appTotals?: Record<string, { count: number; total: number }>;
}

interface PuterAuth {
    isSignedIn(): boolean;
    getUser(): Promise<PuterUser>;
    signIn(): Promise<void>;
    signOut(): Promise<void>;
    getMonthlyUsage(): Promise<UsageData>;
}

interface Puter {
    ai: PuterAI;
    fs: PuterFS;
    auth: PuterAuth;
}

declare global {
    interface Window {
        puter: Puter;
    }
}

export type {
    PuterAIResponse,
    PuterFile,
    PuterAI,
    PuterFS,
    Puter,
};
