import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '@/utils/logger';

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Queue definitions
export const enrichmentQueue = new Queue('enrichment', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // 1 hour
      count: 100,
    },
    removeOnFail: {
      age: 24 * 3600, // 24 hours
    },
  },
});

export const exportQueue = new Queue('export', { connection });

// Queue events for monitoring
export const enrichmentQueueEvents = new QueueEvents('enrichment', { connection });

enrichmentQueueEvents.on('completed', ({ jobId, returnvalue }) => {
  logger.info(`Job ${jobId} completed`);
});

enrichmentQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Job ${jobId} failed: ${failedReason}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await enrichmentQueue.close();
  await exportQueue.close();
  connection.disconnect();
});