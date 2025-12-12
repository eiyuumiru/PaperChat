import ReactMarkdown from 'react-markdown'
import { remarkPlugins, rehypePlugins } from '../utils/markdown'
import { toStringContent } from '../utils/content'

function Message({ role, content }) {
  const roleLabel = role === 'user' ? 'Bạn' : 'AI'

  const normalizeLatexBlocks = (text) => {
    let t = text
    // Block math: \[ ... \] -> $$ ... $$
    t = t.replace(/\\\[(.*?)\\\]/gs, (_, inner) => `$$${inner}$$`)
    // Inline math: \( ... \) -> $ ... $
    t = t.replace(/\\\((.*?)\\\)/gs, (_, inner) => `$${inner}$`)
    // Inline math without delimiters but inside parentheses containing backslash, e.g. (\Delta > 0)
    t = t.replace(/\(([^)]*\\[^)]*)\)/g, (_, inner) => `$${inner}$`)
    return t
  }

  const safeContent = normalizeLatexBlocks(toStringContent(content))

  return (
    <div className={`message ${role}`}>
      <div className="message-role">{roleLabel}</div>
      <div className="message-content markdown-body">
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
  )
}

function LoadingMessage() {
  return (
    <div className="message assistant loading">
      <div className="message-role">AI</div>
      <div className="message-content">
        <span className="loading-dot"></span>
        <span className="loading-dot"></span>
        <span className="loading-dot"></span>
      </div>
    </div>
  )
}

export default Message
export { LoadingMessage }
