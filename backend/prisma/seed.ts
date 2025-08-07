// backend/prisma/seed.ts
import crypto from 'crypto-js';
import * as process from 'process';
import prisma from '../src/lib/prisma';
// const prisma = new PrismaClient();

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
      value: JSON.stringify({ version: '1.0.0', build: Date.now() }),
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'default_rate_limits' },
    update: {},
    create: {
      key: 'default_rate_limits',
      value: JSON.stringify({
        requestsPerSecond: 10,
        burstSize: 20,
        dailyQuota: 2000,
      }),
    },
  });

  // Seed Surfe provider
  console.log('🔌 Creating Surfe provider...');
  const surfe = await prisma.provider.upsert({
    where: { name: 'surfe' },
    update: {
      baseUrl: 'https://api.surfe.com',
      configuration: JSON.stringify({
        version: 'v2',
        features: ['people', 'companies', 'enrichment', 'lookalike'],
        timeout: 30000,
        retryAttempts: 3,
        asyncEnrichment: true,
        supportedOperations: [
          'find-email', 'enrich-person', 'enrich-company',
          'search-people', 'search-companies', 'find-lookalike'
        ]
      }),
    },
    create: {
      name: 'surfe',
      displayName: 'Surfe',
      category: 'major-database',
      baseUrl: 'https://api.surfe.com',
      rateLimit: 10,
      dailyQuota: 2000,
      isActive: true,
      configuration: JSON.stringify({
        version: 'v2',
        features: ['people', 'companies', 'enrichment', 'lookalike'],
        timeout: 30000,
        retryAttempts: 3,
        asyncEnrichment: true,
        supportedOperations: [
          'find-email', 'enrich-person', 'enrich-company',
          'search-people', 'search-companies', 'find-lookalike'
        ]
      }),
    },
  });

  // Create Apollo provider
  const apollo = await prisma.provider.upsert({
    where: { name: 'apollo' },
    update: {
      baseUrl: 'https://api.apollo.io',
      configuration: JSON.stringify({
        version: 'v1',
        features: ['people', 'companies', 'enrichment'],
        timeout: 30000,
        retryAttempts: 3,
        strengths: ['US data', 'Technology companies', 'Sales intelligence'],
        supportedOperations: [
          'search-people', 'search-companies', 'enrich-person', 'enrich-company'
        ]
      }),
    },
    create: {
      name: 'apollo',
      displayName: 'Apollo.io',
      category: 'major-database',
      baseUrl: 'https://api.apollo.io',
      rateLimit: 50,
      dailyQuota: 10000,
      isActive: true,
      configuration: JSON.stringify({
        version: 'v1',
        features: ['people', 'companies', 'enrichment'],
        timeout: 30000,
        retryAttempts: 3,
        strengths: ['US data', 'Technology companies', 'Sales intelligence'],
        supportedOperations: [
          'search-people', 'search-companies', 'enrich-person', 'enrich-company'
        ]
      }),
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
      rateLimit: 30,
      dailyQuota: 5000,
      isActive: true,
      configuration: JSON.stringify({
        features_count: 20,
        categories: ['enrichment', 'email-finder', 'phone-finder', 'ad-intelligence', 'social-enrichment'],
      }),
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
      creditsPerRequest: 1, // Fixed: Surfe charges 1 credit for search
      description: 'Search for people based on company, title, and other criteria',
      parameters: {
        required: [],
        optional: ['companies', 'people', 'limit', 'pageToken'],
      },
    },
    {
      featureId: 'people-enrich',
      featureName: 'People Enrichment',
      category: 'enrichment',
      endpoint: '/v2/people/enrich',
      httpMethod: 'POST',
      creditsPerRequest: 2, // Correct: 2 credits for enrichment
      description: 'Enrich person data with email, phone, LinkedIn (async)',
      parameters: {
        required: ['people'],
        optional: ['include', 'notificationOptions'],
      },
    },
    {
      featureId: 'company-search',
      featureName: 'Company Search',
      category: 'search',
      endpoint: '/v2/companies/search',
      httpMethod: 'POST',
      creditsPerRequest: 1, // Fixed: 1 credit for search
      description: 'Search for companies by industry, size, and location',
      parameters: {
        required: [],
        optional: ['filters', 'limit', 'pageToken'],
      },
    },
    {
      featureId: 'company-enrich',
      featureName: 'Company Enrichment',
      category: 'enrichment',
      endpoint: '/v2/companies/enrich',
      httpMethod: 'POST',
      creditsPerRequest: 3, // Fixed: 3 credits for company enrichment
      description: 'Enrich company data with firmographics, funding (async)',
      parameters: {
        required: ['companies'],
        optional: ['notificationOptions'],
      },
    },
    {
      featureId: 'company-lookalike',
      featureName: 'Company Lookalike',
      category: 'lookalike',
      endpoint: '/v1/organizations/lookalikes',
      httpMethod: 'POST',
      creditsPerRequest: 5, // Fixed: 5 credits for lookalike
      description: 'Find companies similar to given companies',
      parameters: {
        required: [],
        optional: ['domains', 'names', 'filters', 'maxResults'],
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
      update: {
        parameters: JSON.stringify(feature.parameters)
      },
      create: {
        providerId: surfe.id,
        featureId: feature.featureId,
        featureName: feature.featureName,
        category: feature.category,
        endpoint: feature.endpoint,
        httpMethod: feature.httpMethod,
        creditsPerRequest: feature.creditsPerRequest,
        description: feature.description,
        // <<< FIX: Convert object to JSON string
        parameters: JSON.stringify(feature.parameters),
        isActive: true,
      },
    });
  }

  // Seed Apollo features
  console.log('✨ Creating Apollo features...');
  const apolloFeatures = [
    {
      featureId: 'people-search',
      featureName: 'People Search',
      category: 'search',
      endpoint: '/api/v1/mixed_people/search',
      httpMethod: 'POST',
      creditsPerRequest: 1,
      description: 'Search for people based on company, title, and other criteria',
      parameters: {
        required: [],
        optional: ['person_titles', 'person_seniorities', 'person_departments', 'organization_domains', 'organization_names', 'organization_industries', 'limit', 'page'],
      },
    },
    {
      featureId: 'company-search',
      featureName: 'Company Search',
      category: 'search',
      endpoint: '/api/v1/mixed_companies/search',
      httpMethod: 'POST',
      creditsPerRequest: 1,
      description: 'Search for companies by industry, size, and location',
      parameters: {
        required: [],
        optional: ['organization_domains', 'organization_industries', 'organization_num_employees_ranges', 'limit', 'page'],
      },
    },
    {
      featureId: 'people-enrich',
      featureName: 'People Enrichment',
      category: 'enrichment',
      endpoint: '/api/v1/people/enrich',
      httpMethod: 'POST',
      creditsPerRequest: 2,
      description: 'Enrich person data with email, phone, LinkedIn',
      parameters: {
        required: ['first_name', 'last_name'],
        optional: ['email', 'organization_name', 'domain'],
      },
    },
    {
      featureId: 'company-enrich',
      featureName: 'Company Enrichment',
      category: 'enrichment',
      endpoint: '/api/v1/organizations/enrich',
      httpMethod: 'POST',
      creditsPerRequest: 3,
      description: 'Enrich company data with firmographics, funding',
      parameters: {
        required: [],
        optional: ['organization_name', 'domain'],
      },
    },
  ];

  for (const feature of apolloFeatures) {
    await prisma.providerFeature.upsert({
      where: {
        providerId_featureId: {
          providerId: apollo.id,
          featureId: feature.featureId,
        },
      },
      update: {
        parameters: JSON.stringify(feature.parameters)
      },
      create: {
        providerId: apollo.id,
        featureId: feature.featureId,
        featureName: feature.featureName,
        category: feature.category,
        endpoint: feature.endpoint,
        httpMethod: feature.httpMethod,
        creditsPerRequest: feature.creditsPerRequest,
        description: feature.description,
        parameters: JSON.stringify(feature.parameters),
        isActive: true,
      },
    });
  }

  // Create additional mock providers for testing
  console.log('🧪 Creating mock providers...');
  
  const mockProviders = [
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
        name: provider.name,
        displayName: provider.displayName,
        category: provider.category,
        baseUrl: provider.baseUrl,
        rateLimit: provider.rateLimit,
        dailyQuota: provider.dailyQuota,
        isActive: false, // Keep inactive for now
        // <<< FIX: Convert object to JSON string
        configuration: JSON.stringify({
          version: 'v1',
          placeholder: true,
        }),
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
    console.log('🔌 Database connection closed');
  });