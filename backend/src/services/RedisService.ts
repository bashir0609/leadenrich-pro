import { mockRedis } from '../config/redis-mock';

class RedisService {
  private client: any;
  private useMock: boolean = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      // Try to connect to real Redis
      const Redis = require('ioredis');
      const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
      console.log('🔗 Connecting to Redis at:', redisUrl);
      this.client = new Redis(redisUrl);
      
      // Test connection
      await this.client.ping();
      console.log('✅ Connected to Redis');
    } catch (error) {
      console.log('⚠️  Redis not available, using mock Redis');
      this.client = mockRedis;
      this.useMock = true;
    }
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async set(key: string, value: any, options?: any) {
    return await this.client.set(key, value, options);
  }

  async del(key: string) {
    return await this.client.del(key);
  }
}

export const redisService = new RedisService();
