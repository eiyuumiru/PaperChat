/**
 * Admin Panel Component
 * Hidden admin interface for managing Puter accounts
 */

import React, { useState, useEffect } from 'react';
import '../styles/admin.css';

interface Account {
    id: number;
    email: string;
    credits_remaining: number;
    status: 'active' | 'exhausted' | 'error';
    last_used: string | null;
    created_at: string;
}

interface AdminPanelProps {
    onClose: () => void;
    adminKey: string;
}

// Convert credits (tokens) to dollars
// Puter uses ~$0.01 per 1M tokens for most models
function creditsToDollars(credits: number): string {
    const dollars = credits / 100000000; // 100M tokens = $1
    return dollars.toFixed(4);
}

export default function AdminPanel({ onClose, adminKey }: AdminPanelProps): React.ReactElement {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [clearingStorage, setClearingStorage] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [failedIds, setFailedIds] = useState<Set<number>>(new Set());

    // Add account form
    const [newEmail, setNewEmail] = useState('');
    const [newAuthToken, setNewAuthToken] = useState('');
    const [adding, setAdding] = useState(false);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/admin-accounts', {
                headers: { 'X-Admin-Key': adminKey },
            });

            if (!res.ok) throw new Error('Failed to fetch accounts');

            const data = await res.json();
            setAccounts(data.accounts || []);
        } catch (err) {
            setMessage({ type: 'error', text: 'Không thể tải danh sách accounts' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleRefreshAll = async () => {
        setRefreshing(true);
        setMessage(null);
        setFailedIds(new Set());

        try {
            const res = await fetch('/api/admin-refresh', {
                method: 'POST',
                headers: { 'X-Admin-Key': adminKey },
            });

            if (!res.ok) throw new Error('Failed to refresh');

            const data = await res.json();
            setMessage({ type: 'success', text: data.message });

            // Track failed account IDs
            if (data.results) {
                const failed = new Set<number>();
                for (const r of data.results) {
                    if (!r.success) {
                        failed.add(r.id);
                    }
                }
                setFailedIds(failed);
            }

            // Reload accounts
            await fetchAccounts();
        } catch (err) {
            setMessage({ type: 'error', text: 'Refresh thất bại' });
        } finally {
            setRefreshing(false);
        }
    };

    const handleClearStorage = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xoá toàn bộ Storage của tất cả tài khoản?')) {
            return;
        }

        setClearingStorage(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin-clear-storage', {
                method: 'POST',
                headers: { 'X-Admin-Key': adminKey },
            });

            if (!res.ok) throw new Error('Failed to clear storage');

            const data = await res.json();
            setMessage({ type: 'success', text: data.message });
        } catch (err) {
            setMessage({ type: 'error', text: 'Xoá storage thất bại' });
        } finally {
            setClearingStorage(false);
        }
    };

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail || !newAuthToken) return;

        setAdding(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin-accounts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Key': adminKey,
                },
                body: JSON.stringify({
                    email: newEmail,
                    auth_token: newAuthToken,
                }),
            });

            if (!res.ok) throw new Error('Failed to add account');

            const data = await res.json();
            setMessage({ type: 'success', text: data.message });
            setNewEmail('');
            setNewAuthToken('');

            // Reload accounts
            await fetchAccounts();
        } catch (err) {
            setMessage({ type: 'error', text: 'Thêm account thất bại' });
        } finally {
            setAdding(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('vi-VN');
    };

    return (
        <div className="admin-overlay">
            <div className="admin-panel">
                <div className="admin-header">
                    <h1>🔐 Admin Panel</h1>
                    <button className="btn-close" onClick={onClose} title="Đóng">
                        ×
                    </button>
                </div>

                {message && (
                    <div className={`admin-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {/* Accounts Table */}
                <div className="admin-section">
                    <div className="admin-section-header">
                        <h2>📋 Danh sách Accounts</h2>
                        <div className="admin-action-group">
                            <button
                                className={`btn-refresh-icon ${refreshing ? 'loading' : ''}`}
                                onClick={handleRefreshAll}
                                disabled={refreshing || clearingStorage}
                                title="Refresh All Credits"
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 4v6h-6M1 20v-6h6" />
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                </svg>
                            </button>
                            <button
                                className={`btn-clear-storage-icon ${clearingStorage ? 'loading' : ''}`}
                                onClick={handleClearStorage}
                                disabled={refreshing || clearingStorage}
                                title="Clear All Storage"
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <p>Đang tải...</p>
                    ) : (
                        <table className="accounts-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Email</th>
                                    <th>Credits ($)</th>
                                    <th>Status</th>
                                    <th>Last Used</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((acc) => (
                                    <tr key={acc.id}>
                                        <td>{acc.id}</td>
                                        <td className={failedIds.has(acc.id) ? 'email-refresh-failed' : ''}>{acc.email}</td>
                                        <td>${creditsToDollars(acc.credits_remaining)}</td>
                                        <td className={`status-${acc.status}`}>
                                            {acc.status}
                                        </td>
                                        <td>{formatDate(acc.last_used)}</td>
                                    </tr>
                                ))}
                                {accounts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>
                                            Chưa có account nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Add Account Form */}
                <div className="admin-section">
                    <h2>➕ Thêm Account</h2>
                    <form className="add-account-form" onSubmit={handleAddAccount}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Auth Token"
                            value={newAuthToken}
                            onChange={(e) => setNewAuthToken(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={adding || !newEmail || !newAuthToken}>
                            {adding ? <span className="loading-spinner" /> : 'Thêm'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

