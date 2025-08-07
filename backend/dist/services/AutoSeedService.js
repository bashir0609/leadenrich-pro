"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoSeedService = void 0;
const logger_1 = require("../utils/logger");
const prisma_1 = __importDefault(require("../lib/prisma"));
class AutoSeedService {
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
                {
                    name: 'surfe',
                    displayName: 'Surfe',
                    category: 'major-database',
                    baseUrl: 'https://api.surfe.com',
                    rateLimit: 10,
                    dailyQuota: 2000,
                    isActive: true,
                    configuration: {
                        version: 'v2',
                        features: ['people', 'companies', 'enrichment', 'lookalike'],
                        timeout: 30000,
                        retryAttempts: 3,
                        asyncEnrichment: true,
                        supportedOperations: [
                            'find-email', 'enrich-person', 'enrich-company',
                            'search-people', 'search-companies', 'find-lookalike'
                        ]
                    },
                },
                {
                    name: 'apollo',
                    displayName: 'Apollo.io',
                    category: 'major-database',
                    baseUrl: 'https://api.apollo.io/api',
                    rateLimit: 50,
                    dailyQuota: 10000,
                    isActive: true,
                    configuration: {
                        database_size: '275M contacts',
                        strengths: ['US data', 'Technology companies', 'Sales intelligence'],
                        supportedOperations: [
                            'find-email', 'enrich-person', 'enrich-company',
                            'search-people', 'search-companies', 'find-lookalike'
                        ]
                    },
                },
                {
                    name: 'hunter',
                    displayName: 'Hunter.io',
                    category: 'email-finder',
                    baseUrl: 'https://api.hunter.io',
                    rateLimit: 10,
                    dailyQuota: 10000,
                    isActive: true,
                    configuration: {
                        version: 'v2',
                        features: ['email-finder', 'email-verifier', 'domain-search', 'company-enrichment', 'person-enrichment'],
                        strengths: ['Email finding', 'Email verification', 'Domain search', 'High accuracy'],
                        database_size: '200M+ email addresses',
                        accuracy_rate: '97%',
                        supportedOperations: [
                            'find-email', 'enrich-person', 'enrich-company',
                            'search-people', 'search-companies'
                        ]
                    },
                },
                {
                    name: 'betterenrich',
                    displayName: 'BetterEnrich',
                    category: 'email-finder',
                    baseUrl: 'https://api.enrich.so/v1',
                    rateLimit: 30,
                    dailyQuota: 5000,
                    isActive: true,
                    configuration: {
                        features_count: 20,
                        categories: ['enrichment', 'email-finder', 'phone-finder', 'ad-intelligence', 'social-enrichment'],
                    },
                },
                {
                    name: 'companyenrich',
                    displayName: 'CompanyEnrich',
                    category: 'company-data',
                    baseUrl: 'https://api.companyenrich.com',
                    rateLimit: 300,
                    dailyQuota: 10000,
                    isActive: true,
                    configuration: {
                        features: ['company-enrichment'],
                        focus: 'domain-based company enrichment',
                        dataQuality: 'high',
                    },
                },
            ];
            // Create providers
            for (const providerData of providers) {
                await prisma_1.default.provider.upsert({
                    where: { name: providerData.name },
                    update: {
                        displayName: providerData.displayName,
                        isActive: providerData.isActive,
                        // FIX: Stringify the configuration object
                        configuration: JSON.stringify(providerData.configuration),
                    },
                    // FIX: Stringify the configuration object on create
                    create: {
                        ...providerData,
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
            // Don't throw - let the app continue even if seeding fails
        }
    }
    static async seedProviderFeatures() {
        // Get created providers
        const surfe = await prisma_1.default.provider.findUnique({ where: { name: 'surfe' } });
        const apollo = await prisma_1.default.provider.findUnique({ where: { name: 'apollo' } });
        const hunter = await prisma_1.default.provider.findUnique({ where: { name: 'hunter' } });
        const betterenrich = await prisma_1.default.provider.findUnique({ where: { name: 'betterenrich' } });
        const companyenrich = await prisma_1.default.provider.findUnique({ where: { name: 'companyenrich' } });
        // Seed features for each provider
        if (surfe) {
            await this.seedSurfeFeatures(surfe.id);
        }
        if (apollo) {
            await this.seedApolloFeatures(apollo.id);
        }
        if (hunter) {
            await this.seedHunterFeatures(hunter.id);
        }
        if (betterenrich) {
            await this.seedBetterEnrichFeatures(betterenrich.id);
        }
        if (companyenrich) {
            await this.seedCompanyEnrichFeatures(companyenrich.id);
        }
    }
    static async seedSurfeFeatures(providerId) {
        const features = [
            {
                featureId: 'people-search',
                featureName: 'People Search',
                category: 'search',
                endpoint: '/v2/people/search',
                creditsPerRequest: 1,
            },
            {
                featureId: 'people-enrich',
                featureName: 'People Enrichment',
                category: 'enrichment',
                endpoint: '/v2/people/enrich',
                creditsPerRequest: 2,
            },
            {
                featureId: 'company-search',
                featureName: 'Company Search',
                category: 'search',
                endpoint: '/v2/companies/search',
                creditsPerRequest: 1,
            },
            {
                featureId: 'company-enrich',
                featureName: 'Company Enrichment',
                category: 'enrichment',
                endpoint: '/v2/companies/enrich',
                creditsPerRequest: 3,
            },
            {
                featureId: 'company-lookalike',
                featureName: 'Company Lookalike',
                category: 'lookalike',
                endpoint: '/v1/organizations/lookalikes',
                creditsPerRequest: 5,
            },
        ];
        for (const feature of features) {
            await prisma_1.default.providerFeature.upsert({
                where: {
                    providerId_featureId: {
                        providerId,
                        featureId: feature.featureId
                    }
                },
                update: {},
                create: {
                    ...feature,
                    providerId,
                    isActive: true
                },
            });
        }
    }
    static async seedApolloFeatures(providerId) {
        const features = [
            {
                featureId: 'people-search',
                featureName: 'People Search',
                category: 'search',
                endpoint: '/v1/mixed_people/search',
                creditsPerRequest: 1,
            },
            {
                featureId: 'people-enrich',
                featureName: 'People Enrichment',
                category: 'enrichment',
                endpoint: '/v1/people/match',
                creditsPerRequest: 1,
            },
            {
                featureId: 'company-search',
                featureName: 'Company Search',
                category: 'search',
                endpoint: '/v1/mixed_companies/search',
                creditsPerRequest: 1,
            },
            {
                featureId: 'company-enrich',
                featureName: 'Company Enrichment',
                category: 'enrichment',
                endpoint: '/v1/organizations/enrich',
                creditsPerRequest: 1,
            },
            {
                featureId: 'company-lookalike',
                featureName: 'Company Lookalike',
                category: 'lookalike',
                endpoint: '/v1/mixed_companies/search',
                creditsPerRequest: 2,
            },
        ];
        for (const feature of features) {
            await prisma_1.default.providerFeature.upsert({
                where: {
                    providerId_featureId: {
                        providerId,
                        featureId: feature.featureId
                    }
                },
                update: {},
                create: {
                    ...feature,
                    providerId,
                    isActive: true
                },
            });
        }
    }
    static async seedHunterFeatures(providerId) {
        const features = [
            {
                featureId: 'email-finder',
                featureName: 'Email Finder',
                category: 'email-finder',
                endpoint: '/v2/email-finder',
                creditsPerRequest: 1,
            },
            {
                featureId: 'domain-search',
                featureName: 'Domain Search',
                category: 'search',
                endpoint: '/v2/domain-search',
                creditsPerRequest: 1,
            },
            {
                featureId: 'email-verifier',
                featureName: 'Email Verifier',
                category: 'verification',
                endpoint: '/v2/email-verifier',
                creditsPerRequest: 1,
            },
            {
                featureId: 'people-finder',
                featureName: 'People Finder',
                category: 'enrichment',
                endpoint: '/v2/people/find',
                creditsPerRequest: 1,
            },
            {
                featureId: 'company-finder',
                featureName: 'Company Finder',
                category: 'enrichment',
                endpoint: '/v2/companies/find',
                creditsPerRequest: 1,
            },
            {
                featureId: 'combined-finder',
                featureName: 'Combined Finder',
                category: 'enrichment',
                endpoint: '/v2/combined/find',
                creditsPerRequest: 2,
            },
        ];
        for (const feature of features) {
            await prisma_1.default.providerFeature.upsert({
                where: {
                    providerId_featureId: {
                        providerId,
                        featureId: feature.featureId
                    }
                },
                update: {},
                create: {
                    ...feature,
                    providerId,
                    isActive: true
                },
            });
        }
    }
    static async seedBetterEnrichFeatures(providerId) {
        const features = [
            // Standard operations that map to BetterEnrich features
            {
                featureId: 'find-email',
                featureName: 'Find Email',
                category: 'email-finder',
                endpoint: '/email/work',
                creditsPerRequest: 1,
            },
            {
                featureId: 'enrich-person',
                featureName: 'Person Enrichment',
                category: 'enrichment',
                endpoint: '/enrichment/single',
                creditsPerRequest: 1,
            },
            {
                featureId: 'enrich-company',
                featureName: 'Company Enrichment',
                category: 'enrichment',
                endpoint: '/normalize/company',
                creditsPerRequest: 0.1,
            },
            // BetterEnrich-specific advanced features
            {
                featureId: 'waterfall-enrichment',
                featureName: 'Waterfall Enrichment',
                category: 'enrichment',
                endpoint: '/enrichment/waterfall',
                creditsPerRequest: 3,
            },
            {
                featureId: 'find-linkedin-email',
                featureName: 'Find Email from LinkedIn',
                category: 'email-finder',
                endpoint: '/email/linkedin',
                creditsPerRequest: 1,
            },
            {
                featureId: 'find-mobile-phone',
                featureName: 'Find Mobile Phone',
                category: 'phone-finder',
                endpoint: '/phone/mobile',
                creditsPerRequest: 2,
            },
            {
                featureId: 'check-google-ads',
                featureName: 'Google Ads Intelligence',
                category: 'ad-intelligence',
                endpoint: '/ads/google/check',
                creditsPerRequest: 1,
            },
            {
                featureId: 'find-social-urls',
                featureName: 'Find Social URLs',
                category: 'social-enrichment',
                endpoint: '/social/website',
                creditsPerRequest: 1,
            },
        ];
        for (const feature of features) {
            await prisma_1.default.providerFeature.upsert({
                where: {
                    providerId_featureId: {
                        providerId,
                        featureId: feature.featureId
                    }
                },
                update: {},
                create: {
                    ...feature,
                    providerId,
                    isActive: true
                },
            });
        }
    }
    static async seedCompanyEnrichFeatures(providerId) {
        const features = [
            {
                featureId: 'company-enrichment',
                featureName: 'Company Enrichment',
                category: 'enrichment',
                endpoint: '/enrich/company',
                creditsPerRequest: 1,
            },
        ];
        for (const feature of features) {
            await prisma_1.default.providerFeature.upsert({
                where: {
                    providerId_featureId: {
                        providerId,
                        featureId: feature.featureId
                    }
                },
                update: {},
                create: {
                    ...feature,
                    providerId,
                    isActive: true
                },
            });
        }
    }
}
exports.AutoSeedService = AutoSeedService;
//# sourceMappingURL=AutoSeedService.js.map