"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiCache = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
class ApiCache {
    constructor() {
        this.cache = new node_cache_1.default({
            stdTTL: 3600,
            checkperiod: 600,
            useClones: false,
        });
        this.keyPrefix = 'apollo:';
    }
    static getInstance() {
        if (!ApiCache.instance) {
            ApiCache.instance = new ApiCache();
        }
        return ApiCache.instance;
    }
    generateKey(operation, params) {
        if (typeof params === 'string') {
            return `${this.keyPrefix}${operation}:${params}`;
        }
        // Sort params to ensure consistent keys
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
            acc[key] = params[key];
            return acc;
        }, {});
        const paramsString = JSON.stringify(sortedParams);
        return `${this.keyPrefix}${operation}:${Buffer.from(paramsString).toString('base64')}`;
    }
    async get(key) {
        const cacheKey = this.generateKey('', key);
        return this.cache.get(cacheKey);
    }
    async set(key, value, ttl) {
        const cacheKey = this.generateKey('', key);
        return this.cache.set(cacheKey, value, ttl || 3600);
    }
    async getOrSet(operation, params, fetchFn, options = {}) {
        const key = this.generateKey(operation, params);
        const cached = await this.get(key);
        if (cached !== undefined) {
            console.log(`[ApiCache] Cache hit for key: ${key}`);
            return cached;
        }
        console.log(`[ApiCache] Cache miss for key: ${key}, fetching...`);
        const result = await fetchFn();
        // Cache the result with the specified TTL or use default
        const ttl = options.ttl || 3600; // Default 1 hour
        await this.set(key, result, ttl);
        return result;
    }
    clear(operation) {
        if (operation) {
            const keys = this.cache.keys();
            const prefix = `${this.keyPrefix}${operation}:`;
            const matchingKeys = keys.filter(key => key.startsWith(prefix));
            if (matchingKeys.length > 0) {
                this.cache.del(matchingKeys);
                console.log(`[Cache] Cleared ${matchingKeys.length} entries for ${operation}`);
            }
        }
        else {
            this.cache.flushAll();
            console.log('[Cache] Cleared all entries');
        }
    }
    getStats() {
        const stats = this.cache.getStats();
        return {
            keys: this.cache.keys().length,
            hits: stats.hits,
            misses: stats.misses,
            keyspace: this.cache.keys(),
        };
    }
}
exports.ApiCache = ApiCache;
//# sourceMappingURL=ApiCache.js.map