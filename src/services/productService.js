'use strict';

const productRepository = require('../repositories/productRepository');
const NotFoundError     = require('../exceptions/NotFoundError');
const ValidationError   = require('../exceptions/ValidationError');

async function getAll(filters) {
    return productRepository.findAll(filters);
}

async function getById(id) {
    const product = await productRepository.findById(id);
    if (!product) throw new NotFoundError(`Product #${id} not found`);
    return product;
}

async function create({ supplierId, sku, name, category, unitPrice, stock }) {
    if (!supplierId || !sku || !name || unitPrice == null) {
        throw new ValidationError('supplierId, sku, name and unitPrice are required');
    }
    return productRepository.create({ supplierId, sku, name, category, unitPrice, stock });
}

async function update(id, body) {
    const existing = await productRepository.findById(id);
    if (!existing) throw new NotFoundError(`Product #${id} not found`);
    return productRepository.update(id, body);
}

async function remove(id) {
    const deleted = await productRepository.remove(id);
    if (!deleted) throw new NotFoundError(`Product #${id} not found`);
    return deleted;
}

module.exports = { getAll, getById, create, update, remove };
