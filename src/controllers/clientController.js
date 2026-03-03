'use strict';

const clientService = require('../services/clientService');

// GET /api/clients/history/:email
async function getHistory(req, res, next) {
    try {
        const { email } = req.params;
        const result = await clientService.getClientHistory(email);
        res.json({ ok: true, ...result });
    } catch (error) { next(error); }
}

// GET /api/clients/search?q=Juan
async function search(req, res, next) {
    try {
        const { q } = req.query;
        const result = await clientService.searchClients(q || '');
        res.json({ ok: true, clients: result });
    } catch (error) { next(error); }
}

module.exports = { getHistory, search };
