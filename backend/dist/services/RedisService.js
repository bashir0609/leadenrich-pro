"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const redis_mock_1 = require("../config/redis-mock");
class RedisService {
    constructor() {
        this.useMock = false;
        this.initializeRedis();
    }
    async initializeRedis() {
        try {
            // Try to connect to real Redis
            const Redis = require('ioredis');
            this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
            // Test connection
            await this.client.ping();
            console.log('✅ Connected to Redis');
        }
        catch (error) {
            console.log('⚠️  Redis not available, using mock Redis');
            this.client = redis_mock_1.mockRedis;
            this.useMock = true;
        }
    }
    async get(key) {
        return await this.client.get(key);
    }
    async set(key, value, options) {
        return await this.client.set(key, value, options);
    }
    async del(key) {
        return await this.client.del(key);
    }
}
exports.redisService = new RedisService();
//# sourceMappingURL=RedisService.js.map