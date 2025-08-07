import { BaseProvider } from '../base/BaseProvider';
import { CustomError } from '../../../types/errors';
import { ProviderOperation, ProviderRequest } from '../../../types/providers';
interface ApolloPersonSearchParams {
    first_name?: string;
    last_name?: string;
    email?: string;
    organization_name?: string;
    domain?: string;
    person_titles?: string[];
    person_seniorities?: string[];
    person_departments?: string[];
    limit?: number;
    page?: number;
    filters?: {
        companies?: Array<{
            name?: string;
            domain?: string;
            industry?: string[];
            employee_count?: {
                min?: number;
                max?: number;
            };
            revenue?: {
                min?: number;
                max?: number;
            };
        }>;
        people?: Array<{
            first_name?: string;
            last_name?: string;
            email?: string;
            title?: string[];
            seniority?: string[];
            department?: string[];
        }>;
    };
    companies?: {
        domains?: string[];
        names?: string[];
        industries?: string[];
        employeeCount?: {
            min?: number;
            max?: number;
        };
    };
    people?: {
        jobTitles?: string[];
        seniorities?: string[];
        departments?: string[];
    };
}
interface ApolloCompanySearchParams {
    organization_name?: string;
    domain?: string;
    industry?: string[];
    employee_count_min?: number;
    employee_count_max?: number;
    revenue_min?: number;
    revenue_max?: number;
}
export declare class ApolloProvider extends BaseProvider {
    private isAuthenticated;
    private accountType;
    private cache;
    private rateLimits;
    constructor(config: any);
    authenticate(userId?: string): Promise<void>;
    validateConfig(): void;
    mapErrorToStandard(error: any): CustomError;
    protected executeOperation(request: ProviderRequest): Promise<any>;
    searchPeople(params: ApolloPersonSearchParams): Promise<{
        people: any[];
        total: number;
        nextPageToken?: string | null;
    }>;
    private findEmail;
    private enrichPerson;
    private enrichCompany;
    /**
     * Search for companies using Apollo API
     * @param params Search parameters including filters and pagination
     * @returns Object containing companies array, total count, and optional next page token
     */
    searchCompanies(params: ApolloCompanySearchParams & {
        limit?: number;
        filters?: {
            domains?: string[];
            industries?: string[];
            employeeCount?: {
                min?: number;
                max?: number;
            };
        };
    }): Promise<{
        companies: any[];
        total: number;
        nextPageToken?: string;
    }>;
    calculateCredits(operation: ProviderOperation): number;
    /**
     * Updates rate limits from API response headers if available
     */
    private updateRateLimitsFromHeaders;
}
export {};
//# sourceMappingURL=ApolloProvider.d.ts.map