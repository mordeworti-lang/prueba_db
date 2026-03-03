'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const role           = require('../middleware/roleMiddleware');
const { pool }       = require('../config/postgres');

const router = Router();

// GET /api/admin/stats — admin dashboard snapshot
router.get('/stats', authMiddleware, role('admin'), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users)    AS total_users,
                (SELECT COUNT(*) FROM client)   AS total_clients,
                (SELECT COUNT(*) FROM product)  AS total_products,
                (SELECT COUNT(*) FROM supplier) AS total_suppliers,
                (SELECT COUNT(*) FROM sale)     AS total_sales,
                (SELECT COALESCE(SUM(total_amount),0) FROM sale) AS total_revenue
        `);
        res.json({ ok: true, stats: result.rows[0] });
    } catch (error) { next(error); }
});

module.exports = router;
