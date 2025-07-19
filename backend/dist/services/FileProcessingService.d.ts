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
export declare class FileProcessingService {
    static parseCSV(filePath: string): Promise<ParsedData>;
    static detectColumnTypes(data: ParsedData): Promise<Record<string, string>>;
    static suggestColumnMapping(headers: string[], columnTypes: Record<string, string>, targetFields: string[]): ColumnMapping[];
    static cleanupFile(filePath: string): Promise<void>;
}
