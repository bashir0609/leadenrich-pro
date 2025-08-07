import { BaseProvider } from './base/BaseProvider';
import { ProviderConfig } from '../../types/providers';
export declare class ProviderRegistry {
    private static providers;
    private static instances;
    static register(providerId: string, providerClass: new (config: ProviderConfig) => BaseProvider): void;
    static getInstance(providerId: string, config: ProviderConfig, userId: string): Promise<BaseProvider>;
    /**
     * Clears a cached provider instance for a specific user.
     * This is crucial for when API keys are updated or deleted.
     * @param providerId The string name of the provider (e.g., "surfe")
     * @param userId The ID of the user whose cache should be cleared
     */
    static clearInstance(providerId: string, userId: string): void;
    static getRegisteredProviders(): string[];
    static clearInstances(): void;
    static getDebugInfo(): any;
}
//# sourceMappingURL=ProviderRegistry.d.ts.map