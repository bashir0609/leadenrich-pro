import { ProviderOperation } from '../types/providers';
export interface WaterfallConfig {
    operation: ProviderOperation;
    providers: WaterfallStep[];
    stopOnSuccess: boolean;
    qualityThreshold?: number;
    timeout?: number;
}
export interface WaterfallStep {
    providerId: string;
    priority: number;
    weight?: number;
    skipConditions?: SkipCondition[];
}
export interface SkipCondition {
    field: string;
    operator: 'exists' | 'equals' | 'not_equals';
    value?: any;
}
export interface WaterfallResult {
    success: boolean;
    data: any;
    providersUsed: string[];
    creditsUsed: number;
    duration: number;
    attempts: WaterfallAttempt[];
}
export interface WaterfallAttempt {
    provider: string;
    success: boolean;
    data?: any;
    error?: string;
    credits: number;
    duration: number;
}
export declare class WaterfallService {
    static execute(config: WaterfallConfig, params: any, userId: string): Promise<WaterfallResult>;
    private static shouldSkipProvider;
    private static mergeData;
    private static calculateDataQuality;
    private static getNestedValue;
}
export declare const WATERFALL_CONFIGS: {
    EMAIL_FINDER: {
        operation: ProviderOperation;
        providers: {
            providerId: string;
            priority: number;
        }[];
        stopOnSuccess: boolean;
        qualityThreshold: number;
    };
    PERSON_ENRICHMENT: {
        operation: ProviderOperation;
        providers: {
            providerId: string;
            priority: number;
            weight: number;
        }[];
        stopOnSuccess: boolean;
    };
    COMPANY_ENRICHMENT: {
        operation: ProviderOperation;
        providers: {
            providerId: string;
            priority: number;
        }[];
        stopOnSuccess: boolean;
        qualityThreshold: number;
    };
};
//# sourceMappingURL=WaterfallService.d.ts.map