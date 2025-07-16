import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { CustomError, ErrorCode } from '@/types/errors';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  company?: string;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
  private static readonly JWT_EXPIRES_IN = '7d';
  private static readonly SALT_ROUNDS = 10;

  static async register(data: RegisterData): Promise<{ user: any; token: string }> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new CustomError(
        ErrorCode.DUPLICATE_ENTRY,
        'User with this email already exists',
        409
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        company: data.company,
      },
    });

    // Generate token
    const token = this.generateToken(user);

    logger.info(`New user registered: ${user.email}`);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  static async login(credentials: LoginCredentials): Promise<{ user: any; token: string }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user) {
      throw new CustomError(
        ErrorCode.AUTHENTICATION_ERROR,
        'Invalid email or password',
        401
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.password);

    if (!isValidPassword) {
      throw new CustomError(
        ErrorCode.AUTHENTICATION_ERROR,
        'Invalid email or password',
        401
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate token
    const token = this.generateToken(user);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  static async verifyToken(token: string): Promise<AuthTokenPayload> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as AuthTokenPayload;
      return payload;
    } catch (error) {
      throw new CustomError(
        ErrorCode.AUTHENTICATION_ERROR,
        'Invalid or expired token',
        401
      );
    }
  }

  static async refreshToken(oldToken: string): Promise<string> {
    const payload = await this.verifyToken(oldToken);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new CustomError(
        ErrorCode.AUTHENTICATION_ERROR,
        'User not found',
        401
      );
    }

    return this.generateToken(user);
  }

  static async generateApiKey(userId: string): Promise<string> {
    const apiKey = this.generateSecureKey();
    const hashedKey = await bcrypt.hash(apiKey, this.SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { apiKeyHash: hashedKey },
    });

    return apiKey;
  }

  static async validateApiKey(apiKey: string): Promise<AuthTokenPayload> {
    const users = await prisma.user.findMany({
      where: { apiKeyHash: { not: null } },
    });

    for (const user of users) {
      const isValid = await bcrypt.compare(apiKey, user.apiKeyHash!);
      if (isValid) {
        return {
          userId: user.id,
          email: user.email,
          role: user.role,
        };
      }
    }

    throw new CustomError(
      ErrorCode.AUTHENTICATION_ERROR,
      'Invalid API key',
      401
    );
  }

  private static generateToken(user: any): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  private static generateSecureKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  private static sanitizeUser(user: any): any {
    const { password, apiKeyHash, ...sanitized } = user;
    return sanitized;
  }
}