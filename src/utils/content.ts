/**
 * ContentNormalizer - OOP utility class for content normalization
 * Handles various response formats from AI APIs
 */

interface AIResponse {
    message?: { content: unknown };
    choices?: Array<{ message?: { content: unknown } }>;
    delta?: { content?: unknown; text?: unknown };
    content?: unknown;
    text?: unknown;
}

/**
 * Static utility class for normalizing AI response content
 */
export class ContentNormalizer {
    /**
     * Normalizes content from various formats (string, object, array) to string
     */
    static normalize(data: unknown): string {
        if (data === null || data === undefined) return '';
        if (typeof data === 'string') return data;

        if (Array.isArray(data)) {
            return data
                .map((item: unknown) => {
                    if (item === null || item === undefined) return '';
                    if (typeof item === 'string') return item;
                    if (typeof item === 'object') return ContentNormalizer.normalize(item);
                    return String(item);
                })
                .filter(Boolean)
                .join('\n');
        }

        if (typeof data === 'object') {
            const obj = data as AIResponse;

            // Try various common response structures
            if (obj.message?.content !== undefined) {
                return ContentNormalizer.normalize(obj.message.content);
            }
            if (Array.isArray(obj.choices) && obj.choices[0]?.message?.content) {
                return ContentNormalizer.normalize(obj.choices[0].message.content);
            }
            if (obj.delta?.content !== undefined) {
                return ContentNormalizer.normalize(obj.delta.content);
            }
            if (obj.delta?.text !== undefined) {
                return ContentNormalizer.normalize(obj.delta.text);
            }
            if (obj.content !== undefined) {
                return ContentNormalizer.normalize(obj.content);
            }
            if (obj.text !== undefined) {
                return ContentNormalizer.normalize(obj.text);
            }

            // Fallback: stringify the object
            try {
                return JSON.stringify(data, null, 2);
            } catch {
                return String(data);
            }
        }

        return String(data);
    }

    /**
     * Converts content to string for display
     * Simpler version of normalize, used in Message component
     */
    static toString(val: unknown): string {
        if (typeof val === 'string') return val;
        if (val === undefined || val === null) return '';
        try {
            return JSON.stringify(val, null, 2);
        } catch {
            return String(val);
        }
    }
}
