import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { ProviderFactory } from '@/services/providers/ProviderFactory';
import { logger } from '@/utils/logger';
import { EnrichmentJobData } from '@/services/QueueService';

const prisma = new PrismaClient();

export const enrichmentWorker = new Worker(
  'enrichment',
  async (job: Job<EnrichmentJobData>) => {
    const { jobId, providerId, operation, records } = job.data;
    
    logger.info(`Processing enrichment job ${jobId} with ${records.length} records`);
    
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
      const provider = await ProviderFactory.getProvider(providerId);
      
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
            operation: operation as any,
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
          } else {
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
        } catch (error) {
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

      logger.info(`Job ${jobId} completed: ${successful} success, ${failed} failed`);

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
    } catch (error) {
      logger.error(`Job ${jobId} failed:`, error);
      
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
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
    removeOnComplete: {
      age: 24 * 3600, // 24 hours
      count: 100,
    },
    removeOnFail: {
      age: 24 * 3600 * 7, // 7 days
      count: 50,
    },
  }
);

async function logJobError(jobId: string, message: string): Promise<void> {
  try {
    await prisma.jobLog.create({
      data: {
        jobId,
        level: 'error',
        message,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error('Failed to log job error:', error);
  }
}

// Worker event handlers
enrichmentWorker.on('completed', (job) => {
  logger.info(`✅ Job ${job.id} completed successfully`);
});

enrichmentWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed:`, err);
});

enrichmentWorker.on('progress', (job, progress) => {
  if (typeof progress === 'object' && 'percentage' in progress) {
    logger.debug(`📊 Job ${job.id} progress: ${progress.percentage}%`);
  } else {
    logger.debug(`📊 Job ${job.id} progress: ${progress}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down enrichment worker...');
  await enrichmentWorker.close();
});

process.on('SIGINT', async () => {
  logger.info('Shutting down enrichment worker...');
  await enrichmentWorker.close();
});