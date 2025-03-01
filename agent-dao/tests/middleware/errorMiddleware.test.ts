import { Request, Response, NextFunction } from 'express';
import { 
  errorHandler, 
  asyncHandler, 
  ApiError 
} from '../../src/middleware/errorMiddleware';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
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

  describe('ApiError', () => {
    it('should create an error with status code and message', () => {
      const error = new ApiError(404, 'Not found');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not found');
    });
    
    it('should use default status code if not provided', () => {
      // @ts-ignore - Testing default parameter behavior
      const error = new ApiError(null, 'Server error');
      
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Server error');
    });
  });

  describe('errorHandler', () => {
    it('should handle ApiError instances', () => {
      const error = new ApiError(400, 'Bad request');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad request'
      });
    });
    
    it('should handle regular Error instances', () => {
      const error = new Error('Something went wrong');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Something went wrong'
      });
    });
    
    it('should handle non-error objects', () => {
      const error = { message: 'Custom error object' };
      
      errorHandler(error as any, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Custom error object'
      });
    });
    
    it('should handle errors without messages', () => {
      const error = {};
      
      errorHandler(error as any, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'An unknown error occurred'
      });
    });
  });

  describe('asyncHandler', () => {
    it('should pass through to the handler if no error occurs', async () => {
      const mockHandler = jest.fn().mockResolvedValue('success');
      const wrappedHandler = asyncHandler(mockHandler);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockHandler).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });
    
    it('should catch errors and pass them to next', async () => {
      const error = new Error('Async error');
      const mockHandler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = asyncHandler(mockHandler);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockHandler).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalledWith(error);
    });
    
    it('should handle ApiError instances correctly', async () => {
      const error = new ApiError(403, 'Forbidden');
      const mockHandler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = asyncHandler(mockHandler);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockHandler).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });
}); 