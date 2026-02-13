require('dotenv').config();
const { Client } = require('pg');

async function migrate() {
    console.log('Starting migration v3: Adding jersey_name to order_items...');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        // Add jersey_name column to order_items
        await client.query(`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS jersey_name VARCHAR(30);
    `);

        console.log('Column "jersey_name" added to order_items successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Migration complete.');
    }
}

migrate();
