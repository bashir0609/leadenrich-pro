import { BaseProvider } from '../base/BaseProvider';
import { CustomError, ErrorCode } from '@/types/errors';
import {
  ProviderOperation,
  ProviderRequest,
  EmailSearchParams,
  PersonEnrichParams,
  CompanyEnrichParams,
  EmailResult,
  PersonData,
  CompanyData,
  PeopleSearchParams,
  StandardizedPerson
} from '@/types/providers';
import { logger } from '@/utils/logger';

interface SurfeApiError {
  code: string;
  message: string;
  details?: any;
}

export class SurfeProvider extends BaseProvider {
  async authenticate(): Promise<void> {
    if (!this.config.apiKey) {
      throw new CustomError(
        ErrorCode.AUTHENTICATION_ERROR,
        'Surfe API key not configured',
        401
      );
    }

    // Decrypt API key and set auth header
    const apiKey = this.decryptApiKey(this.config.apiKey);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
    logger.info('Surfe provider authenticated successfully');
  }

  validateConfig(): void {
    if (!this.config.baseUrl) {
      throw new CustomError(
        ErrorCode.VALIDATION_ERROR,
        'Surfe base URL not configured',
        400
      );
    }
  }

  mapErrorToStandard(error: any): CustomError {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as SurfeApiError;

      switch (status) {
        case 401:
          return new CustomError(
            ErrorCode.AUTHENTICATION_ERROR,
            'Surfe authentication failed',
            401,
            data
          );
        case 429:
          return new CustomError(
            ErrorCode.PROVIDER_RATE_LIMIT,
            'Surfe rate limit exceeded',
            429,
            data
          );
        case 400:
          return new CustomError(
            ErrorCode.INVALID_INPUT,
            data.message || 'Invalid request to Surfe',
            400,
            data
          );
        default:
          return new CustomError(
            ErrorCode.PROVIDER_ERROR,
            `Surfe API error: ${data.message || 'Unknown error'}`,
            status,
            data
          );
      }
    }

