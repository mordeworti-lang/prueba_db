'use strict';

const { getDb } = require('../config/mongodb');
const { pool }  = require('../config/postgres');

async function findHistoryByEmail(email) {
    const db = getDb();
    return await db.collection('client_histories')
        .findOne({ clientEmail: email.toLowerCase() }) || null;
}

async function search(q) {
    const term = (q || '').trim();
    const result = await pool.query(
        `SELECT c.id, u.name, u.email, c.phone, c.address
         FROM client c
         JOIN users u ON u.id = c.user_id
         WHERE u.name ILIKE $1 OR u.email ILIKE $1
         ORDER BY u.name ASC LIMIT 30`,
        [`%${term}%`]
    );
    return result.rows;
}

module.exports = { findHistoryByEmail, search };
