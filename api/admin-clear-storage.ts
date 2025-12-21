import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@libsql/client';

const PUTER_API_ORIGIN = 'https://api.puter.com';

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

    if (!secret) return false;
    if (!adminKey || Array.isArray(adminKey)) return false;
    return adminKey === secret;
}

async function listFiles(authToken: string): Promise<string[]> {
    const res = await fetch(`${PUTER_API_ORIGIN}/readdir`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ path: '.' }),
    });

    if (!res.ok) {
        throw new Error(`List files error: ${res.status}`);
    }

    const data = await res.json();
    // Puter returns an array of items, each with a 'name' property
    return (data || []).map((item: any) => item.name);
}

async function deleteFile(authToken: string, path: string): Promise<void> {
    const res = await fetch(`${PUTER_API_ORIGIN}/delete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ path }),
    });

    if (!res.ok) {
        throw new Error(`Delete file error: ${res.status}`);
    }
}

async function deleteFiles(authToken: string, paths: string[]): Promise<void> {
    for (const path of paths) {
        try {
            await deleteFile(authToken, path);
        } catch (err) {
            console.error(`Failed to delete file ${path}:`, err);
            // Continue with other files even if one fails
        }
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    const db = getDb();

    try {
        const result = await db.execute('SELECT id, email, auth_token FROM accounts');
        const results = [];

        for (const row of result.rows) {
            const authToken = row.auth_token as string;
            const email = row.email as string;

            try {
                const paths = await listFiles(authToken);
                if (paths.length > 0) {
                    await deleteFiles(authToken, paths);
                }
                results.push({ email, success: true, count: paths.length });
            } catch (err) {
                results.push({ email, success: false, error: String(err) });
            }
        }

        await db.close();
        return res.status(200).json({
            message: `Đã dọn dẹp storage cho ${results.length} tài khoản`,
            results
        });
    } catch (error) {
        if (db) await db.close();
        return res.status(500).json({ error: 'Internal server error', message: String(error) });
    }
}
