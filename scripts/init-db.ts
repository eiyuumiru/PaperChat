/**
 * Database initialization script
 * Run with: npx tsx scripts/init-db.ts
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function initDatabase() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        console.error('❌ TURSO_DATABASE_URL is not set in .env.local');
        process.exit(1);
    }

    console.log('📦 Connecting to Turso database...');
    console.log(`   URL: ${url}`);

    const db = createClient({
        url,
        authToken,
    });

    console.log('🔧 Creating accounts table...');

    await db.execute(`
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            auth_token TEXT NOT NULL,
            credits_remaining REAL DEFAULT 50000000,
            status TEXT DEFAULT 'active',
            last_used DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✅ Database initialized successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   2. Run: npx tsx scripts/add-account.ts <email> <auth_token>');
    console.log('   3. Or manually insert via Turso dashboard');

    await db.close();
}

initDatabase().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
