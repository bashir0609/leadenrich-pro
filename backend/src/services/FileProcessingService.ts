import fs from 'fs/promises';
import csv from 'csv-parser';
import { createReadStream } from 'fs';
import { logger } from '../utils/logger';
import { CustomError, ErrorCode } from '../types/errors';

export interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  preview: Record<string, any>[];
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  isRequired: boolean;
}

export class FileProcessingService {
  static async parseCSV(filePath: string): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
      const rows: Record<string, any>[] = [];
      let headers: string[] = [];
      
      createReadStream(filePath)
        .pipe(csv())
        .on('headers', (h) => {
          headers = h.map((header: string) => header.trim());
        })
        .on('data', (data) => {
          // Clean data
          const cleanedData: Record<string, any> = {};
          for (const [key, value] of Object.entries(data)) {
            cleanedData[key.trim()] = typeof value === 'string' ? value.trim() : value;
          }
          rows.push(cleanedData);
        })
        .on('end', () => {
          resolve({
            headers,
            rows,
            totalRows: rows.length,
            preview: rows.slice(0, 10),
          });
        })
        .on('error', (error) => {
          logger.error('CSV parsing error:', error);
          reject(
            new CustomError(
              ErrorCode.PROVIDER_ERROR,
              'Failed to parse CSV file',
              400,
              { error: error.message, stack: error.stack }
            )
          );
        });
    });
  }

  static async detectColumnTypes(data: ParsedData): Promise<Record<string, string>> {
    const columnTypes: Record<string, string> = {};
    
    for (const header of data.headers) {
      const samples = data.preview
        .map((row) => row[header])
        .filter((val) => val !== null && val !== undefined && val !== '');
      
      if (samples.length === 0) {
        columnTypes[header] = 'unknown';
        continue;
      }

      // Detect email
      if (samples.some((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))) {
        columnTypes[header] = 'email';
      }
      // Detect phone
      else if (samples.some((val) => /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/.test(val))) {
        columnTypes[header] = 'phone';
      }
      // Detect URL
      else if (samples.some((val) => /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(val))) {
        columnTypes[header] = 'url';
      }
      // Detect name
      else if (header.toLowerCase().includes('name') || header.toLowerCase().includes('first') || header.toLowerCase().includes('last')) {
        columnTypes[header] = 'name';
      }
      // Detect company
      else if (header.toLowerCase().includes('company') || header.toLowerCase().includes('organization')) {
        columnTypes[header] = 'company';
      }
      else {
        columnTypes[header] = 'text';
      }
    }
    
    return columnTypes;
  }

  static suggestColumnMapping(
    headers: string[],
    columnTypes: Record<string, string>,
    targetFields: string[]
  ): ColumnMapping[] {
    const suggestions: ColumnMapping[] = [];
    
    const fieldPatterns: Record<string, RegExp[]> = {
      email: [/email/i, /e-mail/i, /mail/i],
      firstName: [/first.*name/i, /fname/i, /given.*name/i],
      lastName: [/last.*name/i, /lname/i, /surname/i, /family.*name/i],
      fullName: [/full.*name/i, /name/i],
      company: [/company/i, /organization/i, /org/i, /employer/i],
      domain: [/domain/i, /website/i, /url/i, /site/i],
      phone: [/phone/i, /mobile/i, /cell/i, /telephone/i],
      linkedinUrl: [/linkedin/i, /profile/i],
    };

    for (const targetField of targetFields) {
      const patterns = fieldPatterns[targetField] || [];
      let bestMatch: string | null = null;
      let bestScore = 0;

      for (const header of headers) {
        // Check column type match
        let score = 0;
        if (columnTypes[header] === targetField) {
          score += 5;
        }

        // Check pattern match
        for (const pattern of patterns) {
          if (pattern.test(header)) {
            score += 3;
          }
        }

        // Check exact match
        if (header.toLowerCase() === targetField.toLowerCase()) {
          score += 10;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = header;
        }
      }

      if (bestMatch) {
        suggestions.push({
          sourceColumn: bestMatch,
          targetField,
          isRequired: ['email', 'company', 'domain'].includes(targetField),
        });
      }
    }

    return suggestions;
  }

  static async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.error('Failed to cleanup file:', error);
    }
  }
}