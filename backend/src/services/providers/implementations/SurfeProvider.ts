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
} from '@/types/providers';
import { logger } from '@/utils/logger';
import axios from 'axios';
import { ProviderRegistry } from '../ProviderRegistry';

interface SurfeApiError {
  code: string;
  message: string;
  details?: any;
}

// Maximum time to wait for enrichment completion (in milliseconds)
const MAX_ENRICHMENT_WAIT_TIME = 30000; // 30 seconds
// Initial poll interval
const INITIAL_POLL_INTERVAL = 1000; // 1 second

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
        return this.searchPeople(request.params);
      case ProviderOperation.SEARCH_COMPANIES:
        return this.searchCompanies(request.params);
      case ProviderOperation.FIND_LOOKALIKE:
        return this.findLookalikes(request.params);
      default:
        throw new CustomError(
          ErrorCode.OPERATION_FAILED,
          `Operation ${request.operation} not implemented for Surfe`,
          501
        );
    }
  }

  private async findEmail(params: EmailSearchParams): Promise<EmailResult> {
    try {
      // Use the person enrichment endpoint to find the email
      const personData = await this.enrichPerson({
        firstName: params.firstName,
        lastName: params.lastName,
        companyDomain: params.companyDomain,
        linkedinUrl: params.linkedinUrl
      });

      if (!personData.email) {
        throw new CustomError(ErrorCode.NOT_FOUND, 'Email not found', 404);
      }

      return {
        email: personData.email,
        confidence: 0.9, // Surfe doesn't provide confidence scores for emails directly
        sources: ['surfe'],
        verified: true, // Surfe verifies emails
      };
    } catch (error) {
      logger.error('Error finding email with Surfe:', error);
      throw this.mapErrorToStandard(error);
    }
  }

  private async enrichPerson(params: PersonEnrichParams): Promise<PersonData> {
    try {
      logger.info('Starting person enrichment with Surfe', { params });
      
      // Step 1: Start the enrichment process
      const enrichRequest = {
        include: {
          email: true,
          linkedInUrl: true,
          mobile: true,
          jobHistory: true
        },
        people: [
          {
            firstName: params.firstName,
            lastName: params.lastName,
            companyDomain: params.companyDomain,
            linkedinUrl: params.linkedinUrl,
            email: params.email,
            externalID: `le-${Date.now()}`
          }
        ]
      };

      // Start enrichment
      const enrichStartResponse = await this.client.post('/v2/people/enrich', enrichRequest);
      
      if (!enrichStartResponse.data.enrichmentID) {
        throw new CustomError(
          ErrorCode.PROVIDER_ERROR,
          'Failed to start enrichment process',
          500
        );
      }

      const enrichmentId = enrichStartResponse.data.enrichmentID;
      logger.info('Enrichment started', { enrichmentId });
      
      // Step 2: Poll for results
      const enrichmentResult = await this.pollEnrichmentStatus(
        `/v2/people/enrich/${enrichmentId}`
      );
      
      if (!enrichmentResult.people || enrichmentResult.people.length === 0) {
        throw new CustomError(
          ErrorCode.NOT_FOUND,
          'Person not found or no data available',
          404
        );
      }

      const person = enrichmentResult.people[0];
      
      // Convert to standard format
      return {
        firstName: person.firstName,
        lastName: person.lastName,
        fullName: `${person.firstName} ${person.lastName}`,
        email: person.emails?.[0]?.email,
        phone: person.mobilePhones?.[0]?.mobilePhone,
        title: person.jobTitle,
        company: person.companyName,
        linkedinUrl: person.linkedInUrl,
        location: person.location,
        additionalData: {
          country: person.country,
          departments: person.departments,
          seniorities: person.seniorities,
          jobHistory: person.jobHistory
        },
      };
    } catch (error) {
      logger.error('Error enriching person with Surfe:', error);
      throw this.mapErrorToStandard(error);
    }
  }

  private async enrichCompany(params: CompanyEnrichParams): Promise<CompanyData> {
    try {
      logger.info('Starting company enrichment with Surfe', { params });
      
      // Step 1: Start the enrichment process
      const enrichRequest = {
        companies: [
          {
            domain: params.domain,
            companyName: params.companyName,
            externalID: `le-${Date.now()}`
          }
        ]
      };

      // Start enrichment
      const enrichStartResponse = await this.client.post('/v2/companies/enrich', enrichRequest);
      
      if (!enrichStartResponse.data.enrichmentID) {
        throw new CustomError(
          ErrorCode.PROVIDER_ERROR,
          'Failed to start company enrichment process',
          500
        );
      }

      const enrichmentId = enrichStartResponse.data.enrichmentID;
      logger.info('Company enrichment started', { enrichmentId });
      
      // Step 2: Poll for results
      const company = await this.pollEnrichmentStatus(
        `/v2/companies/enrich/${enrichmentId}`
      );
      
      if (company.status !== 'COMPLETED') {
        throw new CustomError(
          ErrorCode.NOT_FOUND,
          'Company not found or no data available',
          404
        );
      }

      // Convert to standard format
      return {
        name: company.name,
        domain: params.domain || '',
        description: company.description,
        industry: company.industry,
        size: company.employeeCount?.toString(),
        location: company.hqAddress,
        linkedinUrl: company.linkedInURL,
        technologies: company.keywords || [],
        additionalData: {
          founded: company.founded,
          revenue: company.revenue,
          phones: company.phones,
          websites: company.websites,
          digitalPresence: company.digitalPresence,
          hqCountry: company.hqCountry,
          isPublic: company.isPublic,
          fundingRounds: company.fundingRounds
        },
      };
    } catch (error) {
      logger.error('Error enriching company with Surfe:', error);
      throw this.mapErrorToStandard(error);
    }
  }

  private async searchPeople(params: any): Promise<any> {
    try {
      logger.info('Searching people with Surfe', { params });
      
      // Transform our params to Surfe's format
      const surfeParams: any = {
        limit: params.limit || 10,
        pageToken: params.pageToken || "",
        peoplePerCompany: params.peoplePerCompany || 5
      };

      // Add companies filter if available
      if (params.companyDomains && params.companyDomains.length > 0) {
        surfeParams.companies = {
          domains: params.companyDomains
        };
      }

      if (params.companyCountries && params.companyCountries.length > 0) {
        if (!surfeParams.companies) surfeParams.companies = {};
        surfeParams.companies.countries = params.companyCountries;
      }

      // Add people filter if available
      if (params.jobTitles && params.jobTitles.length > 0 || 
          params.seniorities && params.seniorities.length > 0 ||
          params.departments && params.departments.length > 0) {
        
        surfeParams.people = {};
        
        if (params.jobTitles && params.jobTitles.length > 0) {
          surfeParams.people.jobTitles = params.jobTitles;
        }
        
        if (params.seniorities && params.seniorities.length > 0) {
          surfeParams.people.seniorities = params.seniorities;
        }
        
        if (params.departments && params.departments.length > 0) {
          surfeParams.people.departments = params.departments;
        }
      }

      // People search is synchronous unlike enrichment
      const response = await this.client.post('/v2/people/search', surfeParams);
      
      return {
        data: response.data.people,
        pagination: {
          total: response.data.total,
          nextPageToken: response.data.nextPageToken || null
        }
      };
    } catch (error) {
      logger.error('Error searching people with Surfe:', error);
      throw this.mapErrorToStandard(error);
    }
  }

  private async searchCompanies(params: any): Promise<any> {
    try {
      logger.info('Searching companies with Surfe', { params });
      
      // Transform our params to Surfe's format
      const surfeParams: any = {
        limit: params.limit || 10,
        pageToken: params.pageToken || ""
      };

      // Add filters if available
      if (params.domains || params.countries || params.industries || 
          params.employeeCountRange || params.revenueRange) {
        
        surfeParams.filters = {};
        
        if (params.domains && params.domains.length > 0) {
          surfeParams.filters.domains = params.domains;
        }
        
        if (params.countries && params.countries.length > 0) {
          surfeParams.filters.countries = params.countries;
        }
        
        if (params.industries && params.industries.length > 0) {
          surfeParams.filters.industries = params.industries;
        }
        
        if (params.employeeCountRange) {
          surfeParams.filters.employeeCount = {
            from: params.employeeCountRange.min || 1,
            to: params.employeeCountRange.max || 999999999
          };
        }
        
        if (params.revenueRange) {
          surfeParams.filters.revenue = {
            from: params.revenueRange.min || 1,
            to: params.revenueRange.max || 999999999
          };
        }
      }

      // Companies search is synchronous unlike enrichment
      const response = await this.client.post('/v2/companies/search', surfeParams);
      
      return {
        data: response.data.companies,
        pagination: {
          nextPageToken: response.data.nextPageToken || null
        }
      };
    } catch (error) {
      logger.error('Error searching companies with Surfe:', error);
      throw this.mapErrorToStandard(error);
    }
  }

  /**
   * Polls an enrichment endpoint until completion or timeout
   */
  private async pollEnrichmentStatus(endpoint: string, maxWaitTime = MAX_ENRICHMENT_WAIT_TIME): Promise<any> {
    const startTime = Date.now();
    let pollInterval = INITIAL_POLL_INTERVAL;
    
    while (Date.now() - startTime < maxWaitTime) {
      // Get current status
      const response = await this.client.get(endpoint);
      const data = response.data;
      
      // Check if completed
      if (data.status === 'COMPLETED') {
        return data;
      }
      
      // Check for errors
      if (data.status === 'FAILED' || data.status === 'ERROR') {
        throw new CustomError(
          ErrorCode.PROVIDER_ERROR,
          `Enrichment failed: ${data.message || 'Unknown error'}`,
          500
        );
      }
      
      // Log progress
      logger.debug('Enrichment in progress', { 
        status: data.status, 
        percentCompleted: data.percentCompleted 
      });
      
      // Wait before polling again with exponential backoff
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      pollInterval = Math.min(pollInterval * 1.5, 5000); // Cap at 5 seconds
    }
    
    // If we get here, we've timed out
    throw new CustomError(
      ErrorCode.PROVIDER_ERROR,
      'Enrichment timed out',
      408
    );
  }

  private async findLookalikes(params: any): Promise<any> {
    try {
      logger.info('Finding lookalike companies with Surfe', { params });
      
      // Transform our params to Surfe's format
      const surfeParams: any = {
        maxResults: params.maxResults || 10
      };

      // Add domains if available
      if (params.domains && params.domains.length > 0) {
        surfeParams.domains = params.domains;
      }

      // Add company names if available
      if (params.companyNames && params.companyNames.length > 0) {
        surfeParams.names = params.companyNames;
      }

      // Add filters if available
      if (params.industries || params.locations || params.employeeSizes || 
          params.revenues || params.technologies || params.keywords) {
        
        surfeParams.filters = {};
        
        if (params.industries && params.industries.length > 0) {
          surfeParams.filters.industries = params.industries;
        }
        
        if (params.locations && params.locations.length > 0) {
          surfeParams.filters.locations = params.locations;
          // Primary locations are typically the same as locations
          surfeParams.filters.primaryLocations = params.locations;
        }
        
        if (params.employeeSizes && params.employeeSizes.length > 0) {
          surfeParams.filters.employeeCounts = params.employeeSizes;
        }
        
        if (params.revenues && params.revenues.length > 0) {
          surfeParams.filters.revenues = params.revenues;
        }
        
        if (params.technologies && params.technologies.length > 0) {
          surfeParams.filters.technologies = params.technologies;
        }
        
        if (params.keywords && params.keywords.length > 0) {
          surfeParams.filters.keywords = params.keywords;
        }
      }

      // Lookalikes endpoint is synchronous
      const response = await this.client.post('/v1/organizations/lookalikes', surfeParams);
      
      if (!response.data.organizations || response.data.organizations.length === 0) {
        return {
          data: [],
          count: 0
        };
      }

      // Transform to standard format
      const companies = response.data.organizations.map((org: any) => ({
        name: org.name,
        domain: org.website,
        description: org.description,
        industry: org.industries?.[0]?.industry || '',
        size: org.size,
        location: org.addresses?.[0]?.raw || '',
        linkedinUrl: org.linkedinUrl,
        revenue: org.annualRevenueRange,
        technologies: org.keywords || [],
        additionalData: {
          founded: org.founded,
          phones: org.phones,
          logoUrl: org.logoUrl,
          digitalPresence: org.digitalPresence,
          parentOrganization: org.parentOrganization,
          stocks: org.stocks,
          isPublic: org.isPublic
        }
      }));

      return {
        data: companies,
        count: companies.length
      };
    } catch (error) {
      logger.error('Error finding lookalike companies with Surfe:', error);
      throw this.mapErrorToStandard(error);
    }
  }

 /**
 * Calculate estimated credits used for an operation.
 * NOTE: This is a placeholder implementation with estimated values.
 * TODO: In the future, implement actual credit usage tracking from API responses.
 */
  protected calculateCredits(operation: ProviderOperation): number {
    // Estimated credit usage based on typical Surfe operations
    const creditMap: Record<ProviderOperation, number> = {
      [ProviderOperation.FIND_EMAIL]: 1,
      [ProviderOperation.ENRICH_PERSON]: 2, // Assuming both email and phone lookup
      [ProviderOperation.ENRICH_COMPANY]: 1,
      [ProviderOperation.SEARCH_PEOPLE]: 0, // Search doesn't use credits
      [ProviderOperation.SEARCH_COMPANIES]: 0, // Search doesn't use credits
      [ProviderOperation.FIND_LOOKALIKE]: 1,
    };
    return creditMap[operation] || 1;
  }
}

// Register the provider
ProviderRegistry.register('surfe', SurfeProvider);