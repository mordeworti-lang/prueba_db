'use strict';

const clientRepository = require('../repositories/clientRepository');
const NotFoundError    = require('../exceptions/NotFoundError');

async function getClientHistory(email) {
    const history = await clientRepository.findHistoryByEmail(email);
    if (!history) throw new NotFoundError(`No purchase history found for ${email}`);
    return history;
}

async function searchClients(q) {
    return clientRepository.search(q);
}

module.exports = { getClientHistory, searchClients };
