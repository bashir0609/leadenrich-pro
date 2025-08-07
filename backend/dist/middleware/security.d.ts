/// <reference types="node" />
/// <reference types="express" />
export declare const createRateLimiter: (options: {
    windowMs?: number;
    max?: number;
    message?: string;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const apiRateLimits: {
    auth: import("express-rate-limit").RateLimitRequestHandler;
    enrichment: import("express-rate-limit").RateLimitRequestHandler;
    export: import("express-rate-limit").RateLimitRequestHandler;
};
export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse<import("http").IncomingMessage>, next: (err?: unknown) => void) => void;
export declare const sanitizeInput: import("express").Handler;
//# sourceMappingURL=security.d.ts.map