"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const email_1 = require("../services/email");
const router = (0, express_1.Router)();
// Check jersey number availability
router.get('/check-jersey', async (req, res) => {
    try {
        const { number } = req.query;
        if (!number) {
            res.status(400).json({ error: 'Jersey number required' });
            return;
        }
        const { db, client } = await (0, db_1.getDb)();
        try {
            // Check in order_items table now
            const result = await client.query(`
        SELECT o.name 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.jersey_number = $1
      `, [number.toString().trim()]);
            res.json({
                available: result.rows.length === 0,
                message: result.rows.length > 0
                    ? `Jersey #${number} is taken by ${result.rows[0].name}`
                    : `Jersey #${number} is available`,
            });
        }
        finally {
            await client.end();
        }
    }
    catch (error) {
        console.error('Jersey check error:', error);
        res.status(500).json({ error: 'Check failed' });
    }
});
// Check name existence
router.get('/check-name', async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) {
            res.status(400).json({ error: 'Name required' });
            return;
        }
        const { db, client } = await (0, db_1.getDb)();
        try {
            const result = await client.query('SELECT id FROM orders WHERE LOWER(name) = LOWER($1)', [name.trim()]);
            res.json({
                exists: result.rows.length > 0,
                message: result.rows.length > 0 ? `Name "${name}" already exists` : `Name "${name}" is available`,
            });
        }
        finally {
            await client.end();
        }
    }
    catch (error) {
        console.error('Name check error:', error);
        res.status(500).json({ error: 'Check failed' });
    }
});
// Check contact existence (email or mobile)
router.get('/check-contact', async (req, res) => {
    try {
        const { email, mobileNumber } = req.query;
        if (!email && !mobileNumber) {
            res.status(400).json({ error: 'Email or Mobile Number required' });
            return;
        }
        const { db, client } = await (0, db_1.getDb)();
        try {
            const conditions = [];
            const values = [];
            if (email) {
                values.push(email.trim());
                conditions.push(`email = $${values.length}`);
            }
            if (mobileNumber) {
                values.push(mobileNumber.trim());
                conditions.push(`mobile_number = $${values.length}`);
            }
            const query = `SELECT id FROM orders WHERE ${conditions.join(' OR ')}`;
            const result = await client.query(query, values);
            res.json({
                exists: result.rows.length > 0,
                message: result.rows.length > 0 ? 'Contact already used in previous orders' : 'Contact is new',
            });
        }
        finally {
            await client.end();
        }
    }
    catch (error) {
        console.error('Contact check error:', error);
        res.status(500).json({ error: 'Check failed' });
    }
});
// Submit new order (Multi-item support)
router.post('/', async (req, res) => {
    try {
        const { name, mobileNumber, email, transactionId, txnId, notes, finalPrice, totalPrice, items, preSelectedMethod, preSelectedProvider } = req.body;
        const actualTxnId = transactionId || txnId;
        const actualFinalPrice = finalPrice || totalPrice;
        if (!name || !mobileNumber || !email || !actualFinalPrice || !items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ error: 'Missing required fields or items' });
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            res.status(400).json({ error: 'Invalid email format' });
            return;
        }
        // Validate items
        for (const item of items) {
            const numValue = parseInt(item.jerseyNumber, 10);
            if (isNaN(numValue) || numValue < 0 || numValue > 500) {
                res.status(400).json({ error: `Invalid jersey number: ${item.jerseyNumber}` });
                return;
            }
        }
        // Payment validation: if an online method was selected, require transaction id
        const method = (preSelectedMethod || '').toString().toLowerCase();
        const isCashLike = method === 'hand' || method === 'cash' || method === 'cr' || method === 'cash-to-cr' || method === 'cash_cr';
        const isOnlineLike = method && !isCashLike;
        if (isOnlineLike && !actualTxnId) {
            res.status(400).json({ error: 'Transaction ID is required for online payments' });
            return;
        }
        const { db, client } = await (0, db_1.getDb)();
        try {
            await client.query('BEGIN');
            // 1. Insert Order
            const orderResult = await client.query(`
        INSERT INTO orders (name, mobile_number, email, transaction_id, notes, final_price, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING *
      `, [
                name.trim(), mobileNumber.trim(),
                email.trim(), actualTxnId?.trim() || null,
                notes?.trim() || null, actualFinalPrice
            ]);
            const order = orderResult.rows[0];
            // 2. Insert Items
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
            // 3. Ensure transactions table exists and insert a transaction record
            await client.query(`
                            CREATE TABLE IF NOT EXISTS transactions (
                                id SERIAL PRIMARY KEY,
                                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                                method VARCHAR(60),
                                provider VARCHAR(80),
                                transaction_ref VARCHAR(200),
                                note TEXT,
                                created_at TIMESTAMP DEFAULT now()
                            )
                        `);
            const txRef = isCashLike ? 'CASH-TO-CR' : (actualTxnId?.toString().trim() || null);
            await client.query(`
                            INSERT INTO transactions (order_id, method, provider, transaction_ref, note)
                            VALUES ($1, $2, $3, $4, $5)
                        `, [order.id, method || 'unknown', preSelectedProvider || null, txRef, isCashLike ? 'Cash collected by class representative (CR)' : 'Online payment recorded']);
            await client.query('COMMIT');
            // Attach items for email (multi-item support)
            order.items = items;
            // Send confirmation email
            await (0, email_1.sendEmail)(email, 'ICE Jersey Order Confirmation - Order Received', (0, email_1.orderConfirmationHtml)(order), (0, email_1.orderConfirmationText)(order));
            // Admin notification
            if (process.env.ADMIN_EMAIL) {
                const itemSummary = items.map((i) => `#${i.jerseyNumber}`).join(', ');
                await (0, email_1.sendEmail)(process.env.ADMIN_EMAIL, `New Jersey Order - ${order.name} (${itemSummary})`, (0, email_1.adminNotificationHtml)(order), `New order from ${order.name}. items: ${itemSummary}`);
            }
            res.status(201).json({
                success: true,
                message: 'Order placed successfully',
                orderId: `ICE-${order.id.toString().padStart(3, '0')}`,
                status: 'pending',
            });
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            await client.end();
        }
    }
    catch (error) {
        console.error('Order submission error:', error);
        res.status(500).json({ error: 'Order submission failed' });
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map