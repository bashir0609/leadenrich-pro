import { BaseProvider } from '../base/BaseProvider';
import { CustomError, ErrorCode } from '../../../types/errors';
import { ApiKeyService } from '../../ApiKeyService';
import { ApiCache } from '../utils/ApiCache';
import {
  ProviderOperation,
  ProviderRequest,
  EmailSearchParams,
  PersonEnrichParams,
  CompanyEnrichParams,
  EmailResult,
  PersonData,
  CompanyData,
} from '../../../types/providers';

interface ApolloPersonSearchParams {
  first_name?: string;
  last_name?: string;
  email?: string;
  organization_name?: string;
  domain?: string;
  person_titles?: string[];
  person_seniorities?: string[];
  person_departments?: string[];
  limit?: number;
  page?: number;
  filters?: {
    companies?: Array<{
      name?: string;
      domain?: string;
      industry?: string[];
      employee_count?: { min?: number; max?: number };
      revenue?: { min?: number; max?: number };
    }>;
    people?: Array<{
      first_name?: string;
      last_name?: string;
      email?: string;
      title?: string[];
      seniority?: string[];
      department?: string[];
    }>;
  };
  companies?: {
    domains?: string[];
    names?: string[];
    industries?: string[];
    employeeCount?: { min?: number; max?: number };
  };
  people?: {
    jobTitles?: string[];
    seniorities?: string[];
    departments?: string[];
  };
}

interface ApolloCompanySearchParams {
  organization_name?: string;
  domain?: string;
  industry?: string[];
  employee_count_min?: number;
  employee_count_max?: number;
  revenue_min?: number;
  revenue_max?: number;
}

export class ApolloProvider extends BaseProvider {
  private isAuthenticated = false;
  private accountType: 'free' | 'paid' = 'free';
  private cache: ReturnType<typeof ApiCache.getInstance>;
  private rateLimits: { used: number; remaining: number; resetAt?: Date } = { used: 0, remaining: 0 };

  constructor(config: any) {
    super(config);
    this.cache = ApiCache.getInstance();
    this.validateConfig();
  }

