import { BaseProvider } from '../base/BaseProvider';
import { CustomError, ErrorCode } from '../../../types/errors';
import { ApiKeyService } from '../../ApiKeyService';
import {
  ProviderOperation,
  ProviderRequest,
  EmailSearchParams,
  PersonEnrichParams,
  EmailResult,
  PersonData,
} from '../../../types/providers';

// BetterEnrich specific types
export enum BetterEnrichOperation {
  // Enrichment
  SINGLE_ENRICHMENT = 'single-enrichment',
  WATERFALL_ENRICHMENT = 'waterfall-enrichment',
  
  // Email Finder
  FIND_WORK_EMAIL = 'find-work-email',
  FIND_EMAIL_FROM_LINKEDIN = 'find-email-from-linkedin',
  FIND_EMAIL_FROM_SALESNAV = 'find-email-from-salesnav',
  FIND_PERSONAL_EMAIL = 'find-personal-email',
  
  // Phone Finder
  FIND_MOBILE_PHONE = 'find-mobile-phone',
  
  // Ad Intelligence
  CHECK_GOOGLE_ADS = 'check-google-ads',
  CHECK_FACEBOOK_ADS = 'check-facebook-ads',
  CHECK_LINKEDIN_ADS = 'check-linkedin-ads',
  
  // Social Enrichment
  FIND_SOCIAL_URLS = 'find-social-urls',
  FIND_LINKEDIN_BY_EMAIL = 'find-linkedin-by-email',
  FIND_LINKEDIN_BY_NAME = 'find-linkedin-by-name',
  FIND_FACEBOOK_PROFILE = 'find-facebook-profile',
  
  // Normalization
  NORMALIZE_COMPANY = 'normalize-company',
  NORMALIZE_PERSON = 'normalize-person',
  
  // Verification
  CHECK_DNC_LIST = 'check-dnc-list',
  CHECK_PHONE_STATUS = 'check-phone-status',
  CHECK_ESP = 'check-esp',
  
  // Others
  CHECK_GENDER = 'check-gender',
  FIND_WEBSITE = 'find-website',
}

interface BetterEnrichFeature {
  id: BetterEnrichOperation;
  name: string;
  category: string;
  endpoint: string;
  method: 'GET' | 'POST';
  credits: number;
  description: string;
}

export class BetterEnrichProvider extends BaseProvider {
  private features: Map<string, BetterEnrichFeature> = new Map();

  constructor(config: any) {
    super(config);
    this.initializeFeatures();
  }

  private initializeFeatures(): void {
    const featureList: BetterEnrichFeature[] = [
      // Enrichment
      {
        id: BetterEnrichOperation.SINGLE_ENRICHMENT,
        name: 'Single Enrichment',
        category: 'enrichment',
        endpoint: '/enrichment/single',
        method: 'POST',
        credits: 1,
        description: 'Enrich a single contact with comprehensive data',
      },
      {
        id: BetterEnrichOperation.WATERFALL_ENRICHMENT,
        name: 'Waterfall Enrichment',
        category: 'enrichment',
        endpoint: '/enrichment/waterfall',
        method: 'POST',
        credits: 3,
        description: 'Multi-source enrichment with fallback providers',
      },
      
      // Email Finder
      {
        id: BetterEnrichOperation.FIND_WORK_EMAIL,
        name: 'Find Work Email',
        category: 'email-finder',
        endpoint: '/email/work',
        method: 'POST',
        credits: 1,
        description: 'Find work email address',
      },
      {
        id: BetterEnrichOperation.FIND_EMAIL_FROM_LINKEDIN,
        name: 'Find Email from LinkedIn',
        category: 'email-finder',
        endpoint: '/email/linkedin',
        method: 'POST',
        credits: 1,
        description: 'Extract work email from LinkedIn profile',
      },
      
      // Phone Finder
      {
        id: BetterEnrichOperation.FIND_MOBILE_PHONE,
        name: 'Find Mobile Phone',
        category: 'phone-finder',
        endpoint: '/phone/mobile',
        method: 'POST',
        credits: 2,
        description: 'Find mobile phone number',
      },
      
      // Ad Intelligence
      {
        id: BetterEnrichOperation.CHECK_GOOGLE_ADS,
        name: 'Check Google Ads',
        category: 'ad-intelligence',
        endpoint: '/ads/google/check',
        method: 'POST',
        credits: 1,
        description: 'Check if company runs Google Ads',
      },
      
      // Social Enrichment
      {
        id: BetterEnrichOperation.FIND_SOCIAL_URLS,
        name: 'Find Social URLs',
        category: 'social-enrichment',
        endpoint: '/social/website',
        method: 'POST',
        credits: 1,
        description: 'Find social media profiles from website',
      },
      
      // Normalization
      {
        id: BetterEnrichOperation.NORMALIZE_COMPANY,
        name: 'Normalize Company',
        category: 'normalization',
        endpoint: '/normalize/company',
        method: 'POST',
        credits: 0.1,
        description: 'Standardize company name format',
      },
      
      // Verification
      {
        id: BetterEnrichOperation.CHECK_DNC_LIST,
        name: 'Check DNC List',
        category: 'verification',
        endpoint: '/verify/dnc',
        method: 'POST',
        credits: 0.5,
        description: 'Check if US phone number is on Do Not Call list',
      },
      
      // Add all other features...
    ];

    featureList.forEach((feature) => {
      this.features.set(feature.id, feature);
    });
  }

