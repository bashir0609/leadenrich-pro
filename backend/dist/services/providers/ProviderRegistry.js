"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRegistry = void 0;
const errors_1 = require("@/types/errors");
const logger_1 = require("@/utils/logger");
class ProviderRegistry {
    // Register a provider class
    static register(providerId, providerClass) {
        const normalizedId = providerId.toLowerCase();
        if (this.providers.has(normalizedId)) {
            logger_1.logger.warn(`⚠️ Provider ${providerId} is already registered. Overwriting.`);
        }
        this.providers.set(normalizedId, providerClass);
        logger_1.logger.info(`✅ Provider ${providerId} registered successfully`);
        logger_1.logger.info(`📋 Total registered providers: ${this.providers.size}`);
    }
    // Get or create a provider instance
    static async getInstance(providerId, config) {
        const normalizedId = providerId.toLowerCase();
        const instanceKey = `${normalizedId}_${config.id}`;
        logger_1.logger.info(`🏭 ProviderRegistry: Getting instance for ${providerId} (normalized: ${normalizedId})`);
        // Check if instance already exists
        if (this.instances.has(instanceKey)) {
            logger_1.logger.info(`♻️ Reusing existing instance for ${providerId}`);
            return this.instances.get(instanceKey);
        }
        // Get provider class
        const ProviderClass = this.providers.get(normalizedId);
        if (!ProviderClass) {
            const availableProviders = Array.from(this.providers.keys());
            logger_1.logger.error(`❌ Provider class not found: ${providerId} (${normalizedId})`);
            logger_1.logger.error(`📋 Available provider classes: ${availableProviders.join(', ')}`);
            throw new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_NOT_FOUND, `Provider ${providerId} is not registered. Available: ${availableProviders.join(', ')}`, 404);
        }
        logger_1.logger.info(`🔧 Creating new instance of ${providerId}`);
        // Create new instance
        const instance = new ProviderClass(config);
        // Validate and authenticate if methods exist
        try {
            if (typeof instance.validateConfig === 'function') {
                instance.validateConfig();
                logger_1.logger.info(`✅ Config validated for ${providerId}`);
            }
            if (typeof instance.authenticate === 'function') {
                await instance.authenticate();
                logger_1.logger.info(`✅ Authenticated ${providerId}`);
            }
        }
        catch (error) {
            logger_1.logger.error(`❌ Failed to validate/authenticate ${providerId}:`, error);
            // Don't throw here - some providers might not require immediate auth
        }
        // Cache instance
        this.instances.set(instanceKey, instance);
        logger_1.logger.info(`💾 Cached instance for ${providerId}`);
        return instance;
    }
    static getRegisteredProviders() {
        return Array.from(this.providers.keys());
    }
    static clearInstances() {
        this.instances.clear();
        logger_1.logger.info('🧹 Cleared all provider instances');
    }
    // Debug method
    static getDebugInfo() {
        return {
            registeredClasses: Array.from(this.providers.keys()),
            instanceCount: this.instances.size,
            instances: Array.from(this.instances.keys()),
        };
    }
}
exports.ProviderRegistry = ProviderRegistry;
ProviderRegistry.providers = new Map();
ProviderRegistry.instances = new Map();
//# sourceMappingURL=ProviderRegistry.js.map