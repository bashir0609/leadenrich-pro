import { ProviderRegistry } from './ProviderRegistry';
import { BaseProvider } from './base/BaseProvider';
import { ProviderConfig, ProviderCategory, ProviderOperation } from '../../types/providers';
import { CustomError, ErrorCode } from '../../types/errors';
import { logger } from '../../utils/logger';
import prisma from '../../lib/prisma';

// Default operations for each provider using the ProviderOperation enum
const DEFAULT_SUPPORTED_OPERATIONS: Record<string, ProviderOperation[]> = {
  surfe: [ProviderOperation.SEARCH_PEOPLE, ProviderOperation.ENRICH_PERSON],
  apollo: [ProviderOperation.SEARCH_PEOPLE, ProviderOperation.SEARCH_PEOPLE],
  hunter: [ProviderOperation.FIND_EMAIL, ProviderOperation.FIND_EMAIL],
  betterenrich: [ProviderOperation.ENRICH_PERSON, ProviderOperation.ENRICH_COMPANY],
  companyenrich: [ProviderOperation.ENRICH_COMPANY, ProviderOperation.SEARCH_COMPANIES],
};

// Interface for the configuration object
interface ProviderConfigJson {
  supportedOperations?: ProviderOperation[];
  [key: string]: any;
}

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

      // Parse configuration with proper typing
      let configJson: ProviderConfigJson = {};
      let supportedOperations: ProviderOperation[] = [];
      
      try {
        configJson = providerData.configuration ? JSON.parse(providerData.configuration) : {};
        supportedOperations = Array.isArray(configJson.supportedOperations) 
          ? configJson.supportedOperations 
          : [];
      } catch (error) {
        logger.warn(`Failed to parse configuration for provider ${providerId}:`, error);
      }

      // Use default operations if none are configured
      if (supportedOperations.length === 0) {
        const defaultOps = DEFAULT_SUPPORTED_OPERATIONS[providerId] || [];
        if (defaultOps.length > 0) {
          logger.info(`Using default operations for provider: ${providerId}`);
          supportedOperations = defaultOps;
          
          // Update the database with default operations
          try {
            await prisma.provider.update({
              where: { id: providerData.id },
              data: {
                configuration: JSON.stringify({
                  ...configJson,
                  supportedOperations: defaultOps
                })
              }
            });
            logger.info(`Updated provider ${providerId} with default operations`);
          } catch (updateError) {
            logger.error(`Failed to update provider ${providerId} configuration:`, updateError);
          }
        }
      }

      // Build provider config
      const config: ProviderConfig = {
        id: providerData.name,
        providerNumericId: providerData.id,
        name: providerData.name,
        displayName: providerData.displayName,
        category: providerData.category as ProviderCategory,
        baseUrl: providerData.baseUrl || '',
        apiKey: providerData.apiKeyEncrypted || undefined,
        rateLimits: {
          requestsPerSecond: providerData.rateLimit,
          burstSize: providerData.rateLimit * 2,
          dailyQuota: providerData.dailyQuota,
        },
        supportedOperations,
        customConfig: configJson,
      };

      // Get provider instance from registry
      const provider = await ProviderRegistry.getInstance(providerId, config, userId);
      logger.info(`Provider ${providerId} instance created with ${supportedOperations.length} operations`);
      return provider;
    } catch (error) {
      logger.error(`Failed to create provider ${providerId}:`, error);
      throw error;
    }
  }

  // Get all providers by category
  static async getProvidersByCategory(
    category: ProviderCategory,
    userId: string
  ): Promise<BaseProvider[]> {
    try {
      const providers = await prisma.provider.findMany({
        where: {
          category,
          isActive: true,
        },
      });

      const instances = await Promise.all(
        providers.map((p) => this.getProvider(p.name, userId))
      );

      return instances.filter(Boolean) as BaseProvider[];
    } catch (error) {
      logger.error(`Failed to get providers for category ${category}:`, error);
      throw error;
    }
  }
}