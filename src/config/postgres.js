// src/config/postgres.js
'use strict';

const { Pool } = require('pg');
const { DATABASE_URL, NODE_ENV } = require('./env');

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err.message);
});

async function connectPostgres() {
    const client = await pool.connect();
    try {
        await client.query('SELECT NOW()');
    } finally {
        client.release();
    }
}

module.exports = connectPostgres;
module.exports.pool = pool;
