import { Response } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (err: Error, res: Response) => {
  if (err instanceof AppError && err.isOperational) {
    // Operational, trusted error: send message to client
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Programming or other unknown error: don't leak error details
  console.error('ERROR 💥:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: any, res: Response, next: Function) => {
    fn(req, res, next).catch(next);
  };
};

export const errorTypes = {
  VALIDATION_ERROR: {
    message: 'Invalid input data',
    statusCode: 400,
  },
  AUTHENTICATION_ERROR: {
    message: 'Authentication failed',
    statusCode: 401,
  },
  AUTHORIZATION_ERROR: {
    message: 'Not authorized to perform this action',
    statusCode: 403,
  },
  NOT_FOUND_ERROR: {
    message: 'Resource not found',
    statusCode: 404,
  },
  CONFLICT_ERROR: {
    message: 'Resource conflict',
    statusCode: 409,
  },
  NETWORK_ERROR: {
    message: 'Network error occurred',
    statusCode: 503,
  },
  DATABASE_ERROR: {
    message: 'Database error occurred',
    statusCode: 500,
  },
  BLOCKCHAIN_ERROR: {
    message: 'Blockchain interaction failed',
    statusCode: 500,
  },
  AI_SERVICE_ERROR: {
    message: 'AI service error occurred',
    statusCode: 500,
  },
  EMAIL_SERVICE_ERROR: {
    message: 'Email service error occurred',
    statusCode: 500,
  },
}; 