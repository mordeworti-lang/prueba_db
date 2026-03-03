'use strict';

const { Router } = require('express');
const productController = require('../controllers/productController');
const authMiddleware    = require('../middleware/authMiddleware');
const role              = require('../middleware/roleMiddleware');

const router = Router();

// Public read access; write operations require admin
router.get('/',       authMiddleware, productController.getAll);
router.get('/:id',    authMiddleware, productController.getById);
router.post('/',      authMiddleware, role('admin'), productController.create);
router.put('/:id',    authMiddleware, role('admin'), productController.update);
router.delete('/:id', authMiddleware, role('admin'), productController.remove);

module.exports = router;
