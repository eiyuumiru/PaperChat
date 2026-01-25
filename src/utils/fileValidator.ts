/**
 * FileValidator - OOP utility class for file validation
 * Validates file size (max 20MB) - let Puter.js/AI handle type limits
 */

import type { FileValidationResult } from '../types';
import type { FileCategory } from './constants';
import { IMAGE_TYPES, MAX_FILE_SIZE } from './constants';

// Minimal mime -> extension map for safe filenames.
const MIME_EXTENSION_MAP: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
};

/**
 * Static utility class for file validation
 */
export class FileValidator {
    /**
     * Validates a file - checks size limit (20MB max)
     */
    static validate(file: File | null | undefined): FileValidationResult {
        if (!file) {
            return { valid: false, error: 'Không có file được chọn' };
        }

        if (file.size > MAX_FILE_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            return { valid: false, error: `File quá lớn (${sizeMB}MB). Tối đa 20MB.` };
        }

        return { valid: true };
    }

    /**
     * Determines the file category (for UI display)
     */
    static getCategory(file: File): FileCategory {
        if ((IMAGE_TYPES as readonly string[]).includes(file.type)) {
            return 'image';
        }
        return 'document';
    }

    /**
     * Checks if file is an image
     */
    static isImage(file: File): boolean {
        return (IMAGE_TYPES as readonly string[]).includes(file.type);
    }

    /**
     * Checks if file is a document (non-image)
     */
    static isDocument(file: File): boolean {
        return !FileValidator.isImage(file);
    }

    /**
     * Gets file extension for display
     */
    static getExtension(file: File): string {
        const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
        return ext;
    }

    /**
     * Gets a safe file extension for uploads.
     */
    static getSafeExtension(file: File): string {
        const name = file.name || '';
        const dotIndex = name.lastIndexOf('.');
        if (dotIndex > 0 && dotIndex < name.length - 1) {
            const ext = name.slice(dotIndex + 1).toLowerCase();
            if (/^[a-z0-9]+$/.test(ext)) {
                return ext;
            }
        }

        const mimeExt = MIME_EXTENSION_MAP[(file.type || '').toLowerCase()];
        return mimeExt || '';
    }

    /**
     * Builds a safe filename for uploads.
     */
    static buildSafeFileName(
        prefix: string,
        file: File,
        index?: number,
        fallbackExt: string = 'bin'
    ): string {
        const ext = FileValidator.getSafeExtension(file) || fallbackExt;
        const suffix = typeof index === 'number' ? `_${index}` : '';
        return `${prefix}_${Date.now()}${suffix}.${ext}`;
    }

    /**
     * Converts a file to a data URL for display
     */
    static toDataURL(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Converts a file to a base64 string (without data URL prefix)
     */
    static toBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Creates an object URL for file preview
     */
    static createPreviewURL(file: File): string {
        return URL.createObjectURL(file);
    }

    /**
     * Revokes an object URL
     */
    static revokePreviewURL(url: string): void {
        URL.revokeObjectURL(url);
    }
}
