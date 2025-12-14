/**
 * App Component
 * Main application entry point
 */

import { useState, useCallback } from 'react';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import ChatPanel from './components/ChatPanel';
import ImagePanel from './components/ImagePanel';
import VideoPanel from './components/VideoPanel';
import Footer from './components/Footer';
import type { TabId } from './types';

function App(): React.ReactElement {
    const [activeTab, setActiveTab] = useState<TabId>('chat');
    const [showBetaWarning, setShowBetaWarning] = useState(false);

    const handleTabChange = useCallback((tab: TabId) => {
        if (tab === 'video') {
            setShowBetaWarning(true);
        } else {
            setActiveTab(tab);
        }
    }, []);

    const handleAcceptBetaWarning = useCallback(() => {
        setShowBetaWarning(false);
        setActiveTab('video');
    }, []);

    const handleCloseBetaWarning = useCallback(() => {
        setShowBetaWarning(false);
    }, []);

    return (
        <div className="app-container">
            <Header />
            <TabNavigation activeTab={activeTab} setActiveTab={handleTabChange} />

            <main className="main-content">
                {activeTab === 'chat' && <ChatPanel />}
                {activeTab === 'image' && <ImagePanel />}
                {activeTab === 'video' && <VideoPanel />}
            </main>

            <Footer />

            {/* Beta Warning Modal */}
            {showBetaWarning && (
                <div className="modal-overlay" onClick={handleCloseBetaWarning}>
                    <div className="alpha-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="alpha-modal-icon">🚨</div>
                        <h2 className="alpha-modal-title">Tính năng Alpha</h2>
                        <div className="alpha-modal-content">
                            <div className="alpha-bug-warning">
                                <strong>⛔ Lưu ý:</strong> Tạo video hiện không hoạt động do{' '}
                                <a
                                    href="https://github.com/HeyPuter/puter/issues/2175"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    lỗi từ Puter.js (issue #2175)
                                </a>
                                . Vui lòng chờ bản fix.
                            </div>
                            <p>
                                <strong>Tạo video bằng AI</strong> hiện đang trong giai đoạn <span className="alpha-highlight">Alpha</span>.
                            </p>
                            <ul className="alpha-modal-list">
                                <li>⚠️ Tính năng này <strong>RẤT KHÔNG ỔN ĐỊNH</strong></li>
                                <li>🚫 Nhiều model có thể không hoạt động</li>
                                <li>⏱️ Thời gian tạo video có thể từ 1-5 phút</li>
                                <li>💰 Một số model yêu cầu credits Puter</li>
                                <li>🔧 Đang trong quá trình phát triển</li>
                            </ul>
                            <p className="alpha-modal-note">
                                Bật <strong>Test Mode</strong> để thử nghiệm mà không tốn credits.
                            </p>
                        </div>
                        <div className="alpha-modal-actions">
                            <button
                                className="alpha-modal-btn secondary"
                                onClick={handleCloseBetaWarning}
                            >
                                Quay lại
                            </button>
                            <button
                                className="alpha-modal-btn primary"
                                onClick={handleAcceptBetaWarning}
                            >
                                Tôi hiểu rủi ro, tiếp tục
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
