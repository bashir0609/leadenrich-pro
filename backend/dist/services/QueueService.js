"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
// src/services/QueueService.ts
const queue_1 = require("@/config/queue");
const client_1 = require("@prisma/client");
const logger_1 = require("@/utils/logger");
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient();
class QueueService {
    static async createEnrichmentJob(data) {
        const jobId = (0, uuid_1.v4)();
        // Create job record in database
        await prisma.enrichmentJob.create({
            data: {
                id: jobId,
                providerId: parseInt(data.providerId),
                jobType: data.operation,
                status: 'queued',
                totalRecords: data.records.length,
                inputData: data.records,
                configuration: data.options,
            },
        });
        // Add to queue
        await queue_1.enrichmentQueue.add('process-enrichment', {
            ...data,
            jobId,
        }, {
            jobId,
            priority: 1,
        });
        logger_1.logger.info(`Enrichment job ${jobId} created with ${data.records.length} records`);
        return jobId;
    }
    static async getJobStatus(jobId) {
        const job = await queue_1.enrichmentQueue.getJob(jobId);
        const dbJob = await prisma.enrichmentJob.findUnique({
            where: { id: jobId },
            include: { logs: true },
        });
        if (!job || !dbJob) {
            return null;
        }
        return {
            id: jobId,
            status: dbJob.status,
            progress: {
                total: dbJob.totalRecords,
                processed: dbJob.processedRecords,
                successful: dbJob.successfulRecords,
                failed: dbJob.failedRecords,
            },
            createdAt: dbJob.createdAt,
            completedAt: dbJob.completedAt,
            logs: dbJob.logs,
        };
    }
}
exports.QueueService = QueueService;
//# sourceMappingURL=QueueService.js.map