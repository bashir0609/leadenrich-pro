export interface EnrichmentJobData {
    jobId: string;
    providerId: string;
    operation: string;
    records: any[];
    options?: {
        webhookUrl?: string;
        columnMapping?: Record<string, string>;
    };
}
export declare class QueueService {
    static createEnrichmentJob(data: Omit<EnrichmentJobData, 'jobId'>): Promise<string>;
    static getJobStatus(jobId: string): Promise<any>;
}
