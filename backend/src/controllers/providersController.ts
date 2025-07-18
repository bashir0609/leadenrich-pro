// backend/src/controllers/providersController.ts
import { Request, Response } from 'express';
import { ProviderRegistry } from '../services/providers/ProviderRegistry';

export const getProviders = (_req: Request, res: Response): void => {
  const providers = ProviderRegistry.getRegisteredProviders();
  res.status(200).json({ providers });
};