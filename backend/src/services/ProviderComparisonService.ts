import { ProviderOperation } from '../types/providers';
import { BaseProvider } from '../services/providers/base/BaseProvider';
import { ProviderFactory } from './providers/ProviderFactory';
import prisma from '../lib/prisma';

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

export class ProviderComparisonService {
  static async getProviderMetrics(
    providerId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<ProviderMetrics> {
    const where: any = {
      providerId: parseInt(providerId),
    };

    if (dateRange) {
      where.timestamp = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }
    
    const usage = await prisma.apiUsage.findMany({ where });
    
    const totalRequests = usage.length;
    const successfulRequests = usage.filter((u) => u.statusCode === 200).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    
    const totalResponseTime = usage.reduce((sum, u) => sum + u.responseTime, 0);
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

    const failureReasons: Record<string, number> = {};
    usage
      .filter((u) => u.statusCode !== 200)
      .forEach((u) => {
        const reason = `${u.statusCode} - ${u.endpoint}`;
        failureReasons[reason] = (failureReasons[reason] || 0) + 1;
      });

    const provider = await prisma.provider.findUnique({
      where: { id: parseInt(providerId) },
    });

    return {
      providerId,
      displayName: provider?.displayName || providerId,
      successRate,
      averageResponseTime,
      creditsPerOperation: {}, // Would be calculated from features
      totalRequests,
      failureReasons,
      dataQuality: 85, // Placeholder - would be calculated from actual data
    };
  }

  static async compareProviders(
    operation: ProviderOperation,
    providerIds?: string[]
  ): Promise<ComparisonResult> {
    const providers = providerIds
      ? await prisma.provider.findMany({
          where: { name: { in: providerIds }, isActive: true },
        })
      : await prisma.provider.findMany({ where: { isActive: true } });

    const comparisons: ProviderComparison[] = [];

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
    static async getProviderInstances(
        providerIds: string[] | undefined, 
        userId: string // <<< 1. ADD THE userId PARAMETER HERE
    ): Promise<BaseProvider[]> {
        // Use a more explicit approach to define the query
        const where: any = { isActive: true };
        
        // Only add the name filter if providerIds is provided
        if (providerIds && providerIds.length > 0) {
            where.name = { in: providerIds };
        }
    
    const providers = await prisma.provider.findMany({ where });
        
        // <<< 2. PASS THE userId TO THE FACTORY CALL <<<
        return Promise.all(providers.map(p => ProviderFactory.getProvider(p.name, userId)));
    }

  private static calculateProviderScore(metrics: any): number {
    return (
      metrics.successRate * 0.4 +
      (100 - metrics.responseTime / 100) * 0.2 +
      (100 - metrics.creditCost) * 0.2 +
      metrics.dataCompleteness * 0.2
    );
  }

  private static getOperationCost(provider: string, operation: ProviderOperation): number {
    // Placeholder - would fetch from provider features
    const costs: Record<string, number> = {
      surfe: 2,
      apollo: 1,
      betterenrich: 1.5,
    };
    return costs[provider] || 1;
  }

  private static getProviderPros(provider: string): string[] {
    const pros: Record<string, string[]> = {
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

  private static getProviderCons(provider: string): string[] {
    const cons: Record<string, string[]> = {
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

  private static getProviderBestUses(provider: string): string[] {
    const bestFor: Record<string, string[]> = {
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

    private static generateRecommendation(
        comparisons: ProviderComparison[],
        operation: ProviderOperation
        ): string {
        if (comparisons.length === 0) {
            return 'No providers available for comparison.';
        }

        const best = comparisons[0]!; // Safe to use since we've checked length
        const recommendation = `For ${operation}, we recommend ${best.provider} ` +
            `with ${best.metrics.successRate.toFixed(1)}% success rate and ` +
            `${best.metrics.responseTime.toFixed(0)}ms average response time.`;

        return recommendation;
    }
}