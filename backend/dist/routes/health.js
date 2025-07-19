"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.healthRouter = router;
const prisma = new client_1.PrismaClient();
// Basic health check
router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
// Detailed health check - use async wrapper to handle promises correctly
router.get('/detailed', async (req, res) => {
    try {
        // Check database
        const dbHealth = await checkDatabase();
        // Check Redis (placeholder for now)
        const redisHealth = {
            status: 'up',
            responseTime: 1,
        };
        const health = {
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
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
        });
    }
});
async function checkDatabase() {
    const startTime = Date.now();
    try {
        await prisma.$queryRaw `SELECT 1`;
        return {
            status: 'up',
            responseTime: Date.now() - startTime,
        };
    }
    catch (error) {
        return {
            status: 'down',
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
function determineOverallHealth(db, redis) {
    if (db.status === 'down')
        return 'unhealthy';
    if (redis.status === 'down')
        return 'degraded';
    return 'healthy';
}
//# sourceMappingURL=health.js.map