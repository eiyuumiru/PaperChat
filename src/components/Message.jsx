import ReactMarkdown from "react-markdown";
import { remarkPlugins, rehypePlugins } from "../utils/markdown";
import { toStringContent } from "../utils/content";

function Message({ role, content, images }) {
  const roleLabel = role === "user" ? "Bạn" : "AI";

  const normalizeLatexBlocks = (text) => {
    let t = text;

    // Fix malformed AI output: \left$...\right$ -> \left(...\right)
    t = t.replace(/\\left\$/g, "\\left(");
    t = t.replace(/\\right\$/g, "\\right)");

    // Block math: \[ ... \] -> $$ ... $$
    t = t.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `$$${inner}$$`);

    // Inline math: \( ... \) -> $ ... $
    t = t.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => `$${inner}$`);

    return t;
  };

  const safeContent = normalizeLatexBlocks(toStringContent(content));

  return (
    <div className={`message ${role}`}>
      <div className="message-role">{roleLabel}</div>
      <div className="message-content markdown-body">
        {images && images.length > 0 && (
          <div className={`message-images-container ${images.length === 1 ? "single" : "multiple"}`}>
            {images.map((img, index) => (
              <div key={index} className="message-image-wrapper">
                <img src={img} alt={`Attached ${index + 1}`} className="message-image" />
              </div>
            ))}
          </div>
        )}

        {role === "user" ? (
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

function LoadingMessage({ searching = false }) {
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
