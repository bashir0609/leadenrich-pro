"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyEnrichProvider = void 0;
const BaseProvider_1 = require("../base/BaseProvider");
const errors_1 = require("../../../types/errors");
const ApiKeyService_1 = require("../../ApiKeyService");
const ApiCache_1 = require("../utils/ApiCache");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const providers_1 = require("../../../types/providers");
const axios_1 = __importDefault(require("axios"));
const ProviderRegistry_1 = require("../ProviderRegistry");
class CompanyEnrichProvider extends BaseProvider_1.BaseProvider {
    constructor(config) {
        super(config);
        this.client = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: 30000,
            headers: {
                'User-Agent': 'LeadEnrich/1.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });
    }
    async authenticate(userId) {
        if (!userId) {
            throw new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'User ID is required for authentication', 401);
        }
        try {
            // First, get the provider ID from the database using the provider name
            const provider = await prisma_1.default.provider.findUnique({
                where: { name: this.config.name.toLowerCase() },
                select: { id: true }
            });
            if (!provider) {
                throw new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_NOT_FOUND, 'CompanyEnrich provider not found in database', 404);
            }
            const apiKey = await ApiKeyService_1.ApiKeyService.getActiveApiKey(provider.id, userId);
            if (!apiKey) {
                throw new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'No active API key found for CompanyEnrich', 401);
            }
            // Set Basic Auth header with API key as username
            this.client.defaults.auth = {
                username: apiKey.keyValue,
                password: '',
            };
            console.log('✅ CompanyEnrich provider authenticated successfully');
        }
        catch (error) {
            console.error('❌ CompanyEnrich authentication failed:', error.message);
            throw new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, `CompanyEnrich authentication failed: ${error.message}`, 401);
        }
    }
    validateConfig() {
        if (!this.config.baseUrl) {
            throw new errors_1.CustomError(errors_1.ErrorCode.VALIDATION_ERROR, 'CompanyEnrich base URL is required', 400);
        }
    }
    async executeOperation(request) {
        switch (request.operation) {
            case providers_1.ProviderOperation.ENRICH_COMPANY:
                return await this.enrichCompany(request.params);
            default:
                throw new errors_1.CustomError(errors_1.ErrorCode.OPERATION_FAILED, `Operation ${request.operation} is not supported by CompanyEnrich provider`, 501);
        }
    }
    async enrichCompany(params) {
        if (!params.domain) {
            throw new errors_1.CustomError(errors_1.ErrorCode.VALIDATION_ERROR, 'Domain is required for company enrichment', 400);
        }
        const cacheKey = `companyenrich:company:${params.domain}`;
        const cached = ApiCache_1.ApiCache.getInstance().get(cacheKey);
        if (cached) {
            console.log(`✅ Cache hit for CompanyEnrich company: ${params.domain}`);
            return cached;
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
            ApiCache_1.ApiCache.getInstance().set(cacheKey, transformedData, 86400);
            return transformedData;
        }
        catch (error) {
            console.error(`❌ CompanyEnrich enrichment failed for ${params.domain}:`, error.message);
            throw this.mapErrorToStandard(error);
        }
    }
    transformResponse(data) {
        if (!data) {
            throw new errors_1.CustomError(errors_1.ErrorCode.NOT_FOUND, 'No company data found', 404);
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
                : data.technologies?.split(',').map((t) => t.trim()).filter(Boolean) || [],
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
    mapErrorToStandard(error) {
        if (error instanceof errors_1.CustomError) {
            return error;
        }
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            const status = axiosError.response?.status || 500;
            const message = axiosError.response?.data?.message || axiosError.response?.statusText || 'API error';
            switch (status) {
                case 401:
                    return new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'CompanyEnrich API authentication failed', 401);
                case 403:
                    return new errors_1.CustomError(errors_1.ErrorCode.AUTHORIZATION_ERROR, 'CompanyEnrich API access forbidden - check credits', 403);
                case 404:
                    return new errors_1.CustomError(errors_1.ErrorCode.NOT_FOUND, 'Company not found in CompanyEnrich database', 404);
                case 429:
                    return new errors_1.CustomError(errors_1.ErrorCode.RATE_LIMIT_EXCEEDED, 'CompanyEnrich API rate limit exceeded', 429);
                case 500:
                    return new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, 'CompanyEnrich API server error', 500);
                default:
                    return new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, `CompanyEnrich API error: ${message}`, status);
            }
        }
        return new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, `CompanyEnrich provider error: ${error.message}`, 500);
    }
    calculateCredits(operation, params) {
        switch (operation) {
            case providers_1.ProviderOperation.ENRICH_COMPANY:
                return 1;
            default:
                return 1;
        }
    }
    getSupportedOperations() {
        return [providers_1.ProviderOperation.ENRICH_COMPANY];
    }
}
exports.CompanyEnrichProvider = CompanyEnrichProvider;
// Register the provider
ProviderRegistry_1.ProviderRegistry.register('companyenrich', CompanyEnrichProvider);
//# sourceMappingURL=CompanyEnrichProvider.js.map