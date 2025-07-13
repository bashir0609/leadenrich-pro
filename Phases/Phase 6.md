# Phase 6: Production Deployment & Optimization

## 📋 Prerequisites
- ✅ Phase 5 completed successfully
- ✅ All features working locally
- ✅ Multiple providers integrated
- ✅ Export functionality operational
- ✅ All tests passing

## 🎯 Phase 6 Goals
1. Implement authentication & authorization
2. Add security hardening
3. Set up monitoring and logging
4. Optimize performance
5. Configure production deployment
6. Create CI/CD pipeline

---

## 🔐 Step 6.1: Authentication System

Create `backend/src/services/AuthService.ts`:
```typescript
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
```

Create `backend/src/middleware/auth.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService';
import { CustomError, ErrorCode } from '@/types/errors';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new CustomError(
        ErrorCode.AUTHENTICATION_ERROR,
        'No authorization header',
        401
      );
    }

    let payload;

    if (authHeader.startsWith('Bearer ')) {
      // JWT authentication
      const token = authHeader.slice(7);
      payload = await AuthService.verifyToken(token);
    } else if (authHeader.startsWith('ApiKey ')) {
      // API key authentication
      const apiKey = authHeader.slice(7);
      payload = await AuthService.validateApiKey(apiKey);
    } else {
      throw new CustomError(
        ErrorCode.AUTHENTICATION_ERROR,
        'Invalid authorization format',
        401
      );
    }

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(
        new CustomError(
          ErrorCode.AUTHENTICATION_ERROR,
          'User not authenticated',
          401
        )
      );
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new CustomError(
          ErrorCode.AUTHORIZATION_ERROR,
          'Insufficient permissions',
          403
        )
      );
      return;
    }

    next();
  };
};
```

## 🛡️ Step 6.2: Security Hardening

Create `backend/src/middleware/security.ts`:
```typescript
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { Request, Response } from 'express';

// Enhanced rate limiting
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100,
    message: options.message || 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
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

// API-specific rate limits
export const apiRateLimits = {
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts',
  }),
  enrichment: createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many enrichment requests',
  }),
  export: createRateLimiter({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: 'Too many export requests',
  }),
};

// Security headers configuration
export const securityHeaders = helmet({
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
export const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized potentially malicious input in ${key}`);
  },
});
```

## 📊 Step 6.3: Monitoring & Metrics

Create `backend/src/services/MetricsService.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import * as prometheus from 'prom-client';

const prisma = new PrismaClient();

// Initialize Prometheus metrics
const register = new prometheus.Registry();

// Default metrics
prometheus.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const enrichmentCounter = new prometheus.Counter({
  name: 'enrichment_operations_total',
  help: 'Total number of enrichment operations',
  labelNames: ['provider', 'operation', 'status'],
});

const activeJobsGauge = new prometheus.Gauge({
  name: 'active_jobs_count',
  help: 'Number of active enrichment jobs',
});

const creditUsageCounter = new prometheus.Counter({
  name: 'credits_used_total',
  help: 'Total credits consumed',
  labelNames: ['provider', 'operation'],
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(enrichmentCounter);
register.registerMetric(activeJobsGauge);
register.registerMetric(creditUsageCounter);

export class MetricsService {
  static recordHttpRequest(
    method: string,
    route: string,
    status: number,
    duration: number
  ): void {
    httpRequestDuration.labels(method, route, String(status)).observe(duration);
  }

  static recordEnrichment(
    provider: string,
    operation: string,
    success: boolean,
    credits: number
  ): void {
    enrichmentCounter
      .labels(provider, operation, success ? 'success' : 'failure')
      .inc();
    
    if (success && credits > 0) {
      creditUsageCounter.labels(provider, operation).inc(credits);
    }
  }

  static async updateActiveJobs(): Promise<void> {
    const activeJobs = await prisma.enrichmentJob.count({
      where: {
        status: {
          in: ['queued', 'processing'],
        },
      },
    });
    
    activeJobsGauge.set(activeJobs);
  }

  static async getMetrics(): Promise<string> {
    return register.metrics();
  }

  static async getHealthMetrics(): Promise<any> {
    const [jobStats, providerStats] = await Promise.all([
      this.getJobStatistics(),
      this.getProviderStatistics(),
    ]);

    return {
      jobs: jobStats,
      providers: providerStats,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };
  }

  private static async getJobStatistics(): Promise<any> {
    const stats = await prisma.enrichmentJob.groupBy({
      by: ['status'],
      _count: true,
    });

    return stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<string, number>);
  }

  private static async getProviderStatistics(): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usage = await prisma.apiUsage.groupBy({
      by: ['providerId'],
      where: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        creditsUsed: true,
        requestsCount: true,
      },
    });

    return usage;
  }
}
```

Create monitoring middleware:
```typescript
// backend/src/middleware/monitoring.ts
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '@/services/MetricsService';

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;
    
    MetricsService.recordHttpRequest(
      req.method,
      route,
      res.statusCode,
      duration
    );
  });

  next();
};
```

## 🚀 Step 6.4: Performance Optimization

Create `backend/src/services/CacheService.ts`:
```typescript
import Redis from 'ioredis';
import { logger } from '@/utils/logger';

export class CacheService {
  private static redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  private static DEFAULT_TTL = 3600; // 1 hour

  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  static async set(
    key: string,
    value: any,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  static async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }

  // Provider response caching
  static getCacheKey(
    provider: string,
    operation: string,
    params: any
  ): string {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    const hash = Buffer.from(paramString).toString('base64');
    return `provider:${provider}:${operation}:${hash}`;
  }

  static async cacheProviderResponse(
    provider: string,
    operation: string,
    params: any,
    response: any,
    ttl: number = 3600
  ): Promise<void> {
    const key = this.getCacheKey(provider, operation, params);
    await this.set(key, response, ttl);
  }

  static async getCachedProviderResponse(
    provider: string,
    operation: string,
    params: any
  ): Promise<any | null> {
    const key = this.getCacheKey(provider, operation, params);
    return this.get(key);
  }
}
```

## 🐳 Step 6.5: Production Dockerfile

Create `backend/Dockerfile.production`:
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production
RUN npm install -g typescript
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

RUN apk add --no-cache tini

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Create directories
RUN mkdir -p logs uploads exports temp && \
    chown -R nodejs:nodejs logs uploads exports temp

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "dist/app.js"]
```

## 🔧 Step 6.6: Environment Configuration

Create `backend/.env.production.example`:
```env
# Application
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://username:password@db-host:5432/leadenrich_prod
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://:password@redis-host:6379
REDIS_TLS=true

# Security
JWT_SECRET=your-production-jwt-secret-minimum-32-chars
ENCRYPTION_KEY=your-production-encryption-key-32chars!!
SESSION_SECRET=your-production-session-secret
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=https://app.leadenrichpro.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=104857600
UPLOAD_DIR=/app/uploads
TEMP_DIR=/app/temp

# Logging
LOG_LEVEL=info
LOG_DIR=/app/logs

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-new-relic-key

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@leadenrichpro.com

# Provider API Keys (encrypted)
SURFE_API_KEY=encrypted-key
APOLLO_API_KEY=encrypted-key
BETTERENRICH_API_KEY=encrypted-key

# External Services
WEBHOOK_TIMEOUT=30000
WEBHOOK_RETRY_ATTEMPTS=3
```

## 📦 Step 6.7: CI/CD Pipeline

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Run linting
        working-directory: ./backend
        run: npm run lint
      
      - name: Run type checking
        working-directory: ./backend
        run: npm run typecheck
      
      - name: Setup test database
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        run: |
          npx prisma migrate deploy
          npx prisma generate
      
      - name: Run tests
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          file: ./backend/Dockerfile.production
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add your deployment steps here
          # e.g., SSH to server, pull image, restart service
          # or trigger deployment on your cloud provider
```

## 🖥️ Step 6.8: Production Monitoring

Create `backend/src/routes/monitoring.ts`:
```typescript
import { Router } from 'express';
import { MetricsService } from '@/services/MetricsService';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// Prometheus metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await MetricsService.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error collecting metrics');
  }
});

// Application health metrics (authenticated)
router.get(
  '/health-metrics',
  authenticate,
  authorize(['admin']),
  async (req, res, next) => {
    try {
      const metrics = await MetricsService.getHealthMetrics();
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as monitoringRouter };
```

## 🚢 Step 6.9: Deployment Scripts

Create `scripts/deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Load environment
source .env.production

# Pull latest code
echo "📦 Pulling latest code..."
git pull origin main

# Backend deployment
echo "🔧 Deploying backend..."
cd backend

# Install dependencies
npm ci --only=production

# Run migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Build application
echo "🏗️ Building application..."
npm run build

# Restart services
echo "🔄 Restarting services..."
pm2 restart ecosystem.config.js

# Frontend deployment
echo "🎨 Deploying frontend..."
cd ../frontend

# Install and build
npm ci
npm run build

# Deploy to CDN or static hosting
# rsync -avz --delete dist/ user@server:/var/www/leadenrich/

echo "✅ Deployment complete!"

# Health check
echo "🏥 Running health check..."
sleep 10
curl -f http://localhost:3001/health || exit 1

echo "🎉 Deployment successful!"
```

Create `backend/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'leadenrich-api',
    script: 'dist/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 10000,
    kill_timeout: 5000,
    wait_ready: true,
    node_args: '--max-old-space-size=1024'
  }, {
    name: 'leadenrich-worker',
    script: 'dist/workers/enrichmentWorker.js',
    instances: 2,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/worker-err.log',
    out_file: './logs/worker-out.log',
    autorestart: true,
    max_restarts: 10
  }]
};