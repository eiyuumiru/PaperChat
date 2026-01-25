/**
 * useChat hook - Chat functionality with AI
 * Refactored with TypeScript and OOP patterns
 */

import { useState, useCallback, useRef } from 'react';
import { ContentNormalizer } from '../utils/content';
import { FileValidator } from '../utils/fileValidator';
import { IPYNBParser } from '../utils/ipynbParser';
import { MAX_CHAT_HISTORY, WEB_SEARCH_MODEL, isNativeWebSearchModel } from '../utils/constants';
import { getUseAccountPool, chatViaPool } from '../utils/api';
import type { ChatMessage, UseChatReturn, ChatAttachment } from '../types';


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
        const usePool = getUseAccountPool();
        const searchPrompt = `Tìm kiếm thông tin mới nhất về: "${query}". Trả về kết quả ngắn gọn, chính xác với nguồn nếu có.`;

        if (usePool) {
            // Use account pool for web search
            return await chatViaPool({
                model: WEB_SEARCH_MODEL,
                messages: [{ role: 'user', content: searchPrompt }],
            });
        }

        // Direct Puter.js mode
        ChatService.ensurePuterAvailable();
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
        const isNative = isNativeWebSearchModel(model);
        // Check if using pool mode from localStorage
        const usePool = getUseAccountPool();

        if (usePool) {
            interface APIMessage {
                role: string;
                content: string | any[];
            }
            const messagesForAPI: APIMessage[] = [];

            // Web Search Chain for Pool mode: search first, then use results as context
            if (enableWebSearch && model !== WEB_SEARCH_MODEL) {
                if (!isNative) {
                    try {
                        const searchResults = await ChatService.performWebSearch(content);
                        messagesForAPI.push({
                            role: 'system',
                            content: `[Kết quả tìm kiếm web]\n${searchResults}\n\n[Hướng dẫn]\nDựa trên thông tin tìm kiếm ở trên, hãy trả lời câu hỏi của người dùng một cách chính xác và đầy đủ.`,
                        });
                    } catch {
                        // Ignore search errors, continue without context
                    }
                }
            }

            messagesForAPI.push(
                ...history.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                }))
            );

            return await chatViaPool({
                model,
                messages: messagesForAPI,
                ...(enableWebSearch && isNative && {
                    tools: [{ type: 'web_search' }]
                }),
            });
        }

        // Direct Puter.js mode (original logic)
        ChatService.ensurePuterAvailable();

        let systemContext: string | null = null;

        // Web Search Chain: search first, then use results as context
        if (enableWebSearch && model !== WEB_SEARCH_MODEL && !isNative) {
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
            // Add native web_search tool if user enabled it
            ...(enableWebSearch && isNative && {
                tools: [{ type: 'web_search' }]
            }),
        });

        return ContentNormalizer.normalize(response);
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
        const usePool = getUseAccountPool();

        if (usePool) {
            const ipynbContents: string[] = [];
            const regularFiles: File[] = [];

            // 1. Separate IPYNB files
            for (const file of files) {
                if (IPYNBParser.hasIPYNBExtension(file.name)) {
                    try {
                        const parsedContent = await IPYNBParser.parseFile(file);
                        ipynbContents.push(`\n--- File: ${file.name} ---\n${parsedContent}`);
                    } catch (error) {
                        throw new Error(`Không thể đọc file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                } else {
                    regularFiles.push(file);
                }
            }

            // 2. Convert regular files to Base64 for transit (max ~4.5MB total on Vercel)
            const fileItems = await Promise.all(regularFiles.map(async (file) => {
                const base64 = await FileValidator.toBase64(file);
                return {
                    type: 'file',
                    name: file.name,
                    base64: base64,
                    mimeType: file.type
                };
            }));

            let textContent = content || 'Hãy phân tích các files này';
            if (ipynbContents.length > 0) {
                textContent = `${textContent}\n\n[Nội dung Jupyter Notebook]\n${ipynbContents.join('\n\n')}`;
            }

            const messagesForAPI = [{
                role: 'user',
                content: [
                    ...fileItems,
                    { type: 'text', text: textContent }
                ]
            }];

            const response = await chatViaPool({
                model,
                messages: messagesForAPI as any,
                ...(usePool && isNativeWebSearchModel(model) && {
                    tools: [{ type: 'web_search' }]
                }),
            });

            return {
                response: ContentNormalizer.normalize(response),
                uploadedPaths: [],
            };
        }

        // Direct Puter.js mode (original logic)
        const uploadedPaths: string[] = [];
        const ipynbContents: string[] = [];
        const regularFiles: File[] = [];



        for (const file of files) {
            if (IPYNBParser.hasIPYNBExtension(file.name)) {
                try {
                    const parsedContent = await IPYNBParser.parseFile(file);
                    ipynbContents.push(`\n--- File: ${file.name} ---\n${parsedContent}`);
                } catch (error) {
                    throw new Error(`Không thể đọc file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            } else {
                regularFiles.push(file);
            }
        }

        for (let i = 0; i < regularFiles.length; i++) {
            const file = regularFiles[i];
            const fileName = FileValidator.buildSafeFileName('chat_file', file, i);
            const puterFile = await window.puter.fs.write(fileName, file);
            uploadedPaths.push(puterFile.path);
        }

        interface ContentItem {
            type: string;
            puter_path?: string;
            text?: string;
        }

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
                if (!isNativeWebSearchModel(model)) {
                    setIsSearching(true);
                }
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
     * Send a message with file attachments (images or documents)
     */
    const sendMessageWithFiles = useCallback(
        async (content: string, files: File[], model: string) => {
            if (isLoading) return;

            for (const file of files) {
                const validation = FileValidator.validate(file);
                if (!validation.valid) {
                    setError(validation.error || 'Invalid file');
                    return;
                }
            }

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
