/**
 * Add account to database
 * Run with: npx tsx scripts/add-account.ts <email> <auth_token> [credits]
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function addAccount() {
    const [, , email, authToken, credits] = process.argv;

    if (!email || !authToken) {
        console.log('Usage: npx tsx scripts/add-account.ts <email> <auth_token> [credits]');
        console.log('');
        console.log('Example:');
        console.log('  npx tsx scripts/add-account.ts user@example.com "eyJhbGciOiJIUzI1NiIs..." 50000000');
        process.exit(1);
    }

    const url = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        console.error('❌ TURSO_DATABASE_URL is not set in .env.local');
        process.exit(1);
    }

    const db = createClient({ url, authToken: token });

    const creditsValue = credits ? parseFloat(credits) : 50000000; // Default ~$0.50

    console.log(`📝 Adding account: ${email}`);
    console.log(`   Credits: $${(creditsValue / 100000000).toFixed(2)}`);

    await db.execute({
        sql: `INSERT INTO accounts (email, auth_token, credits_remaining) VALUES (?, ?, ?)`,
        args: [email, authToken, creditsValue],
    });

    console.log('✅ Account added successfully!');

    // List all accounts
    const result = await db.execute('SELECT id, email, credits_remaining, status FROM accounts');
    console.log('');
    console.log('📋 All accounts:');
    for (const row of result.rows) {
        const credits = (row.credits_remaining as number) / 100000000;
        console.log(`   [${row.id}] ${row.email} - $${credits.toFixed(2)} (${row.status})`);
    }

    await db.close();
}

addAccount().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
