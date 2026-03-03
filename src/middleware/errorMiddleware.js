'use strict';

const AppError = require('../exceptions/AppError');

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ ok: false, error: err.message });
    }

    // PostgreSQL unique constraint violation
    if (err.code === '23505') {
        return res.status(409).json({ ok: false, error: 'A record with that value already exists' });
    }

    // PostgreSQL foreign key violation
    if (err.code === '23503') {
        return res.status(400).json({ ok: false, error: 'Referenced record does not exist' });
    }

    // PostgreSQL check constraint violation
    if (err.code === '23514') {
        return res.status(400).json({ ok: false, error: 'Value violates a data constraint' });
    }

    console.error('Unexpected error:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
}

module.exports = errorMiddleware;
