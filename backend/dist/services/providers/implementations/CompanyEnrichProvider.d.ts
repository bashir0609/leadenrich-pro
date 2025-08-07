import { BaseProvider } from '../base/BaseProvider';
import { CustomError } from '../../../types/errors';
import { ProviderOperation, ProviderRequest } from '../../../types/providers';
import { AxiosInstance } from 'axios';
export declare class CompanyEnrichProvider extends BaseProvider {
    protected client: AxiosInstance;
    constructor(config: any);
    authenticate(userId?: string): Promise<void>;
    validateConfig(): void;
    protected executeOperation(request: ProviderRequest): Promise<any>;
    private enrichCompany;
    private transformResponse;
    mapErrorToStandard(error: any): CustomError;
    calculateCredits(operation: ProviderOperation, params?: any): number;
    getSupportedOperations(): ProviderOperation[];
}
//# sourceMappingURL=CompanyEnrichProvider.d.ts.map