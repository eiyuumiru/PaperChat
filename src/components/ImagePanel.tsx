/**
 * ImagePanel Component
 * Image generation panel with drag & drop support
 */

import { useState, useRef, useCallback, useEffect, type ChangeEvent, type DragEvent, type ClipboardEvent, type FormEvent } from 'react';
import { useImageGeneration } from '../hooks/useImageGeneration';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import { useLanguage } from '../utils/i18n';
import { DEFAULT_IMAGE_MODEL } from '../utils/constants';
import { ImageValidator } from '../utils/fileValidator';
import ModelSelector from './ModelSelector';
import {
    ImageLoading,
    ImageError,
    GeneratedImage,
    ImagePlaceholder,
} from './ImageComponents';
import type { SourceImage } from '../types';

function ImagePanel(): React.ReactElement {
    const { t } = useLanguage();
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState<string>(DEFAULT_IMAGE_MODEL);
    const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const {
        imageUrl,
        isLoading,
        error,
        lastPrompt,
        generateImage,
        editImage,
        setError,
    } = useImageGeneration();

    const fileInputRef = useRef<HTMLInputElement>(null);

    useAutoDismiss(error, setError);

    useEffect(() => {
        return () => {
            if (sourceImage?.preview) {
                ImageValidator.revokePreviewURL(sourceImage.preview);
            }
        };
    }, [sourceImage]);

    const handleImageSelect = useCallback(
        (file: File) => {
            if (!file) return;

            const validation = ImageValidator.validate(file);
            if (!validation.valid) {
                setError(validation.error || 'Invalid image');
                return;
            }

            const previewUrl = ImageValidator.createPreviewURL(file);
            setSourceImage({ file, preview: previewUrl, category: 'image' });
        },
        [setError]
    );

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageSelect(file);
        }
        e.target.value = '';
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragOver(false);

        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleImageSelect(file);
        }
    };

    const handlePaste = useCallback(
        (e: ClipboardEvent<HTMLTextAreaElement>): void => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) handleImageSelect(file);
                    return;
                }
            }
        },
        [handleImageSelect]
    );

    const handleRemoveImage = (): void => {
        if (sourceImage?.preview) {
            ImageValidator.revokePreviewURL(sourceImage.preview);
        }
        setSourceImage(null);
    };

    const handleSubmit = (e?: FormEvent): void => {
        e?.preventDefault();
        if (prompt.trim() && !isLoading) {
            if (sourceImage) {
                editImage(prompt, sourceImage.file, model);
            } else {
                generateImage(prompt, model);
            }
        }
    };

    return (
        <div className="tab-panel active">
            <div className="image-panel">
                <div className="image-controls">
                    <ModelSelector
                        type="image"
                        value={model}
                        onChange={setModel}
                        label={t('selectModel')}
                    />

                    <form className="prompt-section" onSubmit={handleSubmit}>
                        <label className="prompt-label">
                            {sourceImage ? t('describeEdit') : t('describeImage')}
                        </label>
                        <textarea
                            className="prompt-input"
                            placeholder={
                                sourceImage
                                    ? t('editPlaceholder')
                                    : t('imagePlaceholder')
                            }
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onPaste={handlePaste}
                        />
                    </form>

                    <div
                        className={`image-upload-section ${isDragOver ? 'drag-over' : ''} ${sourceImage ? 'has-image' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <label className="upload-label">
                            {t('sourceImageLabel')}
                        </label>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />

                        {sourceImage ? (
                            <div className="edit-image-preview-container">
                                <img
                                    src={sourceImage.preview}
                                    alt="Source"
                                    className="edit-image-preview"
                                />
                                <button
                                    type="button"
                                    className="edit-image-remove"
                                    onClick={handleRemoveImage}
                                >
                                    {t('removeSourceImage')}
                                </button>
                            </div>
                        ) : (
                            <div
                                className="upload-area"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <span className="upload-icon">📤</span>
                                <p className="upload-text">
                                    {t('dropImageHere')}
                                </p>
                                <p className="upload-text upload-text-small">
                                    {t('imageFormats')}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="image-options">
                        <button
                            className="generate-btn"
                            onClick={() => handleSubmit()}
                            disabled={isLoading || !prompt.trim()}
                        >
                            {sourceImage ? t('editImage') : t('generateImage')}
                        </button>
                    </div>
                </div>

                <div className="image-result">
                    {isLoading ? (
                        <ImageLoading />
                    ) : error ? (
                        <ImageError message={error} />
                    ) : imageUrl ? (
                        <GeneratedImage url={imageUrl} prompt={lastPrompt} />
                    ) : (
                        <ImagePlaceholder />
                    )}
                </div>
            </div>
        </div>
    );
}

export default ImagePanel;
