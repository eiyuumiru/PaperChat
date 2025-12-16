import { createClient, Client } from '@libsql/client';

// Lazy database client initialization
let db: Client | null = null;

function getDb(): Client {
    if (!db) {
        if (!process.env.TURSO_DATABASE_URL) {
            throw new Error('TURSO_DATABASE_URL environment variable is not set');
        }
        db = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });
    }
    return db;
}

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
    await getDb().execute(`
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
    const result = await getDb().execute(
        `SELECT * FROM accounts WHERE status = 'active' ORDER BY credits_remaining DESC`
    );
    return result.rows as unknown as Account[];
}

// Get account with LEAST credits (for chat - cheapest operations)
export async function getAccountWithLeastCredits(): Promise<Account | null> {
    const result = await getDb().execute(
        `SELECT * FROM accounts 
         WHERE status = 'active' 
         ORDER BY credits_remaining ASC 
         LIMIT 1`
    );
    return (result.rows[0] as unknown as Account) || null;
}

// Get account with MOST credits (for video - most expensive operations)
export async function getAccountWithMostCredits(): Promise<Account | null> {
    const result = await getDb().execute(
        `SELECT * FROM accounts 
         WHERE status = 'active' 
         ORDER BY credits_remaining DESC 
         LIMIT 1`
    );
    return (result.rows[0] as unknown as Account) || null;
}

// Get account with MIDDLE credits (for image - medium operations)
export async function getAccountWithMiddleCredits(): Promise<Account | null> {
    // Get all active accounts sorted by credits
    const result = await getDb().execute(
        `SELECT * FROM accounts 
         WHERE status = 'active' 
         ORDER BY credits_remaining ASC`
    );

    const accounts = result.rows as unknown as Account[];
    if (accounts.length === 0) return null;

    // Return the middle account
    const middleIndex = Math.floor(accounts.length / 2);
    return accounts[middleIndex];
}

// Update account credits
export async function updateAccountCredits(
    accountId: number,
    credits: number
): Promise<void> {
    await getDb().execute({
        sql: `UPDATE accounts 
              SET credits_remaining = ?, last_used = CURRENT_TIMESTAMP 
              WHERE id = ?`,
        args: [credits, accountId],
    });
}

// Mark account as exhausted
export async function markAccountExhausted(accountId: number): Promise<void> {
    await getDb().execute({
        sql: `UPDATE accounts SET status = 'exhausted' WHERE id = ?`,
        args: [accountId],
    });
}

// Mark account as error
export async function markAccountError(
    accountId: number,
    _errorMessage: string
): Promise<void> {
    await getDb().execute({
        sql: `UPDATE accounts SET status = 'error' WHERE id = ?`,
        args: [accountId],
    });
}

export { getDb };
