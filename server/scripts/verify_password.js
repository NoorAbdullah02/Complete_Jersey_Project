
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function verifyPassword() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/jersey_db'
    });

    const username = 'imran';
    const providedPassword = '12345678';

    try {
        await client.connect();
        const res = await client.query('SELECT password_hash FROM admin_users WHERE username = $1', [username]);

        if (res.rows.length === 0) {
            console.log(`User ${username} not found.`);
            return;
        }

        const hash = res.rows[0].password_hash;
        const match = await bcrypt.compare(providedPassword, hash);

        console.log(`--- Password Verification for ${username} ---`);
        console.log(`Hash in DB: ${hash ? 'Found' : 'MISSING'}`);
        console.log(`Comparison Result: ${match ? 'MATCH' : 'NO MATCH'}`);

        if (!match) {
            console.log("\nThe provided password does NOT match the stored hash.");
        } else {
            console.log("\nThe password matches! The login issue might be elsewhere (e.g. JWT secret mismatch).");
        }

    } catch (err) {
        console.error('Error verifying password:', err);
    } finally {
        await client.end();
    }
}

verifyPassword();
