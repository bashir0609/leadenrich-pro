"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
// src/services/QueueService.ts
const queue_1 = require("../config/queue");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
const prisma_1 = __importDefault(require("../lib/prisma"));
class QueueService {
    static async createEnrichmentJob(data) {
        const jobId = (0, uuid_1.v4)();
        // Create job record in database
        await prisma_1.default.enrichmentJob.create({
            data: {
                userId: data.userId,
                id: jobId,
                providerId: parseInt(data.providerId),
                jobType: data.operation,
                status: 'queued',
                totalRecords: data.records.length,
                inputData: JSON.stringify(data.records),
                configuration: data.options ? JSON.stringify(data.options) : null,
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
        logger_1.logger.info(`Enrichment job ${jobId} created for user ${data.userId} with ${data.records.length} records`);
        return jobId;
    }
    static async getJobStatus(jobId) {
        const job = await queue_1.enrichmentQueue.getJob(jobId);
        const dbJob = await prisma_1.default.enrichmentJob.findUnique({
            where: { id: jobId },
            include: { logs: true },
        });
        // If it's not in the database, it truly doesn't exist.
        if (!dbJob) {
            return null;
        }
        if (dbJob.status === 'completed' || dbJob.status === 'failed') {
            const results = dbJob.outputData ? JSON.parse(dbJob.outputData) : [];
            return {
                id: jobId,
                status: dbJob.status,
                // If the job is old and no longer in the queue, we can call its status "expired" for the UI
                displayStatus: 'expired',
                progress: {
                    total: dbJob.totalRecords,
                    processed: dbJob.processedRecords,
                    successful: dbJob.successfulRecords,
                    failed: dbJob.failedRecords,
                },
                createdAt: dbJob.createdAt,
                completedAt: dbJob.completedAt,
                logs: dbJob.logs,
                results: results,
            };
        }
        const queueJob = await queue_1.enrichmentQueue.getJob(jobId);
        if (!queueJob) {
            // This is a rare edge case: the job is in the DB as "processing" but gone from Redis.
            // We can consider it failed or stale.
            // For now, let's treat it as "not found in queue" which is more accurate.
            // Returning null will trigger the "not found" error, which is acceptable here.
            return null;
        }
        // 4. If the job is active, return the combined data.
        const results = dbJob.outputData ? JSON.parse(dbJob.outputData) : [];
        return {
            id: jobId,
            status: dbJob.status,
            displayStatus: dbJob.status,
            progress: {
                total: dbJob.totalRecords,
                processed: dbJob.processedRecords,
                successful: dbJob.successfulRecords,
                failed: dbJob.failedRecords,
            },
            createdAt: dbJob.createdAt,
            completedAt: dbJob.completedAt,
            logs: dbJob.logs,
            results: results,
        };
    }
}
exports.QueueService = QueueService;
//# sourceMappingURL=QueueService.js.map