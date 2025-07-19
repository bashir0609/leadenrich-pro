"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichmentQueueEvents = exports.exportQueue = exports.enrichmentQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("@/utils/logger");
// Redis connection
const connection = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});
// Queue definitions
exports.enrichmentQueue = new bullmq_1.Queue('enrichment', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            age: 3600,
            count: 100,
        },
        removeOnFail: {
            age: 24 * 3600, // 24 hours
        },
    },
});
exports.exportQueue = new bullmq_1.Queue('export', { connection });
// Queue events for monitoring
exports.enrichmentQueueEvents = new bullmq_1.QueueEvents('enrichment', { connection });
exports.enrichmentQueueEvents.on('completed', ({ jobId, returnvalue }) => {
    logger_1.logger.info(`Job ${jobId} completed`);
});
exports.enrichmentQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logger_1.logger.error(`Job ${jobId} failed: ${failedReason}`);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    await exports.enrichmentQueue.close();
    await exports.exportQueue.close();
    connection.disconnect();
});
//# sourceMappingURL=queue.js.map