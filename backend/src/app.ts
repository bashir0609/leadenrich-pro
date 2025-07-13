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
import { providersRouter } from './routes/providers';
import { jobsRouter } from './routes/jobs';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// API Routes
app.use('/health', healthRouter);
app.use('/api/providers', providersRouter);
app.use('/api/jobs', jobsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LeadEnrich Pro API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      providers: '/api/providers',
      jobs: '/api/jobs',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Import worker to start it
if (process.env.NODE_ENV !== 'test') {
  import('./workers/enrichmentWorker');
  logger.info('✅ Enrichment worker started');
}

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 LeadEnrich Pro API server running on port ${PORT}`);
  logger.info(`📖 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🌐 API URL: http://localhost:${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received: closing HTTP server`);
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Close database connections
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$disconnect();
    
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;