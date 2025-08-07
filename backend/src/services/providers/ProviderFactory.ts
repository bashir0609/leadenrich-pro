import { ProviderRegistry } from './ProviderRegistry';
import { BaseProvider } from './base/BaseProvider';
import { ProviderConfig, ProviderCategory, ProviderOperation } from '../../types/providers';
import { CustomError, ErrorCode } from '../../types/errors';
import { logger } from '../../utils/logger';
import prisma from '../../lib/prisma';

export class ProviderFactory {
  // Get a provider instance from database configuration
  static async getProvider(providerId: string, userId: string): Promise<BaseProvider> {
    try {
      // Fetch provider config from database
      const providerData = await prisma.provider.findUnique({
        where: { name: providerId },
      });

      if (!providerData || !providerData.isActive) {
        throw new CustomError(
          ErrorCode.PROVIDER_NOT_FOUND,
          `Provider ${providerId} not found or inactive`,
          404
        );
      }

      // Parse supportedOperations from configuration JSON
      let supportedOperations: ProviderOperation[] = [];
      try {
        const config = JSON.parse(providerData.configuration || '{}');
        supportedOperations = config.supportedOperations || [];
      } catch (error) {
        logger.warn(`Failed to parse configuration for provider ${providerId}:`, error);
      }

      // Build provider config
      const config: ProviderConfig = {
        id: providerData.name,
        providerNumericId: providerData.id,
        name: providerData.name,
        displayName: providerData.displayName,
        category: providerData.category as ProviderCategory,
        baseUrl: providerData.baseUrl,
        apiKey: providerData.apiKeyEncrypted || undefined,
        rateLimits: {
          requestsPerSecond: providerData.rateLimit,
          burstSize: providerData.rateLimit * 2,
          dailyQuota: providerData.dailyQuota,
        },
        supportedOperations,
        customConfig: providerData.configuration ? JSON.parse(providerData.configuration) : {},
      };

      // Get provider instance from registry
      // <<< THE CRITICAL FIX IS HERE: Pass the userId to the ProviderRegistry <<<
      const provider = await ProviderRegistry.getInstance(providerId, config, userId);
      
      logger.info(`Provider ${providerId} instance created successfully for user ${userId}`);
      return provider;
    } catch (error) {
      logger.error(`Failed to create provider ${providerId}:`, error);
      throw error;
    }
  }

  // Get all providers by category
  // <<< FIX: This function now needs the userId to pass to getProvider <<<
  static async getProvidersByCategory(
    category: ProviderCategory,
    userId: string
  ): Promise<BaseProvider[]> {
    const providers = await prisma.provider.findMany({
      where: {
        category,
        isActive: true,
      },
    });

    const instances = await Promise.all(
      // <<< FIX: Pass the userId in the map function <<<
      providers.map((p) => this.getProvider(p.name, userId))
    );

    return instances.filter(Boolean);
  }
}