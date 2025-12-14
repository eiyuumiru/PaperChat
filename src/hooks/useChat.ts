/**
 * useChat hook - Chat functionality with AI
 * Refactored with TypeScript and OOP patterns
 */

import { useState, useCallback, useRef } from 'react';
import { ContentNormalizer } from '../utils/content';
import { ImageValidator } from '../utils/imageValidator';
import { MAX_CHAT_HISTORY, WEB_SEARCH_MODEL } from '../utils/constants';
import type { ChatMessage, UseChatReturn } from '../types';

/**
 * ChatService - Handles chat-related API calls
 * Encapsulates all chat business logic
 */
class ChatService {
    /**
     * Check if Puter.js is loaded and available
     */
    static ensurePuterAvailable(): void {
        if (!window.puter?.ai) {
            throw new Error('Puter.js chưa sẵn sàng. Vui lòng đợi vài giây và thử lại.');
        }
    }

    /**
     * Performs web search using GPT-4o Search model
     */
    static async performWebSearch(query: string): Promise<string> {
        ChatService.ensurePuterAvailable();

        const searchPrompt = `Tìm kiếm thông tin mới nhất về: "${query}". Trả về kết quả ngắn gọn, chính xác với nguồn nếu có.`;

        const response = await window.puter.ai.chat(searchPrompt, {
            model: WEB_SEARCH_MODEL,
        });

        return ContentNormalizer.normalize(response);
    }

    /**
     * Sends a text-only message to the AI
     */
    static async sendTextMessage(
        content: string,
        model: string,
        history: ChatMessage[],
        enableWebSearch: boolean
    ): Promise<string> {
        ChatService.ensurePuterAvailable();

        let systemContext: string | null = null;

        // Web Search Chain: search first, then use results as context
        if (enableWebSearch && model !== WEB_SEARCH_MODEL) {
            try {
                const searchResults = await ChatService.performWebSearch(content);
                systemContext = `[Kết quả tìm kiếm web]\n${searchResults}\n\n[Hướng dẫn]\nDựa trên thông tin tìm kiếm ở trên, hãy trả lời câu hỏi của người dùng một cách chính xác và đầy đủ.`;
            } catch {
                // Ignore search errors, continue without context
            }
        }

        interface APIMessage {
            role: string;
            content: string;
        }

        const messagesForAPI: APIMessage[] = [];

        if (systemContext) {
            messagesForAPI.push({ role: 'system', content: systemContext });
        }

        messagesForAPI.push(
            ...history.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }))
        );

        const response = await window.puter.ai.chat(messagesForAPI, {
            model: model,
        });

        return ContentNormalizer.normalize(response);
    }

    /**
     * Sends a message with image attachments
     */
    static async sendMultimodalMessage(
        content: string,
        imageFiles: File[],
        model: string
    ): Promise<{ response: string; uploadedPaths: string[] }> {
        ChatService.ensurePuterAvailable();

        const uploadedPaths: string[] = [];

        // Upload all images to Puter FS
        for (let i = 0; i < imageFiles.length; i++) {
            const imageFile = imageFiles[i];
            const fileName = `chat_image_${Date.now()}_${i}.${imageFile.name.split('.').pop()}`;
            const puterFile = await window.puter.fs.write(fileName, imageFile);
            uploadedPaths.push(puterFile.path);
        }

        // Build multimodal content array
        interface ContentItem {
            type: string;
            puter_path?: string;
            text?: string;
        }

        const contentArray: ContentItem[] = [
            ...uploadedPaths.map((path) => ({ type: 'file', puter_path: path })),
            { type: 'text', text: content || 'Hãy mô tả các ảnh này' },
        ];

        const multimodalMessage = {
            role: 'user',
            content: contentArray,
        };

        const response = await window.puter.ai.chat([multimodalMessage], {
            model: model,
        });

        return {
            response: ContentNormalizer.normalize(response),
            uploadedPaths,
        };
    }

    /**
     * Cleans up uploaded files
     */
    static async cleanupFiles(paths: string[]): Promise<void> {
        for (const path of paths) {
            try {
                await window.puter.fs.delete(path);
            } catch {
                // Ignore cleanup errors
            }
        }
    }
}

/**
 * useChat hook - React hook for chat functionality
 */
export function useChat(): UseChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const messagesRef = useRef<ChatMessage[]>([]);

    messagesRef.current = messages;

    /**
     * Send a text-only message (with optional web search)
     */
    const sendMessage = useCallback(
        async (content: string, model: string, enableWebSearch: boolean = false) => {
            if (!content.trim() || isLoading) return;

            const userMessage: ChatMessage = { role: 'user', content: content.trim() };
            const currentMessages = messagesRef.current;
            const messagesWithUser = [...currentMessages, userMessage];

            setMessages(messagesWithUser);
            setIsLoading(true);
            setError(null);

            if (enableWebSearch && model !== WEB_SEARCH_MODEL) {
                setIsSearching(true);
            }

            try {
                const history = messagesWithUser.slice(-MAX_CHAT_HISTORY);
                const responseText = await ChatService.sendTextMessage(
                    content.trim(),
                    model,
                    history,
                    enableWebSearch
                );

                const assistantMessage: ChatMessage = { role: 'assistant', content: responseText };
                setMessages((prev) => [...prev, assistantMessage]);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Không thể kết nối với AI';
                setError(errorMessage);
                setMessages(currentMessages);
            } finally {
                setIsLoading(false);
                setIsSearching(false);
            }
        },
        [isLoading]
    );

    /**
     * Send a message with multiple image attachments
     */
    const sendMessageWithImages = useCallback(
        async (content: string, imageFiles: File[], model: string) => {
            if (isLoading) return;

            // Validate all images
            for (const imageFile of imageFiles) {
                const validation = ImageValidator.validate(imageFile);
                if (!validation.valid) {
                    setError(validation.error || 'Invalid image');
                    return;
                }
            }

            // Convert all images to data URLs for display
            let imageDataUrls: string[] = [];
            try {
                imageDataUrls = await Promise.all(imageFiles.map(ImageValidator.toDataURL));
            } catch {
                setError('Không thể đọc file ảnh');
                return;
            }

            const userMessage: ChatMessage = {
                role: 'user',
                content: content.trim() || 'Hãy mô tả các ảnh này',
                images: imageDataUrls,
            };

            const currentMessages = messagesRef.current;
            const messagesWithUser = [...currentMessages, userMessage];

            setMessages(messagesWithUser);
            setIsLoading(true);
            setError(null);

            let uploadedPaths: string[] = [];

            try {
                const result = await ChatService.sendMultimodalMessage(content, imageFiles, model);
                uploadedPaths = result.uploadedPaths;

                const assistantMessage: ChatMessage = { role: 'assistant', content: result.response };
                setMessages((prev) => [...prev, assistantMessage]);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Không thể gửi tin nhắn với ảnh';
                setError(errorMessage);
                setMessages(currentMessages);
            } finally {
                await ChatService.cleanupFiles(uploadedPaths);
                setIsLoading(false);
            }
        },
        [isLoading]
    );

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return {
        messages,
        isLoading,
        isSearching,
        error,
        sendMessage,
        sendMessageWithImages,
        clearMessages,
        setError,
    };
}
