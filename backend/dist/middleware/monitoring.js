"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsMiddleware = void 0;
const MetricsService_1 = require("@/services/MetricsService");
const metricsMiddleware = (req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000;
        const route = req.route?.path || req.path;
        MetricsService_1.MetricsService.recordHttpRequest(req.method, route, res.statusCode, duration);
    });
    next();
};
exports.metricsMiddleware = metricsMiddleware;
//# sourceMappingURL=monitoring.js.map