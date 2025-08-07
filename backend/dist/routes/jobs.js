"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobsRouter = void 0;
const express_1 = require("express");
const queue_1 = require("../config/queue");
const QueueService_1 = require("../services/QueueService");
const errors_1 = require("../types/errors");
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
exports.jobsRouter = router;
// Get all jobs for the logged-in user
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        // Fetch the FULL job objects, not a custom selection
        const jobsFromDb = await prisma_1.default.enrichmentJob.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' },
        });
        const formattedJobs = await Promise.all(
        // By fetching the full object, TypeScript now correctly infers the type of 'job' here
        jobsFromDb.map(async (job) => {
            let displayStatus = job.status;
            if (job.status === 'completed') {
                const queueJob = await queue_1.enrichmentQueue.getJob(job.id);
                if (!queueJob) {
                    displayStatus = 'expired';
                }
            }
            return {
                id: job.id,
                status: job.status,
                displayStatus: displayStatus,
                jobType: job.jobType,
                createdAt: job.createdAt,
                completedAt: job.completedAt,
                // Create the nested 'progress' object
                progress: {
                    total: job.totalRecords,
                    processed: job.processedRecords,
                    successful: job.successfulRecords,
                    failed: job.failedRecords,
                },
                // The full job list doesn't need logs or results, that's for the details page.
            };
        }));
        // --- END OF FIX ---
        res.json({
            success: true,
            data: formattedJobs,
        });
    }
    catch (error) {
        next(error);
    }
});
// Get job status (for a single job)
router.get('/:jobId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { jobId } = req.params;
        // It's also a good idea to verify the user owns this job
        const jobOwner = await prisma_1.default.enrichmentJob.findFirst({
            where: { id: jobId, userId: req.user.userId }
        });
        if (!jobOwner) {
            throw (0, errors_1.NotFoundError)(`Job ${jobId} not found or you do not have permission to view it.`);
        }
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