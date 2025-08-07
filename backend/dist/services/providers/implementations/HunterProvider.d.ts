interface HunterResponse {
    success: boolean;
    data?: any;
    error?: string;
}
interface PersonParams {
    domain: string;
    firstName: string;
    lastName: string;
}
interface CompanyParams {
    domain: string;
}
export declare class HunterProvider {
    private config;
    private client;
    constructor();
    setApiKey(apiKey: string): void;
    private sleep;
    authenticate(): Promise<void>;
    validateConfig(): void;
    findEmail(params: PersonParams): Promise<HunterResponse>;
    searchDomain(params: CompanyParams): Promise<HunterResponse>;
    verifyEmail(email: string): Promise<HunterResponse>;
    bulkEnrichPeople(people: PersonParams[]): Promise<HunterResponse[]>;
    bulkEnrichCompanies(companies: CompanyParams[]): Promise<HunterResponse[]>;
}
export {};
//# sourceMappingURL=HunterProvider.d.ts.map