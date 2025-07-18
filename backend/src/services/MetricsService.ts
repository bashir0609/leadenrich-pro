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
      },
    });

    return usage;
  }
}