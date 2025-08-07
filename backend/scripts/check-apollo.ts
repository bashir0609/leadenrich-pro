import prisma from '../src/lib/prisma';

async function checkApolloProvider() {
  try {
    // Get Apollo provider
    const apollo = await prisma.provider.findUnique({
      where: { name: 'apollo' },
      include: { features: true }
    });

    if (!apollo) {
      console.error('❌ Apollo provider not found in database');
      return;
    }

    console.log('✅ Found Apollo provider:');
    console.log(`- Name: ${apollo.name}`);
    console.log(`- Display Name: ${apollo.displayName}`);
    console.log(`- Is Active: ${apollo.isActive}`);
    console.log(`- Rate Limit: ${apollo.rateLimit}`);
    console.log(`- Daily Quota: ${apollo.dailyQuota}`);
    
    // Parse configuration
    const config = JSON.parse(apollo.configuration as string);
    console.log('\n📋 Configuration:');
    console.log('- Version:', config.version);
    console.log('- Features:', config.features?.join(', '));
    console.log('- Supported Operations:', config.supportedOperations?.join(', '));
    
    // List features
    console.log('\n🔧 Features:');
    apollo.features.forEach(feature => {
      console.log(`\n- ${feature.featureName} (${feature.featureId})`);
      console.log(`  Category: ${feature.category}`);
      console.log(`  Endpoint: ${feature.endpoint}`);
      console.log(`  HTTP Method: ${feature.httpMethod}`);
      console.log(`  Credits: ${feature.creditsPerRequest}`);
      console.log(`  Active: ${feature.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error checking Apollo provider:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApolloProvider();
