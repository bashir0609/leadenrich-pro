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
        return this.findLookalike(request.params);
      default:
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
    const maxAttempts = 30; // 30 seconds max wait
    
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
    const enrichmentCompany = {
      domain: params.domain,
      externalID: `ext_${Date.now()}`,
    };

    // Start enrichment
    const startResponse = await this.client.post('/v2/companies/enrich', {
      companies: [enrichmentCompany],
    });

    const enrichmentId = startResponse.data.enrichmentID;
    
    // Poll for completion
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      await this.sleep(1000);
      
      const resultResponse = await this.client.get(`/v2/companies/enrich/${enrichmentId}`);
      const company = resultResponse.data;
      
      if (company.status === 'COMPLETED') {
        return {
          name: company.name,
          domain: params.domain || company.websites?.[0] || '',
          description: company.description,
          industry: company.industry,
          size: company.employeeCount?.toString(),
          location: company.hqAddress ? `${company.hqAddress}, ${company.hqCountry}` : company.hqCountry,
          linkedinUrl: company.linkedInURL,
          technologies: company.keywords || [],
          additionalData: {
            founded: company.founded,
            revenue: company.revenue,
            isPublic: company.isPublic,
            phones: company.phones,
            websites: company.websites,
            digitalPresence: company.digitalPresence,
            fundingRounds: company.fundingRounds,
            parentOrganization: company.parentOrganization,
            stocks: company.stocks,
            followersLinkedIn: company.followersCountLinkedi,
            subIndustry: company.subIndustry,
            ipo: company.ipo,
          },
        };
      }
      
      attempts++;
    }
    
    throw new CustomError(
      ErrorCode.PROVIDER_ERROR,
      'Company enrichment timeout',
      408
    );
  }

  private async searchPeople(params: any): Promise<any> {
    const searchParams = {
      companies: params.companies || {
        domains: params.companyDomains,
        names: params.companyNames,
        industries: params.industries,
        countries: params.countries,
        employeeCount: params.employeeCount,
        revenue: params.revenue,
      },
      people: params.people || {
        jobTitles: params.jobTitles,
        seniorities: params.seniorities,
        departments: params.departments,
        countries: params.countries,
      },
      limit: Math.min(params.limit || 25, 100), // Surfe has limits
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
      [ProviderOperation.FIND_EMAIL]: 2,
      [ProviderOperation.ENRICH_PERSON]: 2,
      [ProviderOperation.ENRICH_COMPANY]: 3,
      [ProviderOperation.SEARCH_PEOPLE]: 1,
      [ProviderOperation.SEARCH_COMPANIES]: 1,
      [ProviderOperation.FIND_LOOKALIKE]: 5,
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
ProviderRegistry.register('surfe', SurfeProvider);