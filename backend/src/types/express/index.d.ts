import { Request } from 'express';
import { RateLimitInfo } from 'express-rate-limit';
import { AuthRequest } from '../middleware/auth';
import { Multer } from 'multer';
import { ReadableStream, WritableStream } from 'stream';
import { Key, Listener1, Listener2, Args, Key2 } from 'node:events';
import { MediaType } from 'accepts';

declare global {
  namespace Express {
    export interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
      // ADD THIS LINE
      rateLimit?: RateLimitInfo;
    }
  }
}

// Extend the existing Request type
interface CustomRequest extends Request {
  params: {
    providerId: string;
  };
  body: {
    operation: string;
    params?: Record<string, any>;
    options?: Record<string, any>;
  };
}

export { CustomRequest };