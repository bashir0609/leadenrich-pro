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
        limit: number;
        page: number;
    }, {
        limit?: number | undefined;
        page?: number | undefined;
    }>;
};
export declare const validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validation.d.ts.map