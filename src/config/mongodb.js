// src/config/mongodb.js
'use strict';

const { MongoClient } = require('mongodb');
const { MONGODB_URI, MONGODB_DB } = require('./env');

let db = null;

async function connectMongo() {
    const client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    await client.db('admin').command({ ping: 1 });

    db = client.db(MONGODB_DB);

    // Apply schema validation on first connect
    await ensureCollections(db);

    client.on('close', () => { console.warn('MongoDB disconnected'); });
}

/**
 * Ensure collections exist with schema validation.
 * idempotent: createCollection is a no-op if collection already exists.
 */
async function ensureCollections(database) {
    const collections = await database.listCollections().toArray();
    const names = collections.map(c => c.name);

    // ── client_histories ──────────────────────────────────────────────────────
    if (!names.includes('client_histories')) {
        await database.createCollection('client_histories', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['clientEmail', 'clientName', 'purchases'],
                    properties: {
                        clientEmail: { bsonType: 'string', description: 'required string' },
                        clientName:  { bsonType: 'string', description: 'required string' },
                        purchases:   { bsonType: 'array',  description: 'array of purchase records' }
                    }
                }
            }
        });
        await database.collection('client_histories').createIndex(
            { clientEmail: 1 }, { unique: true }
        );
    }

    // ── audit_logs ────────────────────────────────────────────────────────────
    // FIX: now includes schema validation (was missing before)
    if (!names.includes('audit_logs')) {
        await database.createCollection('audit_logs', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['action', 'entity', 'entityId', 'deletedAt', 'snapshot'],
                    properties: {
                        action:    { bsonType: 'string', enum: ['DELETE', 'UPDATE', 'CREATE'] },
                        entity:    { bsonType: 'string', description: 'Table/entity name' },
                        entityId:  { bsonType: 'int',    description: 'PK of deleted record' },
                        deletedAt: { bsonType: 'date' },
                        snapshot:  { bsonType: 'object', description: 'Full record snapshot' }
                    }
                }
            }
        });
        await database.collection('audit_logs').createIndex(
            { entity: 1, deletedAt: -1 }
        );
    }
}

function getDb() {
    if (!db) throw new Error('MongoDB not connected. Call connectMongo() first.');
    return db;
}

module.exports = connectMongo;
module.exports.getDb = getDb;
