/**
 * App Component
 * Main application entry point
 */

import { useState, useEffect } from 'react';
import Snowfall from 'react-snowfall';
import Header from './components/Header';
import { isHolidaySeason, isTetSeason } from './utils/seasonalTheme';
import ChatPanel from './components/ChatPanel';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import './styles/admin.css';
// Tet decorations
import CayMaiLeft from './assets/cay-mai-left.png';
import CayDaoRight from './assets/cay-dao-right.png';
import PetalsFall from './components/PetalsFall';

function App(): React.ReactElement {
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

    return (
        <>
            {/* Snowfall Effect - Only during Christmas season (December) */}
            {isHolidaySeason() && (
                <Snowfall
                    color="#82c3d9"
                    snowflakeCount={100}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        zIndex: 1,
                        pointerEvents: 'none',
                    }}
                />
            )}

            {/* Tet Decorations - Only during Tet season (January-April) */}
            {isTetSeason() && (
                <>
                    <img
                        src={CayMaiLeft}
                        alt=""
                        className="tet-decoration tet-mai-left"
                    />
                    <img
                        src={CayDaoRight}
                        alt=""
                        className="tet-decoration tet-dao-right"
                    />
                </>
            )}

            {/* Cherry Blossom Petals - Tet season only */}
            <PetalsFall />

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

            {showAdmin ? (
                <AdminPanel onClose={handleCloseAdmin} adminKey={password} />
            ) : (
                <div className="app-container">
                    <Header />
                    <main className="main-content">
                        <ChatPanel />
                    </main>
                    <Footer />
                </div>
            )}
        </>
    );
}

export default App;
