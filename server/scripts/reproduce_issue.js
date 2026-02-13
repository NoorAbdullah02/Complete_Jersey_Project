
const { Client } = require('pg');
require('dotenv').config();

async function reproduce() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/jersey_db'
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const testPayload = {
            name: 'Test Runner',
            mobileNumber: '01234567890',
            email: 'test@example.com',
            totalPrice: 400, // Frontend sends totalPrice
            items: [
                {
                    jerseyNumber: '99',
                    jerseyName: 'TESTER',
                    size: 'L',
                    collarType: 'polo',
                    sleeveType: 'half',
                    price: 400
                }
            ]
        };

        console.log('Step 1: Simulating backend logic...');
        const { name, mobileNumber, email, transactionId, txnId, notes, finalPrice, totalPrice, items } = testPayload;

        // This mirrors the bug I found in orders.ts where it uses finalPrice instead of actualFinalPrice
        const actualFinalPrice = finalPrice || totalPrice;

        await client.query('BEGIN');

        console.log('Step 2: Inserting order...');
        const orderResult = await client.query(`
            INSERT INTO orders (name, mobile_number, email, transaction_id, notes, final_price, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending')
            RETURNING *
        `, [
            name.trim(), mobileNumber.trim(),
            email.trim(), transactionId?.trim() || null,
            notes?.trim() || null, actualFinalPrice // Changed to actualFinalPrice to see if it works
        ]);

        const order = orderResult.rows[0];
        console.log(`Order created with ID: ${order.id}`);

        console.log('Step 3: Inserting items...');
        for (const item of items) {
            await client.query(`
                INSERT INTO order_items (order_id, jersey_number, jersey_name, batch, size, collar_type, sleeve_type, item_price)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                order.id,
                item.jerseyNumber.toString().trim(),
                item.jerseyName?.trim().toUpperCase() || null,
                item.batch?.trim() || null,
                item.size,
                item.collarType,
                item.sleeveType,
                item.price || 0
            ]);
        }

        await client.query('COMMIT');
        console.log('Transaction COMMITTED');

        // Verify
        const verify = await client.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
        console.log(`Verification: Found ${verify.rows.length} items for Order ${order.id}`);
        verify.rows.forEach(i => console.log(`  - Number: ${i.jersey_number}, Name: ${i.jersey_name}`));

    } catch (err) {
        console.error('REPRODUCTION FAILED:', err);
        // ROLLBACK is handled in the real code, here we just catch
    } finally {
        await client.end();
    }
}

reproduce();
