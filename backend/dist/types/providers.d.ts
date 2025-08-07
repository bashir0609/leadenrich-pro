export interface PeopleSearchParams {
    companyDomains?: string[];
    jobTitles?: string[];
}
export interface StandardizedPerson {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
}
export interface EnrichmentProvider {
    name: string;
    searchPeople(params: PeopleSearchParams): Promise<StandardizedPerson[]>;
}
export declare enum ProviderCategory {
    MAJOR_DATABASE = "major-database",
    EMAIL_FINDER = "email-finder",
    COMPANY_INTELLIGENCE = "company-intelligence",
    AI_RESEARCH = "ai-research",
    SOCIAL_ENRICHMENT = "social-enrichment",
    VERIFICATION = "verification"
}
export declare enum ProviderOperation {
    FIND_EMAIL = "find-email",
    ENRICH_PERSON = "enrich-person",
    ENRICH_COMPANY = "enrich-company",
    SEARCH_PEOPLE = "search-people",
    SEARCH_COMPANIES = "search-companies",
    FIND_LOOKALIKE = "find-lookalike"
}
export interface ProviderConfig {
    id: string;
    providerNumericId: number;
    name: string;
    displayName: string;
    category: ProviderCategory;
    baseUrl: string;
    apiKey?: string;
    rateLimits: {
        requestsPerSecond: number;
        burstSize: number;
        dailyQuota: number;
    };
    supportedOperations: ProviderOperation[];
    customConfig?: Record<string, any>;
}
export interface ProviderRequest<T = any> {
    operation: ProviderOperation;
    params: T;
    options?: {
        timeout?: number;
        retries?: number;
        webhookUrl?: string;
    };
}
export interface ProviderResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    metadata: {
        provider: string;
        operation: ProviderOperation;
        creditsUsed: number;
        responseTime: number;
        requestId: string;
    };
}
export interface EmailSearchParams {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    companyName?: string;
    companyDomain?: string;
    linkedinUrl?: string;
}
export interface PersonEnrichParams {
    email?: string;
    linkedinUrl?: string;
    firstName?: string;
    lastName?: string;
    companyDomain?: string;
    companyName?: string;
    include?: {
        email?: boolean;
        mobile?: boolean;
        linkedInUrl?: boolean;
        jobHistory?: boolean;
    };
}
export interface CompanyEnrichParams {
    domain?: string;
    companyName?: string;
    linkedinUrl?: string;
}
export interface EmailResult {
    email: string;
    confidence: number;
    sources: string[];
    verified: boolean;
}
export interface PersonData {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    title?: string;
    company?: string;
    linkedinUrl?: string;
    location?: string;
    additionalData?: Record<string, any>;
}
/**
 * Represents the standardized, enriched data for a single company
 * after being processed by a provider. This structure is based on
 * the detailed Surfe API response for company enrichment.
 */
export interface CompanyData {
    name: string;
    domain: string;
    description?: string;
    industry?: string;
    size?: string;
    location?: string;
    linkedinUrl?: string;
    technologies?: string[];
    additionalData?: {
        employeeCount?: number;
        founded?: string;
        revenue?: string;
        hqCountry?: string;
        subIndustry?: string;
        isPublic?: boolean;
        followersCountLinkedin?: number;
        phones?: string[];
        websites?: string[];
        digitalPresence?: {
            name?: string;
            url?: string;
        }[];
        fundingRounds?: {
            amount?: number;
            amountCurrency?: string;
            announcedDate?: string;
            leadInvestors?: string[];
            name?: string;
        }[];
        ipo?: {
            date?: string;
            sharePrice?: number;
            sharePriceCurrency?: string;
        };
        parentOrganization?: {
            name?: string;
            website?: string;
        };
        stocks?: {
            exchange?: string;
            ticker?: string;
        }[];
        [key: string]: any;
    };
}
//# sourceMappingURL=providers.d.ts.map