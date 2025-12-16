import { createClient } from '@libsql/client';

// Turso database client
const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export interface Account {
    id: number;
    email: string;
    auth_token: string;
    credits_remaining: number;
    status: 'active' | 'exhausted' | 'error';
    last_used: string | null;
    created_at: string;
}

// Initialize database schema
export async function initDatabase(): Promise<void> {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            auth_token TEXT NOT NULL,
            credits_remaining REAL DEFAULT 0,
            status TEXT DEFAULT 'active',
            last_used DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// Get all active accounts
export async function getActiveAccounts(): Promise<Account[]> {
    const result = await db.execute(
        `SELECT * FROM accounts WHERE status = 'active' ORDER BY credits_remaining DESC`
    );
    return result.rows as unknown as Account[];
}

// Get account by tier
export async function getAccountByTier(
    minCredits: number,
    maxCredits: number
): Promise<Account | null> {
    const result = await db.execute({
        sql: `SELECT * FROM accounts 
              WHERE status = 'active' 
              AND credits_remaining >= ? 
              AND credits_remaining < ?
              ORDER BY credits_remaining DESC 
              LIMIT 1`,
        args: [minCredits, maxCredits],
    });
    return (result.rows[0] as unknown as Account) || null;
}

// Get account with minimum credits
export async function getAccountWithMinCredits(
    minCredits: number
): Promise<Account | null> {
    const result = await db.execute({
        sql: `SELECT * FROM accounts 
              WHERE status = 'active' 
              AND credits_remaining >= ?
              ORDER BY credits_remaining DESC 
              LIMIT 1`,
        args: [minCredits],
    });
    return (result.rows[0] as unknown as Account) || null;
}

// Get any active account (fallback)
export async function getAnyActiveAccount(): Promise<Account | null> {
    const result = await db.execute(
        `SELECT * FROM accounts 
         WHERE status = 'active' 
         ORDER BY credits_remaining DESC 
         LIMIT 1`
    );
    return (result.rows[0] as unknown as Account) || null;
}

// Update account credits
export async function updateAccountCredits(
    accountId: number,
    credits: number
): Promise<void> {
    await db.execute({
        sql: `UPDATE accounts 
              SET credits_remaining = ?, last_used = CURRENT_TIMESTAMP 
              WHERE id = ?`,
        args: [credits, accountId],
    });
}

// Mark account as exhausted
export async function markAccountExhausted(accountId: number): Promise<void> {
    await db.execute({
        sql: `UPDATE accounts SET status = 'exhausted' WHERE id = ?`,
        args: [accountId],
    });
}

// Mark account as error
export async function markAccountError(
    accountId: number,
    errorMessage: string
): Promise<void> {
    await db.execute({
        sql: `UPDATE accounts SET status = 'error' WHERE id = ?`,
        args: [accountId],
    });
}

export default db;
