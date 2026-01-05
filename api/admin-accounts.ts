/**
 * Admin API: Account Management
 * GET - List all accounts (without auth_token for security)
 * POST - Add new account
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

    // Fail securely if secret is not configured server-side
    if (!secret) {
        console.error('ADMIN_SECRET_KEY is not set in environment variables');
        return false;
    }

    // Fail if key is missing or is an array (multiple headers)
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verify admin key
    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = getDb();

    try {
        if (req.method === 'GET') {
            // List all accounts (without auth_token)
            const result = await db.execute(
                'SELECT id, email, credits_remaining, status, last_used, created_at FROM accounts ORDER BY id'
            );

            await db.close();
            return res.status(200).json({ accounts: result.rows });
        }

        if (req.method === 'POST') {
            const { email, auth_token } = req.body;

            if (!email || !auth_token) {
                await db.close();
                return res.status(400).json({ error: 'email and auth_token are required' });
            }

            // Get initial credits from Puter API
            let credits = 50000000; // Default ~$0.50
            try {
                credits = await getCredits(auth_token);
            } catch (err) {
                console.warn('Could not fetch initial credits, using default');
            }

            await db.execute({
                sql: 'INSERT INTO accounts (email, auth_token, credits_remaining) VALUES (?, ?, ?)',
                args: [email, auth_token, credits],
            });

            await db.close();
            return res.status(201).json({
                success: true,
                message: `Account ${email} added successfully`,
                credits
            });
        }

        if (req.method === 'PUT') {
            const { id, email, status, credits_remaining } = req.body;

            if (!id) {
                await db.close();
                return res.status(400).json({ error: 'id is required' });
            }

            // Build dynamic update query based on provided fields
            const updates: string[] = [];
            const args: (string | number)[] = [];

            if (email !== undefined) {
                updates.push('email = ?');
                args.push(email);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                args.push(status);
            }
            if (credits_remaining !== undefined) {
                updates.push('credits_remaining = ?');
                args.push(credits_remaining);
            }

            if (updates.length === 0) {
                await db.close();
                return res.status(400).json({ error: 'No fields to update' });
            }

            args.push(id);
            await db.execute({
                sql: `UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`,
                args,
            });

            await db.close();
            return res.status(200).json({
                success: true,
                message: `Account ${id} updated successfully`,
            });
        }

        if (req.method === 'DELETE') {
            const { id } = req.body;

            if (!id) {
                await db.close();
                return res.status(400).json({ error: 'id is required' });
            }

            await db.execute({
                sql: 'DELETE FROM accounts WHERE id = ?',
                args: [id],
            });

            await db.close();
            return res.status(200).json({
                success: true,
                message: `Account ${id} deleted successfully`,
            });
        }

        await db.close();
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        await db.close();
        console.error('Admin API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
