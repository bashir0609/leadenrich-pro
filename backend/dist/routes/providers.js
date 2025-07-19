"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providersRouter = void 0;
// backend/src/routes/providers.ts
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("@/utils/validation");
const ProviderFactory_1 = require("@/services/providers/ProviderFactory");
const QueueService_1 = require("@/services/QueueService");
const client_1 = require("@prisma/client");
const logger_1 = require("@/utils/logger");
const errors_1 = require("@/types/errors");
const router = (0, express_1.Router)();
exports.providersRouter = router;
const prisma = new client_1.PrismaClient();
// Get all active providers
router.get('/', async (req, res, next) => {
    try {
        const providers = await prisma.provider.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                displayName: true,
                category: true,
                features: {
                    select: {
                        featureId: true,
                        featureName: true,
                        category: true,
                        creditsPerRequest: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            data: providers,
        });
    }
    catch (error) {
        next(error);
    }
});
// Test provider connection
router.post('/:providerId/test', async (req, res, next) => {
    try {
        const { providerId } = req.params;
        if (!providerId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Provider ID is required',
                },
            });
            return;
        }
        const provider = await ProviderFactory_1.ProviderFactory.getProvider(providerId);
        // Try a simple operation to test connection
        const result = await provider.execute({
            operation: 'test',
            params: {},
        });
        res.json({
            success: true,
            data: {
                provider: providerId,
                connected: result.success,
                message: result.success ? 'Provider connected successfully' : 'Provider connection failed',
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// Execute single operation
const executeSchema = zod_1.z.object({
    operation: zod_1.z.string(),
    params: zod_1.z.record(zod_1.z.any()),
    options: zod_1.z.object({
        timeout: zod_1.z.number().optional(),
        retries: zod_1.z.number().optional(),
    }).optional(),
});
router.post('/:providerId/execute', (0, validation_1.validate)(executeSchema), async (req, res, next) => {
    try {
        const { providerId } = req.params;
        // Validate providerId is present
        if (!providerId) {
            throw (0, errors_1.BadRequestError)('Provider ID is required');
        }
        const { operation, params, options } = req.body;
        logger_1.logger.info(`Executing ${operation} on provider ${providerId}`, { params });
        const provider = await ProviderFactory_1.ProviderFactory.getProvider(providerId);
        const result = await provider.execute({
            operation,
            params,
            options,
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
// Create bulk enrichment job
const bulkEnrichSchema = zod_1.z.object({
    operation: zod_1.z.string(),
    records: zod_1.z.array(zod_1.z.record(zod_1.z.any())).min(1).max(10000),
    options: zod_1.z.object({
        webhookUrl: zod_1.z.string().url().optional(),
        columnMapping: zod_1.z.record(zod_1.z.string()).optional(),
    }).optional(),
});
router.post('/:providerId/bulk', (0, validation_1.validate)(bulkEnrichSchema), async (req, res, next) => {
    try {
        const { providerId } = req.params;
        if (!providerId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Provider ID is required',
                },
            });
            return;
        }
        const { operation, records, options } = req.body;
        const jobId = await QueueService_1.QueueService.createEnrichmentJob({
            providerId,
            operation,
            records,
            options,
        });
        res.status(202).json({
            success: true,
            data: {
                jobId,
                status: 'queued',
                totalRecords: records.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=providers.js.map