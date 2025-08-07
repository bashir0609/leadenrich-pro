"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
class RateLimiter {
    constructor() {
        this.defaultLimits = {
            minute: 50,
            hourly: 200,
            daily: 600, // 600 requests per day
        };
        this.lastRequestTime = 0;
        this.minIntervalMs = 1200; // Slightly more than 1 second (50 RPM = ~1.2s between requests)
        this.cache = new node_cache_1.default({
            stdTTL: 86400,
            checkperiod: 600,
            useClones: false,
        });
    }
    static getInstance() {
        if (!RateLimiter.instance) {
            RateLimiter.instance = new RateLimiter();
        }
        return RateLimiter.instance;
    }
    getRateLimitKey(scope) {
        const now = new Date();
        let key = '';
        switch (scope) {
            case 'minute':
                key = `rate_limit:${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
                break;
            case 'hourly':
                key = `rate_limit:${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
                break;
            case 'daily':
                key = `rate_limit:${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
                break;
        }
        return key;
    }
    getResetTime(scope) {
        const now = new Date();
        const reset = new Date(now);
        switch (scope) {
            case 'minute':
                reset.setMinutes(reset.getMinutes() + 1);
                reset.setSeconds(0);
                break;
            case 'hourly':
                reset.setHours(reset.getHours() + 1);
                reset.setMinutes(0, 0, 0);
                break;
            case 'daily':
                reset.setDate(reset.getDate() + 1);
                reset.setHours(0, 0, 0, 0);
                break;
        }
        return reset.getTime();
    }
    async waitForRateLimit() {
        const now = Date.now();
        // Enforce minimum interval between requests
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minIntervalMs) {
            const waitTime = this.minIntervalMs - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        // Check rate limits for all scopes
        const scopes = ['minute', 'hourly', 'daily'];
        for (const scope of scopes) {
            const key = this.getRateLimitKey(scope);
            let rateInfo = this.cache.get(key);
            if (!rateInfo) {
                rateInfo = {
                    limit: this.defaultLimits[scope],
                    remaining: this.defaultLimits[scope],
                    reset: this.getResetTime(scope),
                };
                this.cache.set(key, rateInfo, Math.ceil((rateInfo.reset - Date.now()) / 1000));
            }
            if (rateInfo.remaining <= 0) {
                const waitTime = rateInfo.reset - now;
                if (waitTime > 0) {
                    console.warn(`⚠️ Rate limit reached for ${scope} scope. Waiting ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
                // Reset the counter after waiting
                rateInfo.remaining = this.defaultLimits[scope];
                rateInfo.reset = this.getResetTime(scope);
            }
            // Decrement the counter
            rateInfo.remaining--;
            this.cache.set(key, rateInfo, Math.ceil((rateInfo.reset - Date.now()) / 1000));
        }
        this.lastRequestTime = Date.now();
    }
    updateFromHeaders(headers) {
        if (!headers)
            return;
        const now = Date.now();
        // Update minute rate limit
        const minuteLimit = parseInt(headers['x-rate-limit-minute']);
        const minuteRemaining = parseInt(headers['x-minute-requests-left']);
        const minuteKey = this.getRateLimitKey('minute');
        if (!isNaN(minuteLimit) && !isNaN(minuteRemaining)) {
            this.cache.set(minuteKey, {
                limit: minuteLimit,
                remaining: minuteRemaining,
                reset: now + 60000, // 1 minute from now
            }, 70); // Slightly more than 1 minute
        }
        // Update hourly rate limit
        const hourlyLimit = parseInt(headers['x-rate-limit-hourly']);
        const hourlyRemaining = parseInt(headers['x-hourly-requests-left']);
        const hourlyKey = this.getRateLimitKey('hourly');
        if (!isNaN(hourlyLimit) && !isNaN(hourlyRemaining)) {
            this.cache.set(hourlyKey, {
                limit: hourlyLimit,
                remaining: hourlyRemaining,
                reset: now + 3600000, // 1 hour from now
            }, 3660); // Slightly more than 1 hour
        }
        // Update daily rate limit
        const dailyLimit = parseInt(headers['x-rate-limit-24-hour']);
        const dailyRemaining = parseInt(headers['x-24-hour-requests-left']);
        const dailyKey = this.getRateLimitKey('daily');
        if (!isNaN(dailyLimit) && !isNaN(dailyRemaining)) {
            this.cache.set(dailyKey, {
                limit: dailyLimit,
                remaining: dailyRemaining,
                reset: now + 86400000, // 24 hours from now
            }, 86460); // Slightly more than 24 hours
        }
    }
    getRateLimits() {
        const now = Date.now();
        const result = {
            minute: this.getOrCreateLimitInfo('minute', now),
            hourly: this.getOrCreateLimitInfo('hourly', now),
            daily: this.getOrCreateLimitInfo('daily', now),
        };
        return result;
    }
    getOrCreateLimitInfo(scope, now) {
        const key = this.getRateLimitKey(scope);
        let rateInfo = this.cache.get(key);
        if (!rateInfo) {
            rateInfo = {
                limit: this.defaultLimits[scope],
                remaining: this.defaultLimits[scope],
                reset: this.getResetTime(scope),
            };
            this.cache.set(key, rateInfo, Math.ceil((rateInfo.reset - now) / 1000));
        }
        return { ...rateInfo };
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=RateLimiter.js.map