// backend/src/routes/providers.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '@/utils/validation';
import { ProviderOperation } from '@/types/providers';
import { ProviderFactory } from '@/services/providers/ProviderFactory';
import { QueueService } from '@/services/QueueService';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import { CustomRequest } from '@/types/express';
import { BadRequestError, NotFoundError } from '@/types/errors';

const router = Router();
const prisma = new PrismaClient();

// Get all active providers
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        category: true,
        features: {
          select: {
            featureId: true,
            featureName: true,
            category: true,
            creditsPerRequest: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    next(error);
  }
});

// Test provider connection
router.post('/:providerId/test', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;
    
    if (!providerId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Provider ID is required',
        },
      });
      return;
    }
    
    const provider = await ProviderFactory.getProvider(providerId);
    
    // Try a simple operation to test connection
    const result = await provider.execute({
      operation: 'test' as any,
      params: {},
    });

    res.json({
      success: true,
      data: {
        provider: providerId,
        connected: result.success,
        message: result.success ? 'Provider connected successfully' : 'Provider connection failed',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Execute single operation
const executeSchema = z.object({
  operation: z.string(),
  params: z.record(z.any()),
  options: z.object({
    timeout: z.number().optional(),
    retries: z.number().optional(),
  }).optional(),
});

router.post(
  '/:providerId/execute',
  validate(executeSchema),
  async (req, res, next) => {
    try {
      const { providerId } = req.params;
      
      // Validate providerId is present
      if (!providerId) {
        throw BadRequestError('Provider ID is required');
      }
      
      const { operation, params, options } = req.body;

      logger.info(`Executing ${operation} on provider ${providerId}`, { params });

      const provider = await ProviderFactory.getProvider(providerId);
      const result = await provider.execute({
        operation,
        params,
        options,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Create bulk enrichment job
const bulkEnrichSchema = z.object({
  operation: z.string(),
  records: z.array(z.record(z.any())).min(1).max(10000),
  options: z.object({
    webhookUrl: z.string().url().optional(),
    columnMapping: z.record(z.string()).optional(),
  }).optional(),
});

router.post(
  '/:providerId/bulk',
  validate(bulkEnrichSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { providerId } = req.params;
      
      if (!providerId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Provider ID is required',
          },
        });
        return;
      }
      
      const { operation, records, options } = req.body;

      const jobId = await QueueService.createEnrichmentJob({
        providerId,
        operation,
        records,
        options,
      });

      res.status(202).json({
        success: true,
        data: {
          jobId,
          status: 'queued',
          totalRecords: records.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);



export { router as providersRouter };