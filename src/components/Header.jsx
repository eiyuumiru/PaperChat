import { useState, useEffect } from "react";

function Header() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <header className="app-header">
      <div className="header-controls-row">
        <button
          className="help-btn"
          onClick={() => setShowHelp(true)}
          title="Hướng dẫn sử dụng"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "light" ? "Dark Mode (Beta)" : "Light Mode"}
        >
          {theme === "light" ? (
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>
        <a
          className="github-link"
          href="https://github.com/eiyuumiru/PaperChat"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Repository"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
      </div>
      <h1 className="app-title">
        <span className="title-emoji">🎉</span> PaperChat
      </h1>
      <p className="app-subtitle">
        AI Chat & Image Generation với phong cách Studygram
      </p>

      {showHelp && (
        <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="help-modal-close"
              onClick={() => setShowHelp(false)}
            >
              ✕
            </button>

            <h2 className="help-modal-title">📚 Hướng dẫn sử dụng</h2>

            <div className="help-section">
              <h3 className="help-section-title">Mục đích</h3>
              <p>
                <strong>PaperChat</strong> là ứng dụng AI Chat & Image
                Generation
                <span className="hl-yellow"> hoàn toàn miễn phí</span>, sử dụng
                <span className="hl-blue"> Puter.js</span> để kết nối với các mô
                hình AI hàng đầu như GPT-5.2, Claude, Gemini và nhiều model khác.
              </p>
            </div>

            <div className="help-section">
              <h3 className="help-section-title">Giới hạn API</h3>
              <p>
                Mặc dù <span className="hl-pink">miễn phí hoàn toàn</span>,
                Puter.js vẫn có giới hạn về số lượng request API cho mỗi tài
                khoản. Khi bạn gặp lỗi
                <em> "API limit exceeded"</em> hoặc chatbot không phản hồi, hãy
                làm theo hướng dẫn bên dưới.
              </p>
            </div>

            <div className="help-section">
              <h3 className="help-section-title">
                Cách khắc phục khi tràn API
              </h3>
              <div className="help-steps">
                <div className="help-step">
                  <strong>Bước 1:</strong> Xoá cookie của trang web này
                  <span className="help-note"> (PaperChat)</span>
                </div>
                <div className="help-step">
                  <strong>Bước 2:</strong> Xoá cookie của
                  <a
                    href="https://puter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {" "}
                    puter.com
                  </a>
                </div>
                <div className="help-step">
                  <strong>Bước 3:</strong> Quay lại PaperChat và gửi tin nhắn
                  bất kỳ
                </div>
                <div className="help-step">
                  <strong>Bước 4:</strong> Hệ thống sẽ tự động tạo tài khoản mới
                  →<span className="hl-yellow"> Xong! ✨</span>
                </div>
              </div>
            </div>

            <div className="help-footer">
              <p>
                Made with 💖 by{" "}
                <a
                  href="https://github.com/eiyuumiru"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  eiyuumiru
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
