"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const health_1 = require("./routes/health");
const providers_1 = require("./routes/providers");
const jobs_1 = require("./routes/jobs");
const upload_1 = require("./routes/upload");
const export_1 = require("./routes/export");
const socket_1 = require("./config/socket");
const ProviderRegistry_1 = require("./services/providers/ProviderRegistry");
// Enhanced provider initialization
logger_1.logger.info('🔌 Initializing providers...');
// Import all provider implementations to trigger registration
require("./services/providers/implementations/SurfeProvider");
require("./services/providers/implementations/ApolloProvider");
require("./services/providers/implementations/BetterEnrichProvider");
// Log what got registered
setTimeout(() => {
    const registeredProviders = ProviderRegistry_1.ProviderRegistry.getRegisteredProviders();
    logger_1.logger.info(`📋 Registered providers: ${registeredProviders.join(', ')}`);
    if (registeredProviders.length === 0) {
        logger_1.logger.error('❌ No providers registered! Check your provider imports.');
    }
    else {
        logger_1.logger.info(`✅ ${registeredProviders.length} providers registered successfully`);
    }
}, 100);
// Load environment variables
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Create HTTP server
const server = (0, http_1.createServer)(app);
// Setup Socket.io
const io = (0, socket_1.setupSocket)(server);
global.io = io;
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
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
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, compression_1.default)());
// Request logging middleware
app.use((req, res, next) => {
    logger_1.logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    next();
});
// API Routes
app.use('/health', health_1.healthRouter);
app.use('/api/providers', providers_1.providersRouter);
app.use('/api/jobs', jobs_1.jobsRouter);
app.use('/api/upload', upload_1.uploadRouter);
app.use('/api/export', export_1.exportRouter);
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
app.use(notFoundHandler_1.notFoundHandler);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
// Import worker to start it
if (process.env.NODE_ENV !== 'test') {
    Promise.resolve().then(() => __importStar(require('./workers/enrichmentWorker')));
    logger_1.logger.info('✅ Enrichment worker started');
}
// Start server with Socket.io support
server.listen(PORT, () => {
    logger_1.logger.info(`🚀 LeadEnrich Pro API server running on port ${PORT}`);
    logger_1.logger.info(`📖 Environment: ${process.env.NODE_ENV}`);
    logger_1.logger.info(`🌐 API URL: http://localhost:${PORT}`);
    logger_1.logger.info(`🔌 Socket.io enabled`);
});
// Start server
// const server = app.listen(PORT, () => {
//   logger.info(`🚀 LeadEnrich Pro API server running on port ${PORT}`);
//   logger.info(`📖 Environment: ${process.env.NODE_ENV}`);
//   logger.info(`🌐 API URL: http://localhost:${PORT}`);
// });
// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`${signal} received: closing HTTP server`);
    server.close(async () => {
        logger_1.logger.info('HTTP server closed');
        // Close database connections
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        await prisma.$disconnect();
        process.exit(0);
    });
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
exports.default = app;
//# sourceMappingURL=app.js.map