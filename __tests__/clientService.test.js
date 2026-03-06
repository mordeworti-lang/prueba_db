'use strict';

// Mock dependencies before importing
const mockClientRepository = {
  findHistoryByEmail: jest.fn(),
  search: jest.fn()
};

jest.mock('../src/repositories/clientRepository', () => mockClientRepository);

const clientService = require('../src/services/clientService');

describe('clientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getClientHistory', () => {
    it('should return client purchase history', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockHistory = {
        clientEmail: email,
        clientName: 'John Doe',
        purchases: [
          {
            transactionId: 'TXN-123',
            date: '2024-01-01T00:00:00Z',
            productName: 'Test Product',
            quantity: 2,
            unitPrice: 10.50,
            totalAmount: 21.00
          }
        ]
      };

      mockClientRepository.findHistoryByEmail.mockResolvedValue(mockHistory);

      // Act
      const result = await clientService.getClientHistory(email);

      // Assert
      expect(mockClientRepository.findHistoryByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(mockHistory);
    });

    it('should throw NotFoundError when no history found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockClientRepository.findHistoryByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(clientService.getClientHistory(email))
        .rejects
        .toThrow('No purchase history found for nonexistent@example.com');
    });
  });

  describe('searchClients', () => {
    it('should return search results for client query', async () => {
      // Arrange
      const query = 'John';
      const mockClients = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          address: '123 Main St'
        },
        {
          id: 2,
          name: 'John Smith',
          email: 'smith@example.com',
          phone: '098-765-4321',
          address: '456 Oak Ave'
        }
      ];

      mockClientRepository.search.mockResolvedValue(mockClients);

      // Act
      const result = await clientService.searchClients(query);

      // Assert
      expect(mockClientRepository.search).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockClients);
    });

    it('should return all clients when query is empty', async () => {
      // Arrange
      const mockClients = [
        {
          id: 1,
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '111-222-3333',
          address: '789 Pine St'
        }
      ];

      mockClientRepository.search.mockResolvedValue(mockClients);

      // Act
      const result = await clientService.searchClients('');

      // Assert
      expect(mockClientRepository.search).toHaveBeenCalledWith('');
      expect(result).toEqual(mockClients);
    });

    it('should handle null query gracefully', async () => {
      // Arrange
      const mockClients = [];
      mockClientRepository.search.mockResolvedValue(mockClients);

      // Act
      const result = await clientService.searchClients(null);

      // Assert
      expect(mockClientRepository.search).toHaveBeenCalledWith(null);
      expect(result).toEqual(mockClients);
    });
  });
});
