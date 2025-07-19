import { BaseProvider } from './base/BaseProvider';
import { ProviderConfig } from '@/types/providers';
export declare class ProviderRegistry {
    private static providers;
    private static instances;
    static register(providerId: string, providerClass: new (config: ProviderConfig) => BaseProvider): void;
    static getInstance(providerId: string, config: ProviderConfig): Promise<BaseProvider>;
    static getRegisteredProviders(): string[];
    static clearInstances(): void;
    static getDebugInfo(): any;
}
