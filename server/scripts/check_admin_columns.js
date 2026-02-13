
const { Client } = require('pg');
require('dotenv').config();

async function checkColumns() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/jersey_db'
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'admin_users'
        `);

        console.log('Columns in admin_users:');
        res.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type}`);
        });

    } catch (err) {
        console.error('Error checking columns:', err);
    } finally {
        await client.end();
    }
}

checkColumns();
