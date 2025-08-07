"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../utils/validation");
const ExportService_1 = require("../services/ExportService");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
exports.exportRouter = router;
const exportSchema = zod_1.z.object({
    format: zod_1.z.enum(['csv', 'xlsx', 'json']),
    columns: zod_1.z.array(zod_1.z.string()).optional(),
    includeMetadata: zod_1.z.boolean().optional(),
});
// Export job results
router.post('/jobs/:jobId', (0, validation_1.validate)(exportSchema), async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const options = req.body;
        // Make sure jobId is defined before passing it to exportJobResults
        if (!jobId) {
            res.status(400).json({
                success: false,
                error: { message: 'Job ID is required' },
            });
            return undefined;
        }
        const result = await ExportService_1.ExportService.exportJobResults(jobId, options);
        res.json({
            success: true,
            data: result,
        });
        return undefined;
    }
    catch (error) {
        next(error);
        return undefined;
    }
});
// Download exported file
router.get('/download/:filename', async (req, res, next) => {
    try {
        const { filename } = req.params;
        const filePath = path_1.default.join(process.cwd(), 'exports', filename);
        // Check if file exists
        if (!fs_1.default.existsSync(filePath)) {
            res.status(404).json({
                success: false,
                error: { message: 'File not found' },
            });
            return undefined;
        }
        // Set appropriate headers
        const ext = path_1.default.extname(filename).toLowerCase();
        const contentTypes = {
            '.csv': 'text/csv',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.json': 'application/json',
        };
        res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        // Stream file
        const stream = fs_1.default.createReadStream(filePath);
        stream.pipe(res);
        return undefined;
    }
    catch (error) {
        next(error);
        return undefined;
    }
});
//# sourceMappingURL=export.js.map