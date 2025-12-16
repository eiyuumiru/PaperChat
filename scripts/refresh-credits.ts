import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const PUTER_API = 'https://api.puter.com';

const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

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

    // Use allowanceInfo.remaining for credits (in tokens, not microcents)
    const remaining = data.allowanceInfo?.remaining ?? 0;

    if (!Number.isFinite(remaining)) {
        throw new Error(`Invalid credits value: ${remaining}`);
    }

    return remaining;
}

async function main() {
    console.log('🔄 Refreshing credits for all accounts...\n');

    const result = await db.execute('SELECT id, email, auth_token FROM accounts');

    if (result.rows.length === 0) {
        console.log('⚠️  No accounts found in database.');
        await db.close();
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const row of result.rows) {
        const id = row.id as number;
        const email = row.email as string;
        const authToken = row.auth_token as string;

        try {
            const credits = await getCredits(authToken);
            // 50M tokens is the free allowance, mark as active if > 1M remaining
            const status = credits > 1000000 ? 'active' : 'exhausted';

            await db.execute({
                sql: 'UPDATE accounts SET credits_remaining = ?, status = ?, last_used = CURRENT_TIMESTAMP WHERE id = ?',
                args: [credits, status, id],
            });

            const creditsM = (credits / 1000000).toFixed(2);
            console.log(`✅ [${id}] ${email}: ${creditsM}M tokens (${status})`);
            successCount++;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.log(`❌ [${id}] ${email}: Failed - ${errorMsg}`);
            failCount++;
        }
    }

    await db.close();

    console.log('\n' + '='.repeat(50));
    console.log(`✨ Done! Success: ${successCount}, Failed: ${failCount}`);
}

main().catch(console.error);
