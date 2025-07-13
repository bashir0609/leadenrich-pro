import { PrismaClient } from '@prisma/client';
import crypto from 'crypto-js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding LeadEnrich Pro database...');

  // Encryption key from env
  const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-this';

  // Clear existing data in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Clearing existing data...');
    await prisma.jobLog.deleteMany();
    await prisma.enrichmentJob.deleteMany();
    await prisma.apiUsage.deleteMany();
    await prisma.providerFeature.deleteMany();
    await prisma.provider.deleteMany();
    await prisma.systemConfig.deleteMany();
  }

  // System Configuration
  console.log('⚙️ Creating system configuration...');
  await prisma.systemConfig.upsert({
    where: { key: 'api_version' },
    update: {},
    create: {
      key: 'api_version',
      value: { version: '1.0.0', build: Date.now() },
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'default_rate_limits' },
    update: {},
    create: {
      key: 'default_rate_limits',
      value: {
        requestsPerSecond: 10,
        burstSize: 20,
        dailyQuota: 2000,
      },
    },
  });

  // Seed Surfe provider
  console.log('🔌 Creating Surfe provider...');
  const surfe = await prisma.provider.upsert({
    where: { name: 'surfe' },
    update: {},
    create: {
      name: 'surfe',
      displayName: 'Surfe',
      category: 'major-database',
      baseUrl: 'https://api.surfe.com',
      apiKeyEncrypted: process.env.SURFE_API_KEY 
        ? crypto.AES.encrypt(process.env.SURFE_API_KEY, encryptionKey).toString()
        : null,
      rateLimit: 10,
      dailyQuota: 2000,
      isActive: true,
      configuration: {
        version: 'v2',
        features: ['people', 'companies', 'enrichment'],
        timeout: 30000,
        retryAttempts: 3,
      },
    },
  });

  const apollo = await prisma.provider.upsert({
    where: { name: 'apollo' },
    update: {},
    create: {
      name: 'apollo',
      displayName: 'Apollo.io',
      category: 'major-database',
      baseUrl: 'https://api.apollo.io/v1',
      apiKeyEncrypted: process.env.APOLLO_API_KEY 
        ? crypto.AES.encrypt(process.env.APOLLO_API_KEY, encryptionKey).toString()
        : null,
      rateLimit: 50,
      dailyQuota: 10000,
      isActive: true,
      configuration: {
        database_size: '275M contacts',
        strengths: ['US data', 'Technology companies', 'Sales intelligence'],
      },
    },
  });

  // Seed BetterEnrich provider
  const betterEnrich = await prisma.provider.upsert({
    where: { name: 'betterenrich' },
    update: {},
    create: {
      name: 'betterenrich',
      displayName: 'BetterEnrich',
      category: 'email-finder',
      baseUrl: 'https://api.betterenrich.com/v1',
      apiKeyEncrypted: process.env.BETTERENRICH_API_KEY 
        ? crypto.AES.encrypt(process.env.BETTERENRICH_API_KEY, encryptionKey).toString()
        : null,
      rateLimit: 30,
      dailyQuota: 5000,
      isActive: true,
      configuration: {
        features_count: 20,
        categories: ['enrichment', 'email-finder', 'phone-finder', 'ad-intelligence', 'social-enrichment'],
      },
    },
  });
  
  // Seed Surfe features
  console.log('✨ Creating Surfe features...');
  const surfeFeatures = [
    {
      featureId: 'people-search',
      featureName: 'People Search',
      category: 'search',
      endpoint: '/v2/people/search',
      httpMethod: 'POST',
      creditsPerRequest: 5,
      description: 'Search for people based on various criteria',
      parameters: {
        required: ['query'],
        optional: ['location', 'company', 'title'],
      },
    },
    {
      featureId: 'people-enrich',
      featureName: 'People Enrichment',
      category: 'enrichment',
      endpoint: '/v2/people/enrich',
      httpMethod: 'POST',
      creditsPerRequest: 2,
      description: 'Enrich person data with additional information',
      parameters: {
        required: [],
        optional: ['email', 'linkedInUrl', 'include'],
      },
    },
    {
      featureId: 'company-search',
      featureName: 'Company Search',
      category: 'search',
      endpoint: '/v2/companies/search',
      httpMethod: 'POST',
      creditsPerRequest: 5,
      description: 'Search for companies',
      parameters: {
        required: ['query'],
        optional: ['location', 'industry', 'size'],
      },
    },
    {
      featureId: 'company-enrich',
      featureName: 'Company Enrichment',
      category: 'enrichment',
      endpoint: '/v2/companies/enrich',
      httpMethod: 'POST',
      creditsPerRequest: 2,
      description: 'Enrich company data',
      parameters: {
        required: [],
        optional: ['domain', 'companyName'],
      },
    },
    {
      featureId: 'company-lookalike',
      featureName: 'Company Lookalike',
      category: 'lookalike',
      endpoint: '/v1/organizations/lookalikes',
      httpMethod: 'POST',
      creditsPerRequest: 10,
      description: 'Find companies similar to a given company',
      parameters: {
        required: ['companyDomain'],
        optional: ['size', 'location', 'industry'],
      },
    },
  ];

  for (const feature of surfeFeatures) {
    await prisma.providerFeature.upsert({
      where: {
        providerId_featureId: {
          providerId: surfe.id,
          featureId: feature.featureId,
        },
      },
      update: {},
      create: {
        ...feature,
        providerId: surfe.id,
        isActive: true,
      },
    });
  }

  // Create additional mock providers for testing
  console.log('🧪 Creating mock providers...');
  
  const mockProviders = [
    {
      name: 'apollo',
      displayName: 'Apollo',
      category: 'major-database',
      baseUrl: 'https://api.apollo.io',
      rateLimit: 15,
      dailyQuota: 5000,
    },
    {
      name: 'zoominfo',
      displayName: 'ZoomInfo',
      category: 'major-database',
      baseUrl: 'https://api.zoominfo.com',
      rateLimit: 20,
      dailyQuota: 10000,
    },
    {
      name: 'hunter',
      displayName: 'Hunter.io',
      category: 'email-finder',
      baseUrl: 'https://api.hunter.io',
      rateLimit: 25,
      dailyQuota: 1000,
    },
  ];

  for (const provider of mockProviders) {
    await prisma.provider.upsert({
      where: { name: provider.name },
      update: {},
      create: {
        ...provider,
        isActive: false, // Keep inactive for now
        configuration: {
          version: 'v1',
          placeholder: true,
        },
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created ${surfeFeatures.length} Surfe features`);
  console.log(`🏢 Created ${mockProviders.length + 1} providers`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  });