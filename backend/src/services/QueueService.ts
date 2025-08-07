// src/services/QueueService.ts
import { enrichmentQueue } from '../config/queue';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';

export interface EnrichmentJobData {
  jobId: string;
  userId: string; // <<< 1. ADD userId TO THE JOB DATA INTERFACE
  providerId: string;
  operation: string;
  records: any[];
  options?: {
    webhookUrl?: string;
    columnMapping?: Record<string, string>;
  };
}

export class QueueService {
  static async createEnrichmentJob(
    data: Omit<EnrichmentJobData, 'jobId'>
  ): Promise<string> {
    const jobId = uuidv4();

    // Create job record in database
    await prisma.enrichmentJob.create({
      data: {
        userId: data.userId, // <<< 2. USE THE REAL userId FROM THE INCOMING DATA
        id: jobId,
        providerId: parseInt(data.providerId), // This should be a number, ensure providerId is passed as number or parse correctly
        jobType: data.operation,
        status: 'queued',
        totalRecords: data.records.length,
        inputData: JSON.stringify(data.records),
        configuration: data.options ? JSON.stringify(data.options) : null,
      },
    });

    // Add to queue
    await enrichmentQueue.add(
      'process-enrichment',
      {
        ...data,
        jobId,
      },
      {
        jobId,
        priority: 1,
      }
    );

    logger.info(`Enrichment job ${jobId} created for user ${data.userId} with ${data.records.length} records`);
    return jobId;
  }

  static async getJobStatus(jobId: string): Promise<any> {
    const job = await enrichmentQueue.getJob(jobId);
    const dbJob = await prisma.enrichmentJob.findUnique({
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
        displayStatus: 'expired', // <<< NEW FIELD FOR THE UI
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

    const queueJob = await enrichmentQueue.getJob(jobId);
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
      displayStatus: dbJob.status, // Use the real status
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