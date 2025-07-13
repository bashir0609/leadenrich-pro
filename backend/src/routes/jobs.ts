import { Router } from 'express';
import { QueueService } from '@/services/QueueService';
import { NotFoundError } from '@/types/errors';

const router = Router();

// Get job status
router.get('/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
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