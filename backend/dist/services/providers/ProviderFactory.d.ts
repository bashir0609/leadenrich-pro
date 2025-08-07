import { BaseProvider } from './base/BaseProvider';
import { ProviderCategory } from '../../types/providers';
export declare class ProviderFactory {
    static getProvider(providerId: string, userId: string): Promise<BaseProvider>;
    static getProvidersByCategory(category: ProviderCategory, userId: string): Promise<BaseProvider[]>;
}
//# sourceMappingURL=ProviderFactory.d.ts.map