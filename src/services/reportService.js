'use strict';

const reportRepository = require('../repositories/reportRepository');

async function getSupplierAnalysis() {
    return reportRepository.getSupplierAnalysis();
}

async function getClientHistory(email) {
    return reportRepository.getClientHistory(email);
}

async function getTopProductsByCategory(category) {
    return reportRepository.getTopProductsByCategory(category);
}

async function getAuditLogs(options) {
    return reportRepository.getAuditLogs(options);
}

module.exports = { getSupplierAnalysis, getClientHistory, getTopProductsByCategory, getAuditLogs };
