"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errors_1 = require("../types/errors");
const errorHandler = (err, req, res, _next // Renamed to _next to indicate it's not used
) => {
    // Log error
    logger_1.logger.error({
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        ...(err instanceof errors_1.CustomError && { code: err.code, details: err.details }),
    });
    // Handle known errors
    if (err instanceof errors_1.CustomError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(process.env.NODE_ENV === 'development' ? { details: err.details } : {}),
            },
        });
        return;
    }
    // Handle unknown errors
    res.status(500).json({
        success: false,
        error: {
            code: errors_1.ErrorCode.INTERNAL_SERVER_ERROR,
            message: 'An unexpected error occurred',
            ...(process.env.NODE_ENV === 'development' ? {
                originalError: err.message,
                stack: err.stack
            } : {}),
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map