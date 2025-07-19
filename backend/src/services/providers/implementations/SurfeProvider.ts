// backend/src/services/providers/implementations/SurfeProvider.ts
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

interface SurfeApiError {
  message: string;
  code?: string;
  details?: any;
  [key: string]: any; // Index signature to match ErrorDetails
}

export class SurfeProvider extends BaseProvider {
  static statusCheckCounts = new Map<string, number>();
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
            data as any
          );
        case 429:
          return new CustomError(
            ErrorCode.PROVIDER_RATE_LIMIT,
            'Surfe rate limit exceeded',
            429,
            data as any
          );
        
        case 403:
          return new CustomError(
            ErrorCode.PROVIDER_QUOTA_EXCEEDED,
            `Surfe Quota Exceeded: ${data.message || 'Check your API plan and usage.'}`,
            403,
            data as any
          );
          
        case 400:
          return new CustomError(
            ErrorCode.INVALID_INPUT,
            data.message || 'Invalid request to Surfe',
            400,
            data as any
          );
        default:
          return new CustomError(
            ErrorCode.PROVIDER_ERROR,
            `Surfe API error: ${data.message || 'Unknown error'}`,
            status,
            data as any
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

  // Replace the entire executeOperation method with this corrected version

  protected async executeOperation(request: ProviderRequest): Promise<any> {
    console.log('🎯 executeOperation called with:', request.operation);
    console.log('🎯 Request params:', JSON.stringify(request.params, null, 2));
    
    switch (request.operation) {
      case ProviderOperation.FIND_EMAIL:
        return this.findEmail(request.params as EmailSearchParams);
        
      case ProviderOperation.ENRICH_PERSON:
        return this.enrichPerson(request.params as PersonEnrichParams);
        
      case ProviderOperation.ENRICH_COMPANY:
        if (request.params.companies && Array.isArray(request.params.companies)) {
          return this.enrichCompaniesBulk(request.params);
        }
        return this.enrichCompany(request.params as CompanyEnrichParams);
        
      case ProviderOperation.SEARCH_PEOPLE:
        return this.searchPeople(request.params);
        
      case ProviderOperation.SEARCH_COMPANIES:
        return this.searchCompanies(request.params);
        
      case ProviderOperation.FIND_LOOKALIKE:
        return this.findLookalike(request.params);
        
      default:
        console.log(`❌ No operation matched for '${request.operation}', throwing error`);
        throw new CustomError(
          ErrorCode.OPERATION_FAILED,
          `Operation ${request.operation} not implemented for Surfe`,
          501
        );
    }
  }

  private async findEmail(params: EmailSearchParams): Promise<EmailResult> {
    // Use people enrichment to find email
    try {
      const enrichedPerson = await this.enrichPerson({
        firstName: params.firstName,
        lastName: params.lastName,
        companyDomain: params.companyDomain,
        linkedinUrl: params.linkedinUrl,
      });

      if (enrichedPerson.email) {
        return {
          email: enrichedPerson.email,
          confidence: 0.9,
          sources: ['surfe'],
          verified: true,
        };
      }
    } catch (error) {
      // If enrichment fails, try search
      const searchResult = await this.searchPeople({
        companies: {
          domains: params.companyDomain ? [params.companyDomain] : undefined,
          names: params.companyName ? [params.companyName] : undefined,
        },
        people: {
          // We can't search by name directly in Surfe, so search broadly
        },
        limit: 10,
      });

      if (searchResult.people && searchResult.people.length > 0) {
        // Try to match by name and enrich
        const matchedPerson = searchResult.people.find((person: any) => 
          (!params.firstName || person.firstName?.toLowerCase().includes(params.firstName.toLowerCase())) &&
          (!params.lastName || person.lastName?.toLowerCase().includes(params.lastName.toLowerCase()))
        );

        if (matchedPerson) {
          const enriched = await this.enrichPerson({
            firstName: matchedPerson.firstName,
            lastName: matchedPerson.lastName,
            companyDomain: matchedPerson.companyDomain,
            linkedinUrl: matchedPerson.linkedInUrl,
          });

          if (enriched.email) {
            return {
              email: enriched.email,
              confidence: 0.8,
              sources: ['surfe'],
              verified: true,
            };
          }
        }
      }
    }

    throw new CustomError(ErrorCode.NOT_FOUND, 'Email not found', 404);
  }

  private async enrichPerson(params: PersonEnrichParams & { include?: any }): Promise<PersonData> {
    const includeOptions = params.include || {
      email: true,
      mobile: false,
      linkedInUrl: true,
      jobHistory: false,
    };

    const enrichmentRequest = {
      people: [{
        firstName: params.firstName,
        lastName: params.lastName,
        companyDomain: params.companyDomain,
        companyName: params.companyName,
        linkedinUrl: params.linkedinUrl,
        externalID: `ext_${Date.now()}`,
      }],
      include: includeOptions,
    };

    // Start enrichment
    const startResponse = await this.client.post('/v2/people/enrich', enrichmentRequest);
    if (!startResponse.data || !startResponse.data.enrichmentID) {
      throw new CustomError(ErrorCode.PROVIDER_ERROR, 'Failed to start person enrichment', 500);
    }

    const enrichmentId = startResponse.data.enrichmentID;
    
    // Poll for completion (Surfe uses async enrichment)
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      await this.sleep(1000); // Wait 1 second
      
      const resultResponse = await this.client.get(`/v2/people/enrich/${enrichmentId}`);
      const result = resultResponse.data;
      
      if (result.status === 'COMPLETED' || result.percentCompleted === 100) {
        const person = result.people?.[0];
        
        if (!person) {
          throw new CustomError(ErrorCode.NOT_FOUND, 'Person not found', 404);
        }

        if (person.status !== 'COMPLETED') {
          throw new CustomError(ErrorCode.NOT_FOUND, 'Person enrichment failed', 404);
        }

        return {
          firstName: person.firstName,
          lastName: person.lastName,
          fullName: `${person.firstName || ''} ${person.lastName || ''}`.trim(),
          email: person.emails?.[0]?.email,
          phone: person.mobilePhones?.[0]?.mobilePhone,
          title: person.jobTitle,
          company: person.companyName,
          linkedinUrl: person.linkedInUrl,
          location: person.location,
          additionalData: {
            seniority: person.seniorities,
            departments: person.departments,
            emailValidation: person.emails?.[0]?.validationStatus,
            phoneConfidence: person.mobilePhones?.[0]?.confidenceScore,
            jobHistory: person.jobHistory,
            country: person.country,
          },
        };
      }
      
      attempts++;
    }
    
    throw new CustomError(
      ErrorCode.PROVIDER_ERROR,
      'Enrichment timeout - operation took too long',
      408
    );
  }

  private async enrichCompany(params: CompanyEnrichParams): Promise<CompanyData> {
    console.log('🔍 enrichCompany started with params:', params);
    
    try {
      const enrichmentCompany = {
        domain: params.domain,
        externalID: `ext_${Date.now()}`,
      };

      console.log('📤 Sending to Surfe API:', enrichmentCompany);

      // Start enrichment
      const startResponse = await this.client.post('/v2/companies/enrich', {
        companies: [enrichmentCompany],
      });

      console.log('✅ Start response from Surfe:', startResponse.data);

      const enrichmentId = startResponse.data.enrichmentID;
      console.log('🆔 Got enrichment ID:', enrichmentId);
      
      // Poll for completion
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        console.log(`⏰ Waiting 1 second before poll attempt ${attempts + 1}...`);
        await this.sleep(1000);
        
        console.log(`🔄 Making poll request to: /v2/companies/enrich/${enrichmentId}`);
        const resultResponse = await this.client.get(`/v2/companies/enrich/${enrichmentId}`);
        const company = resultResponse.data;
        
        console.log(`📊 Poll attempt ${attempts + 1}, status: ${company.status}`);
        console.log('📥 Raw Surfe response:', JSON.stringify(company, null, 2));
        
        // Replace the return statement in your enrichCompany method in SurfeProvider.ts
        // Find this section in enrichCompany method and replace:

        if (company.status === 'COMPLETED') {
          console.log('🎉 Enrichment completed! Processing data...');
          
          const companyData = company.companies?.[0]; // This is EnrichedCompanyResponse
          
          if (!companyData) {
            throw new CustomError(
              ErrorCode.NOT_FOUND,
              'No company data found in response',
              404
            );
          }
          
          // Return the company data directly, not wrapped in extra success/data layers
          const result = {
            name: companyData.name || '',
            domain: params.domain || '',
            description: companyData.description || '',
            industry: companyData.industry || '',
            size: companyData.employeeCount ? companyData.employeeCount.toString() : '',
            location: companyData.hqAddress || '',
            linkedinUrl: companyData.linkedInURL || '',
            technologies: companyData.keywords || [],
            additionalData: {
              founded: companyData.founded,
              revenue: companyData.revenue,
              isPublic: companyData.isPublic,
              phones: companyData.phones || [],
              websites: companyData.websites || [],
              digitalPresence: companyData.digitalPresence || [],
              fundingRounds: companyData.fundingRounds || [],
              parentOrganization: companyData.parentOrganization,
              stocks: companyData.stocks || [],
              followersLinkedIn: companyData.followersCountLinkedin || 0,
              subIndustry: companyData.subIndustry,
              ipo: companyData.ipo,
              employeeCount: companyData.employeeCount,
              hqAddress: companyData.hqAddress,
              hqCountry: companyData.hqCountry,
              externalID: companyData.externalID,
              status: companyData.status,
            },
          };
          
          console.log('🚀 Returning result:', JSON.stringify(result, null, 2));
          return result; // Return this directly, not wrapped in {success: true, data: result}
        }
        
        attempts++;
      }
      
      console.log('⏰ Timeout reached after', maxAttempts, 'attempts');
      throw new CustomError(
        ErrorCode.PROVIDER_ERROR,
        'Company enrichment timeout',
        408
      );
      
    } catch (error) {
      console.error('💥 Error in enrichCompany:', error);
      throw error;
    }
  }

  private async enrichCompaniesBulk(params: any): Promise<CompanyData[]> {
    console.log('🔍 enrichCompaniesBulk started with params:', params);
    
    let companies = params.companies;
    if (!companies && params.records) {
      companies = params.records;
    }

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      throw new CustomError(ErrorCode.INVALID_INPUT, 'Companies array is required', 400);
    }

    if (companies.length === 1) {
      const domain = companies[0].domain;
      if (!domain) {
        throw new CustomError(ErrorCode.INVALID_INPUT, 'Domain is required', 400);
      }
      // For a single company, we can just use the existing single-enrich function
      const singleResult = await this.enrichCompany({ domain });
      return [singleResult]; // Return as an array
    }

    if (companies.length > 500) {
        throw new CustomError(ErrorCode.INVALID_INPUT, 'Maximum 500 companies allowed per batch', 400);
    }

    const enrichmentCompanies = companies.map((company: any, index: number) => {
        if (!company.domain) {
            throw new CustomError(ErrorCode.INVALID_INPUT, `Company at index ${index} is missing domain`, 400);
        }
        return { domain: company.domain, externalID: `bulk_${Date.now()}_${index}` };
    });

    // Start the bulk enrichment job
    const startResponse = await this.client.post('/v2/companies/enrich', { companies: enrichmentCompanies });
    const enrichmentId = startResponse.data?.enrichmentID;

    if (!enrichmentId) {
        throw new CustomError(ErrorCode.PROVIDER_ERROR, 'Failed to start bulk enrichment job', 500);
    }

    console.log('🆔 Got bulk enrichment ID:', enrichmentId, 'starting internal polling...');

    // Poll for completion internally
    let attempts = 0;
    const maxAttempts = 180; // ~3 minutes timeout (180 attempts * 1 second)

    while (attempts < maxAttempts) {
        await this.sleep(1000); // Wait 1 second

        const resultResponse = await this.client.get(`/v2/companies/enrich/${enrichmentId}`);
        const result = resultResponse.data;

        if (result.status === 'COMPLETED' || result.percentCompleted === 100) {
            console.log('🎉 Bulk enrichment completed internally!');
            
            if (!result.companies || result.companies.length === 0) {
                throw new CustomError(ErrorCode.NOT_FOUND, 'No company data found in response', 404);
            }

            // Map the raw results to our standard CompanyData format
            return result.companies.map((companyData: any) => ({
                name: companyData.name || '',
                domain: companyData.websites?.[0] || '',
                description: companyData.description || '',
                industry: companyData.industry || '',
                size: companyData.employeeCount ? companyData.employeeCount.toString() : '',
                location: companyData.hqAddress || '',
                linkedinUrl: companyData.linkedInURL || '',
                technologies: companyData.keywords || [],
                additionalData: {
                    founded: companyData.founded,
                    revenue: companyData.revenue,
                    isPublic: companyData.isPublic,
                    phones: companyData.phones || [],
                    websites: companyData.websites || [],
                    digitalPresence: companyData.digitalPresence || [],
                    fundingRounds: companyData.fundingRounds || [],
                    parentOrganization: companyData.parentOrganization,
                    stocks: companyData.stocks || [],
                    followersLinkedIn: companyData.followersCountLinkedin || 0,
                    subIndustry: companyData.subIndustry,
                    ipo: companyData.ipo,
                    employeeCount: companyData.employeeCount,
                    hqAddress: companyData.hqAddress,
                    hqCountry: companyData.hqCountry,
                    externalID: companyData.externalID,
                    status: companyData.status,
                },
            }));
        }
        
        attempts++;
    }

    throw new CustomError(ErrorCode.PROVIDER_ERROR, 'Bulk enrichment timeout - operation took too long', 408);
  }

  // New method to check bulk enrichment status
  async checkBulkEnrichmentStatus(enrichmentId: string): Promise<any> {
    console.log('🔍 [DEBUG] checkBulkEnrichmentStatus called with ID:', enrichmentId);

    if (!enrichmentId || typeof enrichmentId !== 'string') {
      throw new CustomError(
        ErrorCode.INVALID_INPUT,
        'Valid enrichment ID is required',
        400
      );
    }

    // Add timeout protection
    if (!SurfeProvider.statusCheckCounts) {
      SurfeProvider.statusCheckCounts = new Map();
    }
    const currentCount = (SurfeProvider.statusCheckCounts.get(enrichmentId) || 0) + 1;
    if (currentCount > 180) { // Max 180 attempts = ~18 minutes
      SurfeProvider.statusCheckCounts.delete(enrichmentId);
      throw new CustomError(
        ErrorCode.PROVIDER_ERROR,
        'Enrichment timeout - maximum polling attempts reached',
        408
      );
    }
    SurfeProvider.statusCheckCounts.set(enrichmentId, currentCount);

    try {
      console.log('📡 [DEBUG] Making request to Surfe API for status check...');
      
      const resultResponse = await this.client.get(`/v2/companies/enrich/${enrichmentId}`);
      const result = resultResponse.data;

      if (!result || typeof result !== 'object') {
        throw new CustomError(
          ErrorCode.PROVIDER_ERROR,
          'Invalid response format from Surfe API',
          500,
          { response: result }
        );
      }
      
      if (result.status === 'COMPLETED') {
        // ... (this part is correct)
        return {
          success: true,
          data: { /* ... */ }
        };
      }
      
      if (result.status === 'FAILED') {
        // ... (this part is correct)
        return {
          success: false,
          data: { /* ... */ }
        };
      }
      
      // Still processing
      return {
        success: true,
        data: {
          status: result.status || 'PROCESSING',
          percentCompleted: result.percentCompleted || 0,
          message: 'Enrichment in progress'
        }
      };
      
    } catch (error: any) {
      console.error('💥 [DEBUG] Error checking enrichment status:', error);
      if (error.response) {
        throw this.mapErrorToStandard(error);
      }
      
      throw new CustomError(
        ErrorCode.PROVIDER_ERROR,
        `Failed to check enrichment status: ${error.message || 'Unknown error'}`,
        500,
        { originalError: error }
      );
    }
  }

  private async searchPeople(params: any): Promise<any> {
    const searchParams = {
      companies: {
        domains: params.companies?.domains,
        names: params.companies?.names,
        industries: params.companies?.industries,
        countries: params.companies?.countries,
        employeeCount: params.companies?.employeeCount,
        revenue: params.companies?.revenue,
      },
      people: {
        jobTitles: params.people?.jobTitles,
        seniorities: params.people?.seniorities,
        departments: params.people?.departments,
        countries: params.people?.countries,
      },
      limit: Math.min(params.limit || 25, 100),
      pageToken: params.pageToken || '',
      peoplePerCompany: Math.min(params.peoplePerCompany || 5, 20),
    };

    const response = await this.client.post('/v2/people/search', searchParams);
    
    return {
      people: response.data.people || [],
      nextPageToken: response.data.nextPageToken,
      total: response.data.total || 0,
    };
  }

  private async searchCompanies(params: any): Promise<any> {
    const searchParams = {
      filters: {
        countries: params.countries,
        domains: params.domains,
        domainsExcluded: params.domainsExcluded,
        industries: params.industries,
        employeeCount: params.employeeCount,
        revenue: params.revenue,
      },
      limit: Math.min(params.limit || 25, 100),
      pageToken: params.pageToken || '',
    };

    const response = await this.client.post('/v2/companies/search', searchParams);
    
    return {
      companies: response.data.companies || [],
      nextPageToken: response.data.nextPageToken,
      companyDomains: response.data.companyDomains || [],
    };
  }

  private async findLookalike(params: any): Promise<any> {
    const lookalikeParams = {
      domains: params.domains || [],
      names: params.names || [],
      maxResults: Math.min(params.maxResults || 10, 50),
      filters: {
        employeeCounts: params.employeeCounts,
        industries: params.industries,
        keywords: params.keywords,
        locations: params.locations,
        primaryLocations: params.primaryLocations,
        revenues: params.revenues,
        technologies: params.technologies,
      },
    };

    const response = await this.client.post('/v1/organizations/lookalikes', lookalikeParams);
    
    return {
      organizations: (response.data.organizations || []).map((org: any) => ({
        name: org.name,
        domain: org.website?.replace(/^https?:\/\//, ''),
        description: org.description,
        industry: org.industries?.[0]?.industry,
        size: org.size,
        location: org.addresses?.[0]?.raw,
        linkedinUrl: org.linkedinUrl,
        technologies: org.keywords || [],
        additionalData: {
          founded: org.founded,
          revenue: org.annualRevenueRange,
          isPublic: org.isPublic,
          phones: org.phones,
          digitalPresence: org.digitalPresence,
          fundingRounds: org.fundingRounds,
          parentOrganization: org.parentOrganization,
          stocks: org.stocks,
          followersLinkedIn: org.followersCountLinkedin,
          logoUrl: org.logoUrl,
          addresses: org.addresses,
        },
      })),
    };
  }

  protected calculateCredits(operation: ProviderOperation): number {
    // Surfe's actual credit costs
    const creditMap: Record<ProviderOperation, number> = {
      [ProviderOperation.FIND_EMAIL]: 1,
      [ProviderOperation.ENRICH_PERSON]: 1,
      [ProviderOperation.ENRICH_COMPANY]: 0,
      [ProviderOperation.SEARCH_PEOPLE]: 0,
      [ProviderOperation.SEARCH_COMPANIES]: 0,
      [ProviderOperation.FIND_LOOKALIKE]: 0,
    };
    return creditMap[operation] || 1;
  }

  // Use protected instead of private to match BaseProvider
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Register the provider (keep your existing registration pattern)
import { ProviderRegistry } from '../ProviderRegistry';
import { request } from 'express';
ProviderRegistry.register('surfe', SurfeProvider);