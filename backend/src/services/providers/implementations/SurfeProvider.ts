import { BaseProvider } from '../base/BaseProvider';
import { CustomError, ErrorCode } from '../../../types/errors';
import { ApiKeyService } from '../../ApiKeyService';
import prisma from '../../../lib/prisma';

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

interface SurfeApiError {
  message: string;
  code?: string;
  details?: any;
  [key: string]: any; // Index signature to match ErrorDetails
}

export class SurfeProvider extends BaseProvider {
  static statusCheckCounts = new Map<string, number>();
  
  public isAuthenticated: boolean = false;

    async authenticate(userId?: string): Promise<void> {
    if (!userId) {
      throw new Error('Authentication failed: SurfeProvider was called without a user context.');
    }

    try {
      const apiKeyData = await ApiKeyService.getActiveApiKey(this.config.providerNumericId, userId);

      if (!apiKeyData) {
        throw new Error(`Authentication failed: No active API key found for Surfe for user ID ${userId}.`);
      }

      const apiKey = apiKeyData.keyValue;
      console.log('🔑 Raw API key length:', apiKey.length);
      console.log('🔑 API key first 10 chars:', apiKey.substring(0, 10));
      console.log('🔑 API key last 10 chars:', apiKey.substring(apiKey.length - 10));
      console.log('🔑 API key has spaces?', apiKey.includes(' '));
      
      // Clean the API key of any whitespace
      const cleanApiKey = apiKey.trim();
      this.client.defaults.headers.common['Authorization'] = `Bearer ${cleanApiKey}`;
      
      // Skip API key validation - let actual API calls handle authentication
      this.isAuthenticated = true;
      console.log('🔑 Surfe API key configured (validation skipped)');
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Unsupported state or unable to authenticate data')) {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        await prisma.apiKey.updateMany({
          where: { 
            providerId: this.config.providerNumericId, 
            userId, 
            isActive: true 
          },
          data: { isActive: false }
        });
        
        // await prisma.$disconnect();
        
