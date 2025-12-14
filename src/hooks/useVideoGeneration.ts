/**
 * useVideoGeneration hook - Video generation with AI
 * Refactored with TypeScript and OOP patterns
 */

import { useState, useCallback } from 'react';
import type { UseVideoGenerationReturn, VideoGenerationOptions } from '../types';

/**
 * VideoGenerationService - Handles video generation API calls
 * Encapsulates all video generation business logic
 */
class VideoGenerationService {
    /**
     * Check if Puter.js and txt2vid are loaded and available
     */
    static ensurePuterAvailable(): void {
        if (!window.puter?.ai) {
            throw new Error('Puter.js chưa sẵn sàng. Vui lòng đợi vài giây và thử lại.');
        }
        if (typeof window.puter.ai.txt2vid !== 'function') {
            throw new Error('Tính năng tạo video chưa được hỗ trợ trong phiên bản Puter.js này.');
        }
    }

    /**
     * Extracts video URL from HTMLVideoElement
     */
    static extractVideoUrl(video: HTMLVideoElement): string | null {
        // Try to get src from video element
        if (video.src) return video.src;

        // Try data attributes
        const dataSource = video.getAttribute('data-source');
        if (dataSource) return dataSource;

        // Try source elements
        const sourceEl = video.querySelector('source');
        if (sourceEl?.src) return sourceEl.src;

        return null;
    }

    /**
     * Generates a video from a text prompt
     */
    static async generate(
        prompt: string,
        options: VideoGenerationOptions
    ): Promise<string> {
        VideoGenerationService.ensurePuterAvailable();

        const { model, seconds, size, testMode } = options;

        // If testMode, use the shorthand syntax: txt2vid(prompt, true)
        if (testMode) {
            const video = await window.puter.ai.txt2vid(prompt, true);
            const url = VideoGenerationService.extractVideoUrl(video);
            if (!url) {
                throw new Error('Không thể lấy URL video từ response.');
            }
            return url;
        }

        // Determine provider based on model
        const isTogetherModel = model.includes('/');

        const apiOptions: Record<string, unknown> = {
            model,
            ...(seconds && { seconds }),
            ...(size && { size }),
            ...(isTogetherModel && { provider: 'together' }),
        };

        const video = await window.puter.ai.txt2vid(prompt, apiOptions);

        // Extract URL from video element
        const url = VideoGenerationService.extractVideoUrl(video);
        if (!url) {
            throw new Error('Không thể lấy URL video từ response.');
        }

        return url;
    }

    /**
     * Parses error responses to user-friendly messages
     */
    static parseError(err: unknown, model: string): string {
        const errObj = err as Record<string, { code?: string; status?: number; message?: string }>;
        let errorCode = '';
        let errorStatus = 0;
        let errorMessage = '';

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
            // Check for specific Puter error
            if (errorMessage.includes('No implementation available')) {
                return 'Tính năng tạo video chưa được kích hoạt. Vui lòng thử lại sau hoặc liên hệ Puter.com.';
            }
            return errorMessage;
        }

        return 'Không thể tạo video';
    }
}

/**
 * useVideoGeneration hook - React hook for video generation
 */
export function useVideoGeneration(): UseVideoGenerationReturn {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastPrompt, setLastPrompt] = useState('');

    const generateVideo = useCallback(
        async (prompt: string, options: VideoGenerationOptions) => {
            if (!prompt.trim() || isLoading) return;

            setIsLoading(true);
            setError(null);
            setLastPrompt(prompt.trim());

            try {
                const url = await VideoGenerationService.generate(prompt.trim(), options);
                setVideoUrl(url);
            } catch (err) {
                setError(VideoGenerationService.parseError(err, options.model));
                setVideoUrl(null);
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading]
    );

    const resetVideo = useCallback(() => {
        setVideoUrl(null);
        setError(null);
        setLastPrompt('');
    }, []);

    return {
        videoUrl,
        isLoading,
        error,
        lastPrompt,
        generateVideo,
        resetVideo,
        setError,
    };
}
