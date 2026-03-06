'use strict';

const NotFoundError = require('../exceptions/NotFoundError');
const ValidationError = require('../exceptions/ValidationError');

// In-memory cart storage (in production, use Redis or database)
const carts = new Map();

class CartService {
  // Get or create cart for a user
  getCart(userId) {
    if (!carts.has(userId)) {
      carts.set(userId, {
        userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return carts.get(userId);
  }

  // Add item to cart
  addItem(userId, { productId, name, sku, quantity, unitPrice }) {
    if (!productId || !quantity || !unitPrice) {
      throw new ValidationError('productId, quantity and unitPrice are required');
    }

    const cart = this.getCart(userId);
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      // Add new item
      cart.items.push({
        productId: parseInt(productId),
        name: name || `Product ${productId}`,
        sku: sku || `SKU-${productId}`,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        addedAt: new Date()
      });
    }

    cart.updatedAt = new Date();
    return cart;
  }

  // Remove item from cart
  removeItem(userId, productId) {
    const cart = this.getCart(userId);
    const initialLength = cart.items.length;
    
    cart.items = cart.items.filter(item => item.productId !== parseInt(productId));
    
    if (cart.items.length === initialLength) {
      throw new NotFoundError(`Product ${productId} not found in cart`);
    }

    cart.updatedAt = new Date();
    return cart;
  }

  // Update item quantity
  updateQuantity(userId, productId, quantity) {
    if (!quantity || quantity <= 0) {
      throw new ValidationError('Quantity must be greater than 0');
    }

    const cart = this.getCart(userId);
    const itemIndex = cart.items.findIndex(item => item.productId === parseInt(productId));

    if (itemIndex === -1) {
      throw new NotFoundError(`Product ${productId} not found in cart`);
    }

    cart.items[itemIndex].quantity = parseInt(quantity);
    cart.updatedAt = new Date();
    return cart;
  }

  // Clear entire cart
  clearCart(userId) {
    const cart = this.getCart(userId);
    cart.items = [];
    cart.updatedAt = new Date();
    return cart;
  }

  // Get cart totals
  getCartTotals(userId) {
    const cart = this.getCart(userId);
    
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const itemCount = cart.items.reduce((sum, item) => {
      return sum + item.quantity;
    }, 0);

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      itemCount,
      itemCountDistinct: cart.items.length,
      currency: 'USD'
    };
  }

  // Convert cart to sales format for checkout
  convertToSales(userId) {
    const cart = this.getCart(userId);
    
    if (cart.items.length === 0) {
      throw new ValidationError('Cart is empty');
    }

    return cart.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalAmount: item.quantity * item.unitPrice
    }));
  }

  // Remove cart after successful checkout
  removeCart(userId) {
    carts.delete(userId);
  }
}

module.exports = new CartService();
