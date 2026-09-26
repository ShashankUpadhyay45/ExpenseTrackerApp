import { describe, it, expect } from 'vitest';
import { AppError } from '../utils/AppError.js';

describe('AppError Exception Formatter', () => {
  it('creates an operational 404 error with correct status', () => {
    const error = new AppError('Resource not found', 404);
    expect(error.message).toBe('Resource not found');
    expect(error.statusCode).toBe(404);
    expect(error.status).toBe('fail');
    expect(error.isOperational).toBe(true);
  });

  it('creates a 500 error with error status', () => {
    const error = new AppError('Database connection timed out', 500);
    expect(error.statusCode).toBe(500);
    expect(error.status).toBe('error');
    expect(error.isOperational).toBe(true);
  });
});
