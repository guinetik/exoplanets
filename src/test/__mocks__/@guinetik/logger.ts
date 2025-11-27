/**
 * Mock implementation of @guinetik/logger for Jest tests
 */

export const createLogger = () => ({
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  group: jest.fn(),
  groupEnd: jest.fn(),
  table: jest.fn(),
  time: jest.fn(),
  timeEnd: jest.fn(),
});

export default { createLogger };

