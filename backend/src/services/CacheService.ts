import Redis from 'ioredis';
import { logger } from '@/utils/logger';

export class CacheService {
  private static redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
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