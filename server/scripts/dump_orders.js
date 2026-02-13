
const { Client } = require('pg');
require('dotenv').config();

async function dumpOrders() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/jersey_db'
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        console.log('\n--- LATEST 5 ORDERS ---');
        const orders = await client.query('SELECT * FROM orders ORDER BY id DESC LIMIT 5');
        for (const order of orders.rows) {
            console.log(`Order ID: ${order.id}, Name: ${order.name}, Status: ${order.status}`);

            const items = await client.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
            if (items.rows.length === 0) {
                console.log('  (No items found)');
            } else {
                items.rows.forEach(item => {
                    console.log(`  - Item ID: ${item.id}, Number: [${item.jersey_number}], Name: [${item.jersey_name}], Size: ${item.size}`);
                });
            }
        }

    } catch (err) {
        console.error('Error dumping orders:', err);
    } finally {
        await client.end();
    }
}

dumpOrders();
