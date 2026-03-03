'use strict';

const { pool } = require('../config/postgres');
const { getDb } = require('../config/mongodb');

// ── Shared JOIN query ─────────────────────────────────────────────────────────
const SELECT_SALE = `
    SELECT
        s.id, s.transaction_id, s.sale_date,
        u.name  AS client_name,   u.email AS client_email,
        p.name  AS product_name,  p.sku,   p.category,
        s.quantity, s.unit_price, s.total_amount,
        sup.name AS supplier_name,
        s.created_at
    FROM sale s
    INNER JOIN client  c   ON c.id  = s.client_id
    INNER JOIN users   u   ON u.id  = c.user_id
    INNER JOIN product p   ON p.id  = s.product_id
    INNER JOIN supplier sup ON sup.id = p.supplier_id
`;

async function findAll({ clientId, productId } = {}) {
    let query  = SELECT_SALE;
    const params = [];
    const conds  = [];

    if (clientId)  { conds.push(`s.client_id  = $${params.length + 1}`); params.push(clientId); }
    if (productId) { conds.push(`s.product_id = $${params.length + 1}`); params.push(productId); }
    if (conds.length) query += ` WHERE ${conds.join(' AND ')}`;
    query += ` ORDER BY s.sale_date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
}

async function findById(id) {
    const result = await pool.query(`${SELECT_SALE} WHERE s.id = $1`, [id]);
    return result.rows[0] || null;
}

async function create({ transactionId, saleDate, clientId, productId, quantity, unitPrice, totalAmount }) {
    const pgClient = await pool.connect();
    try {
        await pgClient.query('BEGIN');
        const result = await pgClient.query(
            `INSERT INTO sale (transaction_id, sale_date, client_id, product_id, quantity, unit_price, total_amount)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
            [transactionId, saleDate, clientId, productId, quantity, unitPrice, totalAmount]
        );
        const saleId = result.rows[0].id;
        await pgClient.query('COMMIT');

        // Sync purchase record to MongoDB client_histories
        await syncToMongo(saleId);

        return await findById(saleId);
    } catch (error) {
        await pgClient.query('ROLLBACK');
        throw error;
    } finally {
        pgClient.release();
    }
}

// FIX: UPDATE was completely missing — now implemented
async function update(id, { quantity, unitPrice, saleDate }) {
    const sale = await findById(id);
    if (!sale) return null;

    const newQty       = quantity  ? parseInt(quantity)     : parseInt(sale.quantity);
    const newPrice     = unitPrice ? parseFloat(unitPrice)  : parseFloat(sale.unit_price);
    const newDate      = saleDate  || sale.sale_date;
    const newTotal     = newQty * newPrice;

    await pool.query(
        `UPDATE sale
         SET quantity = $1, unit_price = $2, total_amount = $3, sale_date = $4
         WHERE id = $5`,
        [newQty, newPrice, newTotal, newDate, id]
    );
    return await findById(id);
}

async function remove(id) {
    const sale = await findById(id);
    if (!sale) return null;

    await pool.query('DELETE FROM sale WHERE id = $1', [id]);

    // ── AUDIT LOG in MongoDB ──────────────────────────────────────────────────
    const db = getDb();
    await db.collection('audit_logs').insertOne({
        action:    'DELETE',
        entity:    'sale',
        entityId:  id,
        deletedAt: new Date(),
        snapshot:  sale
    });

    return sale;
}

async function syncToMongo(saleId) {
    try {
        const sale = await findById(saleId);
        if (!sale) return;

        const db = getDb();
        await db.collection('client_histories').updateOne(
            { clientEmail: sale.client_email },
            {
                $setOnInsert: { clientEmail: sale.client_email, clientName: sale.client_name, purchases: [] },
                $push: {
                    purchases: {
                        transactionId: sale.transaction_id,
                        date:          sale.sale_date,
                        productName:   sale.product_name,
                        sku:           sale.sku,
                        category:      sale.category,
                        quantity:      parseInt(sale.quantity),
                        unitPrice:     parseFloat(sale.unit_price),
                        totalAmount:   parseFloat(sale.total_amount),
                        supplierName:  sale.supplier_name
                    }
                }
            },
            { upsert: true }
        );
    } catch (err) {
        console.warn('MongoDB sync warning:', err.message);
    }
}

module.exports = { findAll, findById, create, update, remove };
