
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPassword() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/jersey_db'
    });

    const username = 'imran';
    const newPassword = '12345678';

    try {
        await client.connect();
        const hash = await bcrypt.hash(newPassword, 12);

        const res = await client.query(
            'UPDATE admin_users SET password_hash = $1, is_verified = true WHERE username = $2 RETURNING username',
            [hash, username]
        );

        if (res.rows.length === 0) {
            console.log(`User ${username} not found.`);
        } else {
            console.log(`Successfully reset password and verified status for ${username}.`);
        }

    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        await client.end();
    }
}

resetPassword();