  async authenticate(userId?: string): Promise<void> {
    if (!userId) {
      throw new Error('Authentication failed: BetterEnrichProvider was called without a user context.');
    }

    try {
      const apiKeyData = await ApiKeyService.getActiveApiKey(this.config.providerNumericId, userId);

      if (!apiKeyData) {
        throw new Error(`Authentication failed: No active API key found for BetterEnrich for user ID ${userId}.`);
      }

      const apiKey = apiKeyData.keyValue;
      console.log('🔑 BetterEnrich API key configured');
      
      // Clean the API key of any whitespace
      const cleanApiKey = apiKey.trim();
      this.client.defaults.headers.common['X-API-Key'] = cleanApiKey;
      this.client.defaults.headers.common['Content-Type'] = 'application/json';
      
      console.log('✅ Successfully authenticated with BetterEnrich API');
    } catch (error: unknown) {
      console.error('❌ BetterEnrich authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
      throw new Error(`Authentication failed: ${errorMessage}`);
    }
  }

  validateConfig(): void {
    if (!this.config.baseUrl) {
      throw new CustomError(
        ErrorCode.VALIDATION_ERROR,
        'BetterEnrich base URL not configured',
        400
      );
    }
  }

  public mapErrorToStandard(error: any): CustomError {
    if (error instanceof CustomError) {
      return error;
    }

    // Map BetterEnrich-specific error codes to standard error codes
    if (error.response?.data?.error) {
      const { status, message } = error.response.data.error;
      
      switch (status) {
        case 401:
        case 403:
          return new CustomError(ErrorCode.AUTHENTICATION_ERROR, message || 'Authentication failed', status);
        case 404:
          return new CustomError(ErrorCode.NOT_FOUND, message || 'Resource not found', status);
        case 429:
          return new CustomError(ErrorCode.RATE_LIMIT_EXCEEDED, message || 'Rate limit exceeded', status);
        case 500:
          return new CustomError(ErrorCode.INTERNAL_SERVER_ERROR, message || 'Internal server error', status);
        default:
          return new CustomError(ErrorCode.PROVIDER_ERROR, message || 'API error occurred', status || 500);
      }
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText || 'API error';
      
      switch (status) {
        case 401:
        case 403:
          return new CustomError(ErrorCode.AUTHENTICATION_ERROR, message, status);
        case 404:
          return new CustomError(ErrorCode.NOT_FOUND, message, status);
        case 429:
          return new CustomError(ErrorCode.RATE_LIMIT_EXCEEDED, message, status);
        case 500:
          return new CustomError(ErrorCode.INTERNAL_SERVER_ERROR, message, status);
        default:
          return new CustomError(ErrorCode.PROVIDER_ERROR, message, status);
      }
    }

    // For network errors or other unhandled cases
    return new CustomError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error.message || 'An unknown error occurred',
      error.statusCode || 500
    );
  }

  protected async executeOperation(request: ProviderRequest): Promise<any> {
    // Handle standard operations
    if (Object.values(ProviderOperation).includes(request.operation as ProviderOperation)) {
      return this.handleStandardOperation(request);
    }

    // Handle BetterEnrich specific operations
    const feature = this.features.get(request.operation);
    if (!feature) {
      throw new CustomError(
        ErrorCode.OPERATION_FAILED,
        `Operation ${request.operation} not found`,
        404
      );
    }

    return this.executeFeature(feature, request.params);
  }

  private async handleStandardOperation(request: ProviderRequest): Promise<any> {
    switch (request.operation) {
      case ProviderOperation.FIND_EMAIL:
        // Map to work email finder
        return this.executeFeature(
          this.features.get(BetterEnrichOperation.FIND_WORK_EMAIL)!,
          request.params
        );
      
      case ProviderOperation.ENRICH_PERSON:
        // Map to single enrichment (can be enhanced to use waterfall if needed)
        return this.executeFeature(
          this.features.get(BetterEnrichOperation.SINGLE_ENRICHMENT)!,
          request.params
        );
      
      case ProviderOperation.ENRICH_COMPANY:
        // Map to company normalization (BetterEnrich doesn't have full company enrichment)
        return this.executeFeature(
          this.features.get(BetterEnrichOperation.NORMALIZE_COMPANY)!,
          request.params
        );
      
      // Note: BetterEnrich doesn't support SEARCH_PEOPLE or SEARCH_COMPANIES
      // These operations are not available in BetterEnrich's feature set
      
      default:
        // List supported operations for better error messaging
        const supportedOps = [
          ProviderOperation.FIND_EMAIL,
          ProviderOperation.ENRICH_PERSON,
          ProviderOperation.ENRICH_COMPANY
        ];
        
        throw new CustomError(
          ErrorCode.OPERATION_FAILED,
          `Standard operation '${request.operation}' not supported by BetterEnrich. Supported operations: ${supportedOps.join(', ')}. Use BetterEnrich-specific operations for advanced features.`,
          501
        );
    }
  }

