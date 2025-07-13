import { BaseProvider } from './base/BaseProvider';
import { ProviderConfig } from '@/types/providers';
import { CustomError, ErrorCode } from '@/types/errors';
import { logger } from '@/utils/logger';

export class ProviderRegistry {
  private static providers: Map<string, new (config: ProviderConfig) => BaseProvider> = new Map();
  private static instances: Map<string, BaseProvider> = new Map();

  // Register a provider class
  static register(providerId: string, providerClass: new (config: ProviderConfig) => BaseProvider): void {
    if (this.providers.has(providerId)) {
      logger.warn(`Provider ${providerId} is already registered. Overwriting.`);
    }
    this.providers.set(providerId, providerClass);
    logger.info(`Provider ${providerId} registered successfully`);
  }

  // Get or create a provider instance
  static async getInstance(
    providerId: string,
    config: ProviderConfig
  ): Promise<BaseProvider> {
    // Check if instance already exists
    if (this.instances.has(providerId)) {
      return this.instances.get(providerId)!;
    }

    // Get provider class
    const ProviderClass = this.providers.get(providerId);
    if (!ProviderClass) {
      throw new CustomError(
        ErrorCode.PROVIDER_NOT_FOUND,
        `Provider ${providerId} is not registered`,
        404
      );
    }

    // Create new instance
    const instance = new ProviderClass(config);
    
    // Validate and authenticate if methods exist
    if (typeof instance.validateConfig === 'function') {
      instance.validateConfig();
    }
    
    if (typeof instance.authenticate === 'function') {
      await instance.authenticate();
    }

    // Cache instance
    this.instances.set(providerId, instance);
    
    return instance;
  }

  // Initialize providers from a configuration list
  static initialize(providerConfigs: ProviderConfig[]): void {
    logger.info(`Initializing providers: ${providerConfigs.map(p => p.name).join(', ')}`);
    // This will be used by the ProviderFactory
  }

  static getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  static clearInstances(): void {
    this.instances.clear();
  }
}