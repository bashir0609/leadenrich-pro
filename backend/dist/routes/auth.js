"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.ts
const express_1 = require("express");
const zod_1 = require("zod");
const AuthService_1 = require("../services/AuthService");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Validation schemas
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    company: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// Register endpoint
router.post('/register', (0, validation_1.validate)(registerSchema), async (req, res, next) => {
    try {
        const result = await AuthService_1.AuthService.register(req.body);
        logger_1.logger.info(`User registered successfully: ${req.body.email}`);
        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: result.user,
                token: result.token,
            },
        });
    }
    catch (error) {
        return next(error);
    }
});
// Login endpoint
router.post('/login', (0, validation_1.validate)(loginSchema), async (req, res, next) => {
    try {
        const result = await AuthService_1.AuthService.login(req.body);
        logger_1.logger.info(`User logged in successfully: ${req.body.email}`);
        return res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: result.user,
                token: result.token,
            },
        });
    }
    catch (error) {
        return next(error);
    }
});
// Get current user
router.get('/me', auth_1.authenticate, async (req, res, next) => {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                name: true,
                company: true,
                role: true,
                createdAt: true,
                lastLogin: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        return res.json({
            success: true,
            data: { user },
        });
    }
    catch (error) {
        return next(error);
    }
});
// Refresh token
router.post('/refresh', async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required',
            });
        }
        const newToken = await AuthService_1.AuthService.refreshToken(token);
        return res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: { token: newToken },
        });
    }
    catch (error) {
        return next(error);
    }
});
// Generate API key
router.post('/api-key', auth_1.authenticate, async (req, res, next) => {
    try {
        const apiKey = await AuthService_1.AuthService.generateApiKey(req.user.userId);
        logger_1.logger.info(`API key generated for user: ${req.user.email}`);
        return res.json({
            success: true,
            message: 'API key generated successfully',
            data: { apiKey },
        });
    }
    catch (error) {
        return next(error);
    }
});
// Logout (optional - mainly for logging)
router.post('/logout', auth_1.authenticate, async (req, res, next) => {
    try {
        logger_1.logger.info(`User logged out: ${req.user.email}`);
        return res.json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map