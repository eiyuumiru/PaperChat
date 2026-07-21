/**
 * Application constants
 * Typed constants for the application
 */

// Default model values
export const DEFAULT_CHAT_MODEL = 'gpt-5.3-chat' as const;
export const WEB_SEARCH_MODEL = 'openrouter:openai/gpt-4o-search-preview' as const;

// Models that support native web_search tool (OpenAI only)
// Note: isNativeWebSearchModel() uses substring match, so 'gpt-5.5' also covers
// 'gpt-5.5-pro' and 'gpt-5.4' covers 'gpt-5.4-pro'.
export const NATIVE_WEB_SEARCH_MODELS = [
    'gpt-5.3-chat',
    'gpt-5.4',
    'gpt-5.5',
] as const;

export const isNativeWebSearchModel = (model: string): boolean => {
    return NATIVE_WEB_SEARCH_MODELS.some(m => model.includes(m));
};

// UI Constants
export const TEXTAREA_MIN_HEIGHT = 56 as const;
export const TEXTAREA_MAX_HEIGHT = 150 as const;
export const MAX_CHAT_HISTORY = 40 as const;

// File Upload Constants
export const MAX_FILES = 10;
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

// Image types (for preview detection)
export const IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
] as const;

export type ImageType = (typeof IMAGE_TYPES)[number];

// File type categories for UI
export type FileCategory = 'image' | 'document';
