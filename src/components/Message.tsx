/**
 * Message Components
 */

import ReactMarkdown from 'react-markdown';
import { remarkPlugins, rehypePlugins } from '../utils/markdown';
import { ContentNormalizer } from '../utils/content';
import type { MessageProps, LoadingMessageProps } from '../types';

/**
 * LaTeXNormalizer - Utility class for normalizing LaTeX expressions
 */
class LaTeXNormalizer {
    /**
     * Normalizes LaTeX blocks to standard format
     */
    static normalize(text: string): string {
        let t = text;

        // Fix malformed AI output: \left$...\right$ -> \left(...\right)
        t = t.replace(/\\left\$/g, '\\left(');
        t = t.replace(/\\right\$/g, '\\right)');

        // Block math: \[ ... \] -> $$ ... $$
        t = t.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner: string) => `$$${inner}$$`);

        // Inline math: \( ... \) -> $ ... $
        t = t.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner: string) => `$${inner}$`);

        return t;
    }
}

function Message({ role, content, images }: MessageProps): React.ReactElement {
    const roleLabel = role === 'user' ? 'Bạn' : 'AI';
    const safeContent = LaTeXNormalizer.normalize(ContentNormalizer.toString(content));

    return (
        <div className={`message ${role}`}>
            <div className="message-role">{roleLabel}</div>
            <div className="message-content markdown-body">
                {images && images.length > 0 && (
                    <div className={`message-images-container ${images.length === 1 ? 'single' : 'multiple'}`}>
                        {images.map((img, index) => (
                            <div key={index} className="message-image-wrapper">
                                <img src={img} alt={`Attached ${index + 1}`} className="message-image" />
                            </div>
                        ))}
                    </div>
                )}

                {role === 'user' ? (
                    <p>{safeContent}</p>
                ) : (
                    <ReactMarkdown
                        remarkPlugins={remarkPlugins}
                        rehypePlugins={rehypePlugins}
                    >
                        {safeContent}
                    </ReactMarkdown>
                )}
            </div>
        </div>
    );
}

function LoadingMessage({ searching = false }: LoadingMessageProps): React.ReactElement {
    return (
        <div className="message assistant loading">
            <div className="message-role">AI</div>
            <div className="message-content">
                {searching && (
                    <span className="search-indicator">🔍 Đang tìm kiếm web...</span>
                )}
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
            </div>
        </div>
    );
}

export default Message;
export { LoadingMessage };
