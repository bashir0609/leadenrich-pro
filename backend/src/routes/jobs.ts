import { Router } from 'express';
import { enrichmentQueue } from '../config/queue';
import { QueueService } from '../services/QueueService';
import { NotFoundError } from '../types/errors';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// Get all jobs for the logged-in user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;

    // Fetch the FULL job objects, not a custom selection
    const jobsFromDb = await prisma.enrichmentJob.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const formattedJobs = await Promise.all(
      // By fetching the full object, TypeScript now correctly infers the type of 'job' here
      jobsFromDb.map(async (job) => { 
        let displayStatus = job.status;
        if (job.status === 'completed') {
          const queueJob = await enrichmentQueue.getJob(job.id);
          if (!queueJob) {
            displayStatus = 'expired';
          }
        }
        return {
          id: job.id,
          status: job.status,
          displayStatus: displayStatus,
          jobType: job.jobType,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
          // Create the nested 'progress' object
          progress: {
            total: job.totalRecords,
            processed: job.processedRecords,
            successful: job.successfulRecords,
            failed: job.failedRecords,
          },
          // The full job list doesn't need logs or results, that's for the details page.
        };
      })
    );
    // --- END OF FIX ---

    res.json({
      success: true,
      data: formattedJobs,
    });
  } catch (error) {
    next(error);
  }
});

// Get job status (for a single job)
router.get('/:jobId', authenticate, async (req: AuthRequest, res, next) => { // <<< 4. SECURE THIS ROUTE AS WELL
  try {
    const { jobId } = req.params;
    
    // It's also a good idea to verify the user owns this job
    const jobOwner = await prisma.enrichmentJob.findFirst({
        where: { id: jobId, userId: req.user!.userId }
    });

    if (!jobOwner) {
        throw NotFoundError(`Job ${jobId} not found or you do not have permission to view it.`);
    }
    
    const status = await QueueService.getJobStatus(jobId);
    
    if (!status) {
      throw NotFoundError(`Job ${jobId} not found`);
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

// Get job logs
router.get('/:jobId/logs', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    const status = await QueueService.getJobStatus(jobId);
    
    if (!status) {
      throw NotFoundError(`Job ${jobId} not found`);
    }

    res.json({
      success: true,
      data: status.logs || [],
    });
  } catch (error) {
    next(error);
  }
});

export { router as jobsRouter };