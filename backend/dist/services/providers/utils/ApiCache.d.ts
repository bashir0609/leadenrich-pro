type CacheOptions = {
    ttl?: number;
    keyPrefix?: string;
};
type CacheKey = string | Record<string, any>;
export declare class ApiCache {
    private static instance;
    private cache;
    private keyPrefix;
    private constructor();
    static getInstance(): ApiCache;
    private generateKey;
    get<T>(key: CacheKey): Promise<T | undefined>;
    set<T>(key: CacheKey, value: T, ttl?: number): Promise<boolean>;
    getOrSet<T>(operation: string, params: CacheKey, fetchFn: () => Promise<T>, options?: CacheOptions): Promise<T>;
    clear(operation?: string): void;
    getStats(): {
        keys: number;
        hits: number;
        misses: number;
        keyspace: string[];
    };
}
export {};
//# sourceMappingURL=ApiCache.d.ts.map