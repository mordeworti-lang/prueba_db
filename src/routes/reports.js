'use strict';

const { Router } = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware   = require('../middleware/authMiddleware');

const router = Router();

router.get('/suppliers',    authMiddleware, reportController.getSupplierAnalysis);
router.get('/clients/:email', authMiddleware, reportController.getClientHistory);
router.get('/top-products', authMiddleware, reportController.getTopProducts);
router.get('/audit-logs',   authMiddleware, reportController.getAuditLogs);

module.exports = router;
