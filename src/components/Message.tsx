/**
 * Message Components
 */

import ReactMarkdown from 'react-markdown';
import SantaHat from '../assets/santa-hat.svg';
import { isHolidaySeason } from '../utils/seasonalTheme';
import { remarkPlugins, rehypePlugins } from '../utils/markdown';
import { ContentNormalizer } from '../utils/content';
import { useLanguage } from '../utils/i18n';
import type { MessageProps, LoadingMessageProps, ChatAttachment } from '../types';
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from './ui/code-block';
import { Button } from './ui/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

/**
 * CodeBlockWithHeader - Wrapper to add header and copy functionality to CodeBlock
 */
function CodeBlockWithHeader({ code, language }: { code: string; language?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <CodeBlock>
            <CodeBlockGroup className="code-block-header">
                <div className="code-block-header-left">
                    <div className="code-block-lang-badge">
                        {language?.toUpperCase() || 'CODE'}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCopy}
                    title="Copy code"
                >
                    {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                </Button>
            </CodeBlockGroup>
            <CodeBlockCode code={code} language={language} />
        </CodeBlock>
    );
}

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
                {isHolidaySeason() && <img src={SantaHat} alt="" className="santa-hat santa-hat-role" />}
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
                        components={{
                            pre({ children }) {
                                return <>{children}</>;
                            },
                            code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const code = String(children).replace(/\n$/, '');
                                return !inline ? (
                                    <CodeBlockWithHeader
                                        code={code}
                                        language={match ? match[1] : undefined}
                                    />
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                );
                            },
                        }}
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
                {isHolidaySeason() && <img src={SantaHat} alt="" className="santa-hat santa-hat-role" />}
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
