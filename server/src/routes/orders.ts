import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { sendEmail, orderConfirmationHtml, orderConfirmationText, adminNotificationHtml } from '../services/email';
import { validate } from '../middleware/validate';
import { createOrderSchema } from '../schemas';
import { recommendSize, FitPreference } from '../utils/aiSizer';

const router = Router();

// AI Size Recommendation
router.post('/recommend-size', (req: Request, res: Response) => {
    try {
        const { height, weight, fit } = req.body;
        if (!height || !weight) {
            return res.status(400).json({ error: 'Height (cm) and weight (kg) are required' });
        }

        const recommendation = recommendSize(Number(height), Number(weight), fit as FitPreference);
        res.json({ success: true, recommendedSize: recommendation });
    } catch (error) {
        res.status(500).json({ error: 'Recommendation failed' });
    }
});

// Validate Coupon
router.get('/validate-coupon', async (req: Request, res: Response) => {
    try {
        const { code } = req.query;
        if (!code) return res.status(400).json({ error: 'Coupon code required' });

        const { client } = await getDb();
        try {
            const result = await client.query(
                'SELECT * FROM coupons WHERE code = $1 AND is_active = true AND (expiry_date IS NULL OR expiry_date > NOW())',
                [code.toString().trim().toUpperCase()]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Invalid or expired coupon' });
            }

            const coupon = result.rows[0];
            if (coupon.max_usage && coupon.current_usage >= coupon.max_usage) {
                return res.status(400).json({ error: 'Coupon usage limit reached' });
            }

            res.json({
                success: true,
                discountType: coupon.discount_type,
                discountValue: coupon.discount_value
            });
        } finally {
            await client.end();
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to validate coupon' });
    }
});

// Check jersey number availability
router.get('/check-jersey', async (req: Request, res: Response) => {
    try {
        const { number } = req.query;
        if (!number) {
            return res.status(400).json({ error: 'Jersey number required' });
        }

        const { client } = await getDb();
        try {
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
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Jersey check error:', error);
        res.status(500).json({ error: 'Check failed' });
    }
});

// Check name existence
router.get('/check-name', async (req: Request, res: Response) => {
    try {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({ error: 'Name required' });
        }

        const { client } = await getDb();
        try {
            const result = await client.query('SELECT id FROM orders WHERE LOWER(name) = LOWER($1)', [(name as string).trim()]);
            res.json({
                exists: result.rows.length > 0,
                message: result.rows.length > 0 ? `Name "${name}" already exists` : `Name "${name}" is available`,
            });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Name check error:', error);
        res.status(500).json({ error: 'Check failed' });
    }
});

// Check contact existence
router.get('/check-contact', async (req: Request, res: Response) => {
    try {
        const { email, mobileNumber } = req.query;
        if (!email && !mobileNumber) {
            return res.status(400).json({ error: 'Email or Mobile Number required' });
        }

        const { client } = await getDb();
        try {
            const conditions = [];
            const values = [];

            if (email) {
                values.push((email as string).trim());
                conditions.push(`email = $${values.length}`);
            }
            if (mobileNumber) {
                values.push((mobileNumber as string).trim());
                conditions.push(`mobile_number = $${values.length}`);
            }

            const query = `SELECT id FROM orders WHERE ${conditions.join(' OR ')}`;
            const result = await client.query(query, values);

            res.json({
                exists: result.rows.length > 0,
                message: result.rows.length > 0 ? 'Contact already used in previous orders' : 'Contact is new',
            });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Contact check error:', error);
        res.status(500).json({ error: 'Check failed' });
    }
});

// Submit new order (Multi-item support)
router.post('/', validate(createOrderSchema), async (req: Request, res: Response) => {
    try {
        const { name, mobileNumber, email, transactionId, notes, finalPrice, items } = req.body;

        const { client } = await getDb();
        try {
            await client.query('BEGIN');

            // 1. Fraud Detection: Prevent duplicate transaction IDs within 24 hours
            if (transactionId) {
                const dupCheck = await client.query(
                    'SELECT id FROM payment_logs WHERE transaction_id = $1 AND status = \'success\' AND created_at > NOW() - INTERVAL \'24 hours\'',
                    [transactionId.trim()]
                );
                if (dupCheck.rows.length > 0) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        error: 'Potential duplicate payment detected',
                        code: 'PAYMENT_FRAUD_FLAG'
                    });
                }
            }

            // 2. Insert Order
            const orderResult = await client.query(`
                INSERT INTO orders (name, mobile_number, email, transaction_id, notes, final_price, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'pending')
                RETURNING *
            `, [
                name.trim(), mobileNumber.trim(),
                email.trim(), transactionId?.trim() || null,
                notes?.trim() || null, finalPrice
            ]);

            const order = orderResult.rows[0];

            // 3. Insert Items and Deduct Stock
            for (const item of items) {
                // Deduct from inventory
                const inventoryName = `Jersey ${item.size.toUpperCase()}`;
                const stockUpdate = await client.query(
                    'UPDATE inventory SET quantity = quantity - 1 WHERE item_name = $1 AND quantity > 0 RETURNING id',
                    [inventoryName]
                );

                if (stockUpdate.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: `Item ${inventoryName} is out of stock` });
                }

                const invId = stockUpdate.rows[0].id;

                // Log stock change
                await client.query(
                    'INSERT INTO stock_logs (inventory_id, change, reason) VALUES ($1, $2, $3)',
                    [invId, -1, `Order ICE-${order.id}`]
                );

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
                    item.itemPrice
                ]);
            }

            // 4. Record Payment Log
            if (transactionId) {
                await client.query(`
                    INSERT INTO payment_logs (order_id, provider, transaction_id, amount, status)
                    VALUES ($1, $2, $3, $4, $5)
                `, [order.id, 'online', transactionId.trim(), finalPrice, 'success']);
            }

            await client.query('COMMIT');

            // Attach items for email
            order.items = items;

            // Send confirmation email
            await sendEmail(email, 'ICE Jersey Order Confirmation - Order Received', orderConfirmationHtml(order), orderConfirmationText(order));

            // Admin notification
            if (process.env.ADMIN_EMAIL) {
                const itemSummary = items.map((i: any) => `#${i.jerseyNumber}`).join(', ');
                await sendEmail(
                    process.env.ADMIN_EMAIL,
                    `New Jersey Order - ${order.name} (${itemSummary})`,
                    adminNotificationHtml(order),
                    `New order from ${order.name}. items: ${itemSummary}`
                );
            }

            res.status(201).json({
                success: true,
                message: 'Order placed successfully',
                orderId: `ICE-${order.id.toString().padStart(3, '0')}`,
                status: 'pending',
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Order submission error:', error);
        res.status(500).json({ error: 'Order submission failed' });
    }
});

export default router;
