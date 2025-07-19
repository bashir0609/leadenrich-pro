import { AxiosInstance } from 'axios';
import Bottleneck from 'bottleneck';
import { CustomError } from '@/types/errors';
import { ProviderConfig, ProviderRequest, ProviderResponse, ProviderOperation } from '@/types/providers';
export declare abstract class BaseProvider {
    protected config: ProviderConfig;
    protected client: AxiosInstance;
    protected rateLimiter: Bottleneck;
    private encryptionKey;
    constructor(config: ProviderConfig);
    abstract authenticate(): Promise<void>;
    abstract validateConfig(): void;
    abstract mapErrorToStandard(error: any): CustomError;
    execute<T>(request: ProviderRequest): Promise<ProviderResponse<T>>;
    protected executeOperation(request: ProviderRequest): Promise<any>;
    protected encryptApiKey(apiKey: string): string;
    protected decryptApiKey(encryptedKey: string): string;
    protected setupInterceptors(): void;
    protected supportsOperation(operation: ProviderOperation): boolean;
    protected calculateCredits(operation: ProviderOperation): number;
    protected validateRequired(params: any, requiredFields: string[]): void;
    protected cleanEmail(email: string): string | null;
    protected cleanDomain(input: string): string | null;
    protected cleanPhone(phone: string): string | null;
    protected sleep(ms: number): Promise<void>;
    private generateRequestId;
    get name(): string;
    get id(): string;
    get category(): string;
    get isHealthy(): boolean;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    getCapabilities(): {
        operations: ProviderOperation[];
        rateLimits: ProviderConfig['rateLimits'];
        features: string[];
    };
}
