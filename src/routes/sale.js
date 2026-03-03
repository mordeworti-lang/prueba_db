'use strict';

const { Router } = require('express');
const saleController  = require('../controllers/saleController');
const authMiddleware  = require('../middleware/authMiddleware');
const role            = require('../middleware/roleMiddleware');

const router = Router();

router.get('/',        authMiddleware, saleController.getAll);
router.get('/mine',    authMiddleware, saleController.mine);
router.get('/:id',     authMiddleware, saleController.getById);
router.post('/',       authMiddleware, saleController.create);
router.put('/:id',     authMiddleware, role('admin'), saleController.update);   // FIX: new
router.delete('/:id',  authMiddleware, role('admin'), saleController.remove);

module.exports = router;
