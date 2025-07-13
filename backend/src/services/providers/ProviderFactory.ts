import { PrismaClient } from '@prisma/client';
import { ProviderRegistry } from './ProviderRegistry';
import { BaseProvider } from './base/BaseProvider';
import { ProviderConfig, ProviderCategory, ProviderOperation } from '@/types/providers';
import { CustomError, ErrorCode } from '@/types/errors';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export class ProviderFactory {
  // Get a provider instance from database configuration
  static async getProvider(providerId: string): Promise<BaseProvider> {
    try {
      // Fetch provider config from database
      const providerData = await prisma.provider.findUnique({
        where: { name: providerId },
        include: { features: true },
      });

      if (!providerData || !providerData.isActive) {
        throw new CustomError(
          ErrorCode.PROVIDER_NOT_FOUND,
          `Provider ${providerId} not found or inactive`,
          404
        );
      }

      // Map features to supported operations
      const supportedOperations: ProviderOperation[] = providerData.features
        .filter(f => f.isActive)
        .map(f => {
          // Map feature categories to operations
          switch (f.category) {
            case 'search':
              return f.featureId.includes('people') 
                ? ProviderOperation.SEARCH_PEOPLE 
                : ProviderOperation.SEARCH_COMPANIES;
            case 'enrichment':
              return f.featureId.includes('people') || f.featureId.includes('person')
                ? ProviderOperation.ENRICH_PERSON
                : ProviderOperation.ENRICH_COMPANY;
            case 'email-finder':
              return ProviderOperation.FIND_EMAIL;
            case 'lookalike':
              return ProviderOperation.FIND_LOOKALIKE;
            default:
              return undefined;
          }
        })
        .filter((op): op is ProviderOperation => op !== undefined);

      // Build provider config
      const config: ProviderConfig = {
        id: providerData.name,
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
        customConfig: providerData.configuration as Record<string, any>,
      };

      // Get provider instance from registry
      const provider = await ProviderRegistry.getInstance(providerId, config);
      
      logger.info(`Provider ${providerId} instance created successfully`);
      return provider;
    } catch (error) {
      logger.error(`Failed to create provider ${providerId}:`, error);
      throw error;
    }
  }

  // Get all providers by category
  static async getProvidersByCategory(
    category: ProviderCategory
  ): Promise<BaseProvider[]> {
    const providers = await prisma.provider.findMany({
      where: {
        category,
        isActive: true,
      },
    });

    const instances = await Promise.all(
      providers.map((p) => this.getProvider(p.name))
    );

    return instances.filter(Boolean);
  }
}