'use strict';

const reportService = require('../services/reportService');

// GET /api/reports/suppliers
async function getSupplierAnalysis(req, res, next) {
    try {
        const data = await reportService.getSupplierAnalysis();
        res.json({ ok: true, suppliers: data });
    } catch (error) { next(error); }
}

// GET /api/reports/clients/:email
async function getClientHistory(req, res, next) {
    try {
        const { email } = req.params;
        const data = await reportService.getClientHistory(email);
        res.json({ ok: true, history: data });
    } catch (error) { next(error); }
}

// GET /api/reports/top-products?category=Electronics
async function getTopProducts(req, res, next) {
    try {
        const { category } = req.query;
        const data = await reportService.getTopProductsByCategory(category);
        res.json({ ok: true, products: data });
    } catch (error) { next(error); }
}

// GET /api/reports/audit-logs?entity=sale&limit=20
async function getAuditLogs(req, res, next) {
    try {
        const { entity, limit } = req.query;
        const logs = await reportService.getAuditLogs({ entity, limit: parseInt(limit) || 50 });
        res.json({ ok: true, logs });
    } catch (error) { next(error); }
}

module.exports = { getSupplierAnalysis, getClientHistory, getTopProducts, getAuditLogs };
