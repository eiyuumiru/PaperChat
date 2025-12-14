/**
 * ImageValidator - OOP utility class for image validation
 * Centralizes all image validation logic
 */

import type { ImageValidationResult } from '../types';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, type AllowedImageType } from './constants';

/**
 * Static utility class for image validation
 */
export class ImageValidator {
    /**
     * Validates an image file for type and size
     */
    static validate(file: File | null | undefined): ImageValidationResult {
        if (!file) {
            return { valid: false, error: 'Không có file được chọn' };
        }

        if (!ImageValidator.isAllowedType(file.type)) {
            return {
                valid: false,
                error: 'Định dạng ảnh không được hỗ trợ. Chỉ hỗ trợ JPEG, PNG, GIF, WebP.',
            };
        }

        if (file.size > MAX_IMAGE_SIZE) {
            return {
                valid: false,
                error: 'Ảnh quá lớn. Kích thước tối đa là 5MB.',
            };
        }

        return { valid: true };
    }

    /**
     * Checks if the file type is allowed
     */
    static isAllowedType(type: string): type is AllowedImageType {
        return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
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
