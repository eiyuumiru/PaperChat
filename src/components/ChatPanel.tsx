/**
 * ChatPanel Component
 * Main chat interface with file upload support (images and documents)
 */

import { useState, useRef, useEffect, useCallback, type ChangeEvent, type DragEvent, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { useChat } from '../hooks/useChat';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import { useLanguage } from '../utils/i18n';
import {
    DEFAULT_CHAT_MODEL,
    TEXTAREA_MIN_HEIGHT,
    TEXTAREA_MAX_HEIGHT,
    MAX_FILES,
    WEB_SEARCH_MODEL,
} from '../utils/constants';
import { FileValidator } from '../utils/fileValidator';
import ModelSelector from './ModelSelector';
import Message, { LoadingMessage } from './Message';
import WelcomeMessage from './WelcomeMessage';
import type { AttachedFile } from '../types';

function ChatPanel(): React.ReactElement {
    const { t } = useLanguage();
    const [input, setInput] = useState('');
    const [model, setModel] = useState<string>(DEFAULT_CHAT_MODEL);
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [webSearchEnabled, setWebSearchEnabled] = useState(false);
    const {
        messages,
        isLoading,
        isSearching,
        error,
        sendMessage,
        sendMessageWithFiles,
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
            attachedFiles.forEach((f) => {
                if (f.preview && f.category === 'image') {
                    FileValidator.revokePreviewURL(f.preview);
                }
            });
        };
    }, [attachedFiles]);

    const handleFileSelect = useCallback(
        (files: FileList | File[]) => {
            const fileArray = Array.from(files);
            const validFiles: AttachedFile[] = [];

            for (const file of fileArray) {
                const validation = FileValidator.validate(file);
                if (!validation.valid) {
                    setError(validation.error || 'Invalid file');
                    continue;
                }

                const category = FileValidator.getCategory(file);
                let preview = '';

                if (category === 'image') {
                    preview = FileValidator.createPreviewURL(file);
                } else {
                    preview = FileValidator.getExtension(file);
                }

                validFiles.push({ file, preview, category });
            }

            if (validFiles.length > 0) {
                setAttachedFiles((prev) => {
                    const combined = [...prev, ...validFiles];
                    if (combined.length > MAX_FILES) {
                        setError(t('maxFilesError', { count: MAX_FILES }));
                        validFiles.slice(MAX_FILES - prev.length).forEach((f) => {
                            if (f.category === 'image') {
                                FileValidator.revokePreviewURL(f.preview);
                            }
                        });
                        return combined.slice(0, MAX_FILES);
                    }
                    return combined;
                });
            }
        },
        [setError, t]
    );

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files);
        }
        e.target.value = '';
    };

    const handlePaste = useCallback(
        (e: ClipboardEvent<HTMLTextAreaElement>): void => {
            const items = e.clipboardData?.items;
            if (!items) return;

            const pastedFiles: File[] = [];
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) pastedFiles.push(file);
                }
            }

            if (pastedFiles.length > 0) {
                e.preventDefault();
                handleFileSelect(pastedFiles);
            }
        },
        [handleFileSelect]
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
            handleFileSelect(Array.from(files));
        }
    };

    const handleRemoveFile = (index: number): void => {
        setAttachedFiles((prev) => {
            const newFiles = [...prev];
            const removed = newFiles[index];
            if (removed?.preview && removed.category === 'image') {
                FileValidator.revokePreviewURL(removed.preview);
            }
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    const handleClearAllFiles = useCallback((): void => {
        attachedFiles.forEach((f) => {
            if (f.preview && f.category === 'image') {
                FileValidator.revokePreviewURL(f.preview);
            }
        });
        setAttachedFiles([]);
    }, [attachedFiles]);

    const handleSubmit = (e?: FormEvent): void => {
        e?.preventDefault();
        if (isLoading) return;

        if (attachedFiles.length > 0) {
            const files = attachedFiles.map((f) => f.file);
            sendMessageWithFiles(input, files, model);
            setInput('');
            handleClearAllFiles();
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



    // Auto-enable web search only for gpt-4o-search-preview model
    useEffect(() => {
        if (model === WEB_SEARCH_MODEL) {
            setWebSearchEnabled(true);
        } else {
            // Default to off for all other models (user can toggle on)
            setWebSearchEnabled(false);
        }
    }, [model]);

    const canSubmit = !isLoading && (input.trim() || attachedFiles.length > 0);

    const imageCount = attachedFiles.filter(f => f.category === 'image').length;
    const docCount = attachedFiles.filter(f => f.category === 'document').length;

    return (
        <div className="tab-panel active">
            <div className="chat-panel">
                <div className="chat-header">
                    <ModelSelector
                        type="chat"
                        value={model}
                        onChange={setModel}
                        label={t('selectModel')}
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
                                attachments={msg.attachments}
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
                    {attachedFiles.length > 0 && (
                        <div className="files-preview-container">
                            <div className="files-preview-header">
                                <span className="files-count">
                                    {attachedFiles.length}/{MAX_FILES} files
                                    {imageCount > 0 && ` (${imageCount} ${t('images')}`}
                                    {docCount > 0 && `${imageCount > 0 ? ', ' : ' ('}${docCount} ${t('documents')}`}
                                    {(imageCount > 0 || docCount > 0) && ')'}
                                </span>
                                <button
                                    type="button"
                                    className="clear-all-files-btn"
                                    onClick={handleClearAllFiles}
                                    title={t('clearAllFiles')}
                                >
                                    {t('clearAll')}
                                </button>
                            </div>
                            <div className="files-preview-grid">
                                {attachedFiles.map((f, index) => (
                                    <div key={index} className={`file-preview-item ${f.category}`}>
                                        {f.category === 'image' ? (
                                            <img
                                                src={f.preview}
                                                alt={`Preview ${index + 1}`}
                                                className="file-preview-image"
                                            />
                                        ) : (
                                            <div className="file-preview-doc">
                                                <span className="file-icon">📄</span>
                                                <span className="file-ext">{f.preview}</span>
                                                <span className="file-name" title={f.file.name}>
                                                    {f.file.name.length > 15
                                                        ? f.file.name.slice(0, 12) + '...'
                                                        : f.file.name}
                                                </span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            className="file-preview-remove"
                                            onClick={() => handleRemoveFile(index)}
                                            title={t('removeFile')}
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
                            onChange={handleFileChange}
                            multiple
                            style={{ display: 'none' }}
                        />

                        <div className="input-action-buttons">
                            <button
                                type="button"
                                className={`file-upload-btn ${attachedFiles.length > 0 ? 'has-files' : ''}`}
                                onClick={() => fileInputRef.current?.click()}
                                title={`${t('attachFile')} (${attachedFiles.length}/${MAX_FILES})`}
                                disabled={isLoading || attachedFiles.length >= MAX_FILES}
                            >
                                📎
                                {attachedFiles.length > 0 && (
                                    <span className="file-count-badge">{attachedFiles.length}</span>
                                )}
                            </button>

                            <button
                                type="button"
                                className={`web-search-btn ${webSearchEnabled ? 'active' : ''} ${model === WEB_SEARCH_MODEL ? 'always-on' : ''}`}
                                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                                title={
                                    model === WEB_SEARCH_MODEL
                                        ? t('webSearchBuiltIn')
                                        : webSearchEnabled
                                            ? t('webSearchOff')
                                            : t('webSearchOn')
                                }
                                disabled={
                                    isLoading || attachedFiles.length > 0 || model === WEB_SEARCH_MODEL
                                }
                            >
                                🔍
                            </button>
                        </div>

                        <textarea
                            ref={textareaRef}
                            className="message-input"
                            placeholder={
                                attachedFiles.length > 0
                                    ? t('chatPlaceholderWithFiles', { count: attachedFiles.length })
                                    : t('chatPlaceholder')
                            }
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            rows={1}
                        />
                    </div>
                    <button type="submit" className="send-btn" disabled={!canSubmit}>
                        {t('send')}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChatPanel;