    return new CustomError(
      ErrorCode.PROVIDER_ERROR,
      'Surfe provider error',
      500,
      error
    );
  }

  protected async executeOperation(request: ProviderRequest): Promise<any> {
    switch (request.operation) {
      case ProviderOperation.FIND_EMAIL:
        return this.findEmail(request.params as EmailSearchParams);
      case ProviderOperation.ENRICH_PERSON:
        return this.enrichPerson(request.params as PersonEnrichParams);
      case ProviderOperation.ENRICH_COMPANY:
        return this.enrichCompany(request.params as CompanyEnrichParams);
      case ProviderOperation.SEARCH_PEOPLE:
        return this.searchPeopleInternal(request.params as PeopleSearchParams);
      case ProviderOperation.SEARCH_COMPANIES:
        return this.searchCompanies(request.params);
      default:
        throw new CustomError(
          ErrorCode.OPERATION_FAILED,
          `Operation ${request.operation} not implemented for Surfe`,
          501
        );
    }
  }

  // Implementation of EnrichmentProvider interface method
  async searchPeople(params: PeopleSearchParams): Promise<StandardizedPerson[]> {
    logger.info(`Searching people on Surfe with params:`, params);
    
    // Call internal method via execute to benefit from rate limiting
    const result = await this.execute<any>({
      operation: ProviderOperation.SEARCH_PEOPLE,
      params
    });
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to search people');
    }
    
    // Map the result to StandardizedPerson format
    return result.data.data?.map((person: any) => ({
      id: `surfe-${person.id || Math.random().toString(36).substring(7)}`,
      fullName: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim(),
      email: person.email,
      title: person.jobTitle || person.title,
      company: person.company?.name || person.company
    })) || [];
  }

  // Internal method for direct API access
  private async searchPeopleInternal(params: PeopleSearchParams): Promise<any> {
    // Transform our PeopleSearchParams to Surfe's format
    const surfeParams: any = {};
    
    if (params.companyDomains && params.companyDomains.length > 0) {
      surfeParams.companies = { domains: params.companyDomains };
    }
    
    if (params.jobTitles && params.jobTitles.length > 0) {
      surfeParams.jobTitles = params.jobTitles;
    }
    
    try {
      // In Phase 2, we'll make a real API call here
      // const response = await this.client.post('/v2/people/search', surfeParams);
      // return response.data;
      
      // For now, return mock data
      return {
        data: [
          {
            id: '123',
            firstName: 'John',
            lastName: 'Doe',
            fullName: 'John Doe',
            email: 'john.doe@example.com',
            jobTitle: 'Software Engineer',
            company: { name: 'Example Corp' }
          },
          {
            id: '456',
            firstName: 'Jane',
            lastName: 'Smith',
            fullName: 'Jane Smith',
            email: 'jane.smith@example.com',
            jobTitle: 'Product Manager',
            company: { name: 'Example Corp' }
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          perPage: 10
        }
      };
    } catch (error) {
      logger.error('Error searching people on Surfe:', error);
      throw this.mapErrorToStandard(error);
    }
  }

  private async findEmail(params: EmailSearchParams): Promise<EmailResult> {
    // Convert EmailSearchParams to PeopleSearchParams
    const searchParams: PeopleSearchParams = {};
    
    if (params.companyDomain) {
      searchParams.companyDomains = [params.companyDomain];
    }
    
    if (params.firstName || params.lastName) {
      // In a real implementation, we'd use these parameters
    }
    
    // Use our searchPeople method to get standardized persons
    const people = await this.searchPeople(searchParams);

    if (people.length > 0) {
      const person = people[0];
      return {
        email: person.email || '',
        confidence: person.email ? 0.9 : 0,
        sources: ['surfe'],
        verified: false,
      };
    }

    throw new CustomError(
      ErrorCode.NOT_FOUND,
      'Email not found',
      404
    );
  }

  private async enrichPerson(params: PersonEnrichParams): Promise<PersonData> {
    try {
      // In a real implementation, we'd make an API call
      // const response = await this.client.post('/v2/people/enrich', {
      //   email: params.email,
      //   linkedInUrl: params.linkedinUrl,
      //   include: ['email', 'mobile', 'linkedInUrl', 'jobTitle'],
      // });
      // const data = response.data;
      
      // For now, return mock data
      return {
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        email: params.email || 'john.doe@example.com',
        phone: '+1234567890',
        title: 'Software Engineer',
        company: 'Example Corp',
        linkedinUrl: params.linkedinUrl || 'https://linkedin.com/in/johndoe',
        location: 'San Francisco, CA',
        additionalData: {
          seniority: 'Senior',
          department: 'Engineering',
        },
      };
    } catch (error) {
      logger.error('Error enriching person on Surfe:', error);
      throw this.mapErrorToStandard(error);
    }
  }

  private async enrichCompany(params: CompanyEnrichParams): Promise<CompanyData> {
    try {
      // In a real implementation, we'd make an API call
      // const response = await this.client.post('/v2/companies/enrich', {
      //   domain: params.domain,
      //   companyName: params.companyName,
      // });
      // const data = response.data;
      
      // For now, return mock data
      return {
        name: params.companyName || 'Example Corp',
        domain: params.domain || 'example.com',
        description: 'A leading example company',
        industry: 'Technology',
        size: '51-200',
        location: 'San Francisco, CA',
        linkedinUrl: params.linkedinUrl || 'https://linkedin.com/company/example-corp',
        technologies: ['React', 'Node.js', 'TypeScript'],
        additionalData: {
          founded: 2010,
          revenue: '$10M-$50M',
          fundingStage: 'Series B',
        },
      };
    } catch (error) {
      logger.error('Error enriching company on Surfe:', error);
      throw this.mapErrorToStandard(error);
    }
  }

  private async searchCompanies(params: any): Promise<any> {
    try {
      // In a real implementation, we'd make an API call
      // const response = await this.client.post('/v2/companies/search', params);
      // return response.data;
      
      // For now, return mock data
      return {
        data: [
          {
            name: 'Example Corp',
            domain: 'example.com',
            industry: 'Technology',
          },
          {
            name: 'Sample Inc',
            domain: 'sample.com',
            industry: 'SaaS',
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          perPage: 10
        }
      };
    } catch (error) {
      logger.error('Error searching companies on Surfe:', error);
      throw this.mapErrorToStandard(error);
    }
  }
}

// Register the provider
import { ProviderRegistry } from '../ProviderRegistry';
ProviderRegistry.register('surfe', SurfeProvider);