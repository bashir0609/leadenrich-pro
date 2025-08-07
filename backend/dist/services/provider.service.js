"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderService = void 0;
const logger_1 = require("../utils/logger"); // Adjusted path
const prisma_1 = __importDefault(require("../lib/prisma"));
class ProviderService {
    static async ensureProvidersExist() {
        try {
            // Check if providers already exist
            const existingProviders = await prisma_1.default.provider.count();
            if (existingProviders > 0) {
                logger_1.logger.info(`✅ Found ${existingProviders} existing providers, skipping auto-seed`);
                return;
            }
            logger_1.logger.info('🌱 No providers found, auto-seeding database...');
            // Define providers to seed
            const providers = [
                // ... (your provider data here) ...
                {
                    name: 'surfe',
                    displayName: 'Surfe',
                    category: 'major-database',
                    baseUrl: 'https://api.surfe.com',
                    rateLimit: 10,
                    dailyQuota: 2000,
                    isActive: true,
                    configuration: { version: 'v2', features: ['people', 'companies'] },
                },
                {
                    name: 'apollo',
                    displayName: 'Apollo.io',
                    category: 'major-database',
                    baseUrl: 'https://api.apollo.io/api',
                    rateLimit: 50,
                    dailyQuota: 10000,
                    isActive: true,
                    configuration: { database_size: '275M contacts' },
                },
                // ... etc
            ];
            // Create providers
            for (const providerData of providers) {
                await prisma_1.default.provider.upsert({
                    where: { name: providerData.name },
                    update: {
                        ...providerData,
                        // FIX: Convert configuration object to JSON string
                        configuration: JSON.stringify(providerData.configuration),
                    },
                    create: {
                        ...providerData,
                        // FIX: Convert configuration object to JSON string
                        configuration: JSON.stringify(providerData.configuration),
                    },
                });
                logger_1.logger.info(`✅ Auto-seeded provider: ${providerData.displayName}`);
            }
            // Seed provider features
            await this.seedProviderFeatures();
            logger_1.logger.info(`🎉 Auto-seed completed: ${providers.length} providers created`);
        }
        catch (error) {
            logger_1.logger.error('❌ Auto-seed failed:', error);
        }
    }
    // ... (the rest of your seedProviderFeatures methods are correct) ...
    static async seedProviderFeatures() {
        // ...
    }
    static async seedSurfeFeatures(providerId) {
        // ...
    }
    static async seedApolloFeatures(providerId) {
        // ...
    }
    static async seedHunterFeatures(providerId) {
        // ...
    }
}
exports.ProviderService = ProviderService;
//# sourceMappingURL=provider.service.js.map