import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Mock Redis client for local development to avoid connection errors.
const mockRedis = {
  get: async (key: string): Promise<string | null> => {
    logger.info(`[Mock Redis] GET ${key}`);
    // Simulate a cache miss in development to always fetch fresh data.
    return null;
  },
  setex: async (key: string, ttl: number, value: string): Promise<'OK'> => {
    logger.info(`[Mock Redis] SETEX ${key} with TTL ${ttl}: ${value}`);
    return 'OK';
  },
  del: async (key: string | string[]): Promise<number> => {
    logger.info(`[Mock Redis] DEL ${key}`);
    return 1;
  },
  flushdb: async (): Promise<'OK'> => {
    logger.info('[Mock Redis] FLUSHDB');
    return 'OK';
  },
};

// Always use real Redis in production Docker environment
const redisClient = new Redis(process.env.REDIS_URL || 'redis://leadenrich-redis:6379');

logger.info('🚀 Connecting to Redis...');

export class CacheService {
  // The client is now dynamically chosen based on the environment.
  private static redis: any = redisClient;
  private static DEFAULT_TTL = 3600; // 1 hour

  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  static async set(
    key: string,
    value: any,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  static async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }

  // Provider response caching
  static getCacheKey(
    provider: string,
    operation: string,
    params: any
  ): string {
    // Sort keys for a consistent hash, regardless of parameter order.
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    const hash = Buffer.from(paramString).toString('base64');
    return `provider:${provider}:${operation}:${hash}`;
  }

  static async cacheProviderResponse(
    provider: string,
    operation: string,
    params: any,
    response: any,
    ttl: number = 3600
  ): Promise<void> {
    const key = this.getCacheKey(provider, operation, params);
    await this.set(key, response, ttl);
  }

  static async getCachedProviderResponse(
    provider: string,
    operation: string,
    params: any
  ): Promise<any | null> {
    const key = this.getCacheKey(provider, operation, params);
    return this.get(key);
  }
}
