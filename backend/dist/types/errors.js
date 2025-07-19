"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.BadRequestError = exports.CustomError = exports.ErrorCode = void 0;
// backend/src/types/errors.ts
var ErrorCode;
(function (ErrorCode) {
    // System Errors
    ErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    ErrorCode["AUTHORIZATION_ERROR"] = "AUTHORIZATION_ERROR";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    // Business Logic Errors
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["DUPLICATE_ENTRY"] = "DUPLICATE_ENTRY";
    ErrorCode["OPERATION_FAILED"] = "OPERATION_FAILED";
    // Provider Errors (for future use)
    ErrorCode["PROVIDER_ERROR"] = "PROVIDER_ERROR";
    ErrorCode["PROVIDER_NOT_FOUND"] = "PROVIDER_NOT_FOUND";
    ErrorCode["PROVIDER_RATE_LIMIT"] = "PROVIDER_RATE_LIMIT";
    ErrorCode["PROVIDER_QUOTA_EXCEEDED"] = "PROVIDER_QUOTA_EXCEEDED";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class CustomError extends Error {
    constructor(code, message, statusCode = 500, details, isOperational = true) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = isOperational;
        // Maintains proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
// Helper functions for common errors
const BadRequestError = (message, details) => new CustomError(ErrorCode.INVALID_INPUT, message, 400, details);
exports.BadRequestError = BadRequestError;
const NotFoundError = (message, details) => new CustomError(ErrorCode.NOT_FOUND, message, 404, details);
exports.NotFoundError = NotFoundError;
const UnauthorizedError = (message, details) => new CustomError(ErrorCode.AUTHENTICATION_ERROR, message, 401, details);
exports.UnauthorizedError = UnauthorizedError;
const ForbiddenError = (message, details) => new CustomError(ErrorCode.AUTHORIZATION_ERROR, message, 403, details);
exports.ForbiddenError = ForbiddenError;
const InternalServerError = (message, details) => new CustomError(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, details, false);
exports.InternalServerError = InternalServerError;
//# sourceMappingURL=errors.js.map