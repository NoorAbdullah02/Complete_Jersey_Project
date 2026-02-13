import { Router, Response } from 'express';
import { getDb } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import {
    generateAllRegistrations, generatePaidReport, generateUnpaidReport,
    generateBatchReport, generateFinancialReport, generateExpensesReport,
} from '../services/reports';

const router = Router();
router.use(authenticateToken);

router.get('/:type', async (req: AuthRequest, res: Response) => {
    try {
        const { type } = req.params;
        const { db, client } = await getDb();

        try {
            const ordersResult = await client.query(`
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
                    )) FILTER (WHERE oi.id IS NOT NULL) as items
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                GROUP BY o.id
                ORDER BY o.created_at DESC
            `);
            const orders = ordersResult.rows;

            switch (type) {
                case 'all':
                    await generateAllRegistrations(orders, res);
                    break;
                case 'paid':
                    await generatePaidReport(orders, res);
                    break;
                case 'unpaid':
                    await generateUnpaidReport(orders, res);
                    break;
                case 'batch':
                    await generateBatchReport(orders, res);
                    break;
                case 'financial': {
                    const expResult = await client.query('SELECT * FROM expenses ORDER BY created_at DESC');
                    await generateFinancialReport(orders, expResult.rows, res);
                    break;
                }
                case 'expenses': {
                    const expResult2 = await client.query('SELECT * FROM expenses ORDER BY created_at DESC');
                    await generateExpensesReport(expResult2.rows, res);
                    break;
                }
                default:
                    res.status(400).json({ error: 'Invalid report type' });
            }
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ error: 'Report generation failed' });
    }
});

export default router;