  private async executeFeature(feature: BetterEnrichFeature, params: any): Promise<any> {
    console.log(`🔍 BetterEnrich ${feature.name} Request:`, JSON.stringify(params, null, 2));
    
    // Add a 1-second delay before making the request to prevent overwhelming the API
    console.log(`⏳ Adding 1-second delay before BetterEnrich ${feature.id} request`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const response = await this.client.request({
        method: feature.method,
        url: feature.endpoint,
        data: params,
        timeout: 30000, // 30 second timeout
      });
      
      console.log(`✅ BetterEnrich ${feature.name} Response:`, JSON.stringify(response.data, null, 2));
      return this.transformResponse(feature.id, response.data);
    } catch (error: unknown) {
      console.error(`❌ BetterEnrich ${feature.name} failed:`, error);
      throw this.mapErrorToStandard(error);
    }
  }

  private transformResponse(featureId: string, data: any): any {
    if (!data) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'No data returned from BetterEnrich API', 404);
    }

    // Transform BetterEnrich responses to standard format
    switch (featureId) {
      case BetterEnrichOperation.FIND_WORK_EMAIL:
        return {
          email: data.email || null,
          confidence: typeof data.confidence === 'number' ? data.confidence : 0.9,
          sources: ['betterenrich'],
          verified: Boolean(data.verified),
          _metadata: {
            timestamp: new Date().toISOString(),
            source: 'betterenrich',
            feature: featureId
          }
        } as EmailResult;
      
      case BetterEnrichOperation.SINGLE_ENRICHMENT:
        return {
          firstName: data.first_name || null,
          lastName: data.last_name || null,
          fullName: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || null,
          email: data.email || null,
          phone: data.phone || null,
          title: data.job_title || data.title || null,
          company: data.company_name || data.company || null,
          linkedinUrl: data.linkedin_url || null,
          location: data.location || null,
          additionalData: {
            seniority: data.seniority,
            department: data.department,
            industry: data.industry,
            ...data
          },
          _metadata: {
            timestamp: new Date().toISOString(),
            source: 'betterenrich',
            feature: featureId
          }
        } as PersonData;
      
      case BetterEnrichOperation.WATERFALL_ENRICHMENT:
        return {
          firstName: data.first_name || null,
          lastName: data.last_name || null,
          fullName: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || null,
          email: data.email || null,
          phone: data.phone || null,
          title: data.job_title || data.title || null,
          company: data.company_name || data.company || null,
          linkedinUrl: data.linkedin_url || null,
          location: data.location || null,
          additionalData: {
            enrichmentSources: data.sources || [],
            confidence: data.confidence || 0.8,
            ...data
          },
          _metadata: {
            timestamp: new Date().toISOString(),
            source: 'betterenrich',
            feature: featureId,
            enrichmentType: 'waterfall'
          }
        } as PersonData;
      
      default:
        // For other features, return the data with metadata
        return {
          ...data,
          _metadata: {
            timestamp: new Date().toISOString(),
            source: 'betterenrich',
            feature: featureId
          }
        };
    }
  }

  // Public method to get all available features
  getAvailableFeatures(): BetterEnrichFeature[] {
    return Array.from(this.features.values());
  }

  // Public method to get features by category
  getFeaturesByCategory(category: string): BetterEnrichFeature[] {
    return Array.from(this.features.values()).filter((f) => f.category === category);
  }

  public calculateCredits(operation: ProviderOperation | string): number {
    // Handle standard operations
    if (Object.values(ProviderOperation).includes(operation as ProviderOperation)) {
      switch (operation as ProviderOperation) {
        case ProviderOperation.FIND_EMAIL:
          return this.features.get(BetterEnrichOperation.FIND_WORK_EMAIL)?.credits || 1;
        case ProviderOperation.ENRICH_PERSON:
          return this.features.get(BetterEnrichOperation.SINGLE_ENRICHMENT)?.credits || 1;
        case ProviderOperation.ENRICH_COMPANY:
          return this.features.get(BetterEnrichOperation.NORMALIZE_COMPANY)?.credits || 0.1;
        default:
          return 1; // Default credit cost
      }
    }
    
    // Handle BetterEnrich specific operations
    const feature = this.features.get(operation as string);
    return feature?.credits || 1;
  }
}

// Register the provider
import { ProviderRegistry } from '../ProviderRegistry';
ProviderRegistry.register('betterenrich', BetterEnrichProvider);