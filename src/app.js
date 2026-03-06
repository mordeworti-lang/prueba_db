'use strict';

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const errorMiddleware = require('./middleware/errorMiddleware');
const authRoutes      = require('./routes/auth');
const saleRoutes      = require('./routes/sale');
const clientRoutes    = require('./routes/clients');
const productRoutes   = require('./routes/product');
const cartRoutes      = require('./routes/cart');
const reportsRoutes   = require('./routes/reports');
const adminRoutes     = require('./routes/admin');
const simulacroRoutes = require('./routes/simulacro');

const app = express();

// ── SECURITY ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: false }));

// ── BODY PARSERS ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── STATIC FILES ─────────────────────────────────────────────────────────────
app.use(express.static('public'));

// ── RATE LIMITING ─────────────────────────────────────────────────────────────
app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000, max: 300,
    message: { ok: false, error: 'Too many requests, try again in 15 minutes' }
}));
app.use('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000, max: 10,
    message: { ok: false, error: 'Too many login attempts' }
}));

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
    status: 'OK', service: 'MegaStore Global API', version: '2.0.0',
    timestamp: new Date().toISOString()
}));

// ── API ROUTES ─────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/simulacro', simulacroRoutes);
app.use('/api/reports',   reportsRoutes);
app.use('/api/clients',   clientRoutes);
app.use('/api/sales',     saleRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/cart',      cartRoutes);
app.use('/api/admin',     adminRoutes);

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
