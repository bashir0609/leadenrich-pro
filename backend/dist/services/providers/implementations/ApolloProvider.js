"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApolloProvider = void 0;
const BaseProvider_1 = require("../base/BaseProvider");
const errors_1 = require("@/types/errors");
const providers_1 = require("@/types/providers");
class ApolloProvider extends BaseProvider_1.BaseProvider {
    async authenticate() {
        if (!this.config.apiKey) {
            throw new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'Apollo API key not configured', 401);
        }
        const apiKey = this.decryptApiKey(this.config.apiKey);
        this.client.defaults.headers.common['X-Api-Key'] = apiKey;
    }
    validateConfig() {
        if (!this.config.baseUrl) {
            throw new errors_1.CustomError(errors_1.ErrorCode.VALIDATION_ERROR, 'Apollo base URL not configured', 400);
        }
    }
    mapErrorToStandard(error) {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.error || error.response.data?.message;
            switch (status) {
                case 401:
                    return new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'Apollo authentication failed', 401);
                case 422:
                    return new errors_1.CustomError(errors_1.ErrorCode.INVALID_INPUT, message || 'Invalid parameters for Apollo', 422);
                case 429:
                    return new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_RATE_LIMIT, 'Apollo rate limit exceeded', 429);
                default:
                    return new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, `Apollo error: ${message || 'Unknown error'}`, status);
            }
        }
        return new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, 'Apollo provider error', 500);
    }
    async executeOperation(request) {
        switch (request.operation) {
            case providers_1.ProviderOperation.FIND_EMAIL:
                return this.findEmail(request.params);
            case providers_1.ProviderOperation.ENRICH_PERSON:
                return this.enrichPerson(request.params);
            case providers_1.ProviderOperation.ENRICH_COMPANY:
                return this.enrichCompany(request.params);
            case providers_1.ProviderOperation.SEARCH_PEOPLE:
                return this.searchPeople(request.params);
            case providers_1.ProviderOperation.SEARCH_COMPANIES:
                return this.searchCompanies(request.params);
            case providers_1.ProviderOperation.FIND_LOOKALIKE:
                throw new errors_1.CustomError(errors_1.ErrorCode.OPERATION_FAILED, `Operation ${request.operation} not implemented for Apollo`, 501);
            case providers_1.ProviderOperation.CHECK_ENRICHMENT_STATUS:
                throw new errors_1.CustomError(errors_1.ErrorCode.OPERATION_FAILED, `Operation ${request.operation} not implemented for Apollo`, 501);
            default:
                throw new errors_1.CustomError(errors_1.ErrorCode.OPERATION_FAILED, `Operation ${request.operation} not implemented for Surfe`, 501);
        }
    }
    async findEmail(params) {
        // Apollo's email finder endpoint
        const response = await this.client.post('/v1/people/match', {
            first_name: params.firstName,
            last_name: params.lastName,
            organization_name: params.companyName,
            domain: params.companyDomain,
            reveal_personal_emails: true,
        });
        const person = response.data.person;
        if (!person || !person.email) {
            throw new errors_1.CustomError(errors_1.ErrorCode.NOT_FOUND, 'Email not found', 404);
        }
        return {
            email: person.email,
            confidence: person.email_confidence || 0.85,
            sources: ['apollo'],
            verified: person.email_status === 'verified',
        };
    }
    async enrichPerson(params) {
        const searchParams = {};
        if (params.email) {
            searchParams.email = params.email;
        }
        else if (params.linkedinUrl) {
            searchParams.linkedin_url = params.linkedinUrl;
        }
        else {
            searchParams.first_name = params.firstName;
            searchParams.last_name = params.lastName;
            searchParams.domain = params.companyDomain;
        }
        const response = await this.client.post('/v1/people/match', searchParams);
        const person = response.data.person;
        if (!person) {
            throw new errors_1.CustomError(errors_1.ErrorCode.NOT_FOUND, 'Person not found', 404);
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
        };
    }
    async enrichCompany(params) {
        const response = await this.client.post('/v1/organizations/enrich', {
            domain: params.domain,
            organization_name: params.companyName,
        });
        const company = response.data.organization;
        if (!company) {
            throw new errors_1.CustomError(errors_1.ErrorCode.NOT_FOUND, 'Company not found', 404);
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
                },
            },
        };
    }
    async searchPeople(params) {
        const response = await this.client.post('/v1/mixed_people/search', {
            ...params,
            page: 1,
            per_page: 25,
        });
        return {
            data: response.data.people,
            pagination: response.data.pagination,
        };
    }
    async searchCompanies(params) {
        const response = await this.client.post('/v1/mixed_companies/search', {
            ...params,
            page: 1,
            per_page: 25,
        });
        return {
            data: response.data.organizations,
            pagination: response.data.pagination,
        };
    }
    calculateCredits(operation) {
        // Apollo's credit system
        const creditMap = {
            [providers_1.ProviderOperation.FIND_EMAIL]: 1,
            [providers_1.ProviderOperation.ENRICH_PERSON]: 1,
            [providers_1.ProviderOperation.ENRICH_COMPANY]: 1,
            [providers_1.ProviderOperation.SEARCH_PEOPLE]: 1,
            [providers_1.ProviderOperation.SEARCH_COMPANIES]: 1,
            [providers_1.ProviderOperation.FIND_LOOKALIKE]: 5,
            [providers_1.ProviderOperation.CHECK_ENRICHMENT_STATUS]: 0, // No cost for status check
        };
        return creditMap[operation] || 1;
    }
}
exports.ApolloProvider = ApolloProvider;
// Register the provider
const ProviderRegistry_1 = require("../ProviderRegistry");
ProviderRegistry_1.ProviderRegistry.register('apollo', ApolloProvider);
//# sourceMappingURL=ApolloProvider.js.map