"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HunterProvider = void 0;
const axios_1 = __importDefault(require("axios"));
class HunterProvider {
    constructor() {
        this.config = {
            baseUrl: 'https://api.hunter.io'
        };
        this.client = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: 30000
        });
    }
    setApiKey(apiKey) {
        this.config.apiKey = apiKey;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async authenticate() {
        // Simple auth check
        if (!this.config.apiKey) {
            throw new Error('Hunter API key not configured');
        }
    }
    validateConfig() {
        if (!this.config.apiKey) {
            throw new Error('Hunter API key is required');
        }
    }
    async findEmail(params) {
        try {
            if (!this.config.apiKey) {
                throw new Error('Hunter API key not configured');
            }
            // Add a 1-second delay before making the request to prevent overwhelming the API
            console.log('Adding 1-second delay before Hunter findEmail request');
            await this.sleep(1000);
            const response = await this.client.get('/v2/email-finder', {
                params: {
                    domain: params.domain,
                    first_name: params.firstName,
                    last_name: params.lastName,
                    api_key: this.config.apiKey
                }
            });
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async searchDomain(params) {
        try {
            if (!this.config.apiKey) {
                throw new Error('Hunter API key not configured');
            }
            // Add a 1-second delay before making the request to prevent overwhelming the API
            console.log('Adding 1-second delay before Hunter searchDomain request');
            await this.sleep(1000);
            const response = await this.client.get('/v2/domain-search', {
                params: {
                    domain: params.domain,
                    api_key: this.config.apiKey
                }
            });
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async verifyEmail(email) {
        try {
            if (!this.config.apiKey) {
                throw new Error('Hunter API key not configured');
            }
            // Add a 1-second delay before making the request to prevent overwhelming the API
            console.log('Adding 1-second delay before Hunter verifyEmail request');
            await this.sleep(1000);
            const response = await this.client.get('/v2/email-verifier', {
                params: {
                    email: email,
                    api_key: this.config.apiKey
                }
            });
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    // Bulk methods for compatibility
    async bulkEnrichPeople(people) {
        const results = [];
        for (const person of people) {
            // Increase delay to 1 second for consistency with other operations
            console.log('Adding 1-second delay before Hunter bulkEnrichPeople request');
            await this.sleep(1000); // Rate limiting
            const result = await this.findEmail(person);
            results.push(result);
        }
        return results;
    }
    async bulkEnrichCompanies(companies) {
        const results = [];
        for (const company of companies) {
            // Increase delay to 1 second for consistency with other operations
            console.log('Adding 1-second delay before Hunter bulkEnrichCompanies request');
            await this.sleep(1000); // Rate limiting
            const result = await this.searchDomain(company);
            results.push(result);
        }
        return results;
    }
}
exports.HunterProvider = HunterProvider;
//# sourceMappingURL=HunterProvider.js.map