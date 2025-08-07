import { ProviderOperation } from '../types/providers';
import { BaseProvider } from '../services/providers/base/BaseProvider';
export interface ProviderMetrics {
    providerId: string;
    displayName: string;
    successRate: number;
    averageResponseTime: number;
    creditsPerOperation: Record<string, number>;
    totalRequests: number;
    failureReasons: Record<string, number>;
    dataQuality: number;
}
export interface ComparisonResult {
    operation: ProviderOperation;
    providers: ProviderComparison[];
    recommendation: string;
}
export interface ProviderComparison {
    provider: string;
    metrics: {
        successRate: number;
        responseTime: number;
        creditCost: number;
        dataCompleteness: number;
    };
    pros: string[];
    cons: string[];
    bestFor: string[];
}
export declare class ProviderComparisonService {
    static getProviderMetrics(providerId: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<ProviderMetrics>;
    static compareProviders(operation: ProviderOperation, providerIds?: string[]): Promise<ComparisonResult>;
    /**
     * Get provider instances for all active providers or specified providers
     * @param providerIds Optional list of provider IDs to get instances for
     * @param userId The ID of the user requesting the instances // <<< ADDED DOCS
     * @returns Array of BaseProvider instances
     */
    static getProviderInstances(providerIds: string[] | undefined, userId: string): Promise<BaseProvider[]>;
    private static calculateProviderScore;
    private static getOperationCost;
    private static getProviderPros;
    private static getProviderCons;
    private static getProviderBestUses;
    private static generateRecommendation;
}
//# sourceMappingURL=ProviderComparisonService.d.ts.map