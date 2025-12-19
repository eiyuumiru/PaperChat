/**
 * Message Components
 */

import ReactMarkdown from 'react-markdown';
import SantaHat from '../assets/santa-hat.svg';
import { remarkPlugins, rehypePlugins } from '../utils/markdown';
import { ContentNormalizer } from '../utils/content';
import { useLanguage } from '../utils/i18n';
import type { MessageProps, LoadingMessageProps, ChatAttachment } from '../types';

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

interface ExtendedMessageProps extends Omit<MessageProps, 'images'> {
    attachments?: ChatAttachment[];
}

function Message({ role, content, attachments }: ExtendedMessageProps): React.ReactElement {
    const { t } = useLanguage();
    const roleLabel = role === 'user' ? t('you') : t('ai');
    const safeContent = LaTeXNormalizer.normalize(ContentNormalizer.toString(content));

    const imageAttachments = attachments?.filter(a => a.type === 'image') || [];
    const docAttachments = attachments?.filter(a => a.type === 'document') || [];

    return (
        <div className={`message ${role}`}>
            <div className="message-role">
                {roleLabel}
                <img src={SantaHat} alt="" className="santa-hat santa-hat-role" />
            </div>
            <div className="message-content markdown-body">
                {/* Image attachments */}
                {imageAttachments.length > 0 && (
                    <div className={`message-images-container ${imageAttachments.length === 1 ? 'single' : 'multiple'}`}>
                        {imageAttachments.map((att, index) => (
                            <div key={index} className="message-image-wrapper">
                                <img src={att.url} alt={`Attached ${index + 1}`} className="message-image" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Document attachments */}
                {docAttachments.length > 0 && (
                    <div className="message-docs-container">
                        {docAttachments.map((att, index) => (
                            <div key={index} className="message-doc-badge">
                                <span className="doc-icon">📄</span>
                                <span className="doc-name">{att.name}</span>
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
    const { t } = useLanguage();

    return (
        <div className="message assistant loading">
            <div className="message-role">
                {t('ai')}
                <img src={SantaHat} alt="" className="santa-hat santa-hat-role" />
            </div>
            <div className="message-content">
                {searching && (
                    <span className="search-indicator">🔍 {t('searchingWeb')}</span>
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
