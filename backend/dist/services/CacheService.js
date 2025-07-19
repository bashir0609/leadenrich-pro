"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("@/utils/logger");
class CacheService {
    static async get(key) {
        try {
            const data = await this.redis.get(key);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Cache get error:', error);
            return null;
        }
    }
    static async set(key, value, ttl = this.DEFAULT_TTL) {
        try {
            await this.redis.setex(key, ttl, JSON.stringify(value));
        }
        catch (error) {
            logger_1.logger.error('Cache set error:', error);
        }
    }
    static async delete(key) {
        try {
            await this.redis.del(key);
        }
        catch (error) {
            logger_1.logger.error('Cache delete error:', error);
        }
    }
    static async flush() {
        try {
            await this.redis.flushdb();
        }
        catch (error) {
            logger_1.logger.error('Cache flush error:', error);
        }
    }
    // Provider response caching
    static getCacheKey(provider, operation, params) {
        const paramString = JSON.stringify(params, Object.keys(params).sort());
        const hash = Buffer.from(paramString).toString('base64');
        return `provider:${provider}:${operation}:${hash}`;
    }
    static async cacheProviderResponse(provider, operation, params, response, ttl = 3600) {
        const key = this.getCacheKey(provider, operation, params);
        await this.set(key, response, ttl);
    }
    static async getCachedProviderResponse(provider, operation, params) {
        const key = this.getCacheKey(provider, operation, params);
        return this.get(key);
    }
}
exports.CacheService = CacheService;
CacheService.redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
CacheService.DEFAULT_TTL = 3600; // 1 hour
//# sourceMappingURL=CacheService.js.map