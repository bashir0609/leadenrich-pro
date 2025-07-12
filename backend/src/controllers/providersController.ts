import { Request, Response } from 'express';
import { providerRegistry } from '../services/providers/ProviderRegistry';

export const getProviders = (_req: Request, res: Response): void => {
  const providers = providerRegistry.getAvailableProviders();
  res.status(200).json({ providers });
};