"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WATERFALL_CONFIGS = exports.WaterfallService = void 0;
const ProviderFactory_1 = require("./providers/ProviderFactory");
const logger_1 = require("@/utils/logger");
const providers_1 = require("@/types/providers");
class WaterfallService {
    static async execute(config, params) {
        const startTime = Date.now();
        const attempts = [];
        const providersUsed = [];
        let totalCredits = 0;
        let finalData = null;
        // Sort providers by priority
        const sortedSteps = [...config.providers].sort((a, b) => a.priority - b.priority);
        for (const step of sortedSteps) {
            // Check skip conditions
            if (this.shouldSkipProvider(step, finalData)) {
                logger_1.logger.info(`Skipping provider ${step.providerId} due to conditions`);
                continue;
            }
            try {
                const provider = await ProviderFactory_1.ProviderFactory.getProvider(step.providerId);
                const attemptStart = Date.now();
                const result = await provider.execute({
                    operation: config.operation,
                    params,
                    options: {
                        timeout: config.timeout,
                    },
                });
                const attempt = {
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
            }
            catch (error) {
                logger_1.logger.error(`Waterfall error for provider ${step.providerId}:`, error);
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
    static shouldSkipProvider(step, currentData) {
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
    static mergeData(existing, newData, weight = 1) {
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
    static calculateDataQuality(data) {
        if (!data)
            return 0;
        const fields = Object.keys(data);
        const filledFields = fields.filter((field) => data[field] !== null && data[field] !== undefined && data[field] !== '');
        return (filledFields.length / fields.length) * 100;
    }
    static getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
}
exports.WaterfallService = WaterfallService;
// Predefined waterfall configurations
exports.WATERFALL_CONFIGS = {
    EMAIL_FINDER: {
        operation: providers_1.ProviderOperation.FIND_EMAIL,
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
        operation: providers_1.ProviderOperation.ENRICH_PERSON,
        providers: [
            { providerId: 'apollo', priority: 1, weight: 0.8 },
            { providerId: 'surfe', priority: 2, weight: 0.6 },
            { providerId: 'betterenrich', priority: 3, weight: 0.4 },
        ],
        stopOnSuccess: false,
    },
    COMPANY_ENRICHMENT: {
        operation: providers_1.ProviderOperation.ENRICH_COMPANY,
        providers: [
            { providerId: 'surfe', priority: 1 },
            { providerId: 'apollo', priority: 2 },
        ],
        stopOnSuccess: true,
        qualityThreshold: 85,
    },
};
//# sourceMappingURL=WaterfallService.js.map