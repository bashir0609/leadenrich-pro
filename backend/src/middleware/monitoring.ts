import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../services/MetricsService';

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;
    
    MetricsService.recordHttpRequest(
      req.method,
      route,
      res.statusCode,
      duration
    );
  });

  next();
};