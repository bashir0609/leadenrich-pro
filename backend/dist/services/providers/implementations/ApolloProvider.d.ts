import { BaseProvider } from '../base/BaseProvider';
import { CustomError } from '@/types/errors';
import { ProviderOperation, ProviderRequest } from '@/types/providers';
export declare class ApolloProvider extends BaseProvider {
    authenticate(): Promise<void>;
    validateConfig(): void;
    mapErrorToStandard(error: any): CustomError;
    protected executeOperation(request: ProviderRequest): Promise<any>;
    private findEmail;
    private enrichPerson;
    private enrichCompany;
    private searchPeople;
    private searchCompanies;
    protected calculateCredits(operation: ProviderOperation): number;
}
