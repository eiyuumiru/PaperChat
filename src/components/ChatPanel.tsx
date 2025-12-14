/**
 * ChatPanel Component
 * Main chat interface with image upload support
 */

import { useState, useRef, useEffect, useCallback, type ChangeEvent, type DragEvent, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { useChat } from '../hooks/useChat';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import {
    DEFAULT_CHAT_MODEL,
    TEXTAREA_MIN_HEIGHT,
    TEXTAREA_MAX_HEIGHT,
    MAX_IMAGES,
    WEB_SEARCH_MODEL,
} from '../utils/constants';
import { ImageValidator } from '../utils/imageValidator';
import ModelSelector from './ModelSelector';
import Message, { LoadingMessage } from './Message';
import WelcomeMessage from './WelcomeMessage';
import type { AttachedImage } from '../types';

function ChatPanel(): React.ReactElement {
    const [input, setInput] = useState('');
    const [model, setModel] = useState<string>(DEFAULT_CHAT_MODEL);
    const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [webSearchEnabled, setWebSearchEnabled] = useState(false);
    const {
        messages,
        isLoading,
        isSearching,
        error,
        sendMessage,
        sendMessageWithImages,
        setError,
    } = useChat();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const nextHeight = Math.max(
                TEXTAREA_MIN_HEIGHT,
                Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT)
            );
            textarea.style.height = `${nextHeight}px`;
        }
    }, [input]);

    useAutoDismiss(error, setError);

    useEffect(() => {
        return () => {
            attachedImages.forEach((img) => {
                if (img.preview) ImageValidator.revokePreviewURL(img.preview);
            });
        };
    }, [attachedImages]);

    const handleImageSelect = useCallback(
        (files: FileList | File[]) => {
            const fileArray = Array.from(files);
            const validFiles: AttachedImage[] = [];

            for (const file of fileArray) {
                const validation = ImageValidator.validate(file);
                if (!validation.valid) {
                    setError(validation.error || 'Invalid image');
                    continue;
                }

                const previewUrl = ImageValidator.createPreviewURL(file);
                validFiles.push({ file, preview: previewUrl });
            }

            if (validFiles.length > 0) {
                setAttachedImages((prev) => {
                    const combined = [...prev, ...validFiles];
                    if (combined.length > MAX_IMAGES) {
                        setError(`Chỉ có thể đính kèm tối đa ${MAX_IMAGES} ảnh.`);
                        // Revoke URLs for files that won't be added
                        validFiles.slice(MAX_IMAGES - prev.length).forEach((img) => {
                            ImageValidator.revokePreviewURL(img.preview);
                        });
                        return combined.slice(0, MAX_IMAGES);
                    }
                    return combined;
                });
            }
        },
        [setError]
    );

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleImageSelect(files);
        }
        e.target.value = '';
    };

    const handlePaste = useCallback(
        (e: ClipboardEvent<HTMLTextAreaElement>): void => {
            const items = e.clipboardData?.items;
            if (!items) return;

            const imageFiles: File[] = [];
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) imageFiles.push(file);
                }
            }

            if (imageFiles.length > 0) {
                e.preventDefault();
                handleImageSelect(imageFiles);
            }
        },
        [handleImageSelect]
    );

    const handleDragOver = (e: DragEvent<HTMLFormElement>): void => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLFormElement>): void => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent<HTMLFormElement>): void => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const imageFiles = Array.from(files).filter((file) =>
                file.type.startsWith('image/')
            );
            if (imageFiles.length > 0) {
                handleImageSelect(imageFiles);
            }
        }
    };

    const handleRemoveImage = (index: number): void => {
        setAttachedImages((prev) => {
            const newImages = [...prev];
            if (newImages[index]?.preview) {
                ImageValidator.revokePreviewURL(newImages[index].preview);
            }
            newImages.splice(index, 1);
            return newImages;
        });
    };

    const handleClearAllImages = (): void => {
        attachedImages.forEach((img) => {
            if (img.preview) ImageValidator.revokePreviewURL(img.preview);
        });
        setAttachedImages([]);
    };

    const handleSubmit = (e?: FormEvent): void => {
        e?.preventDefault();
        if (isLoading) return;

        if (attachedImages.length > 0) {
            const files = attachedImages.map((img) => img.file);
            sendMessageWithImages(input, files, model);
            setInput('');
            handleClearAllImages();
        } else if (input.trim()) {
            sendMessage(input, model, webSearchEnabled);
            setInput('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handlePromptClick = (prompt: string): void => {
        setInput(prompt);
        textareaRef.current?.focus();
    };

    const canSubmit = !isLoading && (input.trim() || attachedImages.length > 0);

    return (
        <div className="tab-panel active">
            <div className="chat-panel">
                <div className="chat-header">
                    <ModelSelector
                        type="chat"
                        value={model}
                        onChange={setModel}
                        label="Chọn Model:"
                    />
                </div>

                <div className="messages-container">
                    {messages.length === 0 ? (
                        <WelcomeMessage onPromptClick={handlePromptClick} />
                    ) : (
                        messages.map((msg, idx) => (
                            <Message
                                key={idx}
                                role={msg.role}
                                content={msg.content}
                                images={msg.images}
                            />
                        ))
                    )}

                    {isLoading && <LoadingMessage searching={isSearching} />}

                    {error && <div className="error-message">{error}</div>}

                    <div ref={messagesEndRef} />
                </div>

                <form
                    className={`input-area ${isDragOver ? 'drag-over' : ''}`}
                    onSubmit={handleSubmit}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {attachedImages.length > 0 && (
                        <div className="images-preview-container">
                            <div className="images-preview-header">
                                <span className="images-count">
                                    {attachedImages.length}/{MAX_IMAGES} ảnh
                                </span>
                                <button
                                    type="button"
                                    className="clear-all-images-btn"
                                    onClick={handleClearAllImages}
                                    title="Xóa tất cả ảnh"
                                >
                                    Xóa tất cả
                                </button>
                            </div>
                            <div className="images-preview-grid">
                                {attachedImages.map((img, index) => (
                                    <div key={index} className="image-preview-item">
                                        <img
                                            src={img.preview}
                                            alt={`Preview ${index + 1}`}
                                            className="image-preview"
                                        />
                                        <button
                                            type="button"
                                            className="image-preview-remove"
                                            onClick={() => handleRemoveImage(index)}
                                            title="Xóa ảnh"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="input-wrapper">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileChange}
                            multiple
                            style={{ display: 'none' }}
                        />

                        <button
                            type="button"
                            className={`image-upload-btn ${attachedImages.length > 0 ? 'has-images' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                            title={`Đính kèm ảnh (${attachedImages.length}/${MAX_IMAGES})`}
                            disabled={isLoading || attachedImages.length >= MAX_IMAGES}
                        >
                            📷
                            {attachedImages.length > 0 && (
                                <span className="image-count-badge">{attachedImages.length}</span>
                            )}
                        </button>

                        <button
                            type="button"
                            className={`web-search-btn ${webSearchEnabled && model !== WEB_SEARCH_MODEL ? 'active' : ''} ${model === WEB_SEARCH_MODEL ? 'always-on' : ''}`}
                            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                            title={
                                model === WEB_SEARCH_MODEL
                                    ? 'Model này đã có sẵn tìm kiếm web'
                                    : webSearchEnabled
                                        ? 'Tắt tìm kiếm web'
                                        : 'Bật tìm kiếm web'
                            }
                            disabled={
                                isLoading || attachedImages.length > 0 || model === WEB_SEARCH_MODEL
                            }
                        >
                            🔍
                        </button>

                        <textarea
                            ref={textareaRef}
                            className="message-input"
                            placeholder={
                                attachedImages.length > 0
                                    ? `Nhập câu hỏi về ${attachedImages.length} ảnh...`
                                    : 'Nhập tin nhắn của bạn...'
                            }
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            rows={1}
                        />
                    </div>
                    <button type="submit" className="send-btn" disabled={!canSubmit}>
                        Gửi
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChatPanel;
