import { Router, Response } from 'express';
import { getDb } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { logActivity } from '../utils/logger';

const router = Router();
router.use(authenticateToken);

// Get current inventory levels
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { client } = await getDb();
        try {
            const result = await client.query('SELECT * FROM inventory ORDER BY quantity ASC');
            res.json({ success: true, inventory: result.rows });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Get inventory error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// Update stock level (Restock or Correction)
router.post('/update', authorize(['admin', 'manager']), async (req: AuthRequest, res: Response) => {
    try {
        const { inventoryId, change, reason } = req.body;
        if (!inventoryId || change === undefined) {
            return res.status(400).json({ error: 'inventoryId and change (number) are required' });
        }

        const { client } = await getDb();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                'UPDATE inventory SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [change, inventoryId]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Item not found' });
            }

            // Log the stock change
            await client.query(
                'INSERT INTO stock_logs (inventory_id, change, reason, admin_user_id) VALUES ($1, $2, $3, $4)',
                [inventoryId, change, reason || 'manual_update', req.user?.id]
            );

            await logActivity(req.user?.id || null, 'STOCK_UPDATE', { id: inventoryId, change, reason });

            await client.query('COMMIT');
            res.json({ success: true, item: result.rows[0] });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Stock update error:', error);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

// Create new inventory item
router.post('/add', authorize(['admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { itemName, sku, quantity, minThreshold } = req.body;
        const { client } = await getDb();
        try {
            const result = await client.query(
                'INSERT INTO inventory (item_name, sku, quantity, min_threshold) VALUES ($1, $2, $3, $4) RETURNING *',
                [itemName, sku, quantity || 0, minThreshold || 10]
            );
            await logActivity(req.user?.id || null, 'STOCK_ITEM_ADD', { sku, quantity });
            res.status(201).json({ success: true, item: result.rows[0] });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Add item error:', error);
        res.status(500).json({ error: 'Failed to add inventory item' });
    }
});

export default router;
