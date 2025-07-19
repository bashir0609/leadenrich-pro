export declare class CacheService {
    private static redis;
    private static DEFAULT_TTL;
    static get<T>(key: string): Promise<T | null>;
    static set(key: string, value: any, ttl?: number): Promise<void>;
    static delete(key: string): Promise<void>;
    static flush(): Promise<void>;
    static getCacheKey(provider: string, operation: string, params: any): string;
    static cacheProviderResponse(provider: string, operation: string, params: any, response: any, ttl?: number): Promise<void>;
    static getCachedProviderResponse(provider: string, operation: string, params: any): Promise<any | null>;
}
