"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderFactory = void 0;
const ProviderRegistry_1 = require("./ProviderRegistry");
const providers_1 = require("../../types/providers");
const errors_1 = require("../../types/errors");
const logger_1 = require("../../utils/logger");
const prisma_1 = __importDefault(require("../../lib/prisma"));
class ProviderFactory {
    // Get a provider instance from database configuration
    static async getProvider(providerId, userId) {
        try {
            // Fetch provider config from database
            const providerData = await prisma_1.default.provider.findUnique({
                where: { name: providerId },
                include: { features: true },
            });
            if (!providerData || !providerData.isActive) {
                throw new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_NOT_FOUND, `Provider ${providerId} not found or inactive`, 404);
            }
            // Map features to supported operations
            const supportedOperations = providerData.features
                .filter(f => f.isActive)
                .map(f => {
                // Map feature categories to operations
                switch (f.category) {
                    case 'search':
                        return f.featureId.includes('people')
                            ? providers_1.ProviderOperation.SEARCH_PEOPLE
                            : providers_1.ProviderOperation.SEARCH_COMPANIES;
                    case 'enrichment':
                        return f.featureId.includes('people') || f.featureId.includes('person')
                            ? providers_1.ProviderOperation.ENRICH_PERSON
                            : providers_1.ProviderOperation.ENRICH_COMPANY;
                    case 'email-finder':
                        return providers_1.ProviderOperation.FIND_EMAIL;
                    case 'lookalike':
                        return providers_1.ProviderOperation.FIND_LOOKALIKE;
                    default:
                        return undefined;
                }
            })
                .filter((op) => op !== undefined);
            // Build provider config
            const config = {
                id: providerData.name,
                providerNumericId: providerData.id,
                name: providerData.name,
                displayName: providerData.displayName,
                category: providerData.category,
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
            const provider = await ProviderRegistry_1.ProviderRegistry.getInstance(providerId, config, userId);
            logger_1.logger.info(`Provider ${providerId} instance created successfully for user ${userId}`);
            return provider;
        }
        catch (error) {
            logger_1.logger.error(`Failed to create provider ${providerId}:`, error);
            throw error;
        }
    }
    // Get all providers by category
    // <<< FIX: This function now needs the userId to pass to getProvider <<<
    static async getProvidersByCategory(category, userId) {
        const providers = await prisma_1.default.provider.findMany({
            where: {
                category,
                isActive: true,
            },
        });
        const instances = await Promise.all(
        // <<< FIX: Pass the userId in the map function <<<
        providers.map((p) => this.getProvider(p.name, userId)));
        return instances.filter(Boolean);
    }
}
exports.ProviderFactory = ProviderFactory;
//# sourceMappingURL=ProviderFactory.js.map