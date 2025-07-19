"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.securityHeaders = exports.apiRateLimits = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
// Enhanced rate limiting
const createRateLimiter = (options) => {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs || 15 * 60 * 1000,
        max: options.max || 100,
        message: options.message || 'Too many requests',
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: options.message || 'Too many requests',
                    retryAfter: req.rateLimit?.resetTime,
                },
            });
        },
    });
};
exports.createRateLimiter = createRateLimiter;
// API-specific rate limits
exports.apiRateLimits = {
    auth: (0, exports.createRateLimiter)({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Too many authentication attempts',
    }),
    enrichment: (0, exports.createRateLimiter)({
        windowMs: 60 * 1000,
        max: 30,
        message: 'Too many enrichment requests',
    }),
    export: (0, exports.createRateLimiter)({
        windowMs: 5 * 60 * 1000,
        max: 10,
        message: 'Too many export requests',
    }),
};
// Security headers configuration
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
});
// Input sanitization
exports.sanitizeInput = (0, express_mongo_sanitize_1.default)({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Sanitized potentially malicious input in ${key}`);
    },
});
//# sourceMappingURL=security.js.map