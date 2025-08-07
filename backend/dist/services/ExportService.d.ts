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
export declare class ExportService {
    static exportJobResults(jobId: string, options: ExportOptions): Promise<ExportResult>;
    private static exportToCSV;
    private static exportToExcel;
    private static exportToJSON;
    private static flattenValue;
}
//# sourceMappingURL=ExportService.d.ts.map