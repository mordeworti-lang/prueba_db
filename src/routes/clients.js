'use strict';

const { Router } = require('express');
const clientController = require('../controllers/clientController');
const authMiddleware   = require('../middleware/authMiddleware');

const router = Router();

router.get('/search',        authMiddleware, clientController.search);
router.get('/history/:email', authMiddleware, clientController.getHistory);

module.exports = router;
