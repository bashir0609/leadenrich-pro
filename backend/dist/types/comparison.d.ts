import { ProviderOperation } from './providers';
/**
 * Represents comparison metrics for a provider
 */
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
/**
 * Represents a provider in comparison results
 */
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
/**
 * Results of a provider comparison
 */
export interface ComparisonResult {
    operation: ProviderOperation;
    providers: ProviderComparison[];
    recommendation: string;
}
