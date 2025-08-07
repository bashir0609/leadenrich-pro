import { logger } from '../utils/logger'; // Adjusted path
import prisma from '../lib/prisma';

export class ProviderService {
  static async ensureProvidersExist(): Promise<void> {
    try {
      // Check if providers already exist
      const existingProviders = await prisma.provider.count();

      if (existingProviders > 0) {
        logger.info(`✅ Found ${existingProviders} existing providers, skipping auto-seed`);
        return;
      }

      logger.info('🌱 No providers found, auto-seeding database...');

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
        await prisma.provider.upsert({
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
        logger.info(`✅ Auto-seeded provider: ${providerData.displayName}`);
      }

      // Seed provider features
      await this.seedProviderFeatures();

      logger.info(`🎉 Auto-seed completed: ${providers.length} providers created`);

    } catch (error) {
      logger.error('❌ Auto-seed failed:', error);
    }
  }

  // ... (the rest of your seedProviderFeatures methods are correct) ...
  private static async seedProviderFeatures(): Promise<void> {
    // ...
  }
  private static async seedSurfeFeatures(providerId: number): Promise<void> {
    // ...
  }
  private static async seedApolloFeatures(providerId: number): Promise<void> {
    // ...
  }
  private static async seedHunterFeatures(providerId: number): Promise<void> {
    // ...
  }
}