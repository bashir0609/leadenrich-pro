import NodeCache from 'node-cache';

type CacheOptions = {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
};

type CacheKey = string | Record<string, any>;

export class ApiCache {
  private static instance: ApiCache;
  private cache: NodeCache;
  private keyPrefix: string;

  private constructor() {
    this.cache = new NodeCache({
      stdTTL: 3600, // 1 hour default TTL
      checkperiod: 600, // Check for expired items every 10 minutes
      useClones: false,
    });
    this.keyPrefix = 'apollo:';
  }

  static getInstance(): ApiCache {
    if (!ApiCache.instance) {
      ApiCache.instance = new ApiCache();
    }
    return ApiCache.instance;
  }

  private generateKey(operation: string, params: CacheKey): string {
    if (typeof params === 'string') {
      return `${this.keyPrefix}${operation}:${params}`;
    }
    
    // Sort params to ensure consistent keys
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    const paramsString = JSON.stringify(sortedParams);
    return `${this.keyPrefix}${operation}:${Buffer.from(paramsString).toString('base64')}`;
  }

  async get<T>(key: CacheKey): Promise<T | undefined> {
    const cacheKey = this.generateKey('', key);
    return this.cache.get<T>(cacheKey);
  }

  async set<T>(key: CacheKey, value: T, ttl?: number): Promise<boolean> {
    const cacheKey = this.generateKey('', key);
    return this.cache.set(cacheKey, value, ttl || 3600);
  }

  async getOrSet<T>(
    operation: string,
    params: CacheKey,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const key = this.generateKey(operation, params);
    const cached = await this.get<T>(key);
    
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

  clear(operation?: string): void {
    if (operation) {
      const keys = this.cache.keys();
      const prefix = `${this.keyPrefix}${operation}:`;
      const matchingKeys = keys.filter(key => key.startsWith(prefix));
      
      if (matchingKeys.length > 0) {
        this.cache.del(matchingKeys);
        console.log(`[Cache] Cleared ${matchingKeys.length} entries for ${operation}`);
      }
    } else {
      this.cache.flushAll();
      console.log('[Cache] Cleared all entries');
    }
  }

  getStats(): {
    keys: number;
    hits: number;
    misses: number;
    keyspace: string[];
  } {
    const stats = this.cache.getStats();
    return {
      keys: this.cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      keyspace: this.cache.keys(),
    };
  }
}
