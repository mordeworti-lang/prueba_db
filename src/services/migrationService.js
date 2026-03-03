'use strict';

const fs   = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { pool }  = require('../config/postgres');
const { getDb } = require('../config/mongodb');
const { CSV_PATH } = require('../config/env');

/**
 * runMigration({ clearBefore: bool })
 * Idempotent bulk load: reads CSV, upserts all master entities,
 * then inserts sales if not already present.
 */
async function runMigration({ clearBefore = false } = {}) {
    const csvPath = path.resolve(CSV_PATH);
    const raw     = fs.readFileSync(csvPath, 'utf8');

    const rows = parse(raw, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true
    });

    const pgClient = await pool.connect();
    try {
        await pgClient.query('BEGIN');

        if (clearBefore) {
            await pgClient.query('DELETE FROM sale');
            await pgClient.query('DELETE FROM product');
            await pgClient.query('DELETE FROM client');
            await pgClient.query('DELETE FROM users WHERE role = $1', ['client']);
            await pgClient.query('DELETE FROM supplier');
            const db = getDb();
            await db.collection('client_histories').deleteMany({});
        }

        const counters = { discounts: 0, clients: 0, products: 0, sales: 0 };

        for (const row of rows) {
            const clientEmail   = (row['Email Cliente']      || row.email_cliente       || '').trim().toLowerCase();
            const clientName    = (row['Nombre Cliente']     || row.nombre_cliente      || '').trim();
            const clientAddress = (row['Dirección']          || row.direccion           || '').trim();
            const supplierName  = (row['Nombre Proveedor']   || row.nombre_proveedor    || '').trim();
            const supplierEmail = (row['Contacto Proveedor'] || row.contacto_proveedor  || '').trim();
            const productSku    = (row['SKU']                || row.sku                 || '').trim();
            const productName   = (row['Nombre Producto']    || row.nombre_producto     || '').trim();
            const category      = (row['Categoría Producto'] || row.categoria_producto  || '').trim();
            const unitPrice     = parseFloat(row['Precio Unitario'] || row.precio_unitario || 0);
            const quantity      = parseInt(row['Cantidad']   || row.cantidad             || 0);
            const txnId         = (row['ID Transacción']     || row.id_transaccion      || '').trim();
            const saleDate      = (row['Fecha']              || row.fecha               || '').trim();

            if (!clientEmail || !productSku || !supplierName) continue;

            // ── 1. Upsert supplier ──────────────────────────────────────────
            const supRes = await pgClient.query(
                `INSERT INTO supplier (name, email)
                 VALUES ($1, $2)
                 ON CONFLICT (name) DO UPDATE SET email = EXCLUDED.email
                 RETURNING id`,
                [supplierName, supplierEmail]
            );
            const supplierId = supRes.rows[0].id;

            // ── 2. Upsert product ───────────────────────────────────────────
            const prodRes = await pgClient.query(
                `INSERT INTO product (supplier_id, sku, name, category, unit_price, stock)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (sku) DO UPDATE
                   SET name = EXCLUDED.name, category = EXCLUDED.category,
                       unit_price = EXCLUDED.unit_price, supplier_id = EXCLUDED.supplier_id,
                       updated_at = NOW()
                 RETURNING id`,
                [supplierId, productSku, productName, category, unitPrice, quantity]
            );
            const productId = prodRes.rows[0].id;
            counters.products++;

            // ── 3. Upsert user (client auth) ────────────────────────────────
            const userRes = await pgClient.query(
                `INSERT INTO users (name, email, password, role)
                 VALUES ($1, $2, $3, 'client')
                 ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
                 RETURNING id`,
                [clientName, clientEmail, '$2b$12$placeholder_migrated_hash']
            );
            const userId = userRes.rows[0].id;

            // ── 4. Upsert client profile ────────────────────────────────────
            const clientRes = await pgClient.query(
                `INSERT INTO client (user_id, address)
                 VALUES ($1, $2)
                 ON CONFLICT (user_id) DO UPDATE SET address = EXCLUDED.address
                 RETURNING id`,
                [userId, clientAddress]
            );
            const clientId = clientRes.rows[0].id;
            counters.clients++;

            // ── 5. Insert sale (idempotent by transaction_id) ───────────────
            if (txnId) {
                const saleRes = await pgClient.query(
                    `INSERT INTO sale (transaction_id, sale_date, client_id, product_id, quantity, unit_price, total_amount)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (transaction_id) DO NOTHING
                     RETURNING id`,
                    [txnId, saleDate || new Date().toISOString(), clientId, productId, quantity, unitPrice, quantity * unitPrice]
                );
                if (saleRes.rows.length > 0) {
                    counters.sales++;

                    // ── 6. Sync to MongoDB client_histories ─────────────────
                    const db = getDb();
                    await db.collection('client_histories').updateOne(
                        { clientEmail },
                        {
                            $setOnInsert: { clientEmail, clientName, purchases: [] },
                            $push: {
                                purchases: {
                                    transactionId: txnId,
                                    date:          new Date(saleDate),
                                    productName,
                                    sku:           productSku,
                                    category,
                                    quantity,
                                    unitPrice,
                                    totalAmount:   quantity * unitPrice,
                                    supplierName
                                }
                            }
                        },
                        { upsert: true }
                    );
                }
            }
        }

        await pgClient.query('COMMIT');
        counters.csvPath = csvPath;
        return counters;

    } catch (err) {
        await pgClient.query('ROLLBACK');
        throw err;
    } finally {
        pgClient.release();
    }
}

module.exports = { runMigration };
