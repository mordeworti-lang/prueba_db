'use strict';

const cartService = require('../services/cartService');
const saleService = require('../services/saleService');

// GET /api/cart
async function getCart(req, res, next) {
    try {
        const { id: userId } = req.user;
        const cart = cartService.getCart(userId);
        const totals = cartService.getCartTotals(userId);
        
        res.json({ 
            ok: true, 
            cart: {
                ...cart,
                totals
            }
        });
    } catch (error) { next(error); }
}

// POST /api/cart/items
async function addItem(req, res, next) {
    try {
        const { id: userId } = req.user;
        const cart = cartService.addItem(userId, req.body);
        const totals = cartService.getCartTotals(userId);
        
        res.json({ 
            ok: true, 
            message: 'Item added to cart',
            cart: {
                ...cart,
                totals
            }
        });
    } catch (error) { next(error); }
}

// DELETE /api/cart/items/:productId
async function removeItem(req, res, next) {
    try {
        const { id: userId } = req.user;
        const { productId } = req.params;
        const cart = cartService.removeItem(userId, productId);
        const totals = cartService.getCartTotals(userId);
        
        res.json({ 
            ok: true, 
            message: 'Item removed from cart',
            cart: {
                ...cart,
                totals
            }
        });
    } catch (error) { next(error); }
}

// PUT /api/cart/items/:productId
async function updateQuantity(req, res, next) {
    try {
        const { id: userId } = req.user;
        const { productId } = req.params;
        const { quantity } = req.body;
        const cart = cartService.updateQuantity(userId, productId, quantity);
        const totals = cartService.getCartTotals(userId);
        
        res.json({ 
            ok: true, 
            message: 'Item quantity updated',
            cart: {
                ...cart,
                totals
            }
        });
    } catch (error) { next(error); }
}

// DELETE /api/cart
async function clearCart(req, res, next) {
    try {
        const { id: userId } = req.user;
        const cart = cartService.clearCart(userId);
        const totals = cartService.getCartTotals(userId);
        
        res.json({ 
            ok: true, 
            message: 'Cart cleared',
            cart: {
                ...cart,
                totals
            }
        });
    } catch (error) { next(error); }
}

// POST /api/cart/checkout
async function checkout(req, res, next) {
    try {
        const { id: userId, role } = req.user;
        const { clientId } = req.body;

        // Convert cart items to sales format
        const salesData = cartService.convertToSales(userId);
        
        // Create sales for each item
        const createdSales = [];
        for (const saleData of salesData) {
            const sale = await saleService.create({
                clientId: clientId || userId,
                ...saleData
            });
            createdSales.push(sale);
        }

        // Clear cart after successful checkout
        cartService.removeCart(userId);

        res.status(201).json({ 
            ok: true, 
            message: 'Checkout completed successfully',
            sales: createdSales,
            totalAmount: salesData.reduce((sum, item) => sum + item.totalAmount, 0)
        });
    } catch (error) { next(error); }
}

module.exports = {
    getCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    checkout
};
