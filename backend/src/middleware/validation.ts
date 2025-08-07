// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { CustomError, ErrorCode } from '../types/errors';

export const validate = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errorMessage = result.error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');

        throw new CustomError(
          ErrorCode.VALIDATION_ERROR,
          `Validation failed: ${errorMessage}`,
          400
        );
      }

      // Replace req.body with parsed and validated data
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};