import { Router, Response } from 'express';
import { getDb } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createExpenseSchema } from '../schemas';
import { authorize } from '../middleware/rbac';
import { logActivity } from '../utils/logger';

const router = Router();
router.use(authenticateToken);

// Get all expenses
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { client } = await getDb();
        try {
            const result = await client.query('SELECT * FROM expenses ORDER BY created_at DESC');
            res.json({ success: true, expenses: result.rows });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// Add expense
router.post('/', authorize(['admin', 'manager']), validate(createExpenseSchema), async (req: AuthRequest, res: Response) => {
    try {
        const { description, amount, category, date } = req.body;

        const { client } = await getDb();
        try {
            const result = await client.query(
                'INSERT INTO expenses (description, amount, category, date, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [description.trim(), amount, category || 'general', date || null, req.user?.username || null]
            );

            await logActivity(req.user?.id || null, 'CREATE_EXPENSE', { id: result.rows[0].id, amount });

            res.status(201).json({ success: true, expense: result.rows[0] });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Add expense error:', error);
        res.status(500).json({ error: 'Failed to add expense' });
    }
});

// Update expense
router.patch('/:id', authorize(['admin', 'manager']), async (req: AuthRequest, res: Response) => {
    try {
        const { description, amount, category, date } = req.body;
        const { client } = await getDb();
        try {
            const result = await client.query(
                `UPDATE expenses 
                 SET description = COALESCE($1, description),
                     amount = COALESCE($2, amount),
                     category = COALESCE($3, category),
                     date = COALESCE($4, date)
                 WHERE id = $5 RETURNING *`,
                [description?.trim(), amount ? parseFloat(amount) : null, category, date, req.params.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Expense not found' });
            }

            await logActivity(req.user?.id || null, 'UPDATE_EXPENSE', { id: req.params.id });

            res.json({ success: true, expense: result.rows[0] });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ error: 'Failed to update expense' });
    }
});

// Delete expense
router.delete('/:id', authorize(['admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { client } = await getDb();
        try {
            const result = await client.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Expense not found' });
            }
            await logActivity(req.user?.id || null, 'DELETE_EXPENSE', { id: req.params.id });
            res.json({ success: true, message: 'Expense deleted' });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

export default router;
