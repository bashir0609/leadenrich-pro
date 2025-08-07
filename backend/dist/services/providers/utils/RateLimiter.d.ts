type RateLimitInfo = {
    limit: number;
    remaining: number;
    reset: number;
};
export declare class RateLimiter {
    private static instance;
    private cache;
    private defaultLimits;
    private lastRequestTime;
    private minIntervalMs;
    private constructor();
    static getInstance(): RateLimiter;
    private getRateLimitKey;
    private getResetTime;
    waitForRateLimit(): Promise<void>;
    updateFromHeaders(headers: any): void;
    getRateLimits(): {
        minute: RateLimitInfo;
        hourly: RateLimitInfo;
        daily: RateLimitInfo;
    };
    private getOrCreateLimitInfo;
}
export {};
//# sourceMappingURL=RateLimiter.d.ts.map