declare class RedisService {
    private client;
    private useMock;
    constructor();
    private initializeRedis;
    get(key: string): Promise<any>;
    set(key: string, value: any, options?: any): Promise<any>;
    del(key: string): Promise<any>;
}
export declare const redisService: RedisService;
export {};
//# sourceMappingURL=RedisService.d.ts.map