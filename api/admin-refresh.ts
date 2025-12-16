/**
 * Admin API: Refresh Credits for All Accounts
 * POST - Fetches current credits from Puter API and updates database
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@libsql/client';

const PUTER_API = 'https://api.puter.com';

function getDb() {
    if (!process.env.TURSO_DATABASE_URL) {
        throw new Error('TURSO_DATABASE_URL is not set');
    }
    return createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
}

function verifyAdmin(req: VercelRequest): boolean {
    const adminKey = req.headers['x-admin-key'];
    const secret = process.env.ADMIN_SECRET_KEY;

    if (!secret) {
        console.error('ADMIN_SECRET_KEY is not set in environment variables');
        return false;
    }

    if (!adminKey || Array.isArray(adminKey)) {
        return false;
    }

    return adminKey === secret;
}

async function getCredits(authToken: string): Promise<number> {
    const res = await fetch(`${PUTER_API}/metering/usage`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    });

    if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    return data.allowanceInfo?.remaining ?? 0;
}

interface RefreshResult {
    id: number;
    email: string;
    credits: number;
    status: string;
    success: boolean;
    error?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify admin key
    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = getDb();

    try {
        const result = await db.execute('SELECT id, email, auth_token FROM accounts');

        if (result.rows.length === 0) {
            await db.close();
            return res.status(200).json({
                message: 'No accounts found',
                results: []
            });
        }

        const results: RefreshResult[] = [];

        for (const row of result.rows) {
            const id = row.id as number;
            const email = row.email as string;
            const authToken = row.auth_token as string;

            try {
                const credits = await getCredits(authToken);
                const status = credits > 1000000 ? 'active' : 'exhausted';

                await db.execute({
                    sql: 'UPDATE accounts SET credits_remaining = ?, status = ?, last_used = CURRENT_TIMESTAMP WHERE id = ?',
                    args: [credits, status, id],
                });

                results.push({
                    id,
                    email,
                    credits,
                    status,
                    success: true,
                });
            } catch (err) {
                results.push({
                    id,
                    email,
                    credits: 0,
                    status: 'error',
                    success: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        }

        await db.close();

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return res.status(200).json({
            message: `Refreshed ${successCount} accounts, ${failCount} failed`,
            results,
        });
    } catch (error) {
        await db.close();
        console.error('Admin refresh error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
