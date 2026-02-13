
const { Client } = require('pg');
require('dotenv').config();

async function addColumn() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/jersey_db'
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        console.log('Adding refresh_token column to admin_users...');
        await client.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS refresh_token varchar(500)');
        console.log('Successfully added refresh_token column.');

    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        await client.end();
    }
}

addColumn();
