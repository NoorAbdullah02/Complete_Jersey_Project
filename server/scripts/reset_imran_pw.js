const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPassword() {
    const username = 'imran';
    const newPassword = 'imran123';
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const passwordHash = await bcrypt.hash(newPassword, 10);

        const res = await client.query(
            'UPDATE admin_users SET password_hash = $1 WHERE username = $2 RETURNING id',
            [passwordHash, username]
        );

        if (res.rowCount === 0) {
            // Try again with explicit matching if RETURNING $1 caused issues (unlikely but safe)
            const res2 = await client.query(
                'UPDATE admin_users SET password_hash = $1 WHERE username = $2',
                [passwordHash, username]
            );
            if (res2.rowCount > 0) {
                console.log(`\n✅ Password for "${username}" has been reset to: ${newPassword}\n`);
            } else {
                console.log(`\n❌ User "${username}" not found in database.\n`);
            }
        } else {
            console.log(`\n✅ Password for "${username}" has been reset to: ${newPassword}\n`);
        }
    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        await client.end();
    }
}

resetPassword();
