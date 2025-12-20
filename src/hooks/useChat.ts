/**
 * useChat hook - Chat functionality with AI
 * Refactored with TypeScript and OOP patterns
 */

import { useState, useCallback, useRef } from 'react';
import { ContentNormalizer } from '../utils/content';
import { FileValidator } from '../utils/fileValidator';
import { IPYNBParser } from '../utils/ipynbParser';
import { WEB_SEARCH_MODEL } from '../utils/constants';
import { trimToTokenBudget } from '../utils/contextManager';
import type { ChatMessage, UseChatReturn, ChatAttachment } from '../types';

/**
 * Model config parsed from value string
 */
interface ModelConfig {
    model: string;
    driver?: string;
}

/**
 * Parse model value to extract driver if present
 * Format: "driver:driverName:modelName" or just "modelName"
 */
function parseModelConfig(modelValue: string): ModelConfig {
    if (modelValue.startsWith('driver:')) {
        const parts = modelValue.split(':');
        // driver:openrouter:gpt-5.2-pro -> { model: 'gpt-5.2-pro', driver: 'openrouter' }
        return {
            driver: parts[1],
            model: parts.slice(2).join(':'),
        };
    }
    return { model: modelValue };
}

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
        // Check if using pool mode from localStorage
        const { getUseAccountPool, chatViaPool } = await import('../utils/api');
        const usePool = getUseAccountPool();

        if (usePool) {
            // Use backend pool API with retry on token limit errors
            interface APIMessage {
                role: string;
                content: string;
            }

            let currentHistory = history;
            const MAX_RETRIES = 5;

            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                const messagesForAPI: APIMessage[] = currentHistory.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                }));

                try {
                    return await chatViaPool({
                        model,
                        messages: messagesForAPI,
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);

                    // Check if it's a token limit error
                    const isTokenLimitError =
                        errorMessage.includes('Input tokens exceed') ||
                        errorMessage.includes('token') && errorMessage.includes('limit') ||
                        errorMessage.includes('context length');

                    if (isTokenLimitError && currentHistory.length > 2) {
                        // Remove oldest 25% of messages (keep 75%, at least 2)
                        const keepCount = Math.max(2, Math.floor(currentHistory.length * 0.75));
                        currentHistory = currentHistory.slice(-keepCount);
                        console.log(
                            `[ChatService] Token limit hit, retrying with ${currentHistory.length} messages ` +
                            `(attempt ${attempt + 1}/${MAX_RETRIES})`
                        );
                        continue;
                    }

                    // Not a token limit error or can't trim more, rethrow
                    throw error;
                }
            }

            // All retries exhausted
            throw new Error('Không thể gửi tin nhắn: context quá dài, vui lòng tạo cuộc hội thoại mới');
        }

        // Direct Puter.js mode with retry on token limit errors
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

        let currentHistory = history;
        const MAX_RETRIES = 5;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const messagesForAPI: APIMessage[] = [];

            if (systemContext) {
                messagesForAPI.push({ role: 'system', content: systemContext });
            }

            messagesForAPI.push(
                ...currentHistory.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                }))
            );

            try {
                const config = parseModelConfig(model);
                const response = await window.puter.ai.chat(messagesForAPI, {
                    model: config.model,
                    ...(config.driver && { driver: config.driver }),
                });

                return ContentNormalizer.normalize(response);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);

                // Check if it's a token limit error
                const isTokenLimitError =
                    errorMessage.includes('Input tokens exceed') ||
                    (errorMessage.includes('token') && errorMessage.includes('limit')) ||
                    errorMessage.includes('context length');

                if (isTokenLimitError && currentHistory.length > 2) {
                    // Remove oldest 25% of messages (keep 75%, at least 2)
                    const keepCount = Math.max(2, Math.floor(currentHistory.length * 0.75));
                    currentHistory = currentHistory.slice(-keepCount);
                    console.log(
                        `[ChatService] Token limit hit, retrying with ${currentHistory.length} messages ` +
                        `(attempt ${attempt + 1}/${MAX_RETRIES})`
                    );
                    continue;
                }

                // Not a token limit error or can't trim more, rethrow
                throw error;
            }
        }

        // All retries exhausted
        throw new Error('Không thể gửi tin nhắn: context quá dài, vui lòng tạo cuộc hội thoại mới');
    }

    /**
     * Sends a message with file attachments (images and documents)
     * Handles .ipynb files specially by parsing them to text
     */
    static async sendMultimodalMessage(
        content: string,
        files: File[],
        model: string
    ): Promise<{ response: string; uploadedPaths: string[] }> {
        ChatService.ensurePuterAvailable();

        const uploadedPaths: string[] = [];
        const ipynbContents: string[] = [];
        const regularFiles: File[] = [];

        console.log('[DEBUG] Starting file processing, files:', files.length);

        // Separate IPYNB files from regular files
        for (const file of files) {
            if (IPYNBParser.hasIPYNBExtension(file.name)) {
                console.log('[DEBUG] Parsing IPYNB file:', file.name);
                try {
                    const parsedContent = await IPYNBParser.parseFile(file);
                    ipynbContents.push(`\n--- File: ${file.name} ---\n${parsedContent}`);
                    console.log('[DEBUG] Successfully parsed IPYNB:', file.name);
                } catch (error) {
                    console.error('[DEBUG] Failed to parse IPYNB:', file.name, error);
                    throw new Error(`Không thể đọc file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            } else {
                regularFiles.push(file);
            }
        }

        // Upload regular files to Puter FS
        for (let i = 0; i < regularFiles.length; i++) {
            const file = regularFiles[i];
            const fileName = `chat_file_${Date.now()}_${i}.${file.name.split('.').pop()}`;
            console.log('[DEBUG] Uploading file:', fileName, file.type, file.size);
            const puterFile = await window.puter.fs.write(fileName, file);
            console.log('[DEBUG] Uploaded to:', puterFile.path);
            uploadedPaths.push(puterFile.path);
        }

        // Build multimodal content array
        interface ContentItem {
            type: string;
            puter_path?: string;
            text?: string;
        }

        // Combine user message with IPYNB contents
        let textContent = content || 'Hãy phân tích các files này';
        if (ipynbContents.length > 0) {
            textContent = `${textContent}\n\n[Nội dung Jupyter Notebook]\n${ipynbContents.join('\n\n')}`;
        }

        const contentArray: ContentItem[] = [
            ...uploadedPaths.map((path) => ({ type: 'file', puter_path: path })),
            { type: 'text', text: textContent },
        ];

        const multimodalMessage = {
            role: 'user',
            content: contentArray,
        };

        console.log('[DEBUG] Sending multimodal message:', JSON.stringify(multimodalMessage, null, 2));

        const config = parseModelConfig(model);
        console.log('[DEBUG] Model config:', config);

        const response = await window.puter.ai.chat([multimodalMessage], {
            model: config.model,
            ...(config.driver && { driver: config.driver }),
        });

        console.log('[DEBUG] Raw response:', response);

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
                // Use smart token budget trimming instead of fixed message count
                const history = trimToTokenBudget(messagesWithUser);
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
     * Send a message with file attachments (images or documents)
     */
    const sendMessageWithFiles = useCallback(
        async (content: string, files: File[], model: string) => {
            if (isLoading) return;

            // Validate all files
            for (const file of files) {
                const validation = FileValidator.validate(file);
                if (!validation.valid) {
                    setError(validation.error || 'Invalid file');
                    return;
                }
            }

            // Build attachments for display
            const attachments: ChatAttachment[] = [];
            for (const file of files) {
                if (FileValidator.isImage(file)) {
                    const url = await FileValidator.toDataURL(file);
                    attachments.push({ type: 'image', url });
                } else {
                    attachments.push({ type: 'document', name: file.name });
                }
            }

            const userMessage: ChatMessage = {
                role: 'user',
                content: content.trim() || 'Hãy phân tích các files này',
                attachments,
            };

            const currentMessages = messagesRef.current;
            const messagesWithUser = [...currentMessages, userMessage];

            setMessages(messagesWithUser);
            setIsLoading(true);
            setError(null);

            let uploadedPaths: string[] = [];

            try {
                const result = await ChatService.sendMultimodalMessage(content, files, model);
                uploadedPaths = result.uploadedPaths;

                const assistantMessage: ChatMessage = { role: 'assistant', content: result.response };
                setMessages((prev) => [...prev, assistantMessage]);
            } catch (err) {
                console.error('File upload error:', err);
                const errorMessage = err instanceof Error ? err.message : String(err);
                setError(errorMessage || 'Không thể gửi tin nhắn với files');
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
        sendMessageWithFiles,
        clearMessages,
        setError,
    };
}
