import { createObjectCsvWriter } from 'csv-writer';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '@/utils/logger';
import { CustomError, ErrorCode } from '@/types/errors';

const prisma = new PrismaClient();

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  columns?: string[];
  includeMetadata?: boolean;
  filename?: string;
}

export interface ExportResult {
  filePath: string;
  filename: string;
  format: string;
  recordCount: number;
  fileSize: number;
}

export class ExportService {
  static async exportJobResults(
    jobId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    const job = await prisma.enrichmentJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'Job not found', 404);
    }

    if (job.status !== 'completed') {
      throw new CustomError(
        ErrorCode.OPERATION_FAILED,
        'Job must be completed before export',
        400
      );
    }

    // Get results (in real app, this would come from results storage)
    const results = job.outputData as any[] || [];

    const exportDir = path.join(process.cwd(), 'exports');
    await fs.mkdir(exportDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = options.filename || `export-${jobId}-${timestamp}.${options.format}`;
    const filePath = path.join(exportDir, filename);

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
        throw new CustomError(
          ErrorCode.INVALID_INPUT,
          `Unsupported format: ${options.format}`,
          400
        );
    }

    const stats = await fs.stat(filePath);

    return {
      filePath,
      filename,
      format: options.format,
      recordCount: results.length,
      fileSize: stats.size,
    };
  }

  private static async exportToCSV(
    data: any[],
    filePath: string,
    options: ExportOptions
  ): Promise<void> {
    if (data.length === 0) {
      await fs.writeFile(filePath, 'No data to export');
      return;
    }

    const columns = options.columns || Object.keys(data[0]);
    const header = columns.map((col) => ({ id: col, title: col }));

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header,
    });

    const records = data.map((item) => {
      const record: any = {};
      columns.forEach((col) => {
        record[col] = this.flattenValue(item[col]);
      });
      return record;
    });

    await csvWriter.writeRecords(records);
    logger.info(`Exported ${records.length} records to CSV: ${filePath}`);
  }

  private static async exportToExcel(
    data: any[],
    filePath: string,
    options: ExportOptions
  ): Promise<void> {
    const workbook = XLSX.utils.book_new();
    
    if (data.length === 0) {
      const worksheet = XLSX.utils.aoa_to_sheet([['No data to export']]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    } else {
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
    logger.info(`Exported ${data.length} records to Excel: ${filePath}`);
  }

  private static async exportToJSON(
    data: any[],
    filePath: string,
    options: ExportOptions
  ): Promise<void> {
    const exportData: any = {
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

    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
    logger.info(`Exported ${data.length} records to JSON: ${filePath}`);
  }

  private static flattenValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
}