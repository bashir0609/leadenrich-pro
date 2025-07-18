// backend/src/types/errors.ts
export enum ErrorCode {
  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Business Logic Errors
  INVALID_INPUT = 'INVALID_INPUT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  OPERATION_FAILED = 'OPERATION_FAILED',
  
  // Provider Errors (for future use)
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_RATE_LIMIT = 'PROVIDER_RATE_LIMIT',
  PROVIDER_QUOTA_EXCEEDED = 'PROVIDER_QUOTA_EXCEEDED'
}

export interface ErrorDetails {
  [key: string]: unknown;
}

export interface AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: ErrorDetails;
  isOperational: boolean;
}

export class CustomError extends Error implements AppError {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: ErrorDetails;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: ErrorDetails,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper functions for common errors
export const BadRequestError = (message: string, details?: ErrorDetails): CustomError =>
  new CustomError(ErrorCode.INVALID_INPUT, message, 400, details);

export const NotFoundError = (message: string, details?: ErrorDetails): CustomError =>
  new CustomError(ErrorCode.NOT_FOUND, message, 404, details);

export const UnauthorizedError = (message: string, details?: ErrorDetails): CustomError =>
  new CustomError(ErrorCode.AUTHENTICATION_ERROR, message, 401, details);

export const ForbiddenError = (message: string, details?: ErrorDetails): CustomError =>
  new CustomError(ErrorCode.AUTHORIZATION_ERROR, message, 403, details);

export const InternalServerError = (message: string, details?: ErrorDetails): CustomError =>
  new CustomError(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, details, false);