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

export interface AuditLog {
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

export interface CreateAuditLogData {
    account_id: number;
    account_email: string;
    service: 'chat' | 'image' | 'video';
    action: 'request' | 'credit_change' | 'error';
    credits_before?: number;
    credits_after?: number;
    account_status?: string;
    error_message?: string;
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

    await getDb().execute(`
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

// Get account statistics
export async function getAccountStats(): Promise<{ active: number; exhausted: number }> {
    const result = await getDb().execute(
        `SELECT 
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
            COUNT(CASE WHEN status = 'exhausted' THEN 1 END) as exhausted
         FROM accounts`
    );
    const row = result.rows[0];
    return {
        active: Number(row?.active || 0),
        exhausted: Number(row?.exhausted || 0),
    };
}

// Create an audit log entry
export async function createAuditLog(data: CreateAuditLogData): Promise<void> {
    try {
        // Ensure table exists
        await getDb().execute(`
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

        await getDb().execute({
            sql: `INSERT INTO audit_logs 
                  (account_id, account_email, service, action, credits_before, credits_after, account_status, error_message)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                data.account_id,
                data.account_email,
                data.service,
                data.action,
                data.credits_before ?? null,
                data.credits_after ?? null,
                data.account_status ?? null,
                data.error_message ?? null,
            ],
        });
    } catch (err) {
        console.error('[AuditLog] Failed to create audit log:', err);
    }
}

// Get audit logs with pagination
export async function getAuditLogs(
    limit: number = 50,
    offset: number = 0,
    filters?: { service?: string; account_id?: number }
): Promise<{ logs: AuditLog[]; total: number }> {
    let whereClause = '';
    const args: (string | number)[] = [];

    if (filters?.service) {
        whereClause = 'WHERE service = ?';
        args.push(filters.service);
    }
    if (filters?.account_id) {
        whereClause = whereClause ? `${whereClause} AND account_id = ?` : 'WHERE account_id = ?';
        args.push(filters.account_id);
    }

    // Get total count
    const countResult = await getDb().execute({
        sql: `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
        args,
    });
    const total = Number(countResult.rows[0]?.count || 0);

    // Get logs
    const result = await getDb().execute({
        sql: `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        args: [...args, limit, offset],
    });

    return {
        logs: result.rows as unknown as AuditLog[],
        total,
    };
}

export { getDb };
