import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../types/errors';
export declare const errorHandler: (err: Error | CustomError, req: Request, res: Response, _next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map