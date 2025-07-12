import { Router, Request, Response } from 'express';
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
router.get('/', (req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Detailed health check - use async wrapper to handle promises correctly
router.get('/detailed', async (req: Request, res: Response): Promise<void> => {
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