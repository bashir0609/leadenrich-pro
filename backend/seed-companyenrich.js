const { PrismaClient } = require('@prisma/client');

async function seedCompanyEnrich() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🌱 Seeding CompanyEnrich provider...\n');
    
    // Create CompanyEnrich provider
    const provider = await prisma.provider.upsert({
      where: { name: 'companyenrich' },
      update: {
        displayName: 'CompanyEnrich',
        category: 'company-data',
        baseUrl: 'https://api.companyenrich.com',
        rateLimit: 300,
        dailyQuota: 10000,
        isActive: true,
        configuration: JSON.stringify({
          features: ['company-enrichment'],
          focus: 'domain-based company enrichment',
          dataQuality: 'high',
        }),
      },
      create: {
        name: 'companyenrich',
        displayName: 'CompanyEnrich',
        category: 'company-data',
        baseUrl: 'https://api.companyenrich.com',
        rateLimit: 300,
        dailyQuota: 10000,
        isActive: true,
        configuration: JSON.stringify({
          features: ['company-enrichment'],
          focus: 'domain-based company enrichment',
          dataQuality: 'high',
        }),
      },
    });
    
    console.log(`✅ CompanyEnrich provider created/updated (ID: ${provider.id})`);
    
    // Create CompanyEnrich features
    const features = [
      {
        featureId: 'company-enrichment',
        featureName: 'Company Enrichment',
        category: 'enrichment',
        endpoint: '/companies/enrich',
        creditsPerRequest: 1,
      },
    ];

    console.log(`\n📋 Creating ${features.length} features for CompanyEnrich...`);
    
    for (const feature of features) {
      const result = await prisma.providerFeature.upsert({
        where: {
          providerId_featureId: {
            providerId: provider.id,
            featureId: feature.featureId
          }
        },
        update: {
          featureName: feature.featureName,
          category: feature.category,
          endpoint: feature.endpoint,
          creditsPerRequest: feature.creditsPerRequest,
          isActive: true
        },
        create: {
          ...feature,
          providerId: provider.id,
          isActive: true
        },
      });
      
      console.log(`   ✅ ${feature.featureName} (${feature.featureId})`);
    }
    
    console.log(`\n🎉 Successfully seeded CompanyEnrich provider with ${features.length} features!`);
    console.log('\n📊 CompanyEnrich Details:');
    console.log(`   - Base URL: ${provider.baseUrl}`);
    console.log(`   - Rate Limit: ${provider.rateLimit} requests/minute`);
    console.log(`   - Daily Quota: ${provider.dailyQuota} requests`);
    console.log(`   - Authentication: Basic Auth with API key`);
    console.log(`   - Focus: Domain-based company enrichment`);
    
  } catch (error) {
    console.error('❌ Error seeding CompanyEnrich:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCompanyEnrich();
