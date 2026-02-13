import { Router, Response } from 'express';
import { getDb } from '../db/index';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendEmail, paymentConfirmationHtml } from '../services/email';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all orders (with items)
router.get('/orders', async (req: AuthRequest, res: Response) => {
    try {
        const { page = '1', limit = '50', status, search } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        let query = `
      SELECT o.*, 
             json_agg(json_build_object(
               'id', oi.id,
               'jersey_number', oi.jersey_number,
               'jersey_name', oi.jersey_name,
               'batch', oi.batch,
               'size', oi.size,
               'collar_type', oi.collar_type,
               'sleeve_type', oi.sleeve_type,
               'item_price', oi.item_price
             )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;

        let countQuery = 'SELECT COUNT(DISTINCT o.id) FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id';

        const params: any[] = [];
        const conditions: string[] = [];

        if (status && status !== 'all') {
            conditions.push(`o.status = $${params.length + 1}`);
            params.push(status);
        }

        if (search) {
            conditions.push(`(o.name ILIKE $${params.length + 1} OR o.mobile_number ILIKE $${params.length + 1} OR o.email ILIKE $${params.length + 1} OR oi.jersey_number ILIKE $${params.length + 1} OR oi.batch ILIKE $${params.length + 1})`);
            params.push(`%${search}%`);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit as string), offset);

        const { db, client } = await getDb();
        try {
            const [ordersResult, countResult] = await Promise.all([
                client.query(query, params),
                client.query(countQuery, params.slice(0, -2)),
            ]);

            const totalCount = parseInt(countResult.rows[0].count);
            res.json({
                success: true,
                orders: ordersResult.rows,
                pagination: {
                    page: parseInt(page as string),
                    totalPages: Math.ceil(totalCount / parseInt(limit as string)),
                    total: totalCount,
                },
            });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const { db, client } = await getDb();
        try {
            const [totalResult, pendingResult, doneResult, revenueResult] = await Promise.all([
                client.query('SELECT COUNT(*) FROM orders'),
                client.query("SELECT COUNT(*) FROM orders WHERE status = 'pending'"),
                client.query("SELECT COUNT(*) FROM orders WHERE status = 'done'"),
                client.query("SELECT SUM(final_price) FROM orders WHERE status = 'done'"),
            ]);

            res.json({
                success: true,
                stats: {
                    totalOrders: parseInt(totalResult.rows[0].count),
                    ordersByStatus: {
                        pending: parseInt(pendingResult.rows[0].count),
                        done: parseInt(doneResult.rows[0].count),
                    },
                    totalRevenue: parseFloat(revenueResult.rows[0].sum || 0),
                },
            });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Update order status
router.patch('/orders/:id/status', async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        if (!['pending', 'done'].includes(status)) {
            res.status(400).json({ error: 'Invalid status. Only pending/done allowed.' });
            return;
        }

        const { db, client } = await getDb();
        try {
            // Fetch order with items for email
            const orderResult = await client.query(`
        SELECT o.*, json_agg(oi.*) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1
        GROUP BY o.id
      `, [req.params.id]);

            if (orderResult.rows.length === 0) {
                res.status(404).json({ error: 'Order not found' });
                return;
            }

            const order = orderResult.rows[0];
            await client.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, req.params.id]);

            // Send payment confirmation email when marked as done
            if (status === 'done' && order.status !== 'done') {
                await sendEmail(
                    order.email,
                    'Payment Confirmed - ICE Jersey Order',
                    paymentConfirmationHtml(order),
                    `Your payment has been confirmed. Order ID: ICE-${order.id.toString().padStart(3, '0')}`
                );
            }

            res.json({ success: true, message: 'Order status updated successfully', newStatus: status });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Update order details (Full Edit)
router.patch('/orders/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { name, mobileNumber, email, transactionId, notes, items } = req.body;

        const { db, client } = await getDb();
        try {
            await client.query('BEGIN');

            await client.query(`
                UPDATE orders 
                SET name = $1, mobile_number = $2, email = $3, transaction_id = $4, notes = $5, updated_at = CURRENT_TIMESTAMP 
                WHERE id = $6
            `, [name, mobileNumber, email, transactionId, notes, req.params.id]);

            if (items && Array.isArray(items)) {
                for (const item of items) {
                    const jNum = item.jersey_number || item.jerseyNumber;
                    const jName = item.jersey_name || item.jerseyName;
                    const jSize = item.size;

                    await client.query(`
                        UPDATE order_items 
                        SET jersey_number = $1, size = $2, jersey_name = $3
                        WHERE id = $4 AND order_id = $5
                    `, [jNum, jSize, jName, item.id, req.params.id]);
                }
            }

            await client.query('COMMIT');
            res.json({ success: true, message: 'Order updated successfully' });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// Delete order
router.delete('/orders/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { db, client } = await getDb();
        try {
            const result = await client.query('DELETE FROM orders WHERE id = $1 RETURNING *', [req.params.id]);
            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Order not found' });
                return;
            }
            res.json({ success: true, message: 'Order deleted successfully' });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// Mass Email: Notify Collection
router.post('/notify-collection', async (req: AuthRequest, res: Response) => {
    try {
        const { db, client } = await getDb();
        try {
            // Fetch all PAID orders
            const result = await client.query(`
        SELECT o.email, o.name, o.id 
        FROM orders o 
        WHERE o.status = 'done'
      `);

            const users: any[] = result.rows;
            if (users.length === 0) {
                res.json({ success: true, message: 'No paid users to notify', count: 0 });
                return;
            }

            console.log(`Sending collection emails to ${users.length} users...`);

            // Send emails in parallel (with batching if needed, but simple for now)
            let sentCount = 0;
            const emailPromises = users.map(async (user) => {
                try {
                    const success = await sendEmail(
                        user.email,
                        'Jersey Collection Ready! - ICE Department',
                        `
              <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <h1 style="color: #667eea; text-align: center;">Good News, ${user.name}!</h1>
                  <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    Your ICE Department Jersey is ready for collection! 
                  </p>
                  <div style="background-color: #e0e7ff; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                    <strong>Please visit the Department Office to collect your jersey.</strong>
                  </div>
                  <p style="font-size: 14px; color: #666;">
                    Order ID: <strong>ICE-${user.id.toString().padStart(3, '0')}</strong>
                  </p>
                  <p style="font-size: 14px; color: #666; margin-top: 20px;">
                    Department of Information & Communication Engineering
                  </p>
                </div>
              </div>
            `,
                        `Hello ${user.name}, Your jersey is ready for collection! Please visit the Department Office.`
                    );
                    if (success) sentCount++;
                } catch (e) {
                    console.error(`Failed to email ${user.email}`, e);
                }
            });

            await Promise.all(emailPromises);

            res.json({
                success: true,
                message: `Notifications sent successfully to ${sentCount} users`,
                count: sentCount
            });

        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Notify collection error:', error);
        res.status(500).json({ error: 'Failed to send notifications' });
    }
});

// Bulk update status
router.post('/orders/bulk-status', async (req: AuthRequest, res: Response) => {
    try {
        const { ids, status } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ error: 'No order IDs provided' });
            return;
        }
        if (!['pending', 'done'].includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }

        const { db, client } = await getDb();
        try {
            await client.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)', [status, ids]);
            res.json({ success: true, message: `Updated ${ids.length} orders to ${status}` });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({ error: 'Failed to update orders' });
    }
});

export default router;
