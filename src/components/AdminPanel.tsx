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
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

        try {
            const res = await fetch('/api/admin-refresh', {
                method: 'POST',
                headers: { 'X-Admin-Key': adminKey },
            });

            if (!res.ok) throw new Error('Failed to refresh');

            const data = await res.json();
            setMessage({ type: 'success', text: data.message });

            // Reload accounts
            await fetchAccounts();
        } catch (err) {
            setMessage({ type: 'error', text: 'Refresh thất bại' });
        } finally {
            setRefreshing(false);
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
                    <h2>📋 Danh sách Accounts</h2>

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
                                        <td>{acc.email}</td>
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

                {/* Actions */}
                <div className="admin-section">
                    <h2>⚡ Actions</h2>
                    <div className="admin-actions">
                        <button
                            className={`btn-refresh ${refreshing ? 'loading' : ''}`}
                            onClick={handleRefreshAll}
                            disabled={refreshing}
                        >
                            {refreshing ? (
                                <>
                                    <span className="loading-spinner" />
                                    Đang refresh...
                                </>
                            ) : (
                                '🔄 Refresh All Credits'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
