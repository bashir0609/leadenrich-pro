// src/routes/apiKeyRoutes.ts
import { Router } from 'express';
import { ApiKeyController } from '../controllers/apiKeyController';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();


// Get all keys for a provider
router.get(
  '/providers/:providerId/keys',
  authenticate,
  ApiKeyController.getApiKeys
);

// Add a new key to a provider
router.post(
  '/providers/:providerId/keys',
  authenticate,
  ApiKeyController.addApiKey
);

// Set a key as active
router.put(
  '/providers/:providerId/keys/:keyId/activate',
  authenticate,
  ApiKeyController.setActiveApiKey
);

// Update an existing API key
router.put(
  '/providers/:providerId/keys/:keyId',
  authenticate,
  ApiKeyController.updateApiKey
);

// Delete a key
router.delete(
  '/providers/:providerId/keys/:keyId',
  authenticate,
  ApiKeyController.deleteApiKey
);

export { router as apiKeyRouter };