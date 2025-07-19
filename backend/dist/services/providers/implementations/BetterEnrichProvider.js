"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetterEnrichProvider = exports.BetterEnrichOperation = void 0;
const BaseProvider_1 = require("../base/BaseProvider");
const errors_1 = require("@/types/errors");
const providers_1 = require("@/types/providers");
// BetterEnrich specific types
var BetterEnrichOperation;
(function (BetterEnrichOperation) {
    // Enrichment
    BetterEnrichOperation["SINGLE_ENRICHMENT"] = "single-enrichment";
    BetterEnrichOperation["WATERFALL_ENRICHMENT"] = "waterfall-enrichment";
    // Email Finder
    BetterEnrichOperation["FIND_WORK_EMAIL"] = "find-work-email";
    BetterEnrichOperation["FIND_EMAIL_FROM_LINKEDIN"] = "find-email-from-linkedin";
    BetterEnrichOperation["FIND_EMAIL_FROM_SALESNAV"] = "find-email-from-salesnav";
    BetterEnrichOperation["FIND_PERSONAL_EMAIL"] = "find-personal-email";
    // Phone Finder
    BetterEnrichOperation["FIND_MOBILE_PHONE"] = "find-mobile-phone";
    // Ad Intelligence
    BetterEnrichOperation["CHECK_GOOGLE_ADS"] = "check-google-ads";
    BetterEnrichOperation["CHECK_FACEBOOK_ADS"] = "check-facebook-ads";
    BetterEnrichOperation["CHECK_LINKEDIN_ADS"] = "check-linkedin-ads";
    // Social Enrichment
    BetterEnrichOperation["FIND_SOCIAL_URLS"] = "find-social-urls";
    BetterEnrichOperation["FIND_LINKEDIN_BY_EMAIL"] = "find-linkedin-by-email";
    BetterEnrichOperation["FIND_LINKEDIN_BY_NAME"] = "find-linkedin-by-name";
    BetterEnrichOperation["FIND_FACEBOOK_PROFILE"] = "find-facebook-profile";
    // Normalization
    BetterEnrichOperation["NORMALIZE_COMPANY"] = "normalize-company";
    BetterEnrichOperation["NORMALIZE_PERSON"] = "normalize-person";
    // Verification
    BetterEnrichOperation["CHECK_DNC_LIST"] = "check-dnc-list";
    BetterEnrichOperation["CHECK_PHONE_STATUS"] = "check-phone-status";
    BetterEnrichOperation["CHECK_ESP"] = "check-esp";
    // Others
    BetterEnrichOperation["CHECK_GENDER"] = "check-gender";
    BetterEnrichOperation["FIND_WEBSITE"] = "find-website";
})(BetterEnrichOperation || (exports.BetterEnrichOperation = BetterEnrichOperation = {}));
class BetterEnrichProvider extends BaseProvider_1.BaseProvider {
    constructor(config) {
        super(config);
        this.features = new Map();
        this.initializeFeatures();
    }
    initializeFeatures() {
        const featureList = [
            // Enrichment
            {
                id: BetterEnrichOperation.SINGLE_ENRICHMENT,
                name: 'Single Enrichment',
                category: 'enrichment',
                endpoint: '/enrichment/single',
                method: 'POST',
                credits: 1,
                description: 'Enrich a single contact with comprehensive data',
            },
            {
                id: BetterEnrichOperation.WATERFALL_ENRICHMENT,
                name: 'Waterfall Enrichment',
                category: 'enrichment',
                endpoint: '/enrichment/waterfall',
                method: 'POST',
                credits: 3,
                description: 'Multi-source enrichment with fallback providers',
            },
            // Email Finder
            {
                id: BetterEnrichOperation.FIND_WORK_EMAIL,
                name: 'Find Work Email',
                category: 'email-finder',
                endpoint: '/email/work',
                method: 'POST',
                credits: 1,
                description: 'Find work email address',
            },
            {
                id: BetterEnrichOperation.FIND_EMAIL_FROM_LINKEDIN,
                name: 'Find Email from LinkedIn',
                category: 'email-finder',
                endpoint: '/email/linkedin',
                method: 'POST',
                credits: 1,
                description: 'Extract work email from LinkedIn profile',
            },
            // Phone Finder
            {
                id: BetterEnrichOperation.FIND_MOBILE_PHONE,
                name: 'Find Mobile Phone',
                category: 'phone-finder',
                endpoint: '/phone/mobile',
                method: 'POST',
                credits: 2,
                description: 'Find mobile phone number',
            },
            // Ad Intelligence
            {
                id: BetterEnrichOperation.CHECK_GOOGLE_ADS,
                name: 'Check Google Ads',
                category: 'ad-intelligence',
                endpoint: '/ads/google/check',
                method: 'POST',
                credits: 1,
                description: 'Check if company runs Google Ads',
            },
            // Social Enrichment
            {
                id: BetterEnrichOperation.FIND_SOCIAL_URLS,
                name: 'Find Social URLs',
                category: 'social-enrichment',
                endpoint: '/social/website',
                method: 'POST',
                credits: 1,
                description: 'Find social media profiles from website',
            },
            // Normalization
            {
                id: BetterEnrichOperation.NORMALIZE_COMPANY,
                name: 'Normalize Company',
                category: 'normalization',
                endpoint: '/normalize/company',
                method: 'POST',
                credits: 0.1,
                description: 'Standardize company name format',
            },
            // Verification
            {
                id: BetterEnrichOperation.CHECK_DNC_LIST,
                name: 'Check DNC List',
                category: 'verification',
                endpoint: '/verify/dnc',
                method: 'POST',
                credits: 0.5,
                description: 'Check if US phone number is on Do Not Call list',
            },
            // Add all other features...
        ];
        featureList.forEach((feature) => {
            this.features.set(feature.id, feature);
        });
    }
    async authenticate() {
        if (!this.config.apiKey) {
            throw new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'BetterEnrich API key not configured', 401);
        }
        const apiKey = this.decryptApiKey(this.config.apiKey);
        this.client.defaults.headers.common['X-API-Key'] = apiKey;
    }
    validateConfig() {
        if (!this.config.baseUrl) {
            throw new errors_1.CustomError(errors_1.ErrorCode.VALIDATION_ERROR, 'BetterEnrich base URL not configured', 400);
        }
    }
    mapErrorToStandard(error) {
        if (error.response) {
            const status = error.response.status;
            switch (status) {
                case 401:
                    return new errors_1.CustomError(errors_1.ErrorCode.AUTHENTICATION_ERROR, 'BetterEnrich authentication failed', 401);
                case 429:
                    return new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_RATE_LIMIT, 'BetterEnrich rate limit exceeded', 429);
                default:
                    return new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, 'BetterEnrich API error', status);
            }
        }
        return new errors_1.CustomError(errors_1.ErrorCode.PROVIDER_ERROR, 'BetterEnrich provider error', 500);
    }
    async executeOperation(request) {
        // Handle standard operations
        if (Object.values(providers_1.ProviderOperation).includes(request.operation)) {
            return this.handleStandardOperation(request);
        }
        // Handle BetterEnrich specific operations
        const feature = this.features.get(request.operation);
        if (!feature) {
            throw new errors_1.CustomError(errors_1.ErrorCode.OPERATION_FAILED, `Operation ${request.operation} not found`, 404);
        }
        return this.executeFeature(feature, request.params);
    }
    async handleStandardOperation(request) {
        switch (request.operation) {
            case providers_1.ProviderOperation.FIND_EMAIL:
                return this.executeFeature(this.features.get(BetterEnrichOperation.FIND_WORK_EMAIL), request.params);
            case providers_1.ProviderOperation.ENRICH_PERSON:
                return this.executeFeature(this.features.get(BetterEnrichOperation.SINGLE_ENRICHMENT), request.params);
            default:
                throw new errors_1.CustomError(errors_1.ErrorCode.OPERATION_FAILED, `Standard operation ${request.operation} not mapped for BetterEnrich`, 501);
        }
    }
    async executeFeature(feature, params) {
        const response = await this.client.request({
            method: feature.method,
            url: feature.endpoint,
            data: params,
        });
        return this.transformResponse(feature.id, response.data);
    }
    transformResponse(featureId, data) {
        // Transform BetterEnrich responses to standard format
        switch (featureId) {
            case BetterEnrichOperation.FIND_WORK_EMAIL:
                return {
                    email: data.email,
                    confidence: data.confidence || 0.9,
                    sources: ['betterenrich'],
                    verified: data.verified || false,
                };
            case BetterEnrichOperation.SINGLE_ENRICHMENT:
                return {
                    firstName: data.first_name,
                    lastName: data.last_name,
                    email: data.email,
                    phone: data.phone,
                    title: data.job_title,
                    company: data.company_name,
                    linkedinUrl: data.linkedin_url,
                    additionalData: data,
                };
            default:
                return data;
        }
    }
    // Public method to get all available features
    getAvailableFeatures() {
        return Array.from(this.features.values());
    }
    // Public method to get features by category
    getFeaturesByCategory(category) {
        return Array.from(this.features.values()).filter((f) => f.category === category);
    }
    calculateCredits(operation) {
        const feature = this.features.get(operation);
        return feature?.credits || 1;
    }
}
exports.BetterEnrichProvider = BetterEnrichProvider;
// Register the provider
const ProviderRegistry_1 = require("../ProviderRegistry");
ProviderRegistry_1.ProviderRegistry.register('betterenrich', BetterEnrichProvider);
//# sourceMappingURL=BetterEnrichProvider.js.map