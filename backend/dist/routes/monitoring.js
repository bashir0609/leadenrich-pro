"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringRouter = void 0;
const express_1 = require("express");
const MetricsService_1 = require("@/services/MetricsService");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
exports.monitoringRouter = router;
// Prometheus metrics endpoint
router.get('/metrics', async (req, res) => {
    try {
        const metrics = await MetricsService_1.MetricsService.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
    }
    catch (error) {
        res.status(500).send('Error collecting metrics');
    }
});
// Application health metrics (authenticated)
router.get('/health-metrics', auth_1.authenticate, (0, auth_1.authorize)(['admin']), async (req, res, next) => {
    try {
        const metrics = await MetricsService_1.MetricsService.getHealthMetrics();
        res.json({
            success: true,
            data: metrics,
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=monitoring.js.map