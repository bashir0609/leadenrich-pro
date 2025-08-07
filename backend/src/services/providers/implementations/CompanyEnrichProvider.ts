import { BaseProvider } from '../base/BaseProvider';
import { CustomError, ErrorCode } from '../../../types/errors';
import { ApiKeyService } from '../../ApiKeyService';
import { ApiCache } from '../utils/ApiCache';
import prisma from '../../../lib/prisma';
import {
  ProviderOperation,
  ProviderRequest,
  CompanyEnrichParams,
  CompanyData,
} from '../../../types/providers';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { ProviderRegistry } from '../ProviderRegistry';

export class CompanyEnrichProvider extends BaseProvider {
  protected client: AxiosInstance;

  constructor(config: any) {
    super(config);
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'LeadEnrich/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  async authenticate(userId?: string): Promise<void> {
    if (!userId) {
      throw new CustomError(ErrorCode.AUTHENTICATION_ERROR, 'User ID is required for authentication', 401);
    }

    try {
      // First, get the provider ID from the database using the provider name
      const provider = await prisma.provider.findUnique({
        where: { name: this.config.name.toLowerCase() },
        select: { id: true }
      });

      if (!provider) {
        throw new CustomError(ErrorCode.PROVIDER_NOT_FOUND, 'CompanyEnrich provider not found in database', 404);
      }

      const apiKey = await ApiKeyService.getActiveApiKey(provider.id, userId);
      if (!apiKey) {
        throw new CustomError(ErrorCode.AUTHENTICATION_ERROR, 'No active API key found for CompanyEnrich', 401);
      }

      // Set Basic Auth header with API key as username
      this.client.defaults.auth = {
        username: apiKey.keyValue,
        password: '',
      };

      console.log('✅ CompanyEnrich provider authenticated successfully');
    } catch (error: any) {
      console.error('❌ CompanyEnrich authentication failed:', error.message);
      throw new CustomError(ErrorCode.AUTHENTICATION_ERROR, `CompanyEnrich authentication failed: ${error.message}`, 401);
    }
  }

  validateConfig(): void {
    if (!this.config.baseUrl) {
      throw new CustomError(ErrorCode.VALIDATION_ERROR, 'CompanyEnrich base URL is required', 400);
    }
  }

  protected async executeOperation(request: ProviderRequest): Promise<any> {
    switch (request.operation) {
      case ProviderOperation.ENRICH_COMPANY:
        return await this.enrichCompany(request.params as CompanyEnrichParams);
      default:
        throw new CustomError(ErrorCode.OPERATION_FAILED, `Operation ${request.operation} is not supported by CompanyEnrich provider`, 501);
    }
  }

  private async enrichCompany(params: CompanyEnrichParams): Promise<CompanyData> {
    if (!params.domain) {
      throw new CustomError(ErrorCode.VALIDATION_ERROR, 'Domain is required for company enrichment', 400);
    }

    const cacheKey = `companyenrich:company:${params.domain}`;
    const cached = ApiCache.getInstance().get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit for CompanyEnrich company: ${params.domain}`);
      return cached as unknown as CompanyData;
    }

    try {
      console.log(`🔍 CompanyEnrich: Enriching company for domain: ${params.domain}`);
      
      // Add delay for rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await this.client.get('/companies/enrich', {
        params: {
          domain: params.domain,
        },
      });

      console.log(`✅ CompanyEnrich API response for ${params.domain}:`, JSON.stringify(response.data, null, 2));

      const transformedData = this.transformResponse(response.data);
      
      // Cache for 24 hours
      ApiCache.getInstance().set(cacheKey, transformedData, 86400);
      
      return transformedData;
    } catch (error: any) {
      console.error(`❌ CompanyEnrich enrichment failed for ${params.domain}:`, error.message);
      throw this.mapErrorToStandard(error);
    }
  }

  private transformResponse(data: any): CompanyData {
    if (!data) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'No company data found', 404);
    }

    // Extract company data from either root or nested company object
    const companyData = data.company || data;
    const domain = companyData.domain || data.domain || '';
    
    // Map the response to the CompanyData interface
    return {
      name: companyData.name || data.name || '',
      domain: domain,
      industry: companyData.industry || data.industry || '',
      size: companyData.size || data.employee_count || data.size || '',
      location: companyData.location || data.headquarters || data.location || '',
      description: companyData.description || data.description || '',
      linkedinUrl: companyData.linkedin || data.linkedin_url || data.linkedinUrl || '',
      technologies: Array.isArray(data.technologies) 
        ? data.technologies 
        : data.technologies?.split(',').map((t: string) => t.trim()).filter(Boolean) || [],
      additionalData: {
        employeeCount: data.employee_count || data.employees || companyData.employees,
        founded: data.founded_year || data.founded || companyData.founded,
        revenue: data.annual_revenue || data.revenue || companyData.revenue,
        hqCountry: data.country || companyData.country,
        subIndustry: data.sub_industry || data.subIndustry || companyData.subIndustry,
        isPublic: data.is_public || data.isPublic || companyData.isPublic,
        phones: data.phone || data.phone_number ? [data.phone, data.phone_number].filter(Boolean) : [],
        websites: domain ? [domain] : [],
        // Include any other fields from the original response
        ...companyData,
        ...data
      }
    };
  }

  mapErrorToStandard(error: any): CustomError {
    if (error instanceof CustomError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const status = axiosError.response?.status || 500;
      const message = axiosError.response?.data?.message || axiosError.response?.statusText || 'API error';

      switch (status) {
        case 401:
          return new CustomError(ErrorCode.AUTHENTICATION_ERROR, 'CompanyEnrich API authentication failed', 401);
        case 403:
          return new CustomError(ErrorCode.AUTHORIZATION_ERROR, 'CompanyEnrich API access forbidden - check credits', 403);
        case 404:
          return new CustomError(ErrorCode.NOT_FOUND, 'Company not found in CompanyEnrich database', 404);
        case 429:
          return new CustomError(ErrorCode.RATE_LIMIT_EXCEEDED, 'CompanyEnrich API rate limit exceeded', 429);
        case 500:
          return new CustomError(ErrorCode.PROVIDER_ERROR, 'CompanyEnrich API server error', 500);
        default:
          return new CustomError(ErrorCode.PROVIDER_ERROR, `CompanyEnrich API error: ${message}`, status);
      }
    }

    return new CustomError(ErrorCode.PROVIDER_ERROR, `CompanyEnrich provider error: ${error.message}`, 500);
  }

  calculateCredits(operation: ProviderOperation, params?: any): number {
    switch (operation) {
      case ProviderOperation.ENRICH_COMPANY:
        return 1;
      default:
        return 1;
    }
  }

  getSupportedOperations(): ProviderOperation[] {
    return [ProviderOperation.ENRICH_COMPANY];
  }
}

// Register the provider
ProviderRegistry.register('companyenrich', CompanyEnrichProvider);
