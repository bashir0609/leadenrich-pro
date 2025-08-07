"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurfeProvider = void 0;
const BaseProvider_1 = require("../base/BaseProvider");
const errors_1 = require("../../../types/errors");
const ApiKeyService_1 = require("../../ApiKeyService");
const providers_1 = require("../../../types/providers");
class SurfeProvider extends BaseProvider_1.BaseProvider {
    constructor() {
        super(...arguments);
        this.isAuthenticated = false;
        // <<< FIX: Removed the redundant 'sleep' method. It will now be inherited from BaseProvider.
    }
    async authenticate(userId) {
        if (!userId) {
            throw new Error('Authentication failed: SurfeProvider was called without a user context.');
        }
        try {
            const apiKeyData = await ApiKeyService_1.ApiKeyService.getActiveApiKey(this.config.providerNumericId, userId);
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('Unsupported state or unable to authenticate data')) {
                const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
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
    validateConfig() {
        if (!this.config.baseUrl) {
            throw new errors_1.CustomError(errors_1.ErrorCode.VALIDATION_ERROR, 'Surfe base URL not configured', 400);
        }
    }
    mapErrorToStandard(error) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            switch (status) {
                case 401:
                    return new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'Surfe authentication failed', 401, data);
                case 429:
                    return new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_RATE_LIMIT, 'Surfe rate limit exceeded', 429, data);
                case 403:
                    return new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_QUOTA_EXCEEDED, `Surfe Quota Exceeded: ${data.message || 'Check your API plan and usage.'}`, 403, data);
                case 400:
                    return new errors_1.CustomError(errors_1.ErrorCode.INVALID_INPUT, data.message || 'Invalid request to Surfe', 400, data);
                case 500:
                    return new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, `Surfe API error (500): ${data.message || 'The Surfe API is experiencing internal issues. Please try again later or contact Surfe support at api.support@surfe.com.'}`, status, data);
                default:
                    return new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, `Surfe API error: ${data.message || 'Unknown error'}`, status, data);
            }
        }
        return new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, 'Surfe provider error', 500, error);
    }
    async executeOperation(request) {
        console.log('🎯 executeOperation called with:', request.operation);
        console.log('🎯 Request params:', JSON.stringify(request.params, null, 2));
        switch (request.operation) {
            case providers_1.ProviderOperation.FIND_EMAIL:
                return this.findEmail(request.params);
            case providers_1.ProviderOperation.ENRICH_PERSON:
                return this.enrichPerson(request.params);
            case providers_1.ProviderOperation.ENRICH_COMPANY:
                if (request.params.companies && Array.isArray(request.params.companies)) {
                    return this.enrichCompaniesBulk(request.params);
                }
                return this.enrichCompany(request.params);
            case providers_1.ProviderOperation.SEARCH_PEOPLE:
                return this.searchPeople(request.params);
            case providers_1.ProviderOperation.SEARCH_COMPANIES:
                return this.searchCompanies(request.params);
            case providers_1.ProviderOperation.FIND_LOOKALIKE:
                return this.findLookalike(request.params);
            default:
                console.log(`❌ No operation matched for '${request.operation}', throwing error`);
                throw new errors_1.CustomError(errors_1.ErrorCode.OPERATION_FAILED, `Operation ${request.operation} not implemented for Surfe`, 501);
        }
    }
    async findEmail(params) {
        console.log('🔍 Find Email Request:', JSON.stringify(params, null, 2));
        // Add a fixed delay before making the request to prevent overwhelming the API
        const delayMs = 1000; // 1 second delay
        console.log(`⏱️ Adding ${delayMs}ms delay before making Surfe API request`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
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
        }
        catch (error) {
            const searchResult = await this.searchPeople({
                companies: {
                    domains: params.companyDomain ? [params.companyDomain] : undefined,
                    names: params.companyName ? [params.companyName] : undefined,
                },
                people: {},
                limit: 10,
            });
            if (searchResult.people && searchResult.people.length > 0) {
                const matchedPerson = searchResult.people.find((person) => (!params.firstName || person.firstName?.toLowerCase().includes(params.firstName.toLowerCase())) &&
                    (!params.lastName || person.lastName?.toLowerCase().includes(params.lastName.toLowerCase())));
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
        throw new errors_1.CustomError(errors_1.ErrorCode.NOT_FOUND, 'Email not found', 404);
    }
    async enrichPerson(params) {
        const includeOptions = params.include || { email: true, mobile: false, linkedInUrl: true, jobHistory: false };
        const enrichmentRequest = {
            people: [{
                    ...(params.firstName && { firstName: params.firstName }),
                    ...(params.lastName && { lastName: params.lastName }),
                    ...(params.companyDomain && { companyDomain: params.companyDomain }),
                    ...(params.companyName && { companyName: params.companyName }),
                    ...(params.linkedinUrl && { linkedinUrl: params.linkedinUrl }),
                    externalID: `ext_${Date.now()}`,
                }],
            include: includeOptions,
        };
        console.log('🚀 Surfe Request URL:', this.client.defaults.baseURL + '/v2/people/enrich');
        console.log('🚀 Surfe Headers:', this.client.defaults.headers.common);
        console.log('🚀 Surfe Body:', JSON.stringify(enrichmentRequest, null, 2));
        // Add a fixed delay before making the request to prevent overwhelming the API
        const delayMs = 1000; // 1 second delay
        console.log(`⏱️ Adding ${delayMs}ms delay before making Surfe API request`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        const startResponse = await this.client.post('/v2/people/enrich', enrichmentRequest, { headers: { 'Content-Type': 'application/json' } });
        // ADD THIS LOGGING:
        console.log('✅ Start Response Status:', startResponse.status);
        console.log('✅ Start Response Data:', JSON.stringify(startResponse.data, null, 2));
        if (!startResponse.data || !startResponse.data.enrichmentID) {
            throw new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, 'Failed to start person enrichment', 500);
        }
        const enrichmentId = startResponse.data.enrichmentID;
        let attempts = 0;
        const maxAttempts = 30;
        while (attempts < maxAttempts) {
            await this.sleep(1000); // Wait 1 second
            const resultResponse = await this.client.get(`/v2/people/enrich/${enrichmentId}`);
            console.log('📊 Poll Response Status:', resultResponse.status);
            console.log('📊 Poll Response Data:', JSON.stringify(resultResponse.data, null, 2));
            const result = resultResponse.data;
            if (result.status === 'COMPLETED' || result.percentCompleted === 100) {
                console.log('✅ Enrichment completed!');
                const person = result.people?.[0];
                if (!person || person.status !== 'COMPLETED') {
                    throw new errors_1.CustomError(errors_1.ErrorCode.NOT_FOUND, 'Person enrichment failed or not found', 404);
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
                        seniorities: person.seniorities || [],
                        departments: person.departments || [],
                        emailValidation: person.emails?.[0]?.validationStatus,
                        phoneConfidence: person.mobilePhones?.[0]?.confidenceScore,
                        country: person.country,
                        jobHistory: person.jobHistory || []
                    }
                };
            }
            attempts++;
        }
        throw new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, 'Enrichment timeout', 408);
    }
    async enrichCompany(params) {
        // Add type safety check
        if (!params.domain) {
            throw new errors_1.CustomError(errors_1.ErrorCode.INVALID_INPUT, 'Domain is required for company enrichment', 400);
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
        const startResponse = await this.client.post('/v2/companies/enrich', enrichmentRequest, { headers: { 'Content-Type': 'application/json' } });
        console.log('✅ Start Response Status:', startResponse.status);
        console.log('✅ Start Response Data:', JSON.stringify(startResponse.data, null, 2));
        const enrichmentId = startResponse.data.enrichmentID;
        if (!enrichmentId) {
            throw new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, 'Failed to start company enrichment', 500);
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
                    throw new errors_1.CustomError(errors_1.ErrorCode.NOT_FOUND, 'Enrichment completed but no company data was returned.', 404);
                }
                const hasData = companyData.name || companyData.description || companyData.industry ||
                    (companyData.websites && companyData.websites.some((w) => w.trim() !== ''));
                if (!hasData) {
                    console.log('⚠️ WARNING: Enrichment completed but all fields are empty - likely API plan limitation');
                }
                return {
                    name: companyData.name || '',
                    domain: params.domain,
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
        throw new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, 'Company enrichment timeout', 408);
    }
    async enrichCompaniesBulk(params) {
        try {
            const companies = params.companies || [];
            const enrichmentRequest = {
                companies: companies.map((company, index) => ({
                    domain: company.domain,
                    externalID: company.externalID || `bulk_${Date.now()}_${index}`
                }))
            };
            console.log('🏢 Bulk Company Enrichment Request:', JSON.stringify(enrichmentRequest, null, 2));
            // Add a fixed delay before making the request to prevent overwhelming the API
            const delayMs = 1000; // 1 second delay
            console.log(`⏱️ Adding ${delayMs}ms delay before making Surfe API request`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            const startResponse = await this.client.post('/v2/companies/enrich', enrichmentRequest, { headers: { 'Content-Type': 'application/json' } });
            const enrichmentId = startResponse.data.enrichmentID;
            // Poll for completion
            let attempts = 0;
            const maxAttempts = 60; // Longer timeout for bulk operations
            while (attempts < maxAttempts) {
                await this.sleep(2000); // Wait 2 seconds for bulk
                const resultResponse = await this.client.get(`/v2/companies/enrich/${enrichmentId}`);
                const result = resultResponse.data;
                console.log(`📊 Bulk Poll ${attempts + 1}/${maxAttempts}:`, result.status, `${result.percentCompleted}%`);
                if (result.status === 'COMPLETED') {
                    return result.companies?.map((company) => ({
                        name: company.name || '',
                        domain: company.domain || '',
                        description: company.description || '',
                        industry: company.industry || '',
                        size: company.employeeCount ? company.employeeCount.toString() : '',
                        location: company.hqAddress || '',
                        linkedinUrl: company.linkedInURL || '',
                        technologies: company.keywords || [],
                        additionalData: {
                            founded: company.founded,
                            revenue: company.revenue,
                            isPublic: company.isPublic,
                            stocks: company.stocks
                        }
                    })) || [];
                }
                attempts++;
            }
            throw new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, 'Bulk company enrichment timeout', 408);
        }
        catch (error) {
            console.error('❌ Bulk company enrichment failed:', error);
            throw this.mapErrorToStandard(error);
        }
    }
    async checkBulkEnrichmentStatus(enrichmentId) {
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
        }
        catch (error) {
            console.error('❌ Bulk status check failed:', error);
            throw this.mapErrorToStandard(error);
        }
    }
    async searchPeople(params) {
        console.log('🔑 Authorization header:', this.client.defaults.headers.common['Authorization']);
        const companies = params.companies || {};
        const people = params.people || {};
        const searchRequest = {
            limit: params.limit || 10,
            pageToken: params.pageToken || '',
            peoplePerCompany: params.peoplePerCompany || 5
        };
        const companiesObj = {};
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
        const peopleObj = {};
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
            const response = await this.client.post('/v2/people/search', searchRequest, { headers: { 'Content-Type': 'application/json' } });
            console.log('✅ People Search Response:', JSON.stringify(response.data, null, 2));
            return {
                people: response.data.people || [],
                total: response.data.total || 0,
                nextPageToken: response.data.nextPageToken || null
            };
        }
        catch (error) {
            console.error('❌ People search failed:', error);
            throw this.mapErrorToStandard(error);
        }
    }
    async searchCompanies(params) {
        try {
            const filters = params.filters || {};
            // Build the search request - ALWAYS include filters object
            const searchRequest = {
                filters: {},
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
            const response = await this.client.post('/v2/companies/search', searchRequest, { headers: { 'Content-Type': 'application/json' } });
            console.log('✅ Company Search Response:', JSON.stringify(response.data, null, 2));
            return {
                companies: response.data.companies || [],
                companyDomains: response.data.companyDomains || [],
                nextPageToken: response.data.nextPageToken || null,
                total: response.data.companies?.length || 0
            };
        }
        catch (error) {
            console.error('❌ Company search failed:', error);
            throw this.mapErrorToStandard(error);
        }
    }
    async findLookalike(params) {
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
            const response = await this.client.post('/v1/organizations/lookalikes', lookalikeRequest, { headers: { 'Content-Type': 'application/json' } });
            console.log('✅ Lookalike Search Response:', JSON.stringify(response.data, null, 2));
            return {
                organizations: response.data.organizations || []
            };
        }
        catch (error) {
            console.error('❌ Lookalike search failed:', error);
            throw this.mapErrorToStandard(error);
        }
    }
    calculateCredits(operation) {
        const creditMap = {
            [providers_1.ProviderOperation.FIND_EMAIL]: 1,
            [providers_1.ProviderOperation.ENRICH_PERSON]: 1,
            [providers_1.ProviderOperation.ENRICH_COMPANY]: 0,
            [providers_1.ProviderOperation.SEARCH_PEOPLE]: 0,
            [providers_1.ProviderOperation.SEARCH_COMPANIES]: 0,
            [providers_1.ProviderOperation.FIND_LOOKALIKE]: 0,
        };
        return creditMap[operation] || 1;
    }
}
exports.SurfeProvider = SurfeProvider;
SurfeProvider.statusCheckCounts = new Map();
// Register the provider
const ProviderRegistry_1 = require("../ProviderRegistry");
// <<< FIX: Removed the unused import of 'express'.
ProviderRegistry_1.ProviderRegistry.register('surfe', SurfeProvider);
//# sourceMappingURL=SurfeProvider.js.map