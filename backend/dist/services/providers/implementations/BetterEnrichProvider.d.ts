import { BaseProvider } from '../base/BaseProvider';
import { CustomError } from '../../../types/errors';
import { ProviderOperation, ProviderRequest } from '../../../types/providers';
export declare enum BetterEnrichOperation {
    SINGLE_ENRICHMENT = "single-enrichment",
    WATERFALL_ENRICHMENT = "waterfall-enrichment",
    FIND_WORK_EMAIL = "find-work-email",
    FIND_EMAIL_FROM_LINKEDIN = "find-email-from-linkedin",
    FIND_EMAIL_FROM_SALESNAV = "find-email-from-salesnav",
    FIND_PERSONAL_EMAIL = "find-personal-email",
    FIND_MOBILE_PHONE = "find-mobile-phone",
    CHECK_GOOGLE_ADS = "check-google-ads",
    CHECK_FACEBOOK_ADS = "check-facebook-ads",
    CHECK_LINKEDIN_ADS = "check-linkedin-ads",
    FIND_SOCIAL_URLS = "find-social-urls",
    FIND_LINKEDIN_BY_EMAIL = "find-linkedin-by-email",
    FIND_LINKEDIN_BY_NAME = "find-linkedin-by-name",
    FIND_FACEBOOK_PROFILE = "find-facebook-profile",
    NORMALIZE_COMPANY = "normalize-company",
    NORMALIZE_PERSON = "normalize-person",
    CHECK_DNC_LIST = "check-dnc-list",
    CHECK_PHONE_STATUS = "check-phone-status",
    CHECK_ESP = "check-esp",
    CHECK_GENDER = "check-gender",
    FIND_WEBSITE = "find-website"
}
interface BetterEnrichFeature {
    id: BetterEnrichOperation;
    name: string;
    category: string;
    endpoint: string;
    method: 'GET' | 'POST';
    credits: number;
    description: string;
}
export declare class BetterEnrichProvider extends BaseProvider {
    private features;
    constructor(config: any);
    private initializeFeatures;
    authenticate(userId?: string): Promise<void>;
    validateConfig(): void;
    mapErrorToStandard(error: any): CustomError;
    protected executeOperation(request: ProviderRequest): Promise<any>;
    private handleStandardOperation;
    private executeFeature;
    private transformResponse;
    getAvailableFeatures(): BetterEnrichFeature[];
    getFeaturesByCategory(category: string): BetterEnrichFeature[];
    calculateCredits(operation: ProviderOperation | string): number;
}
export {};
//# sourceMappingURL=BetterEnrichProvider.d.ts.map