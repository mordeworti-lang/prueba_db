'use strict';

// Mock dependencies before importing
const mockReportRepository = {
  getSupplierAnalysis: jest.fn(),
  getTopProductsByCategory: jest.fn(),
  getClientHistory: jest.fn(),
  getAuditLogs: jest.fn()
};

jest.mock('../src/repositories/reportRepository', () => mockReportRepository);

const reportService = require('../src/services/reportService');

describe('BI Reports Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSupplierStats', () => {
    it('should return supplier statistics with sales data', async () => {
      // Arrange
      const mockStats = [
        {
          supplier_id: 1,
          supplier_name: 'Tech Supplier',
          supplier_email: 'tech@supplier.com',
          total_sales: 150,
          total_items_sold: 1250,
          inventory_value: 50000.00,
          total_revenue: 25000.00
        }
      ];

      mockReportRepository.getSupplierAnalysis.mockResolvedValue(mockStats);

      // Act
      const result = await reportService.getSupplierAnalysis();

      // Assert
      expect(mockReportRepository.getSupplierAnalysis).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
      expect(result[0].total_sales).toBe(150);
      expect(result[0].total_revenue).toBe(25000.00);
    });

    it('should return empty array when no suppliers found', async () => {
      // Arrange
      mockReportRepository.getSupplierAnalysis.mockResolvedValue([]);

      // Act
      const result = await reportService.getSupplierAnalysis();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getTopProductsByCategory', () => {
    it('should return top products ranked by revenue within categories', async () => {
      // Arrange
      const mockProducts = [
        {
          category: 'Electronics',
          product_id: 1,
          product_name: 'Laptop',
          sku: 'ELEC-001',
          total_quantity_sold: 50,
          total_revenue: 75000.00,
          rank_in_category: 1
        },
        {
          category: 'Electronics',
          product_id: 2,
          product_name: 'Mouse',
          sku: 'ELEC-002',
          total_quantity_sold: 200,
          total_revenue: 10000.00,
          rank_in_category: 2
        }
      ];

      mockReportRepository.getTopProductsByCategory.mockResolvedValue(mockProducts);

      // Act
      const result = await reportService.getTopProductsByCategory();

      // Assert
      expect(mockReportRepository.getTopProductsByCategory).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].rank_in_category).toBe(1);
      expect(result[0].total_revenue).toBe(75000.00);
    });

    it('should filter products by category when specified', async () => {
      // Arrange
      const category = 'Electronics';
      const mockProducts = [
        {
          category: 'Electronics',
          product_id: 1,
          product_name: 'Laptop',
          sku: 'ELEC-001',
          total_quantity_sold: 50,
          total_revenue: 75000.00,
          rank_in_category: 1
        }
      ];

      mockReportRepository.getTopProductsByCategory.mockResolvedValue(mockProducts);

      // Act
      const result = await reportService.getTopProductsByCategory(category);

      // Assert
      expect(mockReportRepository.getTopProductsByCategory).toHaveBeenCalledWith(category);
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Electronics');
    });
  });

  describe('getClientSummary', () => {
    it('should return client purchase summary with BI metrics', async () => {
      // Arrange
      const email = 'john@example.com';
      const mockSummary = [
        {
          client_name: 'John Doe',
          client_email: 'john@example.com',
          total_orders: 5,
          total_items: 15,
          total_spent: 250.75,
          first_purchase: '2024-01-01T00:00:00Z',
          last_purchase: '2024-01-15T00:00:00Z'
        }
      ];

      mockReportRepository.getClientHistory.mockResolvedValue(mockSummary);

      // Act
      const result = await reportService.getClientHistory(email);

      // Assert
      expect(mockReportRepository.getClientHistory).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].total_orders).toBe(5);
      expect(result[0].total_spent).toBe(250.75);
      expect(result[0].first_purchase).toBeDefined();
      expect(result[0].last_purchase).toBeDefined();
    });

    it('should return empty array when no client data found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockReportRepository.getClientHistory.mockResolvedValue([]);

      // Act
      const result = await reportService.getClientHistory(email);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getAuditLogs', () => {
    it('should return audit logs filtered by entity type', async () => {
      // Arrange
      const entity = 'sale';
      const limit = 20;
      const mockLogs = [
        {
          action: 'DELETE',
          entity: 'sale',
          entityId: 123,
          deletedAt: new Date('2024-01-01T00:00:00Z'),
          snapshot: {
            id: 123,
            transaction_id: 'TXN-123',
            total_amount: 100.00
          }
        }
      ];

      mockReportRepository.getAuditLogs.mockResolvedValue(mockLogs);

      // Act
      const result = await reportService.getAuditLogs({ entity, limit });

      // Assert
      expect(mockReportRepository.getAuditLogs).toHaveBeenCalledWith({ entity, limit });
      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('DELETE');
      expect(result[0].entity).toBe('sale');
      expect(result[0].snapshot).toBeDefined();
    });

    it('should return audit logs without entity filter', async () => {
      // Arrange
      const mockLogs = [
        {
          action: 'DELETE',
          entity: 'product',
          entityId: 456,
          deletedAt: new Date('2024-01-02T00:00:00Z'),
          snapshot: { id: 456, name: 'Test Product' }
        }
      ];

      mockReportRepository.getAuditLogs.mockResolvedValue(mockLogs);

      // Act
      const result = await reportService.getAuditLogs({ limit: 10 });

      // Assert
      expect(mockReportRepository.getAuditLogs).toHaveBeenCalledWith({ limit: 10 });
      expect(result).toHaveLength(1);
      expect(result[0].entity).toBe('product');
    });
  });
});
