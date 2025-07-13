import { ProviderFactory } from './providers/ProviderFactory';
import { logger } from '@/utils/logger';
import { CustomError, ErrorCode } from '@/types/errors';
import { ProviderOperation, ProviderResponse } from '@/types/providers';

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

export class WaterfallService {
  static async execute(
    config: WaterfallConfig,
    params: any
  ): Promise<WaterfallResult> {
    const startTime = Date.now();
    const attempts: WaterfallAttempt[] = [];
    const providersUsed: string[] = [];
    let totalCredits = 0;
    let finalData: any = null;

    // Sort providers by priority
    const sortedSteps = [...config.providers].sort((a, b) => a.priority - b.priority);

    for (const step of sortedSteps) {
      // Check skip conditions
      if (this.shouldSkipProvider(step, finalData)) {
        logger.info(`Skipping provider ${step.providerId} due to conditions`);
        continue;
      }

      try {
        const provider = await ProviderFactory.getProvider(step.providerId);
        const attemptStart = Date.now();

        const result = await provider.execute({
          operation: config.operation,
          params,
          options: {
            timeout: config.timeout,
          },
        });

        const attempt: WaterfallAttempt = {
          provider: step.providerId,
          success: result.success,
          data: result.data,
          error: result.error?.message,
          credits: result.metadata.creditsUsed,
          duration: Date.now() - attemptStart,
        };

        attempts.push(attempt);
        totalCredits += result.metadata.creditsUsed;

        if (result.success) {
          providersUsed.push(step.providerId);
          
          // Merge data
          finalData = this.mergeData(finalData, result.data, step.weight);

          // Check if we should stop
          if (config.stopOnSuccess) {
            const quality = this.calculateDataQuality(finalData);
            if (!config.qualityThreshold || quality >= config.qualityThreshold) {
              break;
            }
          }
        }
      } catch (error) {
        logger.error(`Waterfall error for provider ${step.providerId}:`, error);
        
        attempts.push({
          provider: step.providerId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          credits: 0,
          duration: 0,
        });
      }
    }

    return {
      success: finalData !== null,
      data: finalData,
      providersUsed,
      creditsUsed: totalCredits,
      duration: Date.now() - startTime,
      attempts,
    };
  }

  private static shouldSkipProvider(
    step: WaterfallStep,
    currentData: any
  ): boolean {
    if (!step.skipConditions || !currentData) {
      return false;
    }

    return step.skipConditions.some((condition) => {
      const value = this.getNestedValue(currentData, condition.field);
      
      switch (condition.operator) {
        case 'exists':
          return value !== null && value !== undefined;
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        default:
          return false;
      }
    });
  }

  private static mergeData(existing: any, newData: any, weight: number = 1): any {
    if (!existing) {
      return newData;
    }

    const merged = { ...existing };

    // Simple merge strategy - can be enhanced
    Object.entries(newData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (!merged[key] || weight > 0.5) {
          merged[key] = value;
        }
      }
    });

    return merged;
  }

  private static calculateDataQuality(data: any): number {
    if (!data) return 0;

    const fields = Object.keys(data);
    const filledFields = fields.filter(
      (field) => data[field] !== null && data[field] !== undefined && data[field] !== ''
    );

    return (filledFields.length / fields.length) * 100;
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// Predefined waterfall configurations
export const WATERFALL_CONFIGS = {
  EMAIL_FINDER: {
    operation: ProviderOperation.FIND_EMAIL,
    providers: [
      { providerId: 'hunter', priority: 1 },
      { providerId: 'apollo', priority: 2 },
      { providerId: 'betterenrich', priority: 3 },
      { providerId: 'surfe', priority: 4 },
    ],
    stopOnSuccess: true,
    qualityThreshold: 90,
  },
  PERSON_ENRICHMENT: {
    operation: ProviderOperation.ENRICH_PERSON,
    providers: [
      { providerId: 'apollo', priority: 1, weight: 0.8 },
      { providerId: 'surfe', priority: 2, weight: 0.6 },
      { providerId: 'betterenrich', priority: 3, weight: 0.4 },
    ],
    stopOnSuccess: false,
  },
  COMPANY_ENRICHMENT: {
    operation: ProviderOperation.ENRICH_COMPANY,
    providers: [
      { providerId: 'surfe', priority: 1 },
      { providerId: 'apollo', priority: 2 },
    ],
    stopOnSuccess: true,
    qualityThreshold: 85,
  },
};