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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const client_1 = require("@prisma/client");
const prometheus = __importStar(require("prom-client"));
const prisma = new client_1.PrismaClient();
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
class MetricsService {
    static recordHttpRequest(method, route, status, duration) {
        httpRequestDuration.labels(method, route, String(status)).observe(duration);
    }
    static recordEnrichment(provider, operation, success, credits) {
        enrichmentCounter
            .labels(provider, operation, success ? 'success' : 'failure')
            .inc();
        if (success && credits > 0) {
            creditUsageCounter.labels(provider, operation).inc(credits);
        }
    }
    static async updateActiveJobs() {
        const activeJobs = await prisma.enrichmentJob.count({
            where: {
                status: {
                    in: ['queued', 'processing'],
                },
            },
        });
        activeJobsGauge.set(activeJobs);
    }
    static async getMetrics() {
        return register.metrics();
    }
    static async getHealthMetrics() {
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
    static async getJobStatistics() {
        const stats = await prisma.enrichmentJob.groupBy({
            by: ['status'],
            _count: true,
        });
        return stats.reduce((acc, stat) => {
            acc[stat.status] = stat._count;
            return acc;
        }, {});
    }
    static async getProviderStatistics() {
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
exports.MetricsService = MetricsService;
//# sourceMappingURL=MetricsService.js.map