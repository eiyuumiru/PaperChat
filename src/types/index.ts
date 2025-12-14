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

export type ModelType = 'chat' | 'image' | 'video';

// ==================== Tab Types ====================

export type TabId = 'chat' | 'image' | 'video';

export interface TabItem {
    id: TabId;
    label: string;
}

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
export type AttachedImage = FileAttachment; // Backward compatibility
export type SourceImage = FileAttachment;

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

// Backward compatibility
export type ImageValidationResult = FileValidationResult;

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

export interface UseImageGenerationReturn {
    imageUrl: string | null;
    isLoading: boolean;
    error: string | null;
    lastPrompt: string;
    generateImage: (prompt: string, model: string) => Promise<void>;
    editImage: (prompt: string, imageFile: File, model: string) => Promise<void>;
    resetImage: () => void;
    setError: Dispatch<SetStateAction<string | null>>;
}

export interface VideoGenerationOptions {
    model: string;
    seconds?: number;
    size?: string;
    testMode?: boolean;
}

export interface UseVideoGenerationReturn {
    videoUrl: string | null;
    isLoading: boolean;
    error: string | null;
    lastPrompt: string;
    generateVideo: (prompt: string, options: VideoGenerationOptions) => Promise<void>;
    resetVideo: () => void;
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
    type: ModelType;
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export interface TabNavigationProps {
    activeTab: TabId;
    setActiveTab: (tab: TabId) => void;
}

export interface WelcomeMessageProps {
    onPromptClick: (prompt: string) => void;
}

export interface ImageErrorProps {
    message: string;
}

export interface GeneratedImageProps {
    url: string;
    prompt: string;
}
