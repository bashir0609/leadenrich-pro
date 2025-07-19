"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichmentWorker = void 0;
const bullmq_1 = require("bullmq");
const client_1 = require("@prisma/client");
const ProviderFactory_1 = require("@/services/providers/ProviderFactory");
const logger_1 = require("@/utils/logger");
const prisma = new client_1.PrismaClient();
exports.enrichmentWorker = new bullmq_1.Worker('enrichment', async (job) => {
    const { jobId, providerId, operation, records } = job.data;
    logger_1.logger.info(`Processing enrichment job ${jobId} with ${records.length} records`);
    try {
        // Update job status to processing
        await prisma.enrichmentJob.update({
            where: { id: jobId },
            data: {
                status: 'processing',
                startedAt: new Date(),
            },
        });
        // Get provider instance
        const provider = await ProviderFactory_1.ProviderFactory.getProvider(providerId);
        // Process records with progress tracking
        let processed = 0;
        let successful = 0;
        let failed = 0;
        const results = [];
        const errors = [];
        for (const [index, record] of records.entries()) {
            try {
                // Update job progress
                await job.updateProgress({
                    processed,
                    total: records.length,
                    percentage: Math.round((processed / records.length) * 100),
                });
                // Execute provider operation
                const result = await provider.execute({
                    operation: operation,
                    params: record,
                });
                if (result.success) {
                    successful++;
                    results.push({
                        index,
                        success: true,
                        data: result.data,
                        metadata: result.metadata,
                    });
                }
                else {
                    failed++;
                    const errorMsg = `Record ${index}: ${result.error?.message}`;
                    errors.push(errorMsg);
                    await logJobError(jobId, errorMsg);
                    results.push({
                        index,
                        success: false,
                        error: result.error,
                    });
                }
            }
            catch (error) {
                failed++;
                const errorMsg = `Record ${index} processing error: ${error}`;
                errors.push(errorMsg);
                await logJobError(jobId, errorMsg);
                results.push({
                    index,
                    success: false,
                    error: { message: String(error) },
                });
            }
            processed++;
            // Update database progress every 10 records or on completion
            if (processed % 10 === 0 || processed === records.length) {
                await prisma.enrichmentJob.update({
                    where: { id: jobId },
                    data: {
                        processedRecords: processed,
                        successfulRecords: successful,
                        failedRecords: failed,
                    },
                });
            }
        }
        // Final status update
        await prisma.enrichmentJob.update({
            where: { id: jobId },
            data: {
                status: 'completed',
                processedRecords: processed,
                successfulRecords: successful,
                failedRecords: failed,
                completedAt: new Date(),
            },
        });
        logger_1.logger.info(`Job ${jobId} completed: ${successful} success, ${failed} failed`);
        return {
            jobId,
            summary: {
                total: records.length,
                processed,
                successful,
                failed,
            },
            results,
        };
    }
    catch (error) {
        logger_1.logger.error(`Job ${jobId} failed:`, error);
        await prisma.enrichmentJob.update({
            where: { id: jobId },
            data: {
                status: 'failed',
                errorDetails: {
                    error: String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                },
            },
        });
        throw error;
    }
}, {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
    },
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
    removeOnComplete: {
        age: 24 * 3600,
        count: 100,
    },
    removeOnFail: {
        age: 24 * 3600 * 7,
        count: 50,
    },
});
async function logJobError(jobId, message) {
    try {
        await prisma.jobLog.create({
            data: {
                jobId,
                level: 'error',
                message,
                timestamp: new Date(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to log job error:', error);
    }
}
// Worker event handlers
exports.enrichmentWorker.on('completed', (job) => {
    logger_1.logger.info(`✅ Job ${job.id} completed successfully`);
});
exports.enrichmentWorker.on('failed', (job, err) => {
    logger_1.logger.error(`❌ Job ${job?.id} failed:`, err);
});
exports.enrichmentWorker.on('progress', (job, progress) => {
    if (typeof progress === 'object' && 'percentage' in progress) {
        logger_1.logger.debug(`📊 Job ${job.id} progress: ${progress.percentage}%`);
    }
    else {
        logger_1.logger.debug(`📊 Job ${job.id} progress: ${progress}`);
    }
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('Shutting down enrichment worker...');
    await exports.enrichmentWorker.close();
});
process.on('SIGINT', async () => {
    logger_1.logger.info('Shutting down enrichment worker...');
    await exports.enrichmentWorker.close();
});
//# sourceMappingURL=enrichmentWorker.js.map