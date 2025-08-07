"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
exports.dashboardRouter = router;
// Get dashboard statistics
router.get('/stats', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        console.log('📊 Dashboard API called for user:', userId);
        // Get provider count
        const providerCount = await prisma_1.default.provider.count({
            where: {
                isActive: true,
            },
        });
        console.log('📈 Provider count:', providerCount);
        // Get user's recent jobs count (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentJobsCount = await prisma_1.default.enrichmentJob.count({
            where: {
                userId,
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
        });
        console.log('📈 Recent jobs count:', recentJobsCount);
        // Get API usage statistics for current month
        const currentMonth = new Date();
        currentMonth.setDate(1); // First day of current month
        currentMonth.setHours(0, 0, 0, 0);
        // Count API calls this month (using enrichmentJob table)
        const apiCallsThisMonth = await prisma_1.default.enrichmentJob.aggregate({
            where: {
                userId,
                createdAt: {
                    gte: currentMonth,
                },
            },
            _sum: {
                totalRecords: true,
            },
        });
        // Get recent jobs for the user
        const recentJobs = await prisma_1.default.enrichmentJob.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                status: true,
                createdAt: true,
                totalRecords: true,
                processedRecords: true,
                provider: {
                    select: {
                        displayName: true,
                    },
                },
            },
        });
        // Get job statistics by status
        const jobStatusCounts = await prisma_1.default.enrichmentJob.groupBy({
            by: ['status'],
            where: { userId },
            _count: {
                status: true,
            },
        });
        const statusSummary = {
            completed: jobStatusCounts.find(s => s.status === 'completed')?._count.status || 0,
            processing: jobStatusCounts.find(s => s.status === 'processing')?._count.status || 0,
            failed: jobStatusCounts.find(s => s.status === 'failed')?._count.status || 0,
            queued: jobStatusCounts.find(s => s.status === 'queued')?._count.status || 0,
        };
        // Calculate API credits/usage
        const monthlyApiCalls = apiCallsThisMonth._sum.totalRecords || 0;
        const apiCredits = {
            used: monthlyApiCalls,
            remaining: Math.max(0, 10000 - monthlyApiCalls),
            total: 10000,
            thisMonth: monthlyApiCalls,
        };
        const responseData = {
            providers: {
                total: providerCount,
                active: providerCount, // All counted providers are active
            },
            jobs: {
                recent: recentJobsCount,
                total: statusSummary,
                recentJobs: recentJobs,
            },
            credits: apiCredits,
        };
        console.log('📊 Dashboard response data:', JSON.stringify(responseData, null, 2));
        res.json({
            success: true,
            data: responseData,
        });
    }
    catch (error) {
        console.error('❌ Dashboard API error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DASHBOARD_ERROR',
                message: 'Failed to fetch dashboard statistics',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
        });
    }
});
//# sourceMappingURL=dashboard.js.map