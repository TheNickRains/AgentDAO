import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { 
  generateToken, 
  verifyToken, 
  checkRole, 
  verifyWalletOwnership, 
  validateApiKey 
} from '../../src/middleware/authMiddleware';

// Mock the user service
jest.mock('../../src/services/user/userService', () => ({
  getUserByWallet: jest.fn().mockImplementation((walletAddress) => {
    if (walletAddress === 'valid-wallet') {
      return Promise.resolve({ id: 'user-123', wallet_address: 'valid-wallet' });
    }
    return Promise.resolve(null);
  }),
}));

// Define a type for our tests that matches the structure expected by the middleware
type MockRequest = Request & {
  user?: {
    userId: string;
    walletAddress: string;
    role: string;
    iat?: number;
    exp?: number;
  };
};

describe('Authentication Middleware', () => {
  let mockRequest: Partial<MockRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken('user-123', 'wallet-address', 'user');
      expect(token).toBeDefined();
      
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      expect(decoded.userId).toBe('user-123');
      expect(decoded.walletAddress).toBe('wallet-address');
      expect(decoded.role).toBe('user');
    });

    it('should use default role if not provided', () => {
      const token = generateToken('user-123', 'wallet-address');
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      expect(decoded.role).toBe('user');
    });
  });

  describe('verifyToken', () => {
    it('should pass for valid token', () => {
      const token = generateToken('user-123', 'wallet-address', 'user');
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe('user-123');
    });

    it('should return 401 if no token is provided', () => {
      mockRequest.headers = {};
      
      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'No token provided' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };
      
      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('checkRole', () => {
    it('should pass if user has required role', () => {
      mockRequest.user = {
        userId: 'user-123',
        walletAddress: 'wallet-address',
        role: 'admin',
      };
      
      const middleware = checkRole(['admin', 'moderator']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', () => {
      mockRequest.user = undefined;
      
      const middleware = checkRole(['admin']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Authentication required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have required role', () => {
      mockRequest.user = {
        userId: 'user-123',
        walletAddress: 'wallet-address',
        role: 'user',
      };
      
      const middleware = checkRole(['admin']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Insufficient permissions' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('verifyWalletOwnership', () => {
    it('should pass if wallet address matches', () => {
      mockRequest.user = {
        userId: 'user-123',
        walletAddress: 'wallet-address',
        role: 'user',
      };
      mockRequest.body = { walletAddress: 'wallet-address' };
      
      verifyWalletOwnership(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should pass if wallet address matches (case insensitive)', () => {
      mockRequest.user = {
        userId: 'user-123',
        walletAddress: 'wallet-address',
        role: 'user',
      };
      mockRequest.body = { walletAddress: 'WALLET-ADDRESS' };
      
      verifyWalletOwnership(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should pass if no wallet address in request', () => {
      mockRequest.user = {
        userId: 'user-123',
        walletAddress: 'wallet-address',
        role: 'user',
      };
      mockRequest.body = {};
      
      verifyWalletOwnership(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', () => {
      mockRequest.user = undefined;
      mockRequest.body = { walletAddress: 'wallet-address' };
      
      verifyWalletOwnership(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Authentication required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if wallet address does not match', () => {
      mockRequest.user = {
        userId: 'user-123',
        walletAddress: 'wallet-address',
        role: 'user',
      };
      mockRequest.body = { walletAddress: 'different-wallet' };
      
      verifyWalletOwnership(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Wallet address mismatch' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('validateApiKey', () => {
    it('should pass if API key is valid', () => {
      mockRequest.headers = {
        'x-api-key': process.env.API_KEY,
      };
      
      validateApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 if API key is missing', () => {
      mockRequest.headers = {};
      
      validateApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Invalid API key' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if API key is invalid', () => {
      mockRequest.headers = {
        'x-api-key': 'invalid-api-key',
      };
      
      validateApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Invalid API key' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
}); 