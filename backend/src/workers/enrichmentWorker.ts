// backend/src/workers/enrichmentWorker.ts
import { Worker, Job } from 'bullmq';
import { ProviderFactory } from '../services/providers/ProviderFactory';
import { logger } from '../utils/logger';
import { EnrichmentJobData } from '../services/QueueService';
import prisma from '../lib/prisma';
import { DataCleaningService } from '../services/DataCleaningService';

logger.info('🚀 Initializing Enrichment Worker...');

const enrichmentWorker: Worker = new Worker(
  'enrichment',
  async (job: Job<EnrichmentJobData>) => {
    const { jobId, providerId, userId, operation, records } = job.data;
    
    logger.info(`Processing job ${jobId} for user ${userId} with ${records.length} records`);
    
    // This outer try/catch handles catastrophic setup errors (e.g., provider auth)
    try {
      // Update job status to processing in the database
      await prisma.enrichmentJob.update({
        where: { id: jobId },
        data: {
          status: 'processing',
          startedAt: new Date(),
        },
      });

      // Authenticate the provider ONCE at the start of the job.
      // If this fails, the entire job will fail, which is the correct behavior.
      const provider = await ProviderFactory.getProvider(providerId, userId);
      
      let processed = 0;
      let successful = 0;
      let failed = 0;
      const results: any[] = []; // This will hold only the successful results
      
      // Process records one by one within the job
      for (const [index, record] of records.entries()) {
        // This inner try/catch handles failures of individual records,
        // allowing the rest of the job to continue.
        try {
          const cleanedRecord = {
            ...record,
            // Use your existing service to ensure companyDomain is a valid domain.
            // It will use the 'domain' field if 'companyDomain' is invalid or missing.
            companyDomain: DataCleaningService.cleanDomain(record.companyDomain) || DataCleaningService.cleanDomain(record.domain)
          };
          
          // Optional: Add a check to fail the record if no valid domain can be found
          if (!cleanedRecord.companyDomain) {
              throw new Error("Missing or invalid company domain for this record.");
          }

          const result = await provider.execute({
            operation: operation as any,
            params: cleanedRecord,
          });

          if (result.success) {
            successful++;
            results.push(result.data); 
          } else {
            failed++;
            await logJobError(jobId, `Record ${index + 1}: Failed - ${result.error?.message}`);
          }
        } catch (error: any) {
          failed++;
          await logJobError(jobId, `Record ${index + 1}: Critical Error - ${error.message}`);
        }

        processed++;

        // Update progress in both BullMQ (for real-time UIs) and the database
        await job.updateProgress(Math.round((processed / records.length) * 100));
        
        // Update database progress periodically to save on DB calls
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

      logger.info(`Job ${jobId} processing loop finished.`);

      // Return the final data. BullMQ will see this successful return
      // and trigger the 'completed' event listener.
      return { results, summary: { total: records.length, processed, successful, failed } };

    } catch (error: any) {
      // If setup fails (e.g., provider auth), re-throw the error so BullMQ
      // triggers the 'failed' event listener.
      logger.error(`Job ${jobId} failed catastrophically during setup:`, error);
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
    removeOnComplete: { age: 24 * 3600, count: 1000 },
    removeOnFail: { age: 24 * 3600 * 7, count: 500 },
  }
);

// --- Worker event listeners are the single source of truth for the final job state ---

enrichmentWorker.on('completed', async (job, returnValue) => {
  logger.info(`✅ Job ${job.id} has truly completed. Saving final state to database.`);
  
  const { results, summary } = returnValue;

  await prisma.enrichmentJob.update({
    where: { id: job.id! },
    data: {
      status: 'completed',
      outputData: JSON.stringify(results),
      processedRecords: summary.processed,
      successfulRecords: summary.successful,
      failedRecords: summary.failed,
      completedAt: new Date(),
    },
  });
});

enrichmentWorker.on('failed', async (job, err) => {
  logger.error(`❌ Job ${job?.id} has truly failed. Saving final state to database.`);
  
  // Check if job is not undefined before accessing id
  if (job) {
    await prisma.enrichmentJob.update({
      where: { id: job.id! },
      data: {
        status: 'failed',
        errorDetails: JSON.stringify({ error: err.message, stack: err.stack }),
        completedAt: new Date(), // Mark completion time even on failure
      },
    });
  }
});

enrichmentWorker.on('progress', (job, progress) => {
  // Optional: More detailed logging for progress
  if (typeof progress === 'object' && progress !== null && 'percentage' in progress) {
    logger.debug(`📊 Job ${job.id} progress: ${progress.percentage}%`);
  } else {
    logger.debug(`📊 Job ${job.id} progress updated.`);
  }
});

// Graceful shutdown logic
async function gracefulShutdown() {
  logger.info('Shutting down enrichment worker gracefully...');
  await enrichmentWorker.close();
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);


// Helper function to log errors for individual records
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
    logger.error('Failed to log job error to database:', error);
  }
}

export { enrichmentWorker };