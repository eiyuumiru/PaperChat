/**
 * Type Definitions for PaperChat
 * Centralized types for better maintainability
 */

import type { Dispatch, SetStateAction } from 'react';

// ==================== Message Types ====================

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
    role: MessageRole;
    content: string;
    attachments?: ChatAttachment[];
}

export interface ChatAttachment {
    type: 'image' | 'document';
    url?: string;      // For images (data URL)
    name?: string;     // For documents (filename)
}

// ==================== Model Types ====================

export interface ModelOption {
    value: string;
    label: string;
}

export interface ModelGroup {
    group: string;
    models: ModelOption[];
}

export type ModelType = 'chat';

// ==================== Tips Types ====================

export interface Tip {
    text: string;
    prompt: string;
}

// ==================== File Types ====================

export interface FileAttachment {
    file: File;
    preview: string;     // URL for images, icon for documents
    category: 'image' | 'document';
}

// Type aliases for semantic clarity
export type AttachedFile = FileAttachment;

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

// ==================== Hook Return Types ====================

export interface UseChatReturn {
    messages: ChatMessage[];
    isLoading: boolean;
    isSearching: boolean;
    error: string | null;
    sendMessage: (
        content: string,
        model: string,
        enableWebSearch?: boolean
    ) => Promise<void>;
    sendMessageWithFiles: (
        content: string,
        files: File[],
        model: string
    ) => Promise<void>;
    clearMessages: () => void;
    setError: Dispatch<SetStateAction<string | null>>;
}

// ==================== Component Props ====================

export interface MessageProps {
    role: MessageRole;
    content: string;
    attachments?: ChatAttachment[];
}

export interface LoadingMessageProps {
    searching?: boolean;
}

export interface ModelSelectorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export interface WelcomeMessageProps {
    onPromptClick: (prompt: string) => void;
}
