/**
 * useImageGeneration hook - Image generation with AI
 * Refactored with TypeScript and OOP patterns
 */

import { useState, useCallback } from 'react';
import { ImageValidator } from '../utils/fileValidator';
import type { UseImageGenerationReturn } from '../types';

/**
 * ImageGenerationService - Handles image generation API calls
 * Encapsulates all image generation business logic
 */
class ImageGenerationService {
    /**
     * Check if Puter.js is loaded and available
     */
    static ensurePuterAvailable(): void {
        if (!window.puter?.ai) {
            throw new Error('Puter.js chưa sẵn sàng. Vui lòng đợi vài giây và thử lại.');
        }
    }

    /**
     * Extracts image URL from various response formats
     */
    static extractImageUrl(response: unknown): string | null {
        if (response instanceof HTMLImageElement) return response.src;

        const obj = response as Record<string, unknown>;

        if (obj?.tagName === 'IMG' && obj?.src) return obj.src as string;
        if (obj?.src) return obj.src as string;
        if (obj?.url) return obj.url as string;
        if (obj?.image) return obj.image as string;

        if (
            typeof response === 'string' &&
            (response.startsWith('http') || response.startsWith('data:'))
        ) {
            return response;
        }

        if (obj?.data) return obj.data as string;

        return null;
    }

    /**
     * Generates an image from a text prompt
     */
    static async generate(prompt: string, model: string): Promise<string> {
        ImageGenerationService.ensurePuterAvailable();

        const isTogetherModel = model.includes('/');
        const response = await window.puter.ai.txt2img(prompt, {
            model,
            ...(isTogetherModel && { provider: 'together' }),
        });

        const responseObj = response as { success?: boolean; error?: Record<string, unknown> };
        if (responseObj?.success === false) {
            throw { error: responseObj.error || {} };
        }

        const url = ImageGenerationService.extractImageUrl(response);
        if (!url) {
            throw new Error('Model không trả về hình ảnh.');
        }

        return url;
    }

    /**
     * Edits an existing image based on a prompt
     */
    static async edit(prompt: string, imageFile: File, model: string): Promise<string> {
        ImageGenerationService.ensurePuterAvailable();

        const isGeminiModel = model.includes('gemini');

        if (isGeminiModel) {
            const base64Data = await ImageValidator.toBase64(imageFile);
            const mimeType = imageFile.type || 'image/png';
            const response = await window.puter.ai.txt2img(prompt, {
                model,
                input_image: base64Data,
                input_image_mime_type: mimeType,
            });

            const url = ImageGenerationService.extractImageUrl(response);
            if (!url) {
                throw new Error('Model không trả về hình ảnh. Vui lòng thử lại hoặc dùng model khác.');
            }
            return url;
        }

        // Non-Gemini models: analyze image first, then generate
        const fileName = `edit_image_${Date.now()}.${imageFile.name.split('.').pop() || 'png'}`;
        const puterFile = await window.puter.fs.write(fileName, imageFile);

        try {
            const analysisResponse = await window.puter.ai.chat(
                [
                    {
                        role: 'user',
                        content: [
                            { type: 'file', puter_path: puterFile.path },
                            {
                                type: 'text',
                                text: `Analyze this image and create a detailed prompt for regenerating it with these modifications: "${prompt}". Output ONLY the prompt.`,
                            },
                        ],
                    },
                ],
                { model: 'gpt-5-nano' }
            );

            let enhancedPrompt = prompt;
            const analysisObj = analysisResponse as { message?: { content?: string } };
            if (analysisObj?.message?.content) {
                enhancedPrompt = analysisObj.message.content;
            } else if (typeof analysisResponse === 'string') {
                enhancedPrompt = analysisResponse;
            }

            const isTogetherModel = model.includes('/');
            const response = await window.puter.ai.txt2img(enhancedPrompt, {
                model,
                ...(isTogetherModel && { provider: 'together' }),
            });

            const url = ImageGenerationService.extractImageUrl(response);
            if (!url) {
                throw new Error('Model không trả về hình ảnh. Vui lòng thử lại hoặc dùng model khác.');
            }
            return url;
        } finally {
            try {
                await window.puter.fs.delete(puterFile.path);
            } catch {
                // Ignore cleanup errors
            }
        }
    }

    /**
     * Parses error responses to user-friendly messages
     */
    static parseError(err: unknown, model: string): string {
        let errorCode = '';
        let errorStatus = 0;
        let errorMessage = '';

        const errObj = err as Record<string, { code?: string; status?: number; message?: string }>;
        for (const key in errObj) {
            if (errObj[key]?.code) errorCode = errObj[key].code || '';
            if (errObj[key]?.status) errorStatus = errObj[key].status || 0;
            if (errObj[key]?.message) errorMessage = errObj[key].message || '';
        }

        const errTyped = err as { code?: string; status?: number; message?: string };
        if (!errorCode) errorCode = errTyped.code || '';
        if (!errorStatus) errorStatus = errTyped.status || 0;
        if (!errorMessage) errorMessage = errTyped.message || '';

        if (errorCode === 'insufficient_funds' || errorStatus === 402) {
            return 'Hết credits API. Vui lòng nạp thêm tại puter.com để tiếp tục sử dụng.';
        }
        if (errorCode === 'rate_limit_exceeded' || errorStatus === 429) {
            return 'Quá nhiều yêu cầu. Vui lòng đợi một chút.';
        }
        if (errorStatus === 451) {
            return `Model "${model}" bị chặn. Thử model khác.`;
        }
        if (errorStatus === 503) {
            return 'Model đang bận. Thử lại sau.';
        }
        if (errorMessage) {
            return errorMessage;
        }

        return 'Không thể tạo hình ảnh';
    }
}

/**
 * useImageGeneration hook - React hook for image generation
 */
export function useImageGeneration(): UseImageGenerationReturn {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastPrompt, setLastPrompt] = useState('');

    const generateImage = useCallback(
        async (prompt: string, model: string) => {
            if (!prompt.trim() || isLoading) return;

            setIsLoading(true);
            setError(null);
            setLastPrompt(prompt.trim());

            try {
                const url = await ImageGenerationService.generate(prompt.trim(), model);
                setImageUrl(url);
            } catch (err) {
                setError(ImageGenerationService.parseError(err, model));
                setImageUrl(null);
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading]
    );

    const editImage = useCallback(
        async (prompt: string, imageFile: File, model: string) => {
            if (!prompt.trim() || isLoading) return;

            const validation = ImageValidator.validate(imageFile);
            if (!validation.valid) {
                setError(validation.error || 'Invalid image');
                return;
            }

            setIsLoading(true);
            setError(null);
            setLastPrompt(prompt.trim());

            try {
                const url = await ImageGenerationService.edit(prompt.trim(), imageFile, model);
                setImageUrl(url);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Không thể chỉnh sửa hình ảnh';
                setError(errorMessage);
                setImageUrl(null);
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading]
    );

    const resetImage = useCallback(() => {
        setImageUrl(null);
        setError(null);
        setLastPrompt('');
    }, []);

    return {
        imageUrl,
        isLoading,
        error,
        lastPrompt,
        generateImage,
        editImage,
        resetImage,
        setError,
    };
}
