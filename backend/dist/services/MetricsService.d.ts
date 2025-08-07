export declare class MetricsService {
    static recordHttpRequest(method: string, route: string, status: number, duration: number): void;
    static recordEnrichment(provider: string, operation: string, success: boolean, credits: number): void;
    static updateActiveJobs(): Promise<void>;
    static getMetrics(): Promise<string>;
    static getHealthMetrics(): Promise<any>;
    private static getJobStatistics;
    private static getProviderStatistics;
}
//# sourceMappingURL=MetricsService.d.ts.map