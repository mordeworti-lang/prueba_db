'use strict';

const saleService = require('../services/saleService');

// GET /api/sales
async function getAll(req, res, next) {
    try {
        const { clientId, productId } = req.query;
        const sales = await saleService.getAll({
            clientId:  clientId  ? parseInt(clientId)  : undefined,
            productId: productId ? parseInt(productId) : undefined
        });
        res.json({ ok: true, sales });
    } catch (error) { next(error); }
}

// GET /api/sales/:id
async function getById(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ ok: false, error: 'Invalid ID' });
        const sale = await saleService.getSaleById(id);
        res.json({ ok: true, sale });
    } catch (error) { next(error); }
}

// POST /api/sales
async function create(req, res, next) {
    try {
        const sale = await saleService.create(req.body);
        res.status(201).json({ ok: true, message: 'Sale created successfully', sale });
    } catch (error) { next(error); }
}

// PUT /api/sales/:id  — FIX: was completely missing
async function update(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ ok: false, error: 'Invalid ID' });
        const sale = await saleService.updateSale(id, req.body);
        res.json({ ok: true, message: 'Sale updated successfully', sale });
    } catch (error) { next(error); }
}

// DELETE /api/sales/:id — deletes + writes audit log to MongoDB
async function remove(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ ok: false, error: 'Invalid ID' });
        const deleted = await saleService.deleteSale(id);
        res.json({ ok: true, message: 'Sale deleted and audit log saved', deleted });
    } catch (error) { next(error); }
}

// GET /api/sales/mine
async function mine(req, res, next) {
    try {
        const { id: userId, role } = req.user;
        const sales = await saleService.getMine({ userId, role });
        res.json({ ok: true, sales });
    } catch (error) { next(error); }
}

module.exports = { getAll, getById, create, update, remove, mine };
