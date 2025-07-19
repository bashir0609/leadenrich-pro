"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const AuthService_1 = require("@/services/AuthService");
const errors_1 = require("@/types/errors");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'No authorization header', 401);
        }
        // The payload from the AuthService will contain userId, email, and role
        let payload;
        if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            payload = await AuthService_1.AuthService.verifyToken(token);
        }
        else if (authHeader.startsWith('ApiKey ')) {
            const apiKey = authHeader.slice(7);
            payload = await AuthService_1.AuthService.validateApiKey(apiKey);
        }
        else {
            throw new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'Invalid authorization format', 401);
        }
        req.user = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            next(new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'User not authenticated', 401));
            return;
        }
        if (!roles.includes(req.user.role)) {
            next(new errors_1.CustomError(errors_1.ErrorCode.AUTHORIZATION_ERROR, 'Insufficient permissions', 403));
            return;
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map