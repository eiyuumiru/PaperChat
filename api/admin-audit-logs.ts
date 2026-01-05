/**
 * Admin API: Audit Logs
 * GET - List audit logs with pagination and filters
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@libsql/client';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verify admin key
    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const db = getDb();

    try {
        // Ensure table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER NOT NULL,
                account_email TEXT NOT NULL,
                service TEXT NOT NULL,
                action TEXT NOT NULL,
                credits_before REAL,
                credits_after REAL,
                account_status TEXT,
                error_message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Parse query parameters
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
        const offset = parseInt(req.query.offset as string) || 0;
        const service = req.query.service as string | undefined;
        const accountId = req.query.account_id ? parseInt(req.query.account_id as string) : undefined;

        // Build WHERE clause
        let whereClause = '';
        const args: (string | number)[] = [];

        if (service && ['chat', 'image', 'video'].includes(service)) {
            whereClause = 'WHERE service = ?';
            args.push(service);
        }
        if (accountId) {
            whereClause = whereClause ? `${whereClause} AND account_id = ?` : 'WHERE account_id = ?';
            args.push(accountId);
        }

        // Get total count
        const countResult = await db.execute({
            sql: `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
            args,
        });
        const total = Number(countResult.rows[0]?.count || 0);

        // Get logs
        const result = await db.execute({
            sql: `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            args: [...args, limit, offset],
        });

        await db.close();
        return res.status(200).json({
            logs: result.rows,
            total,
            limit,
            offset,
        });
    } catch (error) {
        await db.close();
        console.error('Audit Logs API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
