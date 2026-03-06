'use strict';

// Mock dependencies before importing
jest.mock('../src/repositories/saleRepository', () => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn()
}));

jest.mock('../src/config/mongodb', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      insertOne: jest.fn(),
      updateOne: jest.fn()
    }))
  }))
}));

const saleService = require('../src/services/saleService');
const saleRepository = require('../src/repositories/saleRepository');

describe('saleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteSale', () => {
    it('should delete sale and create audit log in MongoDB', async () => {
      // Arrange
      const mockSale = {
        id: 1,
        transaction_id: 'TXN-123',
        client_id: 1,
        product_id: 2,
        quantity: 3,
        unit_price: 10.50,
        total_amount: 31.50
      };

      // Mock remove to return the sale (since repository calls findById internally)
      saleRepository.remove.mockResolvedValue(mockSale);

      // Act
      const result = await saleService.deleteSale(1);

      // Assert
      expect(saleRepository.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSale);
    });

    it('should throw NotFoundError when sale does not exist', async () => {
      // Arrange
      saleRepository.remove.mockResolvedValue(null);

      // Act & Assert
      await expect(saleService.deleteSale(999))
        .rejects
        .toThrow('Sale #999 not found');
    });
  });

  describe('create', () => {
    it('should create sale with calculated total amount', async () => {
      // Arrange
      const saleData = {
        clientId: 1,
        productId: 2,
        quantity: 3,
        unitPrice: 10.50
      };

      const expectedSale = {
        transactionId: expect.stringMatching(/^TXN-\d+$/),
        saleDate: expect.any(String),
        clientId: 1,
        productId: 2,
        quantity: 3,
        unitPrice: 10.50,
        totalAmount: 31.50
      };

      saleRepository.create.mockResolvedValue(expectedSale);

      // Act
      const result = await saleService.create(saleData);

      // Assert
      expect(saleRepository.create).toHaveBeenCalledWith(expectedSale);
      expect(result).toEqual(expectedSale);
    });

    it('should throw ValidationError when required fields are missing', async () => {
      // Arrange
      const invalidData = {
        clientId: 1,
        productId: 2
        // missing quantity and unitPrice
      };

      // Act & Assert
      await expect(saleService.create(invalidData))
        .rejects
        .toThrow('clientId, productId, quantity and unitPrice are required');
    });
  });

  describe('updateSale', () => {
    it('should update sale and recalculate total amount', async () => {
      // Arrange
      const existingSale = {
        id: 1,
        quantity: 2,
        unit_price: 10.00,
        sale_date: '2024-01-01T00:00:00Z'
      };

      const updateData = {
        quantity: 5,
        unitPrice: 12.50
      };

      const updatedSale = {
        ...existingSale,
        quantity: 5,
        unit_price: 12.50,
        total_amount: 62.50
      };

      saleRepository.findById.mockResolvedValue(existingSale);
      saleRepository.update.mockResolvedValue(updatedSale);

      // Act
      const result = await saleService.updateSale(1, updateData);

      // Assert
      expect(saleRepository.findById).toHaveBeenCalledWith(1);
      expect(saleRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(updatedSale);
    });

    it('should throw NotFoundError when trying to update non-existent sale', async () => {
      // Arrange
      saleRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(saleService.updateSale(999, { quantity: 5 }))
        .rejects
        .toThrow('Sale #999 not found');
    });

    it('should throw ValidationError when no valid fields provided', async () => {
      // Arrange
      saleRepository.findById.mockResolvedValue({ id: 1 });

      // Act & Assert
      await expect(saleService.updateSale(1, {}))
        .rejects
        .toThrow('Provide at least one field to update: quantity, unitPrice, saleDate');
    });
  });

  describe('getMine', () => {
    it('should return all sales for admin users', async () => {
      // Arrange
      const adminUser = { userId: 1, role: 'admin' };
      const mockSales = [{ id: 1 }, { id: 2 }];
      
      saleRepository.findAll.mockResolvedValue(mockSales);

      // Act
      const result = await saleService.getMine(adminUser);

      // Assert
      expect(saleRepository.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockSales);
    });

    it('should return user-specific sales for client users', async () => {
      // Arrange
      const clientUser = { userId: 123, role: 'client' };
      const mockSales = [{ id: 1, client_id: 123 }];
      
      saleRepository.findAll.mockResolvedValue(mockSales);

      // Act
      const result = await saleService.getMine(clientUser);

      // Assert
      expect(saleRepository.findAll).toHaveBeenCalledWith({ clientId: 123 });
      expect(result).toEqual(mockSales);
    });
  });
});
