"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const express_1 = require("express");
const upload_1 = require("../middleware/upload");
const FileProcessingService_1 = require("../services/FileProcessingService");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.uploadRouter = router;
// Upload and parse CSV
router.post('/csv', upload_1.upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: { message: 'No file uploaded' },
            });
            return;
        }
        logger_1.logger.info(`Processing uploaded file: ${req.file.filename}`);
        // Parse CSV
        const parsedData = await FileProcessingService_1.FileProcessingService.parseCSV(req.file.path);
        // Detect column types
        const columnTypes = await FileProcessingService_1.FileProcessingService.detectColumnTypes(parsedData);
        // Suggest mappings (example target fields)
        const targetFields = ['email', 'firstName', 'lastName', 'company', 'domain', 'phone'];
        const suggestions = FileProcessingService_1.FileProcessingService.suggestColumnMapping(parsedData.headers, columnTypes, targetFields);
        // Clean up file after parsing
        await FileProcessingService_1.FileProcessingService.cleanupFile(req.file.path);
        res.json({
            success: true,
            data: {
                headers: parsedData.headers,
                totalRows: parsedData.totalRows,
                preview: parsedData.preview,
                columnTypes,
                suggestions,
            },
        });
    }
    catch (error) {
        // Clean up file on error
        if (req.file) {
            await FileProcessingService_1.FileProcessingService.cleanupFile(req.file.path);
        }
        next(error);
    }
});
//# sourceMappingURL=upload.js.map