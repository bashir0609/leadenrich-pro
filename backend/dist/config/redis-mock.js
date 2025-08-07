"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockRedis = void 0;
// Mock Redis for local development
exports.mockRedis = {
    async get(key) {
        console.log(`[Mock Redis] GET ${key}`);
        return null;
    },
    async set(key, value, options) {
        console.log(`[Mock Redis] SET ${key}:`, value);
        return 'OK';
    },
    async del(key) {
        console.log(`[Mock Redis] DEL ${key}`);
        return 1;
    }
};
//# sourceMappingURL=redis-mock.js.map