"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const bottleneck_1 = __importDefault(require("bottleneck"));
const p_retry_1 = __importDefault(require("p-retry"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const logger_1 = require("@/utils/logger");
const errors_1 = require("@/types/errors");
const providers_1 = require("@/types/providers");
class BaseProvider {
    constructor(config) {
        this.config = config;
        this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-this';
        // Initialize HTTP client with enhanced configuration
        this.client = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: config.customConfig?.timeout || 30000,
            headers: {
                'User-Agent': 'LeadEnrich/1.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });
        // Initialize rate limiter with provider-specific settings
        this.rateLimiter = new bottleneck_1.default({
            maxConcurrent: config.customConfig?.maxConcurrent || 1,
            minTime: 1000 / config.rateLimits.requestsPerSecond,
            reservoir: config.rateLimits.burstSize,
            reservoirRefreshAmount: config.rateLimits.burstSize,
            reservoirRefreshInterval: 60 * 1000, // 1 minute
        });
        // Set up interceptors
        this.setupInterceptors();
    }
    // Public API
    async execute(request) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        try {
            // Validate operation is supported
            if (!this.supportsOperation(request.operation)) {
                throw new errors_1.CustomError(errors_1.ErrorCode.OPERATION_FAILED, `Provider ${this.config.name} does not support operation ${request.operation}`, 400);
            }
            // Execute with rate limiting and retry
            const result = await this.rateLimiter.schedule(() => (0, p_retry_1.default)(() => this.executeOperation.call(this, request), {
                retries: request.options?.retries || 3,
                factor: 2,
                minTimeout: 1000,
                maxTimeout: 10000,
                onFailedAttempt: (error) => {
                    logger_1.logger.warn(`Provider ${this.config.name} attempt ${error.attemptNumber} failed:`, {
                        error: error.message,
                        operation: request.operation,
                        retriesLeft: error.retriesLeft,
                    });
                },
            }));
            const responseTime = Date.now() - startTime;
            return {
                success: true,
                data: result,
                metadata: {
                    provider: this.config.name,
                    operation: request.operation,
                    creditsUsed: this.calculateCredits(request.operation),
                    responseTime,
                    requestId,
                },
            };
        }
        catch (error) {
            const mappedError = this.mapErrorToStandard(error);
            const responseTime = Date.now() - startTime;
            logger_1.logger.error(`Provider ${this.config.name} operation failed:`, {
                operation: request.operation,
                error: mappedError.message,
                requestId,
                responseTime,
            });
            return {
                success: false,
                error: {
                    code: mappedError.code,
                    message: mappedError.message,
                    details: mappedError.details,
                },
                metadata: {
                    provider: this.config.name,
                    operation: request.operation,
                    creditsUsed: 0,
                    responseTime,
                    requestId,
                },
            };
        }
    }
    // Protected methods for use by child classes
    async executeOperation(request) {
        // Default implementation - override in child classes
        throw new errors_1.CustomError(errors_1.ErrorCode.OPERATION_FAILED, 'Operation not implemented', 501);
    }
    encryptApiKey(apiKey) {
        return crypto_js_1.default.AES.encrypt(apiKey, this.encryptionKey).toString();
    }
    decryptApiKey(encryptedKey) {
        const bytes = crypto_js_1.default.AES.decrypt(encryptedKey, this.encryptionKey);
        return bytes.toString(crypto_js_1.default.enc.Utf8);
    }
    setupInterceptors() {
        this.client.interceptors.request.use((config) => {
            const requestId = this.generateRequestId();
            config.metadata = { requestId, startTime: Date.now() };
            logger_1.logger.debug(`Provider ${this.config.name} request:`, {
                requestId,
                method: config.method?.toUpperCase(),
                url: config.url,
                hasData: !!config.data,
            });
            return config;
        }, (error) => {
            logger_1.logger.error(`Provider ${this.config.name} request error:`, error);
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => {
            const duration = Date.now() - (response.config.metadata?.startTime || 0);
            logger_1.logger.debug(`Provider ${this.config.name} response:`, {
                requestId: response.config.metadata?.requestId,
                status: response.status,
                duration,
                hasData: !!response.data,
            });
            return response;
        }, (error) => {
            const duration = error.config?.metadata ?
                Date.now() - error.config.metadata.startTime : 0;
            logger_1.logger.error(`Provider ${this.config.name} response error:`, {
                requestId: error.config.metadata?.requestId,
                status: error.response?.status,
                duration,
                message: error.message,
            });
            return Promise.reject(error);
        });
    }
    // Enhanced helper methods
    supportsOperation(operation) {
        return this.config.supportedOperations.includes(operation);
    }
    calculateCredits(operation) {
        // Default credit calculation - override in child classes for specific costs
        const creditMap = {
            [providers_1.ProviderOperation.FIND_EMAIL]: 1,
            [providers_1.ProviderOperation.ENRICH_PERSON]: 2,
            [providers_1.ProviderOperation.ENRICH_COMPANY]: 2,
            [providers_1.ProviderOperation.SEARCH_PEOPLE]: 5,
            [providers_1.ProviderOperation.SEARCH_COMPANIES]: 5,
            [providers_1.ProviderOperation.FIND_LOOKALIKE]: 10,
            [providers_1.ProviderOperation.CHECK_ENRICHMENT_STATUS]: 0, // No cost for status check
        };
        return creditMap[operation] || 1;
    }
    // Enhanced utilities
    validateRequired(params, requiredFields) {
        const missing = requiredFields.filter(field => !params[field] ||
            (typeof params[field] === 'string' && params[field].trim() === ''));
        if (missing.length > 0) {
            throw new errors_1.CustomError(errors_1.ErrorCode.INVALID_INPUT, `Missing required fields: ${missing.join(', ')}`, 400, { missingFields: missing });
        }
    }
    cleanEmail(email) {
        if (!email)
            return null;
        const cleaned = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(cleaned) ? cleaned : null;
    }
    // FIXED: Added proper null checks
    cleanDomain(input) {
        if (!input) {
            return null;
        }
        let urlString = input.trim().toLowerCase();
        // The URL constructor requires a protocol. Add one if it's missing.
        if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
            urlString = 'https://' + urlString;
        }
        try {
            const url = new URL(urlString);
            // The `hostname` property gives us exactly what we need (domain + subdomains).
            let domain = url.hostname;
            // We can still remove 'www.' if desired.
            domain = domain.replace(/^www\./, '');
            // Basic validation to ensure it's a proper domain
            const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
            return domainRegex.test(domain) ? domain : null;
        }
        catch (error) {
            // If new URL() fails, it's not a valid URL/domain.
            return null;
        }
    }
    cleanPhone(phone) {
        if (!phone)
            return null;
        const cleaned = phone.replace(/\D/g, '');
        return (cleaned.length >= 10 && cleaned.length <= 15) ? cleaned : null;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    generateRequestId() {
        return `${this.config.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    // Getters
    get name() {
        return this.config.name;
    }
    get id() {
        return this.config.id;
    }
    get category() {
        return this.config.category;
    }
    get isHealthy() {
        // Can be enhanced to check actual health
        return true;
    }
    // Health check method
    async healthCheck() {
        try {
            await this.authenticate();
            return { healthy: true };
        }
        catch (error) {
            return {
                healthy: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // FIXED: Proper typing for getCapabilities return type
    getCapabilities() {
        return {
            operations: this.config.supportedOperations,
            rateLimits: this.config.rateLimits,
            features: Object.keys(this.config.customConfig || {}),
        };
    }
}
exports.BaseProvider = BaseProvider;
//# sourceMappingURL=BaseProvider.js.map