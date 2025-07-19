export declare enum ErrorCode {
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
    NOT_FOUND = "NOT_FOUND",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INVALID_INPUT = "INVALID_INPUT",
    DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
    OPERATION_FAILED = "OPERATION_FAILED",
    PROVIDER_ERROR = "PROVIDER_ERROR",
    PROVIDER_NOT_FOUND = "PROVIDER_NOT_FOUND",
    PROVIDER_RATE_LIMIT = "PROVIDER_RATE_LIMIT",
    PROVIDER_QUOTA_EXCEEDED = "PROVIDER_QUOTA_EXCEEDED"
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
export declare class CustomError extends Error implements AppError {
    readonly code: ErrorCode;
    readonly statusCode: number;
    readonly details?: ErrorDetails;
    readonly isOperational: boolean;
    constructor(code: ErrorCode, message: string, statusCode?: number, details?: ErrorDetails, isOperational?: boolean);
}
export declare const BadRequestError: (message: string, details?: ErrorDetails) => CustomError;
export declare const NotFoundError: (message: string, details?: ErrorDetails) => CustomError;
export declare const UnauthorizedError: (message: string, details?: ErrorDetails) => CustomError;
export declare const ForbiddenError: (message: string, details?: ErrorDetails) => CustomError;
export declare const InternalServerError: (message: string, details?: ErrorDetails) => CustomError;
