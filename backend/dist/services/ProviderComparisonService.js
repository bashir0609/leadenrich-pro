"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderComparisonService = void 0;
const ProviderFactory_1 = require("./providers/ProviderFactory");
const prisma_1 = __importDefault(require("../lib/prisma"));
class ProviderComparisonService {
    static async getProviderMetrics(providerId, dateRange) {
        const where = {
            providerId: parseInt(providerId),
        };
        if (dateRange) {
            where.timestamp = {
                gte: dateRange.start,
                lte: dateRange.end,
            };
        }
        const usage = await prisma_1.default.apiUsage.findMany({ where });
        const totalRequests = usage.length;
        const successfulRequests = usage.filter((u) => u.statusCode === 200).length;
        const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
        const totalResponseTime = usage.reduce((sum, u) => sum + u.responseTime, 0);
        const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
        const failureReasons = {};
        usage
            .filter((u) => u.statusCode !== 200)
            .forEach((u) => {
            const reason = `${u.statusCode} - ${u.endpoint}`;
            failureReasons[reason] = (failureReasons[reason] || 0) + 1;
        });
        const provider = await prisma_1.default.provider.findUnique({
            where: { id: parseInt(providerId) },
        });
        return {
            providerId,
            displayName: provider?.displayName || providerId,
            successRate,
            averageResponseTime,
            creditsPerOperation: {},
            totalRequests,
            failureReasons,
            dataQuality: 85, // Placeholder - would be calculated from actual data
        };
    }
    static async compareProviders(operation, providerIds) {
        const providers = providerIds
            ? await prisma_1.default.provider.findMany({
                where: { name: { in: providerIds }, isActive: true },
            })
            : await prisma_1.default.provider.findMany({ where: { isActive: true } });
        const comparisons = [];
        for (const provider of providers) {
            const metrics = await this.getProviderMetrics(provider.name);
            comparisons.push({
                provider: provider.name,
                metrics: {
                    successRate: metrics.successRate,
                    responseTime: metrics.averageResponseTime,
                    creditCost: this.getOperationCost(provider.name, operation),
                    dataCompleteness: metrics.dataQuality,
                },
                pros: this.getProviderPros(provider.name),
                cons: this.getProviderCons(provider.name),
                bestFor: this.getProviderBestUses(provider.name),
            });
        }
        // Sort by overall score
        comparisons.sort((a, b) => {
            const scoreA = this.calculateProviderScore(a.metrics);
            const scoreB = this.calculateProviderScore(b.metrics);
            return scoreB - scoreA;
        });
        return {
            operation,
            providers: comparisons,
            recommendation: this.generateRecommendation(comparisons, operation),
        };
    }
    /**
     * Get provider instances for all active providers or specified providers
     * @param providerIds Optional list of provider IDs to get instances for
     * @param userId The ID of the user requesting the instances // <<< ADDED DOCS
     * @returns Array of BaseProvider instances
     */
    static async getProviderInstances(providerIds, userId // <<< 1. ADD THE userId PARAMETER HERE
    ) {
        // Use a more explicit approach to define the query
        const where = { isActive: true };
        // Only add the name filter if providerIds is provided
        if (providerIds && providerIds.length > 0) {
            where.name = { in: providerIds };
        }
        const providers = await prisma_1.default.provider.findMany({ where });
        // <<< 2. PASS THE userId TO THE FACTORY CALL <<<
        return Promise.all(providers.map(p => ProviderFactory_1.ProviderFactory.getProvider(p.name, userId)));
    }
    static calculateProviderScore(metrics) {
        return (metrics.successRate * 0.4 +
            (100 - metrics.responseTime / 100) * 0.2 +
            (100 - metrics.creditCost) * 0.2 +
            metrics.dataCompleteness * 0.2);
    }
    static getOperationCost(provider, operation) {
        // Placeholder - would fetch from provider features
        const costs = {
            surfe: 2,
            apollo: 1,
            betterenrich: 1.5,
        };
        return costs[provider] || 1;
    }
    static getProviderPros(provider) {
        const pros = {
            apollo: [
                '275M+ contact database',
                'Excellent company data',
                'Good API reliability',
                'Competitive pricing',
            ],
            surfe: [
                'High data accuracy',
                'Good European coverage',
                'Lookalike search',
                'Real-time enrichment',
            ],
            betterenrich: [
                '20+ specialized features',
                'Waterfall enrichment',
                'Phone number finding',
                'Social media enrichment',
            ],
        };
        return pros[provider] || [];
    }
    static getProviderCons(provider) {
        const cons = {
            apollo: [
                'Limited phone numbers',
                'US-focused data',
                'Rate limits on basic plan',
            ],
            surfe: [
                'Smaller database',
                'Higher cost per credit',
                'Limited free tier',
            ],
            betterenrich: [
                'Complex pricing',
                'Newer provider',
                'Limited company data',
            ],
        };
        return cons[provider] || [];
    }
    static getProviderBestUses(provider) {
        const bestFor = {
            apollo: [
                'B2B sales prospecting',
                'US market research',
                'Technology companies',
            ],
            surfe: [
                'European markets',
                'High-quality requirements',
                'Lookalike searches',
            ],
            betterenrich: [
                'Multi-source enrichment',
                'Phone number finding',
                'Social media research',
            ],
        };
        return bestFor[provider] || [];
    }
    static generateRecommendation(comparisons, operation) {
        if (comparisons.length === 0) {
            return 'No providers available for comparison.';
        }
        const best = comparisons[0]; // Safe to use since we've checked length
        const recommendation = `For ${operation}, we recommend ${best.provider} ` +
            `with ${best.metrics.successRate.toFixed(1)}% success rate and ` +
            `${best.metrics.responseTime.toFixed(0)}ms average response time.`;
        return recommendation;
    }
}
exports.ProviderComparisonService = ProviderComparisonService;
//# sourceMappingURL=ProviderComparisonService.js.map