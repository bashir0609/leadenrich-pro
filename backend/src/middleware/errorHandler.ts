import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { CustomError, ErrorCode } from '../types/errors';

export const errorHandler = (
  err: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    ...(err instanceof CustomError && { code: err.code, details: err.details }),
  });

  // Handle known errors
  if (err instanceof CustomError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { details: err.details }),
      },
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { 
        originalError: err.message,
        stack: err.stack 
      }),
    },
  });
};