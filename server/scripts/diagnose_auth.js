
const { Client } = require('pg');
require('dotenv').config();

async function diagnose() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/jersey_db'
    });

    try {
        await client.connect();
        console.log('--- DATABASE CHECK ---');
        const res = await client.query('SELECT id, username, email, is_verified FROM admin_users');
        console.table(res.rows.map(r => ({
            ...r,
            username_len: r.username.length,
            username_hex: Buffer.from(r.username).toString('hex')
        })));

        console.log('\n--- SECRET CHECK ---');
        const secret = process.env.JWT_SECRET || 'fallback-secret';
        console.log(`Secret length: ${secret.length}`);
        console.log(`Secret hex: ${Buffer.from(secret).toString('hex')}`);
        if (secret.includes('\r')) console.log('WARNING: Secret contains Carriage Return (\\r)');
        if (secret.includes('\n')) console.log('WARNING: Secret contains Newline (\\n)');

    } catch (err) {
        console.error('Error during diagnosis:', err);
    } finally {
        await client.end();
    }
}

diagnose();
