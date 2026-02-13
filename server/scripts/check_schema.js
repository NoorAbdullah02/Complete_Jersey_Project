
const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/jersey_db'
    });

    try {
        await client.connect();
        console.log('--- DATABASE SCHEMA CHECK ---');

        const tables = ['orders', 'order_items'];
        for (const table of tables) {
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY column_name
            `, [table]);

            console.log(`\nTable: ${table}`);
            if (res.rows.length === 0) {
                console.log('  (Table not found or no columns)');
            } else {
                res.rows.forEach(row => {
                    console.log(`  - ${row.column_name}: ${row.data_type}`);
                });
            }
        }
        console.log('\n--- END OF CHECK ---');

    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
