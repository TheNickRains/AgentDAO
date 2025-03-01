import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getUserByWallet } from '../services/user/userService';
import { ApiError } from './errorMiddleware';

// Environment variables should be properly set in production
const JWT_SECRET = process.env.JWT_SECRET || 'agent-dao-development-secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

// Interface for decoded JWT token
interface DecodedToken {
  userId: string;
  walletAddress: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Generate a JWT token for a user
 * @param userId User ID
 * @param walletAddress User's wallet address
 * @param role User's role (default: 'user')
 * @returns JWT token
 */
export const generateToken = (
  userId: string,
  walletAddress: string,
  role: string = 'user'
): string => {
  // @ts-ignore - Ignoring type issues with jwt.sign
  return jwt.sign(
    { userId, walletAddress, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

/**
 * Middleware to verify JWT token
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export const verifyToken = (
  req: Request & { user?: DecodedToken },
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError(401, 'No token provided');
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    
    // Attach user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to check if user has required role
 * @param roles Array of allowed roles
 * @returns Middleware function
 */
export const checkRole = (roles: string[]) => {
  return (
    req: Request & { user?: DecodedToken },
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

/**
 * Middleware to verify wallet ownership
 * Ensures the wallet address in the request matches the one in the token
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export const verifyWalletOwnership = (
  req: Request & { user?: DecodedToken },
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get wallet address from request (either from body, query, or params)
    const requestWallet = 
      req.body.walletAddress || 
      req.query.walletAddress as string || 
      req.params.walletAddress;

    if (!requestWallet) {
      next(); // No wallet in request, skip verification
      return;
    }

    // Check if wallet in request matches wallet in token
    if (requestWallet.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      res.status(403).json({ success: false, error: 'Wallet address mismatch' });
      return;
    }

    next();
  } catch (error) {
    console.error('Wallet verification failed:', error);
    res.status(500).json({ success: false, error: 'Wallet verification failed' });
  }
};

/**
 * Middleware to validate API key for service-to-service communication
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.API_KEY;

    if (!apiKey || apiKey !== validApiKey) {
      res.status(401).json({ success: false, error: 'Invalid API key' });
      return;
    }

    next();
  } catch (error) {
    console.error('API key validation failed:', error);
    res.status(500).json({ success: false, error: 'API key validation failed' });
  }
}; 