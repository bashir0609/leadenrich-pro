// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Provider types
export interface Provider {
  id: number;
  name: string;
  displayName: string;
  category: string;
  features: ProviderFeature[];
}

export interface ProviderFeature {
  featureId: string;
  featureName: string;
  category: string;
  creditsPerRequest: number;
}

// Job types
export interface Job {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  displayStatus?: 'queued' | 'processing' | 'completed' | 'failed' | 'expired';
  jobType?: string;
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
  };
  createdAt: string;
  completedAt?: string;
  logs: JobLog[];
  results?: any[];
}

export interface JobLog {
  id: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

// Enrichment types
export interface EnrichmentRequest {
  operation: string;
  params: Record<string, any>;
  options?: {
    timeout?: number;
    retries?: number;
  };
}

export interface BulkEnrichmentRequest {
  operation: string;
  records: Record<string, any>[];
  options?: {
    webhookUrl?: string;
    columnMapping?: Record<string, string>;
  };
}

/**
 * Represents the structure of a single person record returned
 * by a provider's people search operation.
 */
export interface PersonSearchResult {
  companyDomain?: string;
  companyName?: string;
  country?: string;
  departments?: string[];
  firstName?: string;
  jobTitle?: string;
  lastName?: string;
  linkedInUrl?: string;
  seniorities?: string[];
}

/**
 * Represents the complete data object returned by a successful
 * people search API call from the backend.
 */
export interface PeopleSearchApiResponse {
  nextPageToken?: string;
  people?: PersonSearchResult[];
  total?: number;
}

/**
 * Represents the standardized, enriched data for a single person
 * after being processed by a provider.
 */
export interface PersonData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  companyDomain?: string;
  linkedinUrl?: string;
  location?: string;
  additionalData?: {
    seniorities?: string[];
    departments?: string[];
    [key: string]: any;
  };
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
    
    // Nested objects can be stored as-is
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
    
    [key: string]: any;
  };
}