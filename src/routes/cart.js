'use strict';

const { Router } = require('express');
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

// All cart routes require authentication
router.use(authMiddleware);

// GET /api/cart - Get user's cart with totals
router.get('/', cartController.getCart);

// POST /api/cart/items - Add item to cart
router.post('/items', cartController.addItem);

// DELETE /api/cart/items/:productId - Remove item from cart
router.delete('/items/:productId', cartController.removeItem);

// PUT /api/cart/items/:productId - Update item quantity
router.put('/items/:productId', cartController.updateQuantity);

// DELETE /api/cart - Clear entire cart
router.delete('/', cartController.clearCart);

// POST /api/cart/checkout - Convert cart items to sales
router.post('/checkout', cartController.checkout);

module.exports = router;
