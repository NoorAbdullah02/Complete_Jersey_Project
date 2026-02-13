
const { Client } = require('pg');
require('dotenv').config();

async function checkAdmin() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/jersey_db'
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const res = await client.query('SELECT username, email, is_verified, created_at FROM admin_users WHERE username = $1', ['imran']);

        if (res.rows.length === 0) {
            console.log("User 'imran' NOT found in admin_users table.");
            const allUsers = await client.query('SELECT username FROM admin_users');
            console.log("Current users in DB:", allUsers.rows.map(r => r.username).join(', ') || 'None');
        } else {
            const user = res.rows[0];
            console.log("User 'imran' found:");
            console.log(`- Email: ${user.email}`);
            console.log(`- Verified: ${user.is_verified}`);
            console.log(`- Created At: ${user.created_at}`);

            if (!user.is_verified) {
                console.log("\nACTION REQUIRED: User is not verified. Check email or manually verify.");
            }
        }

    } catch (err) {
        console.error('Error checking admin:', err);
    } finally {
        await client.end();
    }
}

checkAdmin();
