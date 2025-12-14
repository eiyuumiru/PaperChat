/**
 * Header Component
 * App header with help modal, changelog modal, theme toggle, and GitHub link
 */

import { useState, useEffect, type MouseEvent } from 'react';

function Header(): React.ReactElement {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    });
    const [showHelp, setShowHelp] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = (): void => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const stopPropagation = (e: MouseEvent): void => {
        e.stopPropagation();
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
                    className="changelog-btn"
                    onClick={() => setShowChangelog(true)}
                    title="Lịch sử cập nhật"
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
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                </button>
                <button
                    className="theme-toggle-btn"
                    onClick={toggleTheme}
                    title={theme === 'light' ? 'Dark Mode (Beta)' : 'Light Mode'}
                >
                    {theme === 'light' ? (
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
                AI Chat, Image &amp; Video Generation với phong cách Studygram
            </p>

            {showHelp && (
                <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
                    <div className="help-modal" onClick={stopPropagation}>
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
                                <strong>PaperChat</strong> là ứng dụng AI Chat &amp; Image
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
                                        {' '}
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
                                Made with 💖 by{' '}
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

            {showChangelog && (
                <div className="help-modal-overlay" onClick={() => setShowChangelog(false)}>
                    <div className="help-modal changelog-modal" onClick={stopPropagation}>
                        <button
                            className="help-modal-close"
                            onClick={() => setShowChangelog(false)}
                        >
                            ✕
                        </button>

                        <h2 className="help-modal-title">📋 Changelog</h2>

                        <div className="changelog-content">
                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v2.0.0</span>
                                    <span className="version-date">14/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type feature">🚀 Major</span> Refactor toàn bộ codebase sang TypeScript</li>
                                    <li><span className="change-type alpha">🔬 Alpha</span> Thêm tính năng tạo video (Sora, Veo, Kling, ...)</li>
                                    <li><span className="change-type feature">✨ Mới</span> Thêm nút Changelog</li>
                                    <li><span className="change-type improve">⚡ Cải thiện</span> Áp dụng OOP patterns (Service classes)</li>
                                    <li><span className="change-type improve">⚡ Cải thiện</span> Type safety cho toàn bộ components và hooks</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v1.3.0</span>
                                    <span className="version-date">13/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type feature">✨ Mới</span> Hỗ trợ upload nhiều ảnh cùng lúc (tối đa 10 ảnh)</li>
                                    <li><span className="change-type fix">🔧 Sửa</span> Sửa lỗi hiển thị LaTeX</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v1.2.0</span>
                                    <span className="version-date">13/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type feature">✨ Mới</span> Thêm nút Help với hướng dẫn sử dụng</li>
                                    <li><span className="change-type beta">🧪 Beta</span> Thêm Dark Mode</li>
                                    <li><span className="change-type improve">⚡ Cải thiện</span> Dọn dẹp và tối ưu code</li>
                                    <li><span className="change-type improve">⚡ Cải thiện</span> Cập nhật giao diện Studygram</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v1.1.0</span>
                                    <span className="version-date">12/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type feature">✨ Mới</span> Thêm tính năng upload ảnh cho chat</li>
                                    <li><span className="change-type feature">✨ Mới</span> Hỗ trợ hiển thị LaTeX/Math</li>
                                    <li><span className="change-type fix">🔧 Sửa</span> Sửa một số lỗi UI</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v1.0.0</span>
                                    <span className="version-date">12/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type feature">🚀 Ra mắt</span> Phiên bản đầu tiên của PaperChat</li>
                                    <li><span className="change-type feature">✨ Mới</span> Chat văn bản với nhiều model AI</li>
                                    <li><span className="change-type feature">✨ Mới</span> Tạo hình ảnh với AI</li>
                                    <li><span className="change-type feature">✨ Mới</span> Giao diện Studygram độc đáo</li>
                                </ul>
                            </div>
                        </div>

                        <div className="help-footer">
                            <p>
                                Made with 💖 by{' '}
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