        throw new Error('API key corrupted due to encryption changes. Please re-enter your Surfe API key.');
      }
      
      throw error instanceof Error ? error : new Error(String(error));
    }
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
        case 500:
          return new CustomError(
            ErrorCode.PROVIDER_ERROR,
            `Surfe API error (500): ${data.message || 'The Surfe API is experiencing internal issues. Please try again later or contact Surfe support at api.support@surfe.com.'}`,
            status,
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

  private async enrichPerson(params: PersonEnrichParams): Promise<{ people: PersonData[] }> {
    console.log('🔍 Enrich Person Request:', JSON.stringify(params, null, 2));
    
    // Generate a unique external ID for this request
    const externalId = `ext_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const maxAttempts = 10; // 10 attempts * 10 seconds = 1 minute max
    const initialPollInterval = 10000; // Start with 10 second intervals
    const maxPollInterval = 10000; // Max 10 seconds between polls
    const maxRuntimeMs = 60000; // 1 minute max runtime
    const startTime = Date.now();
    
    console.log(`🔍 Starting enrichment process with externalId: ${externalId}`);
    
    let attempts = 0;
    let lastProgressTime = Date.now();
    let lastProgressPercent = 0;
    let enrichmentId: string;
    let currentPollInterval = initialPollInterval;
    
    try {
      // Build the enrichment request
      const enrichmentRequest: any = {
        include: {
          email: params.include?.email || false,
          mobile: params.include?.mobile || false,
          linkedInUrl: params.include?.linkedInUrl || false,
          jobHistory: params.include?.jobHistory || false,
        },
        notificationOptions: {
          webhookUrl: ""
        },
        people: [
          Object.fromEntries(
            Object.entries({
              firstName: params.firstName,
              lastName: params.lastName,
              companyDomain: params.companyDomain,
              linkedInUrl: params.linkedinUrl,
              email: params.email,
              externalID: externalId,
            }).filter(([, value]) => value !== null && value !== '' && value !== undefined)
          ),
        ],
      };
      
      console.log('🚀 Starting enrichment with request:', JSON.stringify(enrichmentRequest, null, 2));
      
      // Add a small delay before making the request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Start the enrichment process
      const startResponse = await this.client.post(
        '/v2/people/enrich',
        enrichmentRequest,
        {
          headers: { 
            'Content-Type': 'application/json',
            'X-Request-ID': externalId
          },
          timeout: 30000 // 30 second timeout for initial request
        }
      );
      
      console.log('🎯 Enrichment started:', {
        status: startResponse.status,
        data: startResponse.data,
        externalId
      });
      
      enrichmentId = startResponse.data.enrichmentID;
      
      if (!enrichmentId) {
        throw new CustomError(
          ErrorCode.PROVIDER_ERROR,
          'Failed to start enrichment: No enrichment ID returned',
          500,
          { response: startResponse.data }
        );
      }
      
      console.log(`🔍 Starting polling for enrichment (ID: ${enrichmentId}, max attempts: ${maxAttempts})`);
      
      // Poll for results with exponential backoff
      while (attempts < maxAttempts) {
        attempts++;
        const elapsedMs = Date.now() - startTime;
        const timeLeftMs = maxRuntimeMs - elapsedMs;
        
        if (timeLeftMs <= 0) {
          throw new CustomError(
            ErrorCode.PROVIDER_ERROR,
            `Enrichment exceeded maximum runtime of ${maxRuntimeMs/1000} seconds`,
            504,
            { enrichmentId, externalId, attempts, elapsedMs }
          );
        }
        
        // Calculate next poll interval with exponential backoff (capped at maxPollInterval)
        const backoff = Math.min(initialPollInterval * Math.pow(1.5, Math.floor(attempts/3)), maxPollInterval);
        console.log(`⏳ Polling attempt ${attempts}/${maxAttempts} in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        
        try {
          const resultResponse = await this.client.get(`/v2/people/enrich/${enrichmentId}`, {
            timeout: 30000, // 30 second timeout for each poll
            headers: { 'X-Request-ID': `${externalId}-poll-${attempts}` }
          });
          
          const result = resultResponse.data;
          const currentStatus = result.status || 'UNKNOWN';
          const percentComplete = result.percentCompleted || 0;
          
          // Check for progress
          if (percentComplete > lastProgressPercent) {
            lastProgressPercent = percentComplete;
            lastProgressTime = Date.now();
          } else if (Date.now() - lastProgressTime > 15000) { // 15 seconds without progress
            console.warn(`⚠️ No progress for 15 seconds. Current status: ${currentStatus} (${percentComplete}%)`);
          }
          
          console.log(`📊 Poll Response (${attempts}/${maxAttempts}):`, {
            status: resultResponse.status,
            currentStatus,
            percentComplete: `${percentComplete}%`,
            hasPeopleData: !!result.people?.[0],
            peopleCount: result.people?.length || 0,
            elapsed: `${(elapsedMs/1000).toFixed(1)}s`
          });
          
          console.log('Raw API response:', JSON.stringify(result, null, 2));
          
          // Handle different statuses
          if (currentStatus === 'COMPLETED' || percentComplete === 100) {
            console.log('✅ Enrichment completed successfully!', { 
              enrichmentId, 
              attempts,
              elapsed: `${(elapsedMs/1000).toFixed(1)}s`
            });
            
            const person = result.people?.[0];
            if (!person) {
              throw new CustomError(
                ErrorCode.NOT_FOUND, 
                'No person data found in completed enrichment',
                404,
                { enrichmentId, response: result }
              );
            }
            
            if (person.status === 'FAILED') {
              throw new CustomError(
                ErrorCode.PROVIDER_ERROR,
                `Enrichment failed: ${person.error || 'Unknown error'}`,
                500,
                { enrichmentId, person }
              );
            }

            const mappedPerson: PersonData = {
              firstName: person.first_name || person.firstName,
              lastName: person.last_name || person.lastName,
              fullName: person.full_name || person.fullName,
              jobTitle: person.job_title || person.jobTitle,
              companyName: person.company_name || person.companyName,
              companyDomain: person.company_domain || person.companyDomain,
              linkedInUrl: person.linkedin_url || person.linkedInUrl,
              location: person.location,
              country: person.country,
              emails: person.emails?.map((e: any) => ({
                email: e.email,
                validationStatus: e.validation_status,
              })) || [],
              mobilePhones: person.mobile_phones?.map((p: any) => ({
                mobilePhone: p.mobile_phone,
                confidenceScore: p.confidence_score,
              })) || [],
              jobHistory: person.job_history || [],
              skills: person.skills || [],
              education: person.education || [],
              socialProfiles: person.social_profiles || [],
              seniorities: person.seniorities || [],
              departments: person.departments || [],
            };

            console.log('✅ Mapped Person Data:', JSON.stringify(mappedPerson, null, 2));

            return { people: [mappedPerson] };
          } else if (currentStatus === 'FAILED') {
            throw new CustomError(
              ErrorCode.PROVIDER_ERROR,
              `Enrichment failed: ${result.message || 'Unknown error'}`,
              500,
              { enrichmentId, response: result }
            );
          }
          // If status is IN_PROGRESS, continue polling
          console.log(`⏳ Enrichment in progress: ${percentComplete}% complete`);
          
        } catch (pollError: any) {
          console.error(`⚠️ Polling error on attempt ${attempts}:`, {
            error: pollError.message,
            stack: pollError.stack,
            enrichmentId,
            attempt: attempts,
            maxAttempts
          });
          
          // If we're close to max attempts, fail fast
          if (attempts >= maxAttempts - 5) {
            throw new CustomError(
              ErrorCode.PROVIDER_ERROR,
              `Failed to complete enrichment after ${attempts} attempts: ${pollError.message}`,
              504,
              { 
                enrichmentId, 
                lastError: pollError.message,
                attempts,
                maxAttempts 
              }
            );
          }
          
          // Exponential backoff for retries
          const backoffTime = Math.min(1000 * Math.pow(2, Math.floor(attempts / 3)), 10000);
          console.log(`⏳ Backing off for ${backoffTime}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
      
      // If we've exhausted all attempts
      throw new CustomError(
        ErrorCode.PROVIDER_ERROR,
        `Enrichment did not complete within ${maxAttempts} attempts (${(maxAttempts * currentPollInterval / 1000).toFixed(0)} seconds)`,
        504,
        { 
          enrichmentId, 
          externalId,
          attempts: maxAttempts,
          totalTimeSeconds: (maxAttempts * currentPollInterval / 1000).toFixed(0)
        }
      );
      
    } catch (error: any) {
      console.error('❌ Enrichment failed with error:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode,
        externalId,
        timestamp: new Date().toISOString()
      });
      
      // Re-throw with enhanced error information
      if (error instanceof CustomError) {
        const enhancedError = new CustomError(
          error.code,
          error.message,
          error.statusCode,
          {
            _metadata: {
              provider: 'surfe',
              enrichmentId: '', // Removed undefined variable
              timestamp: new Date().toISOString(),
              requestId: externalId,
              rawResponse: (error as any).rawResponse || {}
            },
            ...(error.details || {})
          }
        );
        throw enhancedError;
      }
      
      throw new CustomError(
        ErrorCode.PROVIDER_ERROR,
        `Failed to enrich person: ${error.message}`,
        error.statusCode || 500,
        { 
          originalError: error.message,
          externalId,
          timestamp: new Date().toISOString()
        }
      );
    }
  }

  private async enrichCompany(params: CompanyEnrichParams): Promise<CompanyData> {
    // Add type safety check
    if (!params.domain) {
      throw new CustomError(ErrorCode.INVALID_INPUT, 'Domain is required for company enrichment', 400);
    }

    // 1. Build the enrichment request with include parameters
    const enrichmentRequest = {
      companies: [{
        domain: params.domain,
        externalID: `ext_${Date.now()}`,
        // Add name if available, otherwise derive from domain
        name: params.companyName || params.domain.split('.')[0].charAt(0).toUpperCase() + params.domain.split('.')[0].slice(1)
      }],
      include: {
        revenue: true,
        employeeCount: true,
        description: true,
        keywords: true,
        digitalPresence: true,
        fundingRounds: true,
        ipo: true,
        stocks: true,
        parentOrganization: true,
        phones: true,
        websites: true,
        linkedInURL: true,
        founded: true,
        industry: true,
        subIndustry: true,
        hqCountry: true,
        hqAddress: true,
        isPublic: true,
        followersCountLinkedin: true
      }
    };
    
    console.log('🏢 Company Enrichment Request:', JSON.stringify(enrichmentRequest, null, 2));
    
    const delayMs = 1000;
    console.log(`⏱️ Adding ${delayMs}ms delay before making Surfe API request`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    const startResponse = await this.client.post(
      '/v2/companies/enrich', 
      enrichmentRequest,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('✅ Start Response Status:', startResponse.status);
    console.log('✅ Start Response Data:', JSON.stringify(startResponse.data, null, 2));
    
    const enrichmentId = startResponse.data.enrichmentID;

    if (!enrichmentId) {
      throw new CustomError(ErrorCode.PROVIDER_ERROR, 'Failed to start company enrichment', 500);
    }
    
    let attempts = 0;
    const maxAttempts = 30;
        
    while (attempts < maxAttempts) {
      await this.sleep(1000);
      const resultResponse = await this.client.get(`/v2/companies/enrich/${enrichmentId}`);
      
      console.log('--- RAW SURFE API POLLING RESPONSE ---');
      console.log(JSON.stringify(resultResponse.data, null, 2));
      console.log('------------------------------------');
      
      const result = resultResponse.data;
      
      if (result.status === 'COMPLETED') {
        const companyData = result.companies?.[0];

        if (!companyData) {
          throw new CustomError(ErrorCode.NOT_FOUND, 'Enrichment completed but no company data was returned.', 404);
        }
        
        const hasData = companyData.name || companyData.description || companyData.industry || 
                      (companyData.websites && companyData.websites.some((w: string) => w.trim() !== ''));
        
        if (!hasData) {
          console.log('⚠️ WARNING: Enrichment completed but all fields are empty - likely API plan limitation');
        }
        
        return {
          name: companyData.name || '',
          domain: params.domain, // Safe to use now after null check
          description: companyData.description || '',
          industry: companyData.industry || '',
          size: companyData.employeeCount ? companyData.employeeCount.toString() : '',
          location: companyData.hqAddress || '',
          linkedinUrl: companyData.linkedInURL || '',
          technologies: companyData.keywords || [],
          additionalData: {
            employeeCount: companyData.employeeCount,
            founded: companyData.founded,
            revenue: companyData.revenue,
            hqCountry: companyData.hqCountry,
            subIndustry: companyData.subIndustry,
            isPublic: companyData.isPublic,
            followersCountLinkedin: companyData.followersCountLinkedin,
            phones: companyData.phones || [],
            websites: companyData.websites || [],
            digitalPresence: companyData.digitalPresence || [],
            fundingRounds: companyData.fundingRounds || [],
            ipo: companyData.ipo,
            parentOrganization: companyData.parentOrganization,
            stocks: companyData.stocks || [],
            providerStatus: companyData.status,
            externalID: companyData.externalID,
          },
        };
      }
      attempts++;
    }
    throw new CustomError(ErrorCode.PROVIDER_ERROR, 'Company enrichment timeout', 408);
  }

  private async findEmail(params: EmailSearchParams): Promise<EmailResult> {
    console.log('🔍 Find Email Request:', JSON.stringify(params, null, 2));
    
    // Add a fixed delay before making the request to prevent overwhelming the API
    const delayMs = 1000; // 1 second delay
    console.log(`⏱️ Adding ${delayMs}ms delay before making Surfe API request`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    try {
      // First try direct enrichment
      const enrichedResponse = await this.enrichPerson({
        firstName: params.firstName,
        lastName: params.lastName,
        companyDomain: params.companyDomain || params.companyName?.toLowerCase().replace(/\s+/g, '').replace(/\./g, '') || '',
        linkedinUrl: params.linkedinUrl,
      });

      // Check if we have a valid person with email
      if (enrichedResponse.people && enrichedResponse.people.length > 0 && enrichedResponse.people[0].email) {
        return {
          email: enrichedResponse.people[0].email,
          confidence: 0.9,
          sources: ['surfe'],
          verified: true,
        };
      }
      
      // If no email found, try searching first
      console.log('ℹ️ No email found in direct enrichment, falling back to search...');
      
      const searchResult = await this.searchPeople({
        companies: {
          domains: params.companyDomain ? [params.companyDomain] : [],
          names: params.companyName ? [params.companyName] : [],
        },
        people: {
          firstName: params.firstName,
          lastName: params.lastName,
        },
        limit: 10,
      });

      if (searchResult.people && searchResult.people.length > 0) {
        console.log(`🔍 Found ${searchResult.people.length} potential matches, trying to enrich...`);
        
        // Try to find the best match
        const matchedPerson = searchResult.people.find((person: any) => 
          (!params.firstName || 
            (person.firstName && params.firstName && 
             person.firstName.toLowerCase().includes(params.firstName.toLowerCase()))) &&
          (!params.lastName || 
            (person.lastName && params.lastName && 
             person.lastName.toLowerCase().includes(params.lastName.toLowerCase())))
        );

        if (matchedPerson) {
          console.log('🎯 Found matching person in search results, enriching...');
          
          const enrichedResponse = await this.enrichPerson({
            firstName: matchedPerson.firstName,
            lastName: matchedPerson.lastName,
            companyDomain: matchedPerson.companyDomain || 
                         (matchedPerson.companyName ? matchedPerson.companyName.toLowerCase().replace(/\s+/g, '').replace(/\./g, '') : ''),
            linkedinUrl: matchedPerson.linkedInUrl || matchedPerson.linkedinUrl,
          });

          // Check if we have a valid person with email
          if (enrichedResponse.people && enrichedResponse.people.length > 0 && enrichedResponse.people[0].email) {
            return {
              email: enrichedResponse.people[0].email,
              confidence: 0.8, // Slightly lower confidence since we had to search first
              sources: ['surfe'],
              verified: true,
            };
          }
        }
      }
      
      // If we get here, we couldn't find an email
      throw new CustomError(
        ErrorCode.NOT_FOUND,
        'No matching email found after search and enrichment attempts',
        404,
        { 
          firstName: params.firstName,
          lastName: params.lastName,
          companyDomain: params.companyDomain,
          companyName: params.companyName,
          linkedinUrl: params.linkedinUrl,
          timestamp: new Date().toISOString()
        }
      );
      
    } catch (error) {
      console.error('❌ Error in findEmail:', error);
      
      if (error instanceof CustomError) {
        // Re-throw CustomError as is
        throw error;
      }
      
      // Wrap other errors in a CustomError
      throw new CustomError(
        ErrorCode.PROVIDER_ERROR,
        `Failed to find email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        {
          originalError: error,
          params: {
            firstName: params.firstName,
            lastName: params.lastName,
            companyDomain: params.companyDomain,
            companyName: params.companyName,
            linkedinUrl: params.linkedinUrl
          },
          timestamp: new Date().toISOString()
        }
      );
    }
  }

  private async enrichCompaniesBulk(params: any): Promise<CompanyData[]> {
    throw new CustomError(
      ErrorCode.PROVIDER_ERROR,
      'Bulk company enrichment is not implemented yet',
      501
    );
  }
  
  private async checkBulkEnrichmentStatus(enrichmentId: string): Promise<any> {
    try {
      console.log(`🔍 Checking bulk enrichment status for ID: ${enrichmentId}`);
      
      // Add a fixed delay before making the request to prevent overwhelming the API
      const delayMs = 1000; // 1 second delay
      console.log(`⏱️ Adding ${delayMs}ms delay before making Surfe API request`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      const response = await this.client.get(`/v2/companies/enrich/${enrichmentId}`);
      
      return {
        enrichmentId,
        status: response.data.status,
        percentCompleted: response.data.percentCompleted,
        companies: response.data.companies || []
      };
    } catch (error) {
      console.error('❌ Bulk status check failed:', error);
      throw this.mapErrorToStandard(error);
    }
  }

  private async searchPeople(params: any): Promise<any> {
    console.log('🔑 Authorization header:', this.client.defaults.headers.common['Authorization']);
  
    const companies = params.companies || {};
    const people = params.people || {};

    const searchRequest: any = {
      limit: params.limit || 10,
      pageToken: params.pageToken || '',
      peoplePerCompany: params.peoplePerCompany || 5
    };
    
    const companiesObj: any = {};
    if (companies.domains && companies.domains.length > 0) {
      companiesObj.domains = companies.domains;
    }
    if (companies.domainsExcluded && companies.domainsExcluded.length > 0) {
      companiesObj.domainsExcluded = companies.domainsExcluded;
    }
    if (companies.names && companies.names.length > 0) {
      companiesObj.names = companies.names;
    }
    if (companies.industries && companies.industries.length > 0) {
      companiesObj.industries = companies.industries;
    }
    if (companies.countries && companies.countries.length > 0) {
      companiesObj.countries = companies.countries;
    }
    if (companies.employeeCount) {
      companiesObj.employeeCount = companies.employeeCount;
    }
    if (companies.revenue) {
      companiesObj.revenue = companies.revenue;
    }

    // Build people object - only add fields with values
    const peopleObj: any = {};
    if (people.jobTitles && people.jobTitles.length > 0) {
      peopleObj.jobTitles = people.jobTitles;
    }
    if (people.seniorities && people.seniorities.length > 0) {
      peopleObj.seniorities = people.seniorities;
    }
    if (people.departments && people.departments.length > 0) {
      peopleObj.departments = people.departments;
    }
    if (people.countries && people.countries.length > 0) {
      peopleObj.countries = people.countries;
    }

    if (Object.keys(companiesObj).length > 0) {
      searchRequest.companies = companiesObj;
    }
    if (Object.keys(peopleObj).length > 0) {
      searchRequest.people = peopleObj;
    }

    console.log('🔍 People Search Request:', JSON.stringify(searchRequest, null, 2));
     
     try {
       
       // Add a fixed delay before making the request to prevent overwhelming the API
       const delayMs = 1000; // 1 second delay
       console.log(`⏱️ Adding ${delayMs}ms delay before making Surfe API request`);
       await new Promise(resolve => setTimeout(resolve, delayMs));
       
       const response = await this.client.post(
         '/v2/people/search', 
         searchRequest,
         { headers: { 'Content-Type': 'application/json' } }
       );
       
       console.log('✅ People Search Response:', JSON.stringify(response.data, null, 2));
       
       return {
         people: response.data.people || [],
         total: response.data.total || 0,
         nextPageToken: response.data.nextPageToken || null
       };
     } catch (error: any) {
       console.error('❌ People search failed:', error);
       throw this.mapErrorToStandard(error);
     }
  }

  private async searchCompanies(params: any): Promise<any> {
    try {
      const filters = params.filters || {};
      
      // Build the search request - ALWAYS include filters object
      const searchRequest: any = {
        filters: {}, // Always include this
        limit: params.limit || 10,
        pageToken: params.pageToken || ''
      };

      // Add filters individually
      if (filters.domains && Array.isArray(filters.domains) && filters.domains.length > 0) {
        searchRequest.filters.domains = filters.domains;
      }
      if (filters.domainsExcluded && Array.isArray(filters.domainsExcluded) && filters.domainsExcluded.length > 0) {
        searchRequest.filters.domainsExcluded = filters.domainsExcluded;
      }
      if (filters.industries && Array.isArray(filters.industries) && filters.industries.length > 0) {
        searchRequest.filters.industries = filters.industries;
      }
      if (filters.countries && Array.isArray(filters.countries) && filters.countries.length > 0) {
        searchRequest.filters.countries = filters.countries;
      }
      if (filters.employeeCount && typeof filters.employeeCount === 'object') {
        searchRequest.filters.employeeCount = filters.employeeCount;
      }
      if (filters.revenue && typeof filters.revenue === 'object') {
        searchRequest.filters.revenue = filters.revenue;
      }

      console.log('🔍 Company Search Request:', JSON.stringify(searchRequest, null, 2));
      
      // Add a fixed delay before making the request to prevent overwhelming the API
      const delayMs = 1000; // 1 second delay
      console.log(`⏱️ Adding ${delayMs}ms delay before making Surfe API request`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      const response = await this.client.post(
        '/v2/companies/search',
        searchRequest,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      console.log('✅ Company Search Response:', JSON.stringify(response.data, null, 2));
      
      return {
        companies: response.data.companies || [],
        companyDomains: response.data.companyDomains || [],
        nextPageToken: response.data.nextPageToken || null,
        total: response.data.companies?.length || 0
      };
    } catch (error) {
      console.error('❌ Company search failed:', error);
      throw this.mapErrorToStandard(error);
    }
  }

  private async findLookalike(params: any): Promise<any> {
    try {
      const lookalikeRequest = {
        domains: params.domains || [],
        names: params.names || [],
        filters: params.filters || {},
        maxResults: params.maxResults || 5
      };

      console.log('🔍 Lookalike Search Request:', JSON.stringify(lookalikeRequest, null, 2));
      
      // Add a fixed delay before making the request to prevent overwhelming the API
      const delayMs = 1000; // 1 second delay
      console.log(`⏱️ Adding ${delayMs}ms delay before making Surfe API request`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      const response = await this.client.post(
        '/v1/organizations/lookalikes', 
        lookalikeRequest,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      console.log('✅ Lookalike Search Response:', JSON.stringify(response.data, null, 2));
      
      return {
        organizations: response.data.organizations || []
      };
    } catch (error) {
      console.error('❌ Lookalike search failed:', error);
      throw this.mapErrorToStandard(error);
    }
  }

  protected calculateCredits(operation: ProviderOperation): number {
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
  
  // <<< FIX: Removed the redundant 'sleep' method. It will now be inherited from BaseProvider.
}

// Register the provider
import { ProviderRegistry } from '../ProviderRegistry';
// <<< FIX: Removed the unused import of 'express'.
ProviderRegistry.register('surfe', SurfeProvider);