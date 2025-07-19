"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderFactory = void 0;
const client_1 = require("@prisma/client");
const ProviderRegistry_1 = require("./ProviderRegistry");
const providers_1 = require("@/types/providers");
const errors_1 = require("@/types/errors");
const logger_1 = require("@/utils/logger");
const prisma = new client_1.PrismaClient();
class ProviderFactory {
    // Get a provider instance from database configuration
    static async getProvider(providerId) {
        try {
            // Fetch provider config from database
            const providerData = await prisma.provider.findUnique({
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
                customConfig: providerData.configuration,
            };
            // Get provider instance from registry
            const provider = await ProviderRegistry_1.ProviderRegistry.getInstance(providerId, config);
            logger_1.logger.info(`Provider ${providerId} instance created successfully`);
            return provider;
        }
        catch (error) {
            logger_1.logger.error(`Failed to create provider ${providerId}:`, error);
            throw error;
        }
    }
    // Get all providers by category
    static async getProvidersByCategory(category) {
        const providers = await prisma.provider.findMany({
            where: {
                category,
                isActive: true,
            },
        });
        const instances = await Promise.all(providers.map((p) => this.getProvider(p.name)));
        return instances.filter(Boolean);
    }
}
exports.ProviderFactory = ProviderFactory;
//# sourceMappingURL=ProviderFactory.js.map