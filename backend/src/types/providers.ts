// backend/src/types/providers.ts
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

// This will be our universal interface for all providers
export interface EnrichmentProvider {
  name: string;
  searchPeople(params: PeopleSearchParams): Promise<StandardizedPerson[]>;
  // We will add more methods here later (enrich, company search, etc.)
}

export enum ProviderCategory {
  MAJOR_DATABASE = 'major-database',
  EMAIL_FINDER = 'email-finder',
  COMPANY_INTELLIGENCE = 'company-intelligence',
  AI_RESEARCH = 'ai-research',
  SOCIAL_ENRICHMENT = 'social-enrichment',
  VERIFICATION = 'verification',
}

export enum ProviderOperation {
  FIND_EMAIL = 'find-email',
  ENRICH_PERSON = 'enrich-person',
  ENRICH_COMPANY = 'enrich-company',
  SEARCH_PEOPLE = 'search-people',
  SEARCH_COMPANIES = 'search-companies',
  FIND_LOOKALIKE = 'find-lookalike',
}

export interface ProviderConfig {
  id: string; // This is the string name, e.g., "surfe"
  providerNumericId: number; // <<< ADD THIS LINE for the database ID
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
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  title?: string;
  jobTitle?: string;
  company?: string;
  companyName?: string;
  companyDomain?: string;
  linkedinUrl?: string;
  linkedInUrl?: string;
  linkedin_url?: string;
  location?: string;
  country?: string;
  emails?: Array<{ email: string; validationStatus?: string }> | string[];
  mobilePhones?: Array<{ mobilePhone: string; confidenceScore?: number }> | string[];
  seniorities?: string[];
  departments?: string[];
  jobHistory?: any[];
  additionalData?: {
    seniorities?: string[];
    departments?: string[];
    emailValidation?: string;
    phoneConfidence?: number;
    country?: string;
    jobHistory?: any[];
    rawResponse?: any;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Represents the standardized, enriched data for a single company
 * after being processed by a provider. This structure is based on
 * the detailed Surfe API response for company enrichment.
 */
export interface CompanyData {
  // Core, most important fields
  name: string;
  domain: string;
  description?: string;
  industry?: string;
  size?: string; // Standardized as a string range (e.g., "51-200")
  location?: string; // Standardized as the primary HQ address string
  linkedinUrl?: string;
  
  // Keywords/Technologies, standardized under one name
  technologies?: string[];

  // All other detailed, provider-specific data goes into additionalData
  additionalData?: {
    // From the Surfe response
    employeeCount?: number; // The raw number
    founded?: string;
    revenue?: string; // The raw string range
    hqCountry?: string;
    subIndustry?: string;
    isPublic?: boolean;
    followersCountLinkedin?: number;
    phones?: string[];
    websites?: string[];
    
    // Nested objects can be stored as-is or typed out
    digitalPresence?: { name?: string; url?: string; }[];
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
    
    // Any other fields from other providers can also go here
    [key: string]: any;
  };
}