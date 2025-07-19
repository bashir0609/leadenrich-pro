import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare const schemas: {
    id: z.ZodString;
    email: z.ZodString;
    url: z.ZodString;
    pagination: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
    }, {
        page?: number | undefined;
        limit?: number | undefined;
    }>;
};
export declare const validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
