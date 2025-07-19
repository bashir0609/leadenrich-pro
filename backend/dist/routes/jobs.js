"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobsRouter = void 0;
const express_1 = require("express");
const QueueService_1 = require("@/services/QueueService");
const errors_1 = require("@/types/errors");
const router = (0, express_1.Router)();
exports.jobsRouter = router;
// Get job status
router.get('/:jobId', async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const status = await QueueService_1.QueueService.getJobStatus(jobId);
        if (!status) {
            throw (0, errors_1.NotFoundError)(`Job ${jobId} not found`);
        }
        res.json({
            success: true,
            data: status,
        });
    }
    catch (error) {
        next(error);
    }
});
// Get job logs
router.get('/:jobId/logs', async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const status = await QueueService_1.QueueService.getJobStatus(jobId);
        if (!status) {
            throw (0, errors_1.NotFoundError)(`Job ${jobId} not found`);
        }
        res.json({
            success: true,
            data: status.logs || [],
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=jobs.js.map