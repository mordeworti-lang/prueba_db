'use strict';

const productService = require('../services/productService');

// GET /api/products
async function getAll(req, res, next) {
    try {
        const { category, supplierId } = req.query;
        const products = await productService.getAll({
            category,
            supplierId: supplierId ? parseInt(supplierId) : undefined
        });
        res.json({ ok: true, products });
    } catch (error) { next(error); }
}

// GET /api/products/:id
async function getById(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ ok: false, error: 'Invalid ID' });
        const product = await productService.getById(id);
        res.json({ ok: true, product });
    } catch (error) { next(error); }
}

// POST /api/products
async function create(req, res, next) {
    try {
        const product = await productService.create(req.body);
        res.status(201).json({ ok: true, message: 'Product created successfully', product });
    } catch (error) { next(error); }
}

// PUT /api/products/:id
async function update(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ ok: false, error: 'Invalid ID' });
        const product = await productService.update(id, req.body);
        res.json({ ok: true, message: 'Product updated successfully', product });
    } catch (error) { next(error); }
}

// DELETE /api/products/:id
async function remove(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ ok: false, error: 'Invalid ID' });
        const deleted = await productService.remove(id);
        res.json({ ok: true, message: 'Product deleted', deleted });
    } catch (error) { next(error); }
}

module.exports = { getAll, getById, create, update, remove };
