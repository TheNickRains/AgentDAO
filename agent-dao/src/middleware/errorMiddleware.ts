import { Request, Response, NextFunction } from 'express';

/**
 * Custom API error class
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Async handler to catch errors in async routes
 * @param fn Async function to handle
 * @returns Express middleware
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Error handler middleware
 * @param err Error
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err);
  
  // Handle API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
    return;
  }
  
  // Handle other errors
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};

/**
 * Not found middleware - handles 404 errors
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
  next(error);
};

/**
 * Validation error middleware - handles validation errors
 */
export const validationErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Check if this is a validation error
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.details || err.message
    });
  }
  
  // Pass to the next error handler
  next(err);
}; 