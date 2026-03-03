// src/config/env.js
'use strict';

require('dotenv').config();

const requiredVars = [
    'DATABASE_URL',
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
];

requiredVars.forEach((key) => {
    if (!process.env[key]) {
        console.error(`Missing required environment variable: ${key}`);
        process.exit(1);
    }
});

module.exports = {
    PORT:                  process.env.PORT || 3000,
    NODE_ENV:              process.env.NODE_ENV || 'development',
    DATABASE_URL:          process.env.DATABASE_URL,
    MONGODB_URI:           process.env.MONGODB_URI,
    MONGODB_DB:            process.env.MONGODB_DB || 'megastore_db',
    JWT_SECRET:            process.env.JWT_SECRET,
    JWT_REFRESH_SECRET:    process.env.JWT_REFRESH_SECRET,
    JWT_EXPIRES_IN:        process.env.JWT_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN:process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    CSV_PATH:              process.env.SIMULACRO_CSV_PATH || './data/simulacro_megastore_data_.csv',
};
