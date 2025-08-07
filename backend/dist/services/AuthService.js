"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const errors_1 = require("../types/errors");
const logger_1 = require("../utils/logger");
class AuthService {
    static async register(data) {
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new errors_1.CustomError(errors_1.ErrorCode.DUPLICATE_ENTRY, 'User with this email already exists', 409);
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(data.password, this.SALT_ROUNDS);
        // Create user
        const user = await prisma_1.default.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                company: data.company,
            },
        });
        // Generate token
        const token = this.generateToken(user);
        logger_1.logger.info(`New user registered: ${user.email}`);
        return {
            user: this.sanitizeUser(user),
            token,
        };
    }
    static async login(credentials) {
        // Find user
        const user = await prisma_1.default.user.findUnique({
            where: { email: credentials.email },
        });
        if (!user) {
            throw new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'Invalid email or password', 401);
        }
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(credentials.password, user.password);
        if (!isValidPassword) {
            throw new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'Invalid email or password', 401);
        }
        // Update last login
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        // Generate token
        const token = this.generateToken(user);
        logger_1.logger.info(`User logged in: ${user.email}`);
        return {
            user: this.sanitizeUser(user),
            token,
        };
    }
    static async verifyToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
            return payload;
        }
        catch (error) {
            throw new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'Invalid or expired token', 401);
        }
    }
    static async refreshToken(oldToken) {
        const payload = await this.verifyToken(oldToken);
        const user = await prisma_1.default.user.findUnique({
            where: { id: payload.userId },
        });
        if (!user) {
            throw new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'User not found', 401);
        }
        return this.generateToken(user);
    }
    static async generateApiKey(userId) {
        const apiKey = this.generateSecureKey();
        const hashedKey = await bcryptjs_1.default.hash(apiKey, this.SALT_ROUNDS);
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { apiKeyHash: hashedKey },
        });
        return apiKey;
    }
    static async validateApiKey(apiKey) {
        const users = await prisma_1.default.user.findMany({
            where: { apiKeyHash: { not: null } },
        });
        for (const user of users) {
            const isValid = await bcryptjs_1.default.compare(apiKey, user.apiKeyHash);
            if (isValid) {
                return {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                };
            }
        }
        throw new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'Invalid API key', 401);
    }
    static generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRES_IN,
        });
    }
    static generateSecureKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = '';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }
    static sanitizeUser(user) {
        const { password, apiKeyHash, ...sanitized } = user;
        return sanitized;
    }
}
exports.AuthService = AuthService;
AuthService.JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
AuthService.JWT_EXPIRES_IN = '7d';
AuthService.SALT_ROUNDS = 10;
//# sourceMappingURL=AuthService.js.map