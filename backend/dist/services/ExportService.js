"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const csv_writer_1 = require("csv-writer");
const XLSX = __importStar(require("xlsx"));
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = require("@/utils/logger");
const errors_1 = require("@/types/errors");
const prisma = new client_1.PrismaClient();
class ExportService {
    static async exportJobResults(jobId, options) {
        const job = await prisma.enrichmentJob.findUnique({
            where: { id: jobId },
        });
        if (!job) {
            throw new errors_1.CustomError(errors_1.ErrorCode.NOT_FOUND, 'Job not found', 404);
        }
        if (job.status !== 'completed') {
            throw new errors_1.CustomError(errors_1.ErrorCode.OPERATION_FAILED, 'Job must be completed before export', 400);
        }
        // Get results (in real app, this would come from results storage)
        const results = job.outputData || [];
        const exportDir = path_1.default.join(process.cwd(), 'exports');
        await promises_1.default.mkdir(exportDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = options.filename || `export-${jobId}-${timestamp}.${options.format}`;
        const filePath = path_1.default.join(exportDir, filename);
        switch (options.format) {
            case 'csv':
                await this.exportToCSV(results, filePath, options);
                break;
            case 'xlsx':
                await this.exportToExcel(results, filePath, options);
                break;
            case 'json':
                await this.exportToJSON(results, filePath, options);
                break;
            default:
                throw new errors_1.CustomError(errors_1.ErrorCode.INVALID_INPUT, `Unsupported format: ${options.format}`, 400);
        }
        const stats = await promises_1.default.stat(filePath);
        return {
            filePath,
            filename,
            format: options.format,
            recordCount: results.length,
            fileSize: stats.size,
        };
    }
    static async exportToCSV(data, filePath, options) {
        if (data.length === 0) {
            await promises_1.default.writeFile(filePath, 'No data to export');
            return;
        }
        const columns = options.columns || Object.keys(data[0]);
        const header = columns.map((col) => ({ id: col, title: col }));
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
            path: filePath,
            header,
        });
        const records = data.map((item) => {
            const record = {};
            columns.forEach((col) => {
                record[col] = this.flattenValue(item[col]);
            });
            return record;
        });
        await csvWriter.writeRecords(records);
        logger_1.logger.info(`Exported ${records.length} records to CSV: ${filePath}`);
    }
    static async exportToExcel(data, filePath, options) {
        const workbook = XLSX.utils.book_new();
        if (data.length === 0) {
            const worksheet = XLSX.utils.aoa_to_sheet([['No data to export']]);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
        }
        else {
            const columns = options.columns || Object.keys(data[0]);
            const rows = [columns];
            data.forEach((item) => {
                const row = columns.map((col) => this.flattenValue(item[col]));
                rows.push(row);
            });
            const worksheet = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
            if (options.includeMetadata) {
                const metadata = [
                    ['Export Date', new Date().toISOString()],
                    ['Total Records', data.length],
                    ['Columns', columns.join(', ')],
                ];
                const metaSheet = XLSX.utils.aoa_to_sheet(metadata);
                XLSX.utils.book_append_sheet(workbook, metaSheet, 'Metadata');
            }
        }
        XLSX.writeFile(workbook, filePath);
        logger_1.logger.info(`Exported ${data.length} records to Excel: ${filePath}`);
    }
    static async exportToJSON(data, filePath, options) {
        const exportData = {
            exportDate: new Date().toISOString(),
            recordCount: data.length,
            data: data,
        };
        if (options.includeMetadata) {
            exportData.metadata = {
                columns: options.columns || (data.length > 0 ? Object.keys(data[0]) : []),
                format: 'json',
            };
        }
        await promises_1.default.writeFile(filePath, JSON.stringify(exportData, null, 2));
        logger_1.logger.info(`Exported ${data.length} records to JSON: ${filePath}`);
    }
    static flattenValue(value) {
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    }
}
exports.ExportService = ExportService;
//# sourceMappingURL=ExportService.js.map