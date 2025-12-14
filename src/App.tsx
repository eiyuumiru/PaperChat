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
import { useLanguage } from './utils/i18n';
import type { TabId } from './types';

function App(): React.ReactElement {
    const { t } = useLanguage();
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
                        <h2 className="alpha-modal-title">{t('alphaTitle')}</h2>
                        <div className="alpha-modal-content">
                            <div className="alpha-bug-warning">
                                <strong>⛔ {t('alphaNote')}</strong> {t('alphaVideoDisabled')}{' '}
                                <a
                                    href="https://github.com/HeyPuter/puter/issues/2175"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t('puterBug')}
                                </a>
                                . {t('alphaWaitFix')}
                            </div>
                            <p>
                                <strong>{t('alphaVideoAI')}</strong> {t('alphaInPhase')} <span className="alpha-highlight">Alpha</span>.
                            </p>
                            <ul className="alpha-modal-list">
                                <li>⚠️ {t('alphaUnstable')}</li>
                                <li>🚫 {t('alphaManyModelsNotWork')}</li>
                                <li>⏱️ {t('alphaTime')}</li>
                                <li>💰 {t('alphaCredits')}</li>
                                <li>🔧 {t('alphaInDevelopment')}</li>
                            </ul>
                            <p className="alpha-modal-note">
                                {t('alphaTestModeNote')}
                            </p>
                        </div>
                        <div className="alpha-modal-actions">
                            <button
                                className="alpha-modal-btn secondary"
                                onClick={handleCloseBetaWarning}
                            >
                                {t('alphaGoBack')}
                            </button>
                            <button
                                className="alpha-modal-btn primary"
                                onClick={handleAcceptBetaWarning}
                            >
                                {t('alphaUnderstandContinue')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
