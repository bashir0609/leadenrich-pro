// src/routes/auth.ts
import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/AuthService';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  company: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Register endpoint
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);

    logger.info(`User registered successfully: ${req.body.email}`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Login endpoint
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body);

    logger.info(`User logged in successfully: ${req.body.email}`);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
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
  } catch (error) {
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

    const newToken = await AuthService.refreshToken(token);

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token: newToken },
    });
  } catch (error) {
    return next(error);
  }
});

// Generate API key
router.post('/api-key', authenticate, async (req, res, next) => {
  try {
    const apiKey = await AuthService.generateApiKey(req.user!.userId);

    logger.info(`API key generated for user: ${req.user!.email}`);

    return res.json({
      success: true,
      message: 'API key generated successfully',
      data: { apiKey },
    });
  } catch (error) {
    return next(error);
  }
});

// Logout (optional - mainly for logging)
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    logger.info(`User logged out: ${req.user!.email}`);

    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return next(error);
  }
});

export default router;