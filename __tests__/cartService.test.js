'use strict';

const cartService = require('../src/services/cartService');

describe('CartService', () => {
  const userId = 123;
  const testProduct = {
    productId: 1,
    name: 'Test Product',
    sku: 'TEST-001',
    quantity: 2,
    unitPrice: 10.50
  };

  beforeEach(() => {
    // Clear cart before each test
    cartService.clearCart(userId);
  });

  describe('getCart', () => {
    it('should create empty cart for new user', () => {
      const cart = cartService.getCart(userId);
      
      expect(cart.userId).toBe(userId);
      expect(cart.items).toEqual([]);
      expect(cart.createdAt).toBeInstanceOf(Date);
      expect(cart.updatedAt).toBeInstanceOf(Date);
    });

    it('should return existing cart for user', () => {
      const cart1 = cartService.getCart(userId);
      const cart2 = cartService.getCart(userId);
      
      expect(cart1).toBe(cart2);
    });
  });

  describe('addItem', () => {
    it('should add item to cart', () => {
      const cart = cartService.addItem(userId, testProduct);
      
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toMatchObject(testProduct);
      expect(cart.items[0].addedAt).toBeInstanceOf(Date);
    });

    it('should increase quantity for existing item', () => {
      cartService.addItem(userId, testProduct);
      const cart = cartService.addItem(userId, { ...testProduct, quantity: 3 });
      
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5); // 2 + 3
    });

    it('should throw ValidationError for missing required fields', () => {
      expect(() => {
        cartService.addItem(userId, { productId: 1 });
      }).toThrow('productId, quantity and unitPrice are required');
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      cartService.addItem(userId, testProduct);
      const cart = cartService.removeItem(userId, testProduct.productId);
      
      expect(cart.items).toHaveLength(0);
    });

    it('should throw NotFoundError for non-existent item', () => {
      expect(() => {
        cartService.removeItem(userId, 999);
      }).toThrow('Product 999 not found in cart');
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      cartService.addItem(userId, testProduct);
      const cart = cartService.updateQuantity(userId, testProduct.productId, 5);
      
      expect(cart.items[0].quantity).toBe(5);
    });

    it('should throw ValidationError for invalid quantity', () => {
      expect(() => {
        cartService.updateQuantity(userId, testProduct.productId, 0);
      }).toThrow('Quantity must be greater than 0');
    });

    it('should throw NotFoundError for non-existent item', () => {
      expect(() => {
        cartService.updateQuantity(userId, 999, 5);
      }).toThrow('Product 999 not found in cart');
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', () => {
      cartService.addItem(userId, testProduct);
      cartService.addItem(userId, { ...testProduct, productId: 2 });
      const cart = cartService.clearCart(userId);
      
      expect(cart.items).toHaveLength(0);
    });
  });

  describe('getCartTotals', () => {
    it('should calculate correct totals', () => {
      cartService.addItem(userId, testProduct);
      cartService.addItem(userId, { ...testProduct, productId: 2, quantity: 3, unitPrice: 5.00 });
      
      const totals = cartService.getCartTotals(userId);
      
      expect(totals.subtotal).toBe(36.00); // (2 * 10.50) + (3 * 5.00)
      expect(totals.itemCount).toBe(5); // 2 + 3
      expect(totals.itemCountDistinct).toBe(2);
      expect(totals.currency).toBe('USD');
    });

    it('should return zero totals for empty cart', () => {
      const totals = cartService.getCartTotals(userId);
      
      expect(totals.subtotal).toBe(0);
      expect(totals.itemCount).toBe(0);
      expect(totals.itemCountDistinct).toBe(0);
    });
  });

  describe('convertToSales', () => {
    it('should convert cart items to sales format', () => {
      cartService.addItem(userId, testProduct);
      const sales = cartService.convertToSales(userId);
      
      expect(sales).toHaveLength(1);
      expect(sales[0]).toMatchObject({
        productId: testProduct.productId,
        quantity: testProduct.quantity,
        unitPrice: testProduct.unitPrice,
        totalAmount: testProduct.quantity * testProduct.unitPrice
      });
    });

    it('should throw ValidationError for empty cart', () => {
      expect(() => {
        cartService.convertToSales(userId);
      }).toThrow('Cart is empty');
    });
  });

  describe('removeCart', () => {
    it('should remove cart completely', () => {
      cartService.addItem(userId, testProduct);
      cartService.removeCart(userId);
      
      // Should create new empty cart
      const cart = cartService.getCart(userId);
      expect(cart.items).toHaveLength(0);
    });
  });
});
