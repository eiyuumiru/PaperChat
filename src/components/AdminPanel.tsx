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

interface AuditLog {
    id: number;
    account_id: number;
    account_email: string;
    service: 'chat' | 'image' | 'video';
    action: 'request' | 'credit_change' | 'error';
    credits_before: number | null;
    credits_after: number | null;
    account_status: string | null;
    error_message: string | null;
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
    const [failedIds, setFailedIds] = useState<Set<number>>(new Set());

    // Add account form
    const [newEmail, setNewEmail] = useState('');
    const [newAuthToken, setNewAuthToken] = useState('');
    const [adding, setAdding] = useState(false);

    // Edit/Delete state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<Partial<Account>>({});
    const [deleting, setDeleting] = useState<number | null>(null);

    // Audit logs state
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditTotal, setAuditTotal] = useState(0);

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
        fetchAuditLogs();
    }, []);

    const fetchAuditLogs = async () => {
        setAuditLoading(true);
        try {
            const res = await fetch('/api/admin-audit-logs?limit=30', {
                headers: { 'X-Admin-Key': adminKey },
            });
            if (!res.ok) throw new Error('Failed to fetch audit logs');
            const data = await res.json();
            setAuditLogs(data.logs || []);
            setAuditTotal(data.total || 0);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
        } finally {
            setAuditLoading(false);
        }
    };

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

    const handleDeleteAccount = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xoá account này?')) return;

        setDeleting(id);
        setMessage(null);

        try {
            const res = await fetch('/api/admin-accounts', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Key': adminKey,
                },
                body: JSON.stringify({ id }),
            });

            if (!res.ok) throw new Error('Failed to delete account');

            const data = await res.json();
            setMessage({ type: 'success', text: data.message });
            await fetchAccounts();
        } catch (err) {
            setMessage({ type: 'error', text: 'Xoá account thất bại' });
        } finally {
            setDeleting(null);
        }
    };

    const handleUpdateAccount = async (id: number) => {
        setMessage(null);

        try {
            const res = await fetch('/api/admin-accounts', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Key': adminKey,
                },
                body: JSON.stringify({ id, ...editData }),
            });

            if (!res.ok) throw new Error('Failed to update account');

            const data = await res.json();
            setMessage({ type: 'success', text: data.message });
            setEditingId(null);
            setEditData({});
            await fetchAccounts();
        } catch (err) {
            setMessage({ type: 'error', text: 'Cập nhật account thất bại' });
        }
    };

    const startEdit = (acc: Account) => {
        setEditingId(acc.id);
        setEditData({
            email: acc.email,
            credits_remaining: acc.credits_remaining,
            status: acc.status,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('vi-VN');
    };

    const formatCredits = (val: number | null) => {
        if (val === null) return '-';
        return `$${creditsToDollars(val)}`;
    };

    const getServiceBadge = (service: string) => {
        const colors: Record<string, string> = {
            chat: '#2563EB',
            image: '#7C3AED',
            video: '#059669',
        };
        return (
            <span className="service-badge" style={{ backgroundColor: colors[service] || '#6b7280' }}>
                {service}
            </span>
        );
    };

    const getActionBadge = (action: string) => {
        const colors: Record<string, string> = {
            request: '#16a34a',
            error: '#dc2626',
            credit_change: '#d97706',
        };
        return (
            <span className="action-badge" style={{ backgroundColor: colors[action] || '#6b7280' }}>
                {action}
            </span>
        );
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
                        <button
                            className={`btn-refresh-icon ${refreshing ? 'loading' : ''}`}
                            onClick={handleRefreshAll}
                            disabled={refreshing}
                            title="Refresh All Credits"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 4v6h-6M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                        </button>
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
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((acc) => (
                                    <tr key={acc.id}>
                                        <td>{acc.id}</td>
                                        {editingId === acc.id ? (
                                            <>
                                                <td>
                                                    <input
                                                        type="email"
                                                        className="edit-input"
                                                        value={editData.email || ''}
                                                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="edit-input edit-input-small"
                                                        value={editData.credits_remaining || 0}
                                                        onChange={(e) => setEditData({ ...editData, credits_remaining: parseFloat(e.target.value) })}
                                                        step="1000000"
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        className="edit-select"
                                                        value={editData.status || 'active'}
                                                        onChange={(e) => setEditData({ ...editData, status: e.target.value as Account['status'] })}
                                                    >
                                                        <option value="active">active</option>
                                                        <option value="exhausted">exhausted</option>
                                                        <option value="error">error</option>
                                                    </select>
                                                </td>
                                                <td>{formatDate(acc.last_used)}</td>
                                                <td className="actions-cell">
                                                    <button
                                                        className="btn-action btn-save"
                                                        onClick={() => handleUpdateAccount(acc.id)}
                                                        title="Lưu"
                                                    >
                                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="btn-action btn-cancel-edit"
                                                        onClick={cancelEdit}
                                                        title="Huỷ"
                                                    >
                                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18" />
                                                            <line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className={failedIds.has(acc.id) ? 'email-refresh-failed' : ''}>{acc.email}</td>
                                                <td>${creditsToDollars(acc.credits_remaining)}</td>
                                                <td className={`status-${acc.status}`}>
                                                    {acc.status}
                                                </td>
                                                <td>{formatDate(acc.last_used)}</td>
                                                <td className="actions-cell">
                                                    <button
                                                        className="btn-action btn-edit"
                                                        onClick={() => startEdit(acc)}
                                                        title="Sửa"
                                                    >
                                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="btn-action btn-delete"
                                                        onClick={() => handleDeleteAccount(acc.id)}
                                                        disabled={deleting === acc.id}
                                                        title="Xoá"
                                                    >
                                                        {deleting === acc.id ? (
                                                            <span className="loading-spinner-small" />
                                                        ) : (
                                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {accounts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>
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

                {/* Audit Logs */}
                <div className="admin-section">
                    <div className="admin-section-header">
                        <h2>📜 Audit Logs ({auditTotal})</h2>
                        <button
                            className={`btn-refresh-icon ${auditLoading ? 'loading' : ''}`}
                            onClick={fetchAuditLogs}
                            disabled={auditLoading}
                            title="Refresh Audit Logs"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 4v6h-6M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                        </button>
                    </div>

                    {auditLoading && auditLogs.length === 0 ? (
                        <p>Đang tải...</p>
                    ) : (
                        <table className="accounts-table audit-logs-table">
                            <thead>
                                <tr>
                                    <th>Thời gian</th>
                                    <th>Account</th>
                                    <th>Dịch vụ</th>
                                    <th>Action</th>
                                    <th>Credits</th>
                                    <th>Status</th>
                                    <th>Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{formatDate(log.created_at)}</td>
                                        <td title={`ID: ${log.account_id}`}>{log.account_email}</td>
                                        <td>{getServiceBadge(log.service)}</td>
                                        <td>{getActionBadge(log.action)}</td>
                                        <td>
                                            {formatCredits(log.credits_before)}
                                            {log.credits_after !== null && (
                                                <> → {formatCredits(log.credits_after)}</>
                                            )}
                                        </td>
                                        <td className={`status-${log.account_status}`}>
                                            {log.account_status || '-'}
                                        </td>
                                        <td className="error-cell" title={log.error_message || ''}>
                                            {log.error_message ? log.error_message.substring(0, 30) + '...' : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {auditLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>
                                            Chưa có audit log nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

