// 2. ENHANCED ProviderRegistry with better error handling
import { BaseProvider } from './base/BaseProvider';
import { ProviderConfig } from '../../types/providers';
import { CustomError, ErrorCode } from '../../types/errors';
import { logger } from '../../utils/logger';

export class ProviderRegistry {
  private static providers: Map<string, new (config: ProviderConfig) => BaseProvider> = new Map();
  private static instances: Map<string, BaseProvider> = new Map();

  // Register a provider class
  static register(providerId: string, providerClass: new (config: ProviderConfig) => BaseProvider): void {
    const normalizedId = providerId.toLowerCase();
    
    if (this.providers.has(normalizedId)) {
      logger.warn(`⚠️ Provider ${providerId} is already registered. Overwriting.`);
    }
    
    this.providers.set(normalizedId, providerClass);
    logger.info(`✅ Provider ${providerId} registered successfully`);
    logger.info(`📋 Total registered providers: ${this.providers.size}`);
  }

  // Get or create a provider instance
  static async getInstance(
    providerId: string,
    config: ProviderConfig,
    userId: string // <<< 1. ADD THE userId PARAMETER HERE
  ): Promise<BaseProvider> {
    const normalizedId = providerId.toLowerCase();
    
    // <<< 2. FIX THE CACHE KEY TO BE USER-SPECIFIC <<<
    const instanceKey = `${normalizedId}_${userId}`;
    
    logger.info(`🏭 ProviderRegistry: Getting instance for ${providerId} (normalized: ${normalizedId}) for user ${userId}`);

    // Check if instance already exists FOR THIS USER
    if (this.instances.has(instanceKey)) {
      logger.info(`♻️ Reusing existing instance for ${providerId} for user ${userId}`);
      return this.instances.get(instanceKey)!;
    }

    // Get provider class
    const ProviderClass = this.providers.get(normalizedId);
    if (!ProviderClass) {
      const availableProviders = Array.from(this.providers.keys());
      logger.error(`❌ Provider class not found: ${providerId} (${normalizedId})`);
      logger.error(`📋 Available provider classes: ${availableProviders.join(', ')}`);
      
      throw new CustomError(
        ErrorCode.PROVIDER_NOT_FOUND,
        `Provider ${providerId} is not registered. Available: ${availableProviders.join(', ')}`,
        404
      );
    }

    logger.info(`🔧 Creating new instance of ${providerId} for user ${userId}`);

    // Create new instance
    const instance = new ProviderClass(config);
    
    // Validate and authenticate if methods exist
    try {
      if (typeof instance.validateConfig === 'function') {
        instance.validateConfig();
        logger.info(`✅ Config validated for ${providerId}`);
      }
      
      if (typeof instance.authenticate === 'function') {
        // <<< 3. PASS THE userId TO THE AUTHENTICATE METHOD <<<
        await instance.authenticate(userId); 
        logger.info(`✅ Authenticated ${providerId} for user ${userId}`);
      }
    } catch (error) {
      // Re-throwing the error is important so the user gets feedback.
      // The original stack trace shows that this error IS being caught and logged.
      logger.error(`❌ Failed to validate/authenticate ${providerId} for user ${userId}:`, error);
      throw error; // Let the caller handle the failure.
    }

    // Cache instance
    this.instances.set(instanceKey, instance);
    logger.info(`💾 Cached instance for ${providerId} for user ${userId}`);
    
    return instance;
  }

  /**
   * Clears a cached provider instance for a specific user.
   * This is crucial for when API keys are updated or deleted.
   * @param providerId The string name of the provider (e.g., "surfe")
   * @param userId The ID of the user whose cache should be cleared
   */
  static clearInstance(providerId: string, userId: string): void {
    const normalizedId = providerId.toLowerCase();
    const instanceKey = `${normalizedId}_${userId}`;
    
    if (this.instances.has(instanceKey)) {
      this.instances.delete(instanceKey);
      logger.info(`✅ Cleared cached instance for provider ${providerId} for user ${userId}`);
    }
  }

  static getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  static clearInstances(): void {
    this.instances.clear();
    logger.info('🧹 Cleared all provider instances');
  }

  // Debug method
  static getDebugInfo(): any {
    return {
      registeredClasses: Array.from(this.providers.keys()),
      instanceCount: this.instances.size,
      instances: Array.from(this.instances.keys()),
    };
  }
}