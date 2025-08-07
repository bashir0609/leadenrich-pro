// backend/src/routes/providers.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../utils/validation';
import { ProviderOperation } from '../types/providers';
import { ProviderFactory } from '../services/providers/ProviderFactory';
import { QueueService } from '../services/QueueService';
import prisma from '../lib/prisma';
import { logger } from '../utils/logger';
import { CustomRequest } from '../types/express'; // This might be used implicitly
import { BadRequestError, NotFoundError } from '../types/errors';
import { authenticate, AuthRequest } from '../middleware/auth'; // <<< 1. IMPORT AuthRequest TYPE

const router = Router();

// Get all active providers (This can remain public)
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        category: true,
        configuration: true,
      },
    });

    // Transform providers to include features from configuration
    const transformedProviders = providers.map(provider => {
      let features = [];
      try {
        const config = JSON.parse(provider.configuration || '{}');
        if (config.supportedOperations) {
          features = config.supportedOperations.map((op: string, index: number) => ({
            featureId: `${provider.name}_${index}`,
            featureName: op,
            category: provider.category,
            creditsPerRequest: 1
          }));
        }
      } catch (error) {
        logger.error('Error parsing provider configuration:', error);
      }
      
      return {
        ...provider,
        features
      };
    });

    res.json({
      success: true,
      data: transformedProviders,
    });
  } catch (error) {
    next(error);
  }
});

// Test provider connection
router.post('/:providerId/test', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;
    const userId = (req as AuthRequest).user!.userId; // <<< 2. GET userId FROM AUTHENTICATED REQUEST
    
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
    
    // <<< 3. PASS userId TO THE getProvider METHOD
    const provider = await ProviderFactory.getProvider(providerId, userId); 
    
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
  authenticate, 
  validate(executeSchema),
  // The 'req' parameter here is already implicitly an AuthRequest due to the middleware
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { providerId } = req.params;
      // No change needed here, this was already correct.
      const userId = (req as AuthRequest).user!.userId;
      
      if (!providerId) {
        throw BadRequestError('Provider ID is required');
      }
      
      const { operation, params, options } = req.body;

      logger.info(`Executing ${operation} on provider ${providerId} for user ${userId}`);

      // No change needed here, this was already correct.
      const provider = await ProviderFactory.getProvider(providerId, userId);
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
  authenticate,
  validate(bulkEnrichSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // No change needed here, this was already correct.
      const userId = (req as AuthRequest).user!.userId;
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

      // No change needed here, this was already correct.
      const jobId = await QueueService.createEnrichmentJob({
        providerId,
        userId,
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