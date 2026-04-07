import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { sendEmail, orderConfirmationHtml, orderConfirmationText, adminNotificationHtml } from '../services/email';
import { validate } from '../middleware/validate';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createOrderSchema } from '../schemas';
import { recommendSize, FitPreference } from '../utils/aiSizer';

const router = Router();

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
                values.push((email as string).toLowerCase().trim());
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
        const { name, mobileNumber, email, batch, transactionId, notes, finalPrice, items } = req.body;

        const { client } = await getDb();
        try {
            await client.query('BEGIN');

            if (transactionId && !transactionId.startsWith('HAND-')) {
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
                email.toLowerCase().trim(), transactionId?.trim() || null,
                notes?.trim() || null, finalPrice
            ]);

            const order = orderResult.rows[0];

            for (const item of items) {
                await client.query(`
                    INSERT INTO order_items (order_id, jersey_number, jersey_name, batch, size, collar_type, sleeve_type, item_price)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    order.id,
                    item.jerseyNumber.toString().trim(),
                    item.jerseyName?.trim().toUpperCase() || null,
                    (item.batch || batch)?.trim() || null,
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

// --- USER AUTHENTICATED ROUTES ---

// Fetch user's own orders
router.get('/my-orders', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const email = req.user?.email?.toLowerCase().trim();
        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const { client } = await getDb();
        try {
            const ordersResult = await client.query(`
                SELECT * FROM orders 
                WHERE email = $1 
                ORDER BY created_at DESC
            `, [email]);

            const orders = ordersResult.rows;

            // Fetch items for each order
            for (const order of orders) {
                const itemsResult = await client.query(`
                    SELECT * FROM order_items 
                    WHERE order_id = $1
                `, [order.id]);
                order.items = itemsResult.rows;
            }

            res.json(orders);
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Fetch my-orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Update specific jersey
router.put('/:orderId/items/:itemId', authenticateToken, async (req: AuthRequest, res: Response) => {
    const { orderId, itemId } = req.params;
    const { jerseyName, size, sleeveType, jerseyNumber, batch } = req.body;
    const email = req.user?.email?.toLowerCase().trim();

    console.log(`[USER_ACTION] Updating item ${itemId} in order ${orderId} by ${email}`);
    console.log('Payload:', { jerseyName, size, sleeveType, jerseyNumber });

    if (!email) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { client } = await getDb();
        try {
            await client.query('BEGIN');

            const orderCheck = await client.query(
                'SELECT id, status FROM orders WHERE id = $1 AND email = $2',
                [orderId, email]
            );

            if (orderCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Order not found or access denied' });
            }

            if (orderCheck.rows[0].status !== 'pending') {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Only pending orders can be modified' });
            }

            const oldItemCheck = await client.query(
                'SELECT jersey_name, size, jersey_number FROM order_items WHERE id = $1 AND order_id = $2',
                [itemId, orderId]
            );

            if (oldItemCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Jersey item not found in this order' });
            }

            const oldItem = oldItemCheck.rows[0];

            const result = await client.query(`
                UPDATE order_items 
                SET jersey_name = $1, size = $2, jersey_number = $3, batch = $4
                WHERE id = $5 AND order_id = $6
                RETURNING *
            `, [
                String(jerseyName || '').trim().toUpperCase(),
                String(size || 'M').trim(),
                String(jerseyNumber || '00').trim(),
                String(batch || '').trim() || null,
                itemId,
                orderId
            ]);

            if (result.rowCount === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Jersey item not found in this order' });
            }

            const newItem = result.rows[0];

            // Build differences payload
            const changes: any = {};
            if (oldItem.jersey_name !== newItem.jersey_name) changes.jerseyName = { old: oldItem.jersey_name, new: newItem.jersey_name };
            if (oldItem.size !== newItem.size) changes.size = { old: oldItem.size, new: newItem.size };
            if (oldItem.jersey_number !== newItem.jersey_number) changes.jerseyNumber = { old: oldItem.jersey_number, new: newItem.jersey_number };

            if (Object.keys(changes).length > 0) {
                await client.query(`
                    INSERT INTO order_logs (order_id, action, details, performed_by) 
                    VALUES ($1, $2, $3, $4)
                `, [orderId, 'USER_MODIFIED_ITEM', JSON.stringify(changes), email]);
            }

            if (result.rowCount === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Jersey item not found in this order' });
            }

            await client.query('COMMIT');
            console.log(`✅ Item ${itemId} successfully updated!`);
            res.json({ success: true, item: result.rows[0] });
        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            await client.end();
        }
    } catch (error: any) {
        console.error('Update jersey error:', error);
        res.status(500).json({ error: 'Transmission error: Unable to update jersey details. DB Error: ' + (error.message || error) });
    }
});

// Delete specific jersey
router.delete('/:orderId/items/:itemId', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { orderId, itemId } = req.params;
        const email = req.user?.email?.toLowerCase().trim();

        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const { client } = await getDb();
        try {
            await client.query('BEGIN');

            // Verify ownership and status
            const orderCheck = await client.query(
                'SELECT id, status, final_price FROM orders WHERE id = $1 AND email = $2',
                [orderId, email]
            );

            if (orderCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Order not found' });
            }

            if (orderCheck.rows[0].status !== 'pending') {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Only pending orders can be modified' });
            }

            // Get item price before deleting
            const itemResult = await client.query(
                'SELECT item_price FROM order_items WHERE id = $1 AND order_id = $2',
                [itemId, orderId]
            );

            if (itemResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Jersey item not found' });
            }

            const itemPrice = parseFloat(itemResult.rows[0].item_price);

            // Delete item
            await client.query('DELETE FROM order_items WHERE id = $1 AND order_id = $2', [itemId, orderId]);

            // Update order total price
            const newPrice = parseFloat(orderCheck.rows[0].final_price) - itemPrice;
            
            if (newPrice <= 0) {
                // If no items left, delete order or keep it with 0? 
                // Usually better to delete or mark as cancelled. Let's delete for now as per "delete item" logic.
                await client.query('DELETE FROM orders WHERE id = $1', [orderId]);
                await client.query('COMMIT');
                return res.json({ success: true, message: 'Item deleted and order removed (no items left)' });
            }

            await client.query('UPDATE orders SET final_price = $1 WHERE id = $2', [newPrice, orderId]);

            await client.query('COMMIT');
            res.json({ success: true, newTotal: newPrice });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Delete jersey error:', error);
        res.status(500).json({ error: 'Failed to delete jersey' });
    }
});

// Get order history logs (Customer facing)
router.get('/:orderId/logs', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const email = req.user?.email?.toLowerCase().trim();

        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const { client } = await getDb();
        try {
            // Check order ownership
            const orderCheck = await client.query(
                'SELECT id FROM orders WHERE id = $1 AND email = $2',
                [orderId, email]
            );

            if (orderCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }

            const result = await client.query(`
                SELECT * FROM order_logs 
                WHERE order_id = $1 
                ORDER BY created_at DESC
            `, [orderId]);
            res.json({ success: true, logs: result.rows });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Get user order logs error:', error);
        res.status(500).json({ error: 'Failed to fetch order history' });
    }
});

export default router;
