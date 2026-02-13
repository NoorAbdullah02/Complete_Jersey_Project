const { Client } = require('pg');
const path = require('path');
// Load .env from the server directory explicitly
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not defined in .env');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // Force SSL for Neon
    });

    try {
        await client.connect();
        console.log('Connected to Neon DB for migration...');

        // Start transaction
        await client.query('BEGIN');

        console.log('Removing legacy columns from orders table...');
        const columns = ['jersey_number', 'batch', 'size', 'collar_type', 'sleeve_type'];
        for (const col of columns) {
            try {
                await client.query(`ALTER TABLE orders DROP COLUMN IF EXISTS ${col}`);
                console.log(`- Dropped ${col} (if existed)`);
            } catch (e) {
                console.log(`- Error dropping ${col}: ${e.message}`);
            }
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
