import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      // Add any custom properties you might have
      user?: {
        id: string;
        role: string;
      };
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