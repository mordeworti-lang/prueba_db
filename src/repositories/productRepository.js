'use strict';

const { pool } = require('../config/postgres');

async function findAll({ category, supplierId } = {}) {
    let query = `
        SELECT p.id, p.sku, p.name, p.category, p.unit_price, p.stock,
               s.name AS supplier_name, p.created_at, p.updated_at
        FROM product p
        INNER JOIN supplier s ON s.id = p.supplier_id
    `;
    const params = [];
    const conds  = [];

    if (category)   { conds.push(`LOWER(p.category) = LOWER($${params.length+1})`); params.push(category); }
    if (supplierId) { conds.push(`p.supplier_id = $${params.length+1}`);             params.push(supplierId); }
    if (conds.length) query += ` WHERE ${conds.join(' AND ')}`;
    query += ` ORDER BY p.name ASC`;

    const result = await pool.query(query, params);
    return result.rows;
}

async function findById(id) {
    const result = await pool.query(
        `SELECT p.id, p.sku, p.name, p.category, p.unit_price, p.stock,
                s.name AS supplier_name, p.created_at, p.updated_at
         FROM product p
         INNER JOIN supplier s ON s.id = p.supplier_id
         WHERE p.id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

async function create({ supplierId, sku, name, category, unitPrice, stock }) {
    const result = await pool.query(
        `INSERT INTO product (supplier_id, sku, name, category, unit_price, stock)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id`,
        [supplierId, sku, name, category, unitPrice, stock ?? 0]
    );
    return findById(result.rows[0].id);
}

async function update(id, { name, category, unitPrice, stock, supplierId }) {
    const existing = await findById(id);
    if (!existing) return null;

    await pool.query(
        `UPDATE product
         SET name       = COALESCE($1, name),
             category   = COALESCE($2, category),
             unit_price = COALESCE($3, unit_price),
             stock      = COALESCE($4, stock),
             supplier_id= COALESCE($5, supplier_id),
             updated_at = NOW()
         WHERE id = $6`,
        [name, category, unitPrice, stock, supplierId, id]
    );
    return findById(id);
}

async function remove(id) {
    const existing = await findById(id);
    if (!existing) return null;
    await pool.query('DELETE FROM product WHERE id = $1', [id]);
    return existing;
}

module.exports = { findAll, findById, create, update, remove };
