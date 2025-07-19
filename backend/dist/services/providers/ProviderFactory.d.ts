import { BaseProvider } from './base/BaseProvider';
import { ProviderCategory } from '@/types/providers';
export declare class ProviderFactory {
    static getProvider(providerId: string): Promise<BaseProvider>;
    static getProvidersByCategory(category: ProviderCategory): Promise<BaseProvider[]>;
}
