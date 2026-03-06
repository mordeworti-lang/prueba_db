'use strict';

// Set test environment variables before loading modules
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.MONGODB_URI = 'mongodb://localhost:27017';
process.env.MONGODB_DB = 'test_megastore_db';
process.env.JWT_SECRET = 'test_secret_minimum_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_minimum_32_characters_long';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock database connections
jest.mock('../src/config/postgres', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(() => ({
      query: jest.fn(),
      release: jest.fn()
    }))
  }
}));

jest.mock('../src/config/mongodb', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      findOne: jest.fn(),
      deleteMany: jest.fn()
    }))
  }))
}));
