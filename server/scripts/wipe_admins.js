const { Client } = require('pg');
require('dotenv').config();

async function wipeAdmins() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        await client.query('DELETE FROM admin_users');
        console.log('\n✅ All admin accounts have been removed.');
        console.log('You can now register a new admin account via the UI.');
        console.log('The first account registered will be automatically verified.\n');
    } catch (err) {
        console.error('Error wiping admins:', err);
    } finally {
        await client.end();
    }
}

wipeAdmins();
