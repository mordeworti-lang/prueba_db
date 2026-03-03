'use strict';

const saleRepository    = require('../repositories/saleRepository');
const NotFoundError     = require('../exceptions/NotFoundError');
const ValidationError   = require('../exceptions/ValidationError');

async function getAll(filters) {
    return saleRepository.findAll(filters);
}

async function getSaleById(id) {
    const sale = await saleRepository.findById(id);
    if (!sale) throw new NotFoundError(`Sale #${id} not found`);
    return sale;
}

async function create({ clientId, productId, saleDate, quantity, unitPrice }) {
    if (!clientId || !productId || !quantity || !unitPrice) {
        throw new ValidationError('clientId, productId, quantity and unitPrice are required');
    }
    const transactionId = `TXN-${Date.now()}`;
    const totalAmount   = parseFloat(quantity) * parseFloat(unitPrice);
    return saleRepository.create({
        transactionId,
        saleDate: saleDate || new Date().toISOString(),
        clientId:  parseInt(clientId),
        productId: parseInt(productId),
        quantity:  parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        totalAmount
    });
}

async function updateSale(id, body) {
    const existing = await saleRepository.findById(id);
    if (!existing) throw new NotFoundError(`Sale #${id} not found`);

    const { quantity, unitPrice, saleDate } = body;
    if (!quantity && !unitPrice && !saleDate) {
        throw new ValidationError('Provide at least one field to update: quantity, unitPrice, saleDate');
    }
    return saleRepository.update(id, { quantity, unitPrice, saleDate });
}

async function deleteSale(id) {
    const deleted = await saleRepository.remove(id);
    if (!deleted) throw new NotFoundError(`Sale #${id} not found`);
    return deleted;
}

async function getMine({ userId, role }) {
    if (role === 'admin') return saleRepository.findAll({});
    return saleRepository.findAll({ clientId: userId });
}

module.exports = { getAll, getSaleById, create, updateSale, deleteSale, getMine };
