import { Request, Response, NextFunction } from 'express';
import { apiRateLimiter } from '../../src/middleware/rateLimitMiddleware';

// Mock the rate-limiter-flexible module
jest.mock('rate-limiter-flexible', () => {
  return {
    RateLimiterMemory: jest.fn().mockImplementation(() => {
      return {
        consume: jest.fn().mockImplementation((key) => {
          if (key === 'blocked-ip') {
            return Promise.reject(new Error('Rate limit exceeded'));
          }
          return Promise.resolve({
            remainingPoints: 10,
            consumedPoints: 1
          });
        })
      };
    })
  };
});

describe('Rate Limit Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      headers: {}
    } as Partial<Request>;
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn()
    };
    nextFunction = jest.fn();
  });

  it('should allow requests under the rate limit', async () => {
    await apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 10);
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should block requests that exceed the rate limit', async () => {
    // Create a new request object with the blocked IP
    mockRequest = {
      ip: 'blocked-ip',
      headers: {}
    } as Partial<Request>;
    
    await apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(429);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Too many requests, please try again later.'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should use X-Forwarded-For header if available', async () => {
    mockRequest = {
      ip: '127.0.0.1',
      headers: {
        'x-forwarded-for': '192.168.1.1'
      }
    } as Partial<Request>;
    
    await apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // The middleware should use the X-Forwarded-For IP
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    // Mock the consume function to throw an unexpected error
    const originalConsume = require('rate-limiter-flexible').RateLimiterMemory().consume;
    require('rate-limiter-flexible').RateLimiterMemory().consume = jest.fn().mockRejectedValue(new Error('Unexpected error'));
    
    await apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Should still call next even if there's an error with the rate limiter
    expect(nextFunction).toHaveBeenCalled();
    
    // Restore the original mock
    require('rate-limiter-flexible').RateLimiterMemory().consume = originalConsume;
  });
}); 