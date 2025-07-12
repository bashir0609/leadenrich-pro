import { EnrichmentProvider } from '../../types/providers';
import { SurfeProvider } from './implementations/SurfeProvider';

class ProviderRegistry {
  private providers: Map<string, EnrichmentProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // In the future, we will load these from the database
    const surfeProvider = new SurfeProvider();
    this.register(surfeProvider);

    // Register other providers here later
    // const apolloProvider = new ApolloProvider();
    // this.register(apolloProvider);
  }

  public register(provider: EnrichmentProvider) {
    this.providers.set(provider.name, provider);
    console.log(`✅ Provider registered: ${provider.name}`);
  }

  public getProvider(name: string): EnrichmentProvider | undefined {
    return this.providers.get(name);
  }

  public getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Export a singleton instance
export const providerRegistry = new ProviderRegistry();