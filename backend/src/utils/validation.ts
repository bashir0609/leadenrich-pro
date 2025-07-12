import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../types/errors';

// Common validation schemas
export const schemas = {
  id: z.string().cuid(),
  email: z.string().email(),
  url: z.string().url(),
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
};

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(BadRequestError('Validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
};