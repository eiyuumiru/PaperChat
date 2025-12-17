/**
 * Header Component
 * App header with Settings dropdown containing help, changelog, theme toggle, GitHub, language, and account
 */

import { useState, useEffect, useCallback, useRef, type MouseEvent } from 'react';
import { useLanguage } from '../utils/i18n';
import { getUseAccountPool, setUseAccountPool } from '../utils/api';

interface PuterUser {
    username?: string;
    email?: string;
}

interface UsageData {
    allowanceInfo?: {
        monthUsageAllowance: number;
        remaining: number;
    };
    usage?: Record<string, { cost: number; count: number; units: string }>;
    appTotals?: Record<string, { count: number; total: number }>;
}

function Header(): React.ReactElement {
    const { language, toggleLanguage, t } = useLanguage();
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    });
    const [showHelp, setShowHelp] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [user, setUser] = useState<PuterUser | null>(null);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [usageData, setUsageData] = useState<UsageData | null>(null);
    const [usageLoading, setUsageLoading] = useState(false);
    const [usageError, setUsageError] = useState(false);
    const [showUsageDetails, setShowUsageDetails] = useState(false);
    const [accountPoolEnabled, setAccountPoolEnabled] = useState(getUseAccountPool);
    const settingsRef = useRef<HTMLDivElement>(null);

    // Check auth status on mount and fetch usage
    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (window.puter.auth?.isSignedIn?.()) {
                    const userData = await window.puter.auth.getUser();
                    setUser(userData);
                    setIsSignedIn(true);
                    // Auto-fetch usage on page load
                    try {
                        const usage = await window.puter.auth.getMonthlyUsage();
                        setUsageData(usage);
                    } catch (e) {
                        console.error('Failed to fetch usage on load:', e);
                    }
                }
            } catch {
                setIsSignedIn(false);
                setUser(null);
            }
        };
        checkAuth();
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleTheme = useCallback((): void => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    }, []);

    const handleSignIn = async () => {
        try {
            await window.puter.auth.signIn();
            const userData = await window.puter.auth.getUser();
            setUser(userData);
            setIsSignedIn(true);
        } catch (error) {
            console.error('Sign in failed:', error);
        }
    };

    const handleSignOut = async () => {
        try {
            await window.puter.auth.signOut();
            setUser(null);
            setIsSignedIn(false);
            setUsageData(null);
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    };

    const fetchUsage = async () => {
        if (usageLoading) return;
        setUsageLoading(true);
        setUsageError(false);
        try {
            const data = await window.puter.auth.getMonthlyUsage();
            setUsageData(data);
        } catch (error) {
            console.error('Failed to fetch usage:', error);
            setUsageError(true);
        } finally {
            setUsageLoading(false);
        }
    };

    const stopPropagation = (e: MouseEvent): void => {
        e.stopPropagation();
    };

    return (
        <header className="app-header">
            {/* Settings Button - Fixed to viewport top-right */}
            <div className="settings-wrapper" ref={settingsRef}>
                <button
                    className="settings-btn"
                    onClick={() => setShowSettings(!showSettings)}
                    title={t('settings')}
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
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                </button>

                {/* Settings Dropdown */}
                {showSettings && (
                    <div className="settings-dropdown">
                        {/* Help */}
                        <button
                            className="settings-item"
                            onClick={() => {
                                setShowHelp(true);
                                setShowSettings(false);
                            }}
                        >
                            <svg className="settings-item-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <span className="settings-item-label">{t('help')}</span>
                        </button>

                        {/* Changelog */}
                        <button
                            className="settings-item"
                            onClick={() => {
                                setShowChangelog(true);
                                setShowSettings(false);
                            }}
                        >
                            <svg className="settings-item-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                            <span className="settings-item-label">{t('changelog')}</span>
                        </button>

                        {/* Theme Toggle */}
                        <button className="settings-item" onClick={toggleTheme}>
                            {theme === 'light' ? (
                                <svg className="settings-item-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            ) : (
                                <svg className="settings-item-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                            <span className="settings-item-label">
                                {theme === 'light' ? t('darkMode') : t('lightMode')}
                            </span>
                        </button>

                        {/* GitHub */}
                        <a
                            className="settings-item"
                            href="https://github.com/eiyuumiru/PaperChat"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <svg className="settings-item-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            <span className="settings-item-label">{t('github')}</span>
                        </a>

                        {/* Language Toggle - 1 click */}
                        <button className="settings-item" onClick={toggleLanguage}>
                            <svg className="settings-item-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                            <span className="settings-item-label">{t('language')}</span>
                            <span className="settings-item-badge">{language.toUpperCase()}</span>
                        </button>

                        {/* Account Pool Toggle */}
                        <div className="settings-toggle-item">
                            <svg className="settings-item-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <span className="settings-item-label">{t('accountPool')}</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={accountPoolEnabled}
                                    onChange={() => {
                                        const newValue = !accountPoolEnabled;
                                        setAccountPoolEnabled(newValue);
                                        setUseAccountPool(newValue);
                                        window.location.reload();
                                    }}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        {/* Divider */}
                        <div className="settings-divider" />

                        {/* Account Section - Hidden when Account Pool is enabled */}
                        {!accountPoolEnabled && (
                            <>
                                <div className="settings-account">
                                    <svg className="settings-item-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <div className="settings-account-info">
                                        <span className="settings-account-name">
                                            {isSignedIn ? (user?.username || user?.email || 'User') : t('guest')}
                                        </span>
                                        {isSignedIn ? (
                                            <button className="settings-auth-btn signout" onClick={handleSignOut}>
                                                {t('signOut')}
                                            </button>
                                        ) : (
                                            <button className="settings-auth-btn signin" onClick={handleSignIn}>
                                                {t('signIn')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Credits/Usage Section */}
                                <div className="settings-usage">
                                    <div className="settings-usage-header">
                                        <svg className="settings-item-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                        </svg>
                                        <span className="settings-usage-label">{t('credits')}</span>
                                        <button
                                            className="settings-usage-refresh"
                                            onClick={fetchUsage}
                                            disabled={usageLoading}
                                            title={t('refreshUsage')}
                                        >
                                            <svg className={`settings-refresh-icon ${usageLoading ? 'spinning' : ''}`} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M23 4v6h-6M1 20v-6h6" />
                                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="settings-usage-content">
                                        {usageLoading && (
                                            <span className="settings-usage-loading">{t('loadingUsage')}</span>
                                        )}
                                        {usageError && (
                                            <span className="settings-usage-error">{t('errorLoadingUsage')}</span>
                                        )}
                                        {usageData && !usageLoading && (
                                            <div className="settings-usage-data">
                                                {usageData.allowanceInfo && (
                                                    <>
                                                        <span className="settings-usage-total">
                                                            {t('usageThisMonth')}: <strong>${((usageData.allowanceInfo.monthUsageAllowance - usageData.allowanceInfo.remaining) / 100000000).toFixed(2)}</strong>
                                                        </span>
                                                        <span className="settings-usage-remaining">
                                                            {language === 'vi' ? 'Còn lại' : 'Remaining'}: ${(usageData.allowanceInfo.remaining / 100000000).toFixed(2)}
                                                        </span>
                                                    </>
                                                )}
                                                {usageData.usage && Object.keys(usageData.usage).length > 0 && (
                                                    <button
                                                        className="settings-usage-details-btn"
                                                        onClick={() => setShowUsageDetails(true)}
                                                    >
                                                        {language === 'vi' ? 'Xem chi tiết' : 'View details'}
                                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {!usageData && !usageLoading && !usageError && (
                                            <span className="settings-usage-hint">{t('refreshUsage')}</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <h1 className="app-title">
                <span className="title-emoji">🎉</span> PaperChat
            </h1>
            <p className="app-subtitle">{t('appSubtitle')}</p>

            {showHelp && (
                <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
                    <div className="help-modal" onClick={stopPropagation}>
                        <button
                            className="help-modal-close"
                            onClick={() => setShowHelp(false)}
                        >
                            ✕
                        </button>

                        <h2 className="help-modal-title">{t('helpTitle')}</h2>

                        <div className="help-section">
                            <h3 className="help-section-title">{t('helpPurposeTitle')}</h3>
                            <p>
                                <strong>PaperChat</strong> {language === 'vi' ? 'là ứng dụng AI Chat & Image Generation' : 'is an AI Chat & Image Generation app'}
                                <span className="hl-yellow"> {language === 'vi' ? 'hoàn toàn miễn phí' : 'completely free'}</span>, {language === 'vi' ? 'sử dụng' : 'using'}
                                <span className="hl-blue"> Puter.js</span> {language === 'vi' ? 'để kết nối với các mô hình AI hàng đầu như GPT-5.2, Claude, Gemini và nhiều model khác.' : 'to connect with top AI models like GPT-5.2, Claude, Gemini and more.'}
                            </p>
                        </div>

                        {!accountPoolEnabled && (
                            <>
                                <div className="help-section">
                                    <h3 className="help-section-title">{t('helpLimitTitle')}</h3>
                                    <p>
                                        {language === 'vi' ? 'Mặc dù' : 'Although'} <span className="hl-pink">{language === 'vi' ? 'miễn phí hoàn toàn' : 'completely free'}</span>,
                                        {language === 'vi'
                                            ? ' Puter.js vẫn có giới hạn về số lượng request API cho mỗi tài khoản. Khi bạn gặp lỗi "API limit exceeded" hoặc chatbot không phản hồi, hãy làm theo hướng dẫn bên dưới.'
                                            : ' Puter.js has request limits per account. When you encounter "API limit exceeded" errors or the chatbot stops responding, follow the instructions below.'
                                        }
                                    </p>
                                </div>

                                <div className="help-section">
                                    <h3 className="help-section-title">{t('helpFixTitle')}</h3>
                                    <div className="help-steps">
                                        <div className="help-step">
                                            <strong>{language === 'vi' ? 'Cách 1:' : 'Option 1:'}</strong> {language === 'vi' ? 'Bật Account Pool trong Settings' : 'Enable Account Pool in Settings'}
                                            <span className="help-note"> ({language === 'vi' ? 'khuyên dùng' : 'recommended'})</span>
                                        </div>
                                        <div className="help-step">
                                            <strong>{language === 'vi' ? 'Cách 2:' : 'Option 2:'}</strong> {language === 'vi' ? 'Reset tài khoản Puter' : 'Reset Puter account'}
                                        </div>
                                        <div className="help-step" style={{ paddingLeft: '20px' }}>
                                            • {t('helpStep1')} <span className="help-note">(PaperChat)</span>
                                        </div>
                                        <div className="help-step" style={{ paddingLeft: '20px' }}>
                                            • {t('helpStep2')}
                                        </div>
                                        <div className="help-step" style={{ paddingLeft: '20px' }}>
                                            • {t('helpStep3')}
                                        </div>
                                        <div className="help-step" style={{ paddingLeft: '20px' }}>
                                            • {t('helpStep4')}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="help-footer">
                            <p>
                                {t('helpFooter')}{' '}
                                <a
                                    href="https://github.com/eiyuumiru"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    eiyuumiru
                                </a>{' '}
                                ✨
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Usage Details Modal */}
            {showUsageDetails && usageData?.usage && (
                <div className="help-modal-overlay" onClick={() => setShowUsageDetails(false)}>
                    <div className="help-modal usage-modal" onClick={stopPropagation}>
                        <button
                            className="help-modal-close"
                            onClick={() => setShowUsageDetails(false)}
                        >
                            ✕
                        </button>

                        <h2 className="help-modal-title">💰 {language === 'vi' ? 'Chi tiết sử dụng' : 'Usage Details'}</h2>

                        {usageData.allowanceInfo && (
                            <div className="usage-modal-summary">
                                <span>{language === 'vi' ? 'Đã dùng' : 'Used'}: <strong>${((usageData.allowanceInfo.monthUsageAllowance - usageData.allowanceInfo.remaining) / 100000000).toFixed(2)}</strong></span>
                                <span>{language === 'vi' ? 'Còn lại' : 'Remaining'}: <strong>${(usageData.allowanceInfo.remaining / 100000000).toFixed(2)}</strong></span>
                            </div>
                        )}

                        <div className="usage-modal-table-wrapper">
                            <table className="settings-usage-table">
                                <thead>
                                    <tr>
                                        <th>{language === 'vi' ? 'Dịch vụ' : 'Service'}</th>
                                        <th>{language === 'vi' ? 'Số lần' : 'Count'}</th>
                                        <th>{language === 'vi' ? 'Chi phí' : 'Cost'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        // Filter AI model entries
                                        const aiPrefixes = [
                                            'gpt', 'openai', 'claude', 'gemini', 'deepseek', 'o3',
                                            'dall-e', 'flux', 'stable', 'black-forest',
                                            'sora', 'veo', 'google/veo', 'kling', 'seedance', 'bytedance',
                                            'minimax', 'hailuo', 'pixverse', 'wan', 'vidu'
                                        ];

                                        const filteredEntries = Object.entries(usageData.usage)
                                            .filter(([apiName]) => {
                                                const lowercaseName = apiName.toLowerCase();
                                                return aiPrefixes.some(prefix => lowercaseName.includes(prefix));
                                            });

                                        // Group by model name (remove :prompt_tokens, :completion_tokens, :prompt, :completion suffixes)
                                        const grouped: Record<string, { count: number; cost: number }> = {};
                                        filteredEntries.forEach(([apiName, details]) => {
                                            const modelName = apiName
                                                .replace(/:prompt_tokens$/, '')
                                                .replace(/:completion_tokens$/, '')
                                                .replace(/:prompt$/, '')
                                                .replace(/:completion$/, '');

                                            if (!grouped[modelName]) {
                                                grouped[modelName] = { count: 0, cost: 0 };
                                            }
                                            grouped[modelName].count += details.count;
                                            grouped[modelName].cost += details.cost;
                                        });

                                        return Object.entries(grouped).map(([modelName, data]) => (
                                            <tr key={modelName}>
                                                <td>{modelName}</td>
                                                <td>{data.count}</td>
                                                <td>${(data.cost / 100000000).toFixed(4)}</td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
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

                        <h2 className="help-modal-title">{t('changelogTitle')}</h2>

                        <div className="changelog-content">
                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v4.1.1</span>
                                    <span className="version-date">17/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type improve">⚡ {language === 'vi' ? 'Cải thiện' : 'Improve'}</span> {language === 'vi' ? 'Error logging display' : 'Error logging display'}</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v4.1.0</span>
                                    <span className="version-date">17/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type unstable">🚧 Unstable</span> {language === 'vi' ? 'Video chuyển từ Beta sang Unstable mode' : 'Video moved from Beta to Unstable mode'}</li>
                                    <li><span className="change-type unstable">🚧 Unstable</span> {language === 'vi' ? 'Size video thay đổi động theo từng model' : 'Dynamic video size options per model'}</li>
                                    <li><span className="change-type improve">🎨 {language === 'vi' ? 'Cải thiện' : 'Improve'}</span> {language === 'vi' ? 'Căn giữa ảnh/video trong khung polaroid' : 'Center image/video in polaroid frame'}</li>
                                    <li><span className="change-type improve">🎨 {language === 'vi' ? 'Cải thiện' : 'Improve'}</span> {language === 'vi' ? 'Ẩn lưu ý khi tạo ảnh' : 'Hide note when generating images'}</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v4.0.1</span>
                                    <span className="version-date">16/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type improve">⚡ {language === 'vi' ? 'Cải thiện' : 'Improve'}</span> {language === 'vi' ? 'Ẩn hướng dẫn API limit khi bật Account Pool' : 'Hide API limit guide when Account Pool enabled'}</li>
                                    <li><span className="change-type improve">🎨 {language === 'vi' ? 'Cải thiện' : 'Improve'}</span> {language === 'vi' ? 'Scrollbar theo phong cách Studygram' : 'Studygram-styled scrollbar'}</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag major">v4.0.0</span>
                                    <span className="version-date">16/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type feature">🚀 Major</span> {language === 'vi' ? 'Account Pool - Sử dụng miễn phí không cần đăng nhập' : 'Account Pool - Use for free without login'}</li>
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Toggle bật/tắt Account Pool trong Settings' : 'Toggle to enable/disable Account Pool in Settings'}</li>
                                    <li><span className="change-type improve">⚡ {language === 'vi' ? 'Cải thiện' : 'Improve'}</span> {language === 'vi' ? 'Tự động chuyển account khi hết credits' : 'Auto-switch account when out of credits'}</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v3.1.0</span>
                                    <span className="version-date">16/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Xem chi tiết credits/usage với popup modal' : 'Detailed credits/usage view with popup modal'}</li>
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Tự động load credits khi vào trang' : 'Auto-load credits on page load'}</li>
                                    <li><span className="change-type fix">🔧 {language === 'vi' ? 'Sửa' : 'Fix'}</span> {language === 'vi' ? 'Căn chỉnh kích thước nút files/search với input' : 'Align files/search buttons size with input'}</li>
                                    <li><span className="change-type improve">⚡ {language === 'vi' ? 'Cải thiện' : 'Improve'}</span> {language === 'vi' ? 'Dọn dẹp và tối ưu CSS' : 'CSS cleanup and optimization'}</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v3.0.1</span>
                                    <span className="version-date">15/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type fix">🔧 {language === 'vi' ? 'Sửa' : 'Fix'}</span> {language === 'vi' ? 'Bug tạo video từ Puter.js đã được fix' : 'Video generation bug from Puter.js has been fixed'} <a href="https://github.com/HeyPuter/puter/issues/2175" target="_blank" rel="noopener noreferrer">(issue #2175)</a></li>
                                    <li><span className="change-type beta">🧪 Beta</span> {language === 'vi' ? 'Chuyển tính năng tạo video từ Alpha sang Beta' : 'Moved video generation from Alpha to Beta'}</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag major">v3.0.0</span>
                                    <span className="version-date">14/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type feature">🚀 Major</span> {language === 'vi' ? 'Hỗ trợ đa ngôn ngữ (Tiếng Anh/Tiếng Việt)' : 'Multi-language support (English/Vietnamese)'}</li>
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Gộp 4 nút vào menu Settings' : 'Consolidated 4 buttons into Settings menu'}</li>
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Hiển thị tài khoản và đăng nhập/xuất Puter' : 'Account display with Puter sign in/out'}</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v2.1.2</span>
                                    <span className="version-date">14/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type alpha">🔬 Alpha</span> {language === 'vi' ? 'Tạo video hiện không hoạt động do' : 'Video generation currently not working due to'} <a href="https://github.com/HeyPuter/puter/issues/2175" target="_blank" rel="noopener noreferrer">{language === 'vi' ? 'lỗi từ Puter.js (issue #2175)' : 'Puter.js bug (issue #2175)'}</a></li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v2.1.1</span>
                                    <span className="version-date">14/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type improve">⚡ {language === 'vi' ? 'Cải thiện' : 'Improve'}</span> {language === 'vi' ? 'Tăng dung lượng upload file lên tối đa 20MB' : 'Increased file upload limit to 20MB'}</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v2.1.0</span>
                                    <span className="version-date">14/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Thêm GPT-5.2 Thinking - suy luận nâng cao (Chain-of-Thought)' : 'Added GPT-5.2 Thinking - advanced reasoning (Chain-of-Thought)'}</li>
                                    <li><span className="change-type beta">🧪 Beta</span> {language === 'vi' ? 'Thêm GPT-5.2 Pro - model AI mạnh nhất của OpenAI' : 'Added GPT-5.2 Pro - OpenAI\'s most powerful AI model'}</li>
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Hỗ trợ upload nhiều loại file hơn để AI phân tích' : 'Support for more file types for AI analysis'}</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag major">v2.0.0</span>
                                    <span className="version-date">14/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type feature">🚀 Major</span> {language === 'vi' ? 'Refactor toàn bộ codebase sang TypeScript' : 'Refactored entire codebase to TypeScript'}</li>
                                    <li><span className="change-type alpha">🔬 Alpha</span> {language === 'vi' ? 'Thêm tính năng tạo video (Sora, Veo, Kling, ...)' : 'Added video generation (Sora, Veo, Kling, ...)'}</li>
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Thêm nút Changelog' : 'Added Changelog button'}</li>
                                    <li><span className="change-type improve">⚡ {language === 'vi' ? 'Cải thiện' : 'Improve'}</span> {language === 'vi' ? 'Áp dụng OOP patterns (Service classes)' : 'Applied OOP patterns (Service classes)'}</li>
                                    <li><span className="change-type improve">⚡ {language === 'vi' ? 'Cải thiện' : 'Improve'}</span> {language === 'vi' ? 'Type safety cho toàn bộ components và hooks' : 'Type safety for all components and hooks'}</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v1.3.0</span>
                                    <span className="version-date">13/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Hỗ trợ upload nhiều ảnh cùng lúc (tối đa 10 ảnh)' : 'Support for multiple image upload (up to 10)'}</li>
                                    <li><span className="change-type fix">🔧 {language === 'vi' ? 'Sửa' : 'Fix'}</span> {language === 'vi' ? 'Sửa lỗi hiển thị LaTeX' : 'Fixed LaTeX rendering issue'}</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v1.2.0</span>
                                    <span className="version-date">13/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Thêm nút Help với hướng dẫn sử dụng' : 'Added Help button with user guide'}</li>
                                    <li><span className="change-type beta">🧪 Beta</span> {language === 'vi' ? 'Thêm Dark Mode' : 'Added Dark Mode'}</li>
                                    <li><span className="change-type improve">⚡ {language === 'vi' ? 'Cải thiện' : 'Improve'}</span> {language === 'vi' ? 'Dọn dẹp và tối ưu code' : 'Code cleanup and optimization'}</li>
                                    <li><span className="change-type improve">⚡ {language === 'vi' ? 'Cải thiện' : 'Improve'}</span> {language === 'vi' ? 'Cập nhật giao diện Studygram' : 'Updated Studygram UI'}</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag">v1.1.0</span>
                                    <span className="version-date">12/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Thêm tính năng upload ảnh cho chat' : 'Added image upload for chat'}</li>
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Hỗ trợ hiển thị LaTeX/Math' : 'Added LaTeX/Math rendering'}</li>
                                    <li><span className="change-type fix">🔧 {language === 'vi' ? 'Sửa' : 'Fix'}</span> {language === 'vi' ? 'Sửa một số lỗi UI' : 'Fixed some UI bugs'}</li>
                                </ul>
                            </div>

                            <div className="changelog-version">
                                <div className="version-header">
                                    <span className="version-tag major">v1.0.0</span>
                                    <span className="version-date">12/12/2024</span>
                                </div>
                                <ul className="version-changes">
                                    <li><span className="change-type feature">🚀 {language === 'vi' ? 'Ra mắt' : 'Launch'}</span> {language === 'vi' ? 'Phiên bản đầu tiên của PaperChat' : 'First version of PaperChat'}</li>
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Chat văn bản với nhiều model AI' : 'Text chat with multiple AI models'}</li>
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Tạo hình ảnh với AI' : 'AI image generation'}</li>
                                    <li><span className="change-type feature">✨ {language === 'vi' ? 'Mới' : 'New'}</span> {language === 'vi' ? 'Giao diện Studygram độc đáo' : 'Unique Studygram interface'}</li>
                                </ul>
                            </div>
                        </div>

                        <div className="help-footer">
                            <p>
                                {t('helpFooter')}{' '}
                                <a
                                    href="https://github.com/eiyuumiru"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    eiyuumiru
                                </a>{' '}
                                ✨
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;
