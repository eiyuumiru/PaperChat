/**
 * App Component
 * Main application entry point
 */

import { useState, useEffect } from 'react';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import ChatPanel from './components/ChatPanel';
import ImagePanel from './components/ImagePanel';
import VideoPanel from './components/VideoPanel';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import type { TabId } from './types';
import './styles/admin.css';

function App(): React.ReactElement {
    const [activeTab, setActiveTab] = useState<TabId>('chat');

    // Admin mode states
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [verifying, setVerifying] = useState(false);

    // Keyboard shortcut: Ctrl+Alt+Shift+P
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.altKey && e.shiftKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                setShowPasswordModal(true);
                setPassword('');
                setPasswordError(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifying(true);
        setPasswordError(false);

        try {
            // Verify password by making a test request to admin API
            const res = await fetch('/api/admin-accounts', {
                method: 'GET',
                headers: { 'X-Admin-Key': password },
            });

            if (res.ok) {
                setShowPasswordModal(false);
                setShowAdmin(true);
            } else {
                setPasswordError(true);
            }
        } catch (error) {
            console.error('Verification failed', error);
            setPasswordError(true);
        } finally {
            setVerifying(false);
        }
    };

    const handleCloseAdmin = () => {
        setShowAdmin(false);
    };

    // Show admin panel if authenticated
    if (showAdmin) {
        // Pass the entered password as the key for subsequent requests
        return <AdminPanel onClose={handleCloseAdmin} adminKey={password} />;
    }

    return (
        <>
            {/* Password Modal */}
            {showPasswordModal && (
                <div className="admin-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="admin-password-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>🔐 Admin Login</h2>
                        {passwordError && (
                            <div className="error-msg">Sai mật khẩu</div>
                        )}
                        <form onSubmit={handlePasswordSubmit}>
                            <input
                                type="password"
                                placeholder="Nhập mật khẩu..."
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setPasswordError(false);
                                }}
                                autoFocus
                            />
                            <div className="btn-row">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setShowPasswordModal(false)}
                                >
                                    Huỷ
                                </button>
                                <button
                                    type="submit"
                                    className="btn-submit"
                                    disabled={verifying}
                                >
                                    {verifying ? 'Đang kiểm tra...' : 'Đăng nhập'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="app-container">
                <Header />
                <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

                <main className="main-content">
                    {activeTab === 'chat' && <ChatPanel />}
                    {activeTab === 'image' && <ImagePanel />}
                    {activeTab === 'video' && <VideoPanel />}
                </main>

                <Footer />
            </div>
        </>
    );
}

export default App;
