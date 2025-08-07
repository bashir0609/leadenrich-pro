"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
// Mock Redis client for local development to avoid connection errors.
const mockRedis = {
    get: async (key) => {
        logger_1.logger.info(`[Mock Redis] GET ${key}`);
        // Simulate a cache miss in development to always fetch fresh data.
        return null;
    },
    setex: async (key, ttl, value) => {
        logger_1.logger.info(`[Mock Redis] SETEX ${key} with TTL ${ttl}: ${value}`);
        return 'OK';
    },
    del: async (key) => {
        logger_1.logger.info(`[Mock Redis] DEL ${key}`);
        return 1;
    },
    flushdb: async () => {
        logger_1.logger.info('[Mock Redis] FLUSHDB');
        return 'OK';
    },
};
// Use the mock client in development, otherwise connect to the real Redis server.
const isDevelopment = process.env.NODE_ENV === 'development';
const redisClient = isDevelopment
    ? mockRedis
    : new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
logger_1.logger.info(isDevelopment ? '🔧 Using Mock Redis for local development.' : '🚀 Connecting to Redis...');
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
        // Sort keys for a consistent hash, regardless of parameter order.
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
// The client is now dynamically chosen based on the environment.
CacheService.redis = redisClient;
CacheService.DEFAULT_TTL = 3600; // 1 hour
//# sourceMappingURL=CacheService.js.map