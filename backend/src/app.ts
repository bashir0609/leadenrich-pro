import { EnvironmentValidator } from "./services/EnvironmentValidator";
import dotenv from 'dotenv';

const dns = require('dns');

// Configure reliable DNS servers to prevent ENOTFOUND errors
dns.setServers([
  '8.8.8.8',      // Google DNS Primary
  '8.8.4.4',      // Google DNS Secondary  
  '1.1.1.1',      // Cloudflare DNS Primary
  '1.0.0.1',      // Cloudflare DNS Secondary
  '208.67.222.222', // OpenDNS
  '208.67.220.220'  // OpenDNS
]);

console.log('🔧 DNS servers configured:', dns.getServers());

// Test DNS resolution for Surfe API
dns.lookup('api.surfe.com', (err: any, address: string) => {
  if (err) {
    console.error('❌ DNS lookup failed for api.surfe.com:', err.message);
  } else {
    console.log('✅ DNS lookup successful for api.surfe.com:', address);
  }
});

import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { healthRouter } from './routes/health';
import { providersRouter } from './routes/providers';
import { jobsRouter } from './routes/jobs';
import { uploadRouter } from './routes/upload';
import { exportRouter } from './routes/export';
import { apiKeyRouter } from './routes/apiKeyRoutes';
import { dashboardRouter } from './routes/dashboard';
import { setupSocket } from './config/socket';
import { ProviderRegistry } from './services/providers';
import { ProviderService } from './services/provider.service';
import authRouter from './routes/auth';

// Load environment variables at the very beginning
dotenv.config();

// Enhanced provider initialization
logger.info('🔌 Initializing providers...');

// Import all provider implementations to trigger registration
import './services/providers/implementations/SurfeProvider';
import './services/providers/implementations/ApolloProvider';
import './services/providers/implementations/BetterEnrichProvider';

// Log what got registered
setTimeout(() => {
  const registeredProviders = ProviderRegistry.getRegisteredProviders();
  logger.info(`📋 Registered providers: ${registeredProviders.join(', ')}`);
  
  if (registeredProviders.length === 0) {
    logger.error('❌ No providers registered! Check your provider imports.');
  } else {
    logger.info(`✅ ${registeredProviders.length} providers registered successfully`);
  }
}, 100);

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = createServer(app);

// Setup Socket.io
const io = setupSocket(server);

// Make io available globally for job notifications
declare global {
  var io: import('socket.io').Server;
}
global.io = io;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
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
app.use('/api/auth', authRouter);
app.use('/api/health', healthRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/providers', providersRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/export', exportRouter);
app.use('/api', apiKeyRouter);

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

// Start server with Socket.io support
const startServer = () => {
  server.listen(PORT, () => {
    logger.info(`🚀 LeadEnrich Pro API server running on port ${PORT}`);
    // ...
  });
};

// --- MODIFIED STARTUP SEQUENCE ---
// Start server first, then try to connect to database
startServer();

// Try to initialize database connection in background
ProviderService.ensureProvidersExist()
  .then(() => {
    logger.info('✅ Database connection established and providers seeded');
  })
  .catch((error) => {
    logger.error('⚠️ Database connection failed, but server is still running:', error.message);
    // Don't exit - let the server handle requests and return proper error messages
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