  async authenticate(userId?: string): Promise<void> {
    if (!userId) {
      throw new Error('Authentication failed: ApolloProvider was called without a user context.');
    }

    try {
      const apiKeyData = await ApiKeyService.getActiveApiKey(this.config.providerNumericId, userId);

      if (!apiKeyData) {
        throw new Error(`Authentication failed: No active API key found for Apollo for user ID ${userId}.`);
      }

      const apiKey = apiKeyData.keyValue;
      console.log('🔑 Apollo API key configured');
      
      // Clean the API key of any whitespace
      const cleanApiKey = apiKey.trim();
      this.client.defaults.headers.common['x-api-key'] = cleanApiKey;
      this.client.defaults.headers.common['Cache-Control'] = 'no-cache';
      this.client.defaults.headers.common['accept'] = 'application/json';
      
      this.isAuthenticated = true;
      
      // Verify the API key by making a test request
      try {
        await this.client.get('/v1/users/me');
        console.log('✅ Successfully authenticated with Apollo API');
      } catch (error) {
        console.error('❌ Apollo API key verification failed:', error);
        throw new Error('Authentication failed: Invalid API key for Apollo');
      }
    } catch (error: unknown) {
      console.error('❌ Apollo authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
      throw new Error(`Authentication failed: ${errorMessage}`);
    }
  }

  validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('API key is required for Apollo provider');
    }
  }

  public mapErrorToStandard(error: any): CustomError {
    if (error instanceof CustomError) {
      return error;
    }

    // Map Apollo-specific error codes to standard error codes
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

    // For network errors or other unhandled cases
    return new CustomError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error.message || 'An unknown error occurred',
      error.statusCode || 500
    );
  }

  protected async executeOperation(request: ProviderRequest): Promise<any> {
    console.log('🎯 Apollo executeOperation called with:', request.operation);
    console.log('🎯 Apollo Request params:', JSON.stringify(request.params, null, 2));
    
    if (this.accountType === 'free' && request.operation !== ProviderOperation.ENRICH_COMPANY) {
      throw new CustomError(
        ErrorCode.AUTHENTICATION_ERROR,
        'Free Apollo accounts can only perform company enrichment. Please upgrade your plan for full access.',
        403
      );
    }

    try {
      switch (request.operation) {
        case ProviderOperation.SEARCH_PEOPLE:
          return await this.searchPeople(request.params as ApolloPersonSearchParams);
        case ProviderOperation.SEARCH_COMPANIES:
          return await this.searchCompanies(request.params as ApolloCompanySearchParams);
        case ProviderOperation.ENRICH_PERSON:
          return await this.enrichPerson(request.params as PersonEnrichParams);
        case ProviderOperation.ENRICH_COMPANY:
          return await this.enrichCompany(request.params as CompanyEnrichParams);
        case ProviderOperation.FIND_EMAIL:
          return await this.findEmail(request.params as EmailSearchParams);
        default:
          throw new CustomError(
            ErrorCode.OPERATION_FAILED,
            `Operation ${request.operation} is not supported by Apollo provider`,
            501
          );
      }
    } catch (error) {
      throw this.mapErrorToStandard(error);
    }
  }

  async searchPeople(params: ApolloPersonSearchParams): Promise<{ people: any[]; total: number; nextPageToken?: string | null }> {
    if (!this.isAuthenticated) {
      throw new Error('Provider not authenticated');
    }
    
    console.log('🔍 Apollo People Search Request:', JSON.stringify(params, null, 2));
    
    const cacheKey = {
      operation: 'searchPeople',
      ...params
    };
    
    const cachedResult = await this.cache.get<{ people: any[]; total: number; nextPageToken?: string | null }>(cacheKey);
    if (cachedResult) {
      console.log('📦 Using cached people search result');
      return cachedResult;
    }
    
    return this.cache.getOrSet<{ people: any[]; total: number; nextPageToken?: string | null }>(
      'searchPeople',
      cacheKey,
      async () => {
        // Transform to Apollo format
        const apolloParams: any = {
          page: 1,
          per_page: params.limit || 25,
        };
        
        if (params.first_name) apolloParams.first_name = params.first_name;
        if (params.last_name) apolloParams.last_name = params.last_name;
        if (params.email) apolloParams.email = params.email;
        if (params.organization_name) apolloParams.organization_name = params.organization_name;
        if (params.domain) apolloParams.domain = params.domain;
        
        // Map person filters
        if (params.person_titles?.length) apolloParams.person_titles = params.person_titles;
        if (params.person_seniorities?.length) apolloParams.person_seniorities = params.person_seniorities;
        if (params.person_departments?.length) apolloParams.person_departments = params.person_departments;

        console.log('🔍 Transformed Apollo people params:', JSON.stringify(apolloParams, null, 2));
        
        try {
          const response = await this.client.post('/v1/mixed_people/search', apolloParams);
          console.log('✅ Apollo People Search Response:', JSON.stringify(response.data, null, 2));
          
          if (response.headers) {
            this.updateRateLimitsFromHeaders(response.headers);
          }
          
          return {
            people: response.data.people || [],
            total: response.data.pagination?.total_entries || 0,
            nextPageToken: response.data.pagination?.page < response.data.pagination?.total_pages ? 
              (response.data.pagination.page + 1).toString() : null,
            _metadata: {
              timestamp: new Date().toISOString()
            }
          };
        } catch (error: unknown) {
          console.error('❌ Apollo people search failed:', error);
          throw this.mapErrorToStandard(error);
        }
      }
    );
  }

  private async findEmail(params: EmailSearchParams): Promise<EmailResult> {
    const cacheKey = {
      operation: 'findEmail',
      ...params
    };
    
    return this.cache.getOrSet(
      'findEmail',
      JSON.stringify(cacheKey),
      async () => {
        // Apollo's email finder endpoint
        const response = await this.client.post('/v1/people/match', {
          first_name: params.firstName,
          last_name: params.lastName,
          organization_name: params.companyName,
          domain: params.companyDomain,
          reveal_personal_emails: true,
        });
        console.log('Apollo findEmail request completed');

        const person = response.data.person;
        
        if (!person || !person.email) {
          throw new CustomError(ErrorCode.NOT_FOUND, 'Email not found', 404);
        }

        return {
          email: person.email,
          confidence: person.email_confidence || 0.85,
          sources: ['apollo'],
          verified: person.email_status === 'verified',
          _metadata: {
            timestamp: new Date().toISOString()
          }
        };
      },
      { ttl: 86400 } // Cache email lookups for 24 hours
    );
  }

  private async enrichPerson(params: PersonEnrichParams): Promise<PersonData> {
    const cacheKey = {
      operation: 'enrichPerson',
      ...params
    };
    
    return this.cache.getOrSet(
      'enrichPerson',
      JSON.stringify(cacheKey),
      async () => {
        const searchParams: any = {};
    
        if (params.email) {
          searchParams.email = params.email;
        } else if (params.linkedinUrl) {
          searchParams.linkedin_url = params.linkedinUrl;
        } else {
          searchParams.first_name = params.firstName;
          searchParams.last_name = params.lastName;
          searchParams.domain = params.companyDomain;
        }

        const response = await this.client.post('/v1/people/match', searchParams);
        console.log('Apollo enrichPerson request completed');
        
        // Update rate limit info from response headers if available
        if (response.headers) {
          this.updateRateLimitsFromHeaders(response.headers);
        }
        
        const person = response.data.person;

        if (!person) {
          throw new CustomError(ErrorCode.NOT_FOUND, 'Person not found', 404);
        }

        return {
          firstName: person.first_name,
          lastName: person.last_name,
          fullName: person.name,
          email: person.email,
          phone: person.phone_numbers?.[0]?.sanitized_number,
          title: person.title,
          company: person.organization?.name,
          linkedinUrl: person.linkedin_url,
          location: `${person.city || ''} ${person.state || ''} ${person.country || ''}`.trim(),
          additionalData: {
            seniority: person.seniority,
            departments: person.departments,
            emailStatus: person.email_status,
            technologies: person.technologies,
          },
          _metadata: {
            timestamp: new Date().toISOString()
          }
        };
      },
      { ttl: 3600 } // Cache person enrichment for 1 hour
    );
  }

  private async enrichCompany(params: CompanyEnrichParams): Promise<CompanyData> {
    const cacheKey = {
      operation: 'enrichCompany',
      domain: params.domain,
      companyName: params.companyName
    };
    
    return this.cache.getOrSet(
      'enrichCompany',
      JSON.stringify(cacheKey),
      async () => {
        const response = await this.client.post('/v1/organizations/enrich', {
          domain: params.domain,
          organization_name: params.companyName,
        });
        console.log('Apollo enrichCompany request completed');
        
        // Update rate limit info from response headers if available
        if (response.headers) {
          this.updateRateLimitsFromHeaders(response.headers);
        }
        
        const company = response.data.organization;

        if (!company) {
          throw new CustomError(ErrorCode.NOT_FOUND, 'Company not found', 404);
        }

        return {
          name: company.name,
          domain: company.primary_domain,
          description: company.short_description,
          industry: company.industry,
          size: company.estimated_num_employees,
          location: `${company.city || ''} ${company.state || ''} ${company.country || ''}`.trim(),
          linkedinUrl: company.linkedin_url,
          technologies: company.technologies || [],
          additionalData: {
            founded: company.founded_year,
            revenue: company.annual_revenue,
            employeeCount: company.num_employees,
            phoneNumbers: company.phone_numbers,
            socialLinks: {
              twitter: company.twitter_url,
              facebook: company.facebook_url,
              linkedin: company.linkedin_url,
            },
            logo: company.logo_url,
          },
          _metadata: {
            timestamp: new Date().toISOString(),
            source: 'apollo',
          }
        };
      },
      { ttl: 86400 } // Cache company enrichment for 24 hours
    );
  }

  /**
   * Search for companies using Apollo API
   * @param params Search parameters including filters and pagination
   * @returns Object containing companies array, total count, and optional next page token
   */
  async searchCompanies(
    params: ApolloCompanySearchParams & { 
      limit?: number; 
      filters?: { 
        domains?: string[]; 
        industries?: string[]; 
        employeeCount?: { min?: number; max?: number } 
      } 
    }
  ): Promise<{ companies: any[]; total: number; nextPageToken?: string }> {
    if (!this.isAuthenticated) {
      throw new Error('Provider not authenticated');
    }
    
    console.log('🏢 Apollo Company Search Request:', JSON.stringify(params, null, 2));
    
    const companyCacheKey = {
      operation: 'searchCompanies',
      ...params
    };
    
    const companyCachedResult = await this.cache.get<{ companies: any[]; total: number; nextPageToken?: string }>(companyCacheKey);
    if (companyCachedResult) {
      console.log('📦 Using cached company search result');
      return companyCachedResult;
    }
    
    return this.cache.getOrSet<{ companies: any[]; total: number; nextPageToken?: string }>(
      'searchCompanies',
      companyCacheKey,
      async () => {
        const apolloParams: any = { 
          page: 1, 
          per_page: params.limit || 25 
        };
        
        // Add company search parameters
        if ('organization_name' in params) {
          apolloParams.organization_name = params.organization_name;
        }
        if ('domain' in params) {
          apolloParams.domain = params.domain;
        }
        if ('industry' in params && params.industry?.length) {
          apolloParams.organization_industries = params.industry;
        }
        
        // Handle employee count range
        if ('employee_count_min' in params || 'employee_count_max' in params) {
          apolloParams.organization_num_employees_ranges = [
            `${'employee_count_min' in params ? params.employee_count_min : 1}-${'employee_count_max' in params ? params.employee_count_max : 10000}`
          ];
        }
        
        // Handle revenue range if provided
        if ('revenue_min' in params || 'revenue_max' in params) {
          apolloParams.organization_revenue_ranges = [
            `${'revenue_min' in params ? params.revenue_min : 0}-${'revenue_max' in params ? params.revenue_max : 1000000000}`
          ];
        }
        
        // Process filters if provided
        if (params.filters) {
          if (params.filters.domains?.length) {
            apolloParams.organization_domains = params.filters.domains;
          }
          if (params.filters.industries?.length) {
            apolloParams.organization_industries = params.filters.industries;
          }
          if (params.filters.employeeCount) {
            apolloParams.organization_num_employees_ranges = [
              `${params.filters.employeeCount.min || 1}-${params.filters.employeeCount.max || 10000}`
            ];
          }
        }
        
        console.log('🔍 Transformed Apollo company params:', JSON.stringify(apolloParams, null, 2));
        
        try {
          const response = await this.client.post('/v1/organizations/search', apolloParams);
          console.log('✅ Apollo Company Search Response:', JSON.stringify(response.data, null, 2));
          
          if (response.headers) {
            this.updateRateLimitsFromHeaders(response.headers);
          }
          
          const companies = response.data.organizations || [];
          const total = response.data.pagination?.total_entries || companies.length;
          const hasNextPage = response.data.pagination?.page < response.data.pagination?.total_pages;
          
          const result = {
            companies: companies.map((company: any) => ({
              id: company.id,
              name: company.name,
              domain: company.website_url || company.domain || '',
              description: company.short_description,
              industry: company.industry,
              employeeCount: company.employee_count,
              location: [
                company.city,
                company.state,
                company.country
              ].filter(Boolean).join(', '),
              linkedinUrl: company.linkedin_url,
              twitterUrl: company.twitter_url,
              facebookUrl: company.facebook_url,
              logoUrl: company.logo_url,
              technologies: company.technologies || [],
              revenue: company.revenue,
              funding: company.total_funding,
              lastFundingRound: company.last_funding_round,
              lastFundingDate: company.last_funding_date,
              _metadata: {
                source: 'apollo',
                timestamp: new Date().toISOString()
              }
            })),
            total,
            _metadata: {
              timestamp: new Date().toISOString()
            }
          };
          
          // Add nextPageToken if there are more pages
          if (hasNextPage && response.data.pagination) {
            return {
              ...result,
              nextPageToken: (response.data.pagination.page + 1).toString()
            };
          }
          
          return result;
        } catch (error: unknown) {
          console.error('❌ Apollo company search failed:', error);
          throw this.mapErrorToStandard(error);
        }
      }
    );
  }

  public calculateCredits(operation: ProviderOperation): number {
    if (!this.isAuthenticated) {
      throw new Error('Provider not authenticated');
    }
    // Simple credit calculation based on operation type
    switch (operation) {
      case ProviderOperation.SEARCH_PEOPLE:
      case ProviderOperation.SEARCH_COMPANIES:
        return 1; // 1 credit per search
      case ProviderOperation.ENRICH_PERSON:
      case ProviderOperation.ENRICH_COMPANY:
        return 2; // 2 credits per enrichment
      case ProviderOperation.FIND_EMAIL:
        return 1; // 1 credit per email find
      default:
        return 0; // No cost for unsupported operations
    }
  }

  /**
   * Updates rate limits from API response headers if available
   */
  private updateRateLimitsFromHeaders(headers: Record<string, any>): void {
    if (!headers) return;
    
    try {
      if (!this.isAuthenticated) {
        return; // No-op if not authenticated
      }

      // Update rate limits from headers if available
      const rateLimitLimit = headers['x-ratelimit-limit'];
      const rateLimitRemaining = headers['x-ratelimit-remaining'];
      const rateLimitReset = headers['x-ratelimit-reset'];

      if (rateLimitLimit && rateLimitRemaining) {
        const limit = typeof rateLimitLimit === 'string' ? parseInt(rateLimitLimit, 10) : rateLimitLimit;
        const remaining = typeof rateLimitRemaining === 'string' ? parseInt(rateLimitRemaining, 10) : rateLimitRemaining;
        
        this.rateLimits = {
          used: limit - remaining,
          remaining,
          resetAt: rateLimitReset ? new Date(
            typeof rateLimitReset === 'string' ? parseInt(rateLimitReset, 10) * 1000 : rateLimitReset * 1000
          ) : undefined
        };

        // Log rate limit status
        console.log(`ℹ️ Rate limit: ${remaining}/${limit} requests remaining`);

        // Warn if approaching rate limit
        if (typeof remaining === 'number' && typeof limit === 'number' && limit > 0 && remaining / limit < 0.2) {
          console.warn('⚠️ Approaching rate limit, consider adding a delay');
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error updating rate limits:', errorMessage);
    }
  }
}

// Register the provider with the ProviderRegistry
import { ProviderRegistry } from '../ProviderRegistry';

// Register the provider with a string identifier since ProviderType enum doesn't exist
ProviderRegistry.register('apollo', ApolloProvider);
