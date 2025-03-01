import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../config/constants';

// Configure rate limiters for different endpoints
const createRateLimiter = (points: number, duration: number) => {
  const rateLimiter = new RateLimiterMemory({
    points,
    duration
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get IP address and ensure it's a string
      const ipHeader = req.headers['x-forwarded-for'];
      const ip = (req.ip || (typeof ipHeader === 'string' ? ipHeader : ipHeader?.[0] || '')).toString();
      
      await rateLimiter.consume(ip);
      next();
    } catch (error) {
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later'
      });
    }
  };
};

/**
 * Rate limiter for authentication endpoints
 * Limits requests to 10 per 15 minutes
 */
export const authRateLimiter = createRateLimiter(10, 15 * 60);

/**
 * Rate limiter for nonce generation
 * Limits requests to 5 per 5 minutes
 */
export const nonceRateLimiter = createRateLimiter(5, 5 * 60);

/**
 * Rate limiter for API endpoints
 * Limits requests to 60 per minute
 */
export const apiRateLimiter = createRateLimiter(60, 60);

/**
 * Rate limiter for email webhook endpoints
 * Limits requests to 10 per minute
 */
export const emailWebhookRateLimiter = createRateLimiter(10, 60); 