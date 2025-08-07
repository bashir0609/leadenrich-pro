import { BaseProvider } from '../base/BaseProvider';
import { CustomError } from '../../../types/errors';
import { ProviderOperation, ProviderRequest } from '../../../types/providers';
export declare class SurfeProvider extends BaseProvider {
    static statusCheckCounts: Map<string, number>;
    isAuthenticated: boolean;
    authenticate(userId?: string): Promise<void>;
    validateConfig(): void;
    mapErrorToStandard(error: any): CustomError;
    protected executeOperation(request: ProviderRequest): Promise<any>;
    private findEmail;
    private enrichPerson;
    private enrichCompany;
    private enrichCompaniesBulk;
    checkBulkEnrichmentStatus(enrichmentId: string): Promise<any>;
    private searchPeople;
    private searchCompanies;
    private findLookalike;
    protected calculateCredits(operation: ProviderOperation): number;
}
//# sourceMappingURL=SurfeProvider.d.ts.map