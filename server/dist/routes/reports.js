"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const reports_1 = require("../services/reports");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { db, client } = await (0, db_1.getDb)();
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
                    await (0, reports_1.generateAllRegistrations)(orders, res);
                    break;
                case 'paid':
                    await (0, reports_1.generatePaidReport)(orders, res);
                    break;
                case 'unpaid':
                    await (0, reports_1.generateUnpaidReport)(orders, res);
                    break;
                case 'batch':
                    await (0, reports_1.generateBatchReport)(orders, res);
                    break;
                case 'financial': {
                    const expResult = await client.query('SELECT * FROM expenses ORDER BY created_at DESC');
                    await (0, reports_1.generateFinancialReport)(orders, expResult.rows, res);
                    break;
                }
                case 'expenses': {
                    const expResult2 = await client.query('SELECT * FROM expenses ORDER BY created_at DESC');
                    await (0, reports_1.generateExpensesReport)(expResult2.rows, res);
                    break;
                }
                default:
                    res.status(400).json({ error: 'Invalid report type' });
            }
        }
        finally {
            await client.end();
        }
    }
    catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ error: 'Report generation failed' });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map