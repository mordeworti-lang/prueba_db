'use strict';

const { pool } = require('../config/postgres');
const { getDb } = require('../config/mongodb');

// BI Query 1: Top suppliers by items sold and inventory value
async function getSupplierAnalysis() {
    const result = await pool.query(`
        SELECT
            sup.id                                      AS supplier_id,
            sup.name                                    AS supplier_name,
            sup.email                                   AS supplier_email,
            COUNT(DISTINCT p.id)                        AS product_count,
            COALESCE(SUM(sl.quantity), 0)               AS total_items_sold,
            COALESCE(SUM(sl.total_amount), 0)           AS total_revenue,
            COALESCE(SUM(p.unit_price * p.stock), 0)    AS inventory_value
        FROM supplier sup
        LEFT JOIN product p  ON p.supplier_id = sup.id
        LEFT JOIN sale    sl ON sl.product_id  = p.id
        GROUP BY sup.id, sup.name, sup.email
        ORDER BY total_items_sold DESC
    `);
    return result.rows;
}

// BI Query 2: Full purchase history for a specific client (from MongoDB)
async function getClientHistory(email) {
    const db = getDb();
    const history = await db.collection('client_histories')
        .findOne({ clientEmail: email.toLowerCase() });
    return history || null;
}

// BI Query 3: Top products by category ordered by revenue (with optional filter)
async function getTopProductsByCategory(category) {
    let query = `
        SELECT
            p.category,
            p.id          AS product_id,
            p.name        AS product_name,
            p.sku,
            sup.name      AS supplier_name,
            SUM(sl.quantity)     AS total_quantity_sold,
            SUM(sl.total_amount) AS total_revenue,
            RANK() OVER (PARTITION BY p.category ORDER BY SUM(sl.total_amount) DESC) AS rank_in_category
        FROM product p
        JOIN sale     sl  ON sl.product_id  = p.id
        JOIN supplier sup ON sup.id = p.supplier_id
    `;
    const params = [];
    if (category) {
        query += ` WHERE LOWER(p.category) = LOWER($1)`;
        params.push(category);
    }
    query += ` GROUP BY p.category, p.id, p.name, p.sku, sup.name
               ORDER BY p.category, rank_in_category`;

    const result = await pool.query(query, params);
    return result.rows;
}

// Audit logs from MongoDB, sorted by most recent deletion
async function getAuditLogs({ entity, limit = 50 } = {}) {
    const db = getDb();
    const filter = entity ? { entity } : {};
    const logs = await db.collection('audit_logs')
        .find(filter)
        .sort({ deletedAt: -1 })
        .limit(limit)
        .toArray();
    return logs;
}

module.exports = { getSupplierAnalysis, getClientHistory, getTopProductsByCategory, getAuditLogs };
