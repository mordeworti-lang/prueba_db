'use strict';

const { Router } = require('express');
const { runMigration } = require('../services/migrationService');
const connectPostgres  = require('../config/postgres');
const connectMongo     = require('../config/mongodb');

const router = Router();

// POST /api/simulacro/migrate
router.post('/migrate', async (req, res, next) => {
    try {
        const { clearBefore = false } = req.body;
        const result = await runMigration({ clearBefore });
        res.json({
            ok: true,
            message: 'Migration completed successfully',
            summary: result
        });
    } catch (error) { next(error); }
});

module.exports = router;
