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
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
  };
  createdAt: string;
  completedAt?: string;
  logs: JobLog[];
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