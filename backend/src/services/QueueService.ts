// src/services/QueueService.ts
import { enrichmentQueue } from '@/config/queue';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface EnrichmentJobData {
  jobId: string;
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
        id: jobId,
        providerId: parseInt(data.providerId), // Assuming provider ID from DB
        jobType: data.operation,
        status: 'queued',
        totalRecords: data.records.length,
        inputData: data.records,
        configuration: data.options,
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

    logger.info(`Enrichment job ${jobId} created with ${data.records.length} records`);
    return jobId;
  }

  static async getJobStatus(jobId: string): Promise<any> {
    const job = await enrichmentQueue.getJob(jobId);
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