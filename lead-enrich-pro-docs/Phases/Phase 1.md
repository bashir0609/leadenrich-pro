# Phase 1: Core Backend Foundation

## 📋 Prerequisites
- ✅ Phase 0 completed successfully
- ✅ Docker services running (postgres, redis)
- ✅ TypeScript compiling without errors

## 🎯 Phase 1 Goals
1. Create Express server with security middleware
2. Set up structured logging system
3. Implement error handling framework
4. Create health check endpoints
5. Set up Prisma with database schema
6. Implement basic validation system

---

## 📝 Step 1.1: Core Server Setup

Create `backend/src/app.ts`:
```typescript
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { healthRouter } from './routes/health';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Routes
app.use('/health', healthRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
```

## 🔧 Step 1.2: Logger Setup

Create `backend/src/utils/logger.ts`:
```typescript
import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure log directory exists
const logDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'leadenrich-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
});

// Create a stream object for Morgan middleware
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
```

## 🛡️ Step 1.3: Error Handling System

Create `backend/src/types/errors.ts`:
```typescript
export enum ErrorCode {
  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Business Logic Errors
  INVALID_INPUT = 'INVALID_INPUT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  OPERATION_FAILED = 'OPERATION_FAILED',
  
  // Provider Errors (for future use)
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_RATE_LIMIT = 'PROVIDER_RATE_LIMIT',
}

export interface AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: any;
  isOperational: boolean;
}

export class CustomError extends Error implements AppError {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper functions for common errors
export const BadRequestError = (message: string, details?: any) =>
  new CustomError(ErrorCode.INVALID_INPUT, message, 400, details);

export const NotFoundError = (message: string, details?: any) =>
  new CustomError(ErrorCode.NOT_FOUND, message, 404, details);

export const UnauthorizedError = (message: string, details?: any) =>
  new CustomError(ErrorCode.AUTHENTICATION_ERROR, message, 401, details);

export const ForbiddenError = (message: string, details?: any) =>
  new CustomError(ErrorCode.AUTHORIZATION_ERROR, message, 403, details);

export const InternalServerError = (message: string, details?: any) =>
  new CustomError(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, details, false);
```

Create `backend/src/middleware/errorHandler.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { CustomError, ErrorCode } from '../types/errors';

export const errorHandler = (
  err: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    ...(err instanceof CustomError && { code: err.code, details: err.details }),
  });

  // Handle known errors
  if (err instanceof CustomError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { details: err.details }),
      },
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { 
        originalError: err.message,
        stack: err.stack 
      }),
    },
  });
};
```

Create `backend/src/middleware/notFoundHandler.ts`:
```typescript
import { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
    },
  });
};
```

## 🏥 Step 1.4: Health Check System

Create `backend/src/routes/health.ts`:
```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
  };
}

interface ServiceHealth {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check database
    const dbHealth = await checkDatabase();
    
    // Check Redis (placeholder for now)
    const redisHealth: ServiceHealth = {
      status: 'up',
      responseTime: 1,
    };

    const health: HealthStatus = {
      status: determineOverallHealth(dbHealth, redisHealth),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

async function checkDatabase(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'up',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function determineOverallHealth(
  db: ServiceHealth,
  redis: ServiceHealth
): 'healthy' | 'degraded' | 'unhealthy' {
  if (db.status === 'down') return 'unhealthy';
  if (redis.status === 'down') return 'degraded';
  return 'healthy';
}

export { router as healthRouter };
```

## 🗄️ Step 1.5: Database Setup with Prisma

Install Prisma:
```bash
cd backend
npm install --save-exact prisma@5.1.1 @prisma/client@5.1.1
```

Initialize Prisma:
```bash
npx prisma init
```

Create complete `backend/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Core Provider Management
model Provider {
  id              Int       @id @default(autoincrement())
  name            String    @unique @db.VarChar(50)
  displayName     String    @db.VarChar(100)
  category        String    @db.VarChar(50)
  apiKeyEncrypted String?   @db.Text
  baseUrl         String    @db.VarChar(255)
  rateLimit       Int       @default(10)
  dailyQuota      Int       @default(2000)
  isActive        Boolean   @default(true)
  configuration   Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  features     ProviderFeature[]
  apiUsage     ApiUsage[]
  enrichmentJobs EnrichmentJob[]

  @@map("providers")
  @@index([category])
  @@index([isActive])
}

// Provider Features
model ProviderFeature {
  id                Int      @id @default(autoincrement())
  providerId        Int
  featureId         String   @db.VarChar(100)
  featureName       String   @db.VarChar(200)
  category          String   @db.VarChar(50)
  endpoint          String   @db.VarChar(500)
  httpMethod        String   @default("POST") @db.VarChar(10)
  creditsPerRequest Int      @default(1)
  isActive          Boolean  @default(true)
  parameters        Json?
  description       String?  @db.Text
  createdAt         DateTime @default(now())

  // Relations
  provider Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@unique([providerId, featureId])
  @@map("provider_features")
  @@index([providerId])
  @@index([category])
}

// Enrichment Jobs
model EnrichmentJob {
  id                String    @id @default(cuid())
  providerId        Int?
  jobType           String    @db.VarChar(50)
  status            String    @default("pending") @db.VarChar(20)
  totalRecords      Int       @default(0)
  processedRecords  Int       @default(0)
  successfulRecords Int       @default(0)
  failedRecords     Int       @default(0)
  inputData         Json?
  configuration     Json?
  creditsUsed       Int       @default(0)
  errorDetails      Json?
  startedAt         DateTime?
  completedAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  provider Provider? @relation(fields: [providerId], references: [id])
  logs     JobLog[]

  @@map("enrichment_jobs")
  @@index([status])
  @@index([createdAt])
}

// Job Logs
model JobLog {
  id        Int      @id @default(autoincrement())
  jobId     String
  level     String   @db.VarChar(10)
  message   String   @db.Text
  details   Json?
  timestamp DateTime @default(now())

  // Relations
  job EnrichmentJob @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@map("job_logs")
  @@index([jobId, timestamp])
}

// API Usage Tracking
model ApiUsage {
  id            Int      @id @default(autoincrement())
  providerId    Int
  endpoint      String   @db.VarChar(200)
  method        String   @db.VarChar(10)
  statusCode    Int
  creditsUsed   Int      @default(0)
  responseTime  Int      // milliseconds
  timestamp     DateTime @default(now())

  // Relations
  provider Provider @relation(fields: [providerId], references: [id])

  @@map("api_usage")
  @@index([providerId, timestamp])
  @@index([timestamp])
}

// System Configuration
model SystemConfig {
  id        Int      @id @default(autoincrement())
  key       String   @unique @db.VarChar(100)
  value     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("system_config")
}
```

Run Prisma migration:
```bash
npx prisma migrate dev --name initial-schema
```

## ✅ Step 1.6: Validation System

Install validation dependencies:
```bash
npm install --save-exact zod@3.21.4
```

Create `backend/src/utils/validation.ts`:
```typescript
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../types/errors';

// Common validation schemas
export const schemas = {
  id: z.string().cuid(),
  email: z.string().email(),
  url: z.string().url(),
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
};

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(BadRequestError('Validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
};

// Query validation middleware
export const validateQuery = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(BadRequestError('Query validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
};
```

## 🧪 Step 1.7: Create First Tests

Create `backend/tests/health.test.ts`:
```typescript
import request from 'supertest';
import app from '../src/app';

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('redis');
    });
  });
});
```

## 🚀 Step 1.8: Run and Verify

1. **Start the server**:
```bash
npm run dev
```

2. **In a new terminal, test endpoints**:
```bash
# Basic health check
curl http://localhost:3001/health

# Detailed health check
curl http://localhost:3001/health/detailed

# Test 404 handling
curl http://localhost:3001/api/nonexistent

# Run tests
npm test
```

3. **Check logs**:
```bash
# View log files
ls -la logs/
cat logs/combined.log
```

## ✅ Phase 1 Completion Checklist

- [ ] Express server running with security middleware
- [ ] Structured logging implemented
- [ ] Error handling system in place
- [ ] Health check endpoints working
- [ ] Prisma connected to PostgreSQL
- [ ] Validation system ready
- [ ] Tests passing
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No linting errors (`npm run lint`)

## 🎯 Git Checkpoint

```bash
git add .
git commit -m "Complete Phase 1: Core backend foundation with health checks"
git branch phase-1-complete
```

## 📊 Current Project State

You now have:
- ✅ Secure Express server
- ✅ Professional error handling
- ✅ Structured logging
- ✅ Database schema ready
- ✅ Health monitoring
- ✅ Type-safe validation

## 🚨 Common Issues & Solutions

1. **Database connection failed**: Check Docker is running and credentials match
2. **TypeScript errors**: Run `npm run typecheck` and fix any issues
3. **Port already in use**: Change PORT in .env file
4. **Prisma errors**: Run `npx prisma generate` after schema changes

## 📝 Next Phase

You're ready for Phase 2! The backend now has:
- Solid foundation
- Professional structure
- Ready for provider system

Proceed to: **Phase 2: Provider System & Queue Implementation**