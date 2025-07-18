import axios, { AxiosInstance } from 'axios';
import Bottleneck from 'bottleneck';
import pRetry from 'p-retry';
import crypto from 'crypto-js';
import { logger } from '@/utils/logger';
import { CustomError, ErrorCode } from '@/types/errors';
import {
  ProviderConfig,
  ProviderRequest,
  ProviderResponse,
  ProviderOperation,
} from '@/types/providers';

export abstract class BaseProvider {
  protected config: ProviderConfig;
  protected client: AxiosInstance;
  protected rateLimiter: Bottleneck;
  private encryptionKey: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-this';
    
    // Initialize HTTP client with enhanced configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.customConfig?.timeout || 30000,
      headers: {
        'User-Agent': 'LeadEnrich/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Initialize rate limiter with provider-specific settings
    this.rateLimiter = new Bottleneck({
      maxConcurrent: config.customConfig?.maxConcurrent || 1,
      minTime: 1000 / config.rateLimits.requestsPerSecond,
      reservoir: config.rateLimits.burstSize,
      reservoirRefreshAmount: config.rateLimits.burstSize,
      reservoirRefreshInterval: 60 * 1000, // 1 minute
    });

    // Set up interceptors
    this.setupInterceptors();
  }

  // Abstract methods that each provider must implement
  abstract authenticate(): Promise<void>;
  abstract validateConfig(): void;
  abstract mapErrorToStandard(error: any): CustomError;

  // Public API
  async execute<T>(request: ProviderRequest): Promise<ProviderResponse<T>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Validate operation is supported
      if (!this.supportsOperation(request.operation)) {
        throw new CustomError(
          ErrorCode.OPERATION_FAILED,
          `Provider ${this.config.name} does not support operation ${request.operation}`,
          400
        );
      }

      // Execute with rate limiting and retry
      const result = await this.rateLimiter.schedule(() =>
        pRetry(
          () => this.executeOperation(request),
          {
            retries: request.options?.retries || 3,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 10000,
            onFailedAttempt: (error) => {
              logger.warn(`Provider ${this.config.name} attempt ${error.attemptNumber} failed:`, {
                error: error.message,
                operation: request.operation,
                retriesLeft: error.retriesLeft,
              });
            },
          }
        )
      );

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          provider: this.config.name,
          operation: request.operation,
          creditsUsed: this.calculateCredits(request.operation),
          responseTime,
          requestId,
        },
      };
    } catch (error) {
      const mappedError = this.mapErrorToStandard(error);
      const responseTime = Date.now() - startTime;
      
      logger.error(`Provider ${this.config.name} operation failed:`, {
        operation: request.operation,
        error: mappedError.message,
        requestId,
        responseTime,
      });
      
      return {
        success: false,
        error: {
          code: mappedError.code,
          message: mappedError.message,
          details: mappedError.details,
        },
        metadata: {
          provider: this.config.name,
          operation: request.operation,
          creditsUsed: 0,
          responseTime,
          requestId,
        },
      };
    }
  }

  // Protected methods for use by child classes
  protected async executeOperation(request: ProviderRequest): Promise<any> {
    // Default implementation - override in child classes
    throw new CustomError(
      ErrorCode.OPERATION_FAILED,
      'Operation not implemented',
      501
    );
  }

  protected encryptApiKey(apiKey: string): string {
    return crypto.AES.encrypt(apiKey, this.encryptionKey).toString();
  }

  protected decryptApiKey(encryptedKey: string): string {
    const bytes = crypto.AES.decrypt(encryptedKey, this.encryptionKey);
    return bytes.toString(crypto.enc.Utf8);
  }

  protected setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        const requestId = this.generateRequestId();
        (config as any).metadata = { requestId, startTime: Date.now() };
        
        logger.debug(`Provider ${this.config.name} request:`, {
          requestId,
          method: config.method?.toUpperCase(),
          url: config.url,
          hasData: !!config.data,
        });
        
        return config;
      },
      (error) => {
        logger.error(`Provider ${this.config.name} request error:`, error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - ((response.config as any).metadata?.startTime || 0);
        
        logger.debug(`Provider ${this.config.name} response:`, {
          requestId: (response.config as any).metadata?.requestId,
          status: response.status,
          duration,
          hasData: !!response.data,
        });
        
        return response;
      },
      (error) => {
        const duration = error.config?.metadata ? 
          Date.now() - (error.config as any).metadata.startTime : 0;
          
        logger.error(`Provider ${this.config.name} response error:`, {
          requestId: (error.config as any).metadata?.requestId,
          status: error.response?.status,
          duration,
          message: error.message,
        });
        
        return Promise.reject(error);
      }
    );
  }

  // Enhanced helper methods
  protected supportsOperation(operation: ProviderOperation): boolean {
    return this.config.supportedOperations.includes(operation);
  }

  protected calculateCredits(operation: ProviderOperation): number {
    // Default credit calculation - override in child classes for specific costs
    const creditMap: Record<ProviderOperation, number> = {
      [ProviderOperation.FIND_EMAIL]: 1,
      [ProviderOperation.ENRICH_PERSON]: 2,
      [ProviderOperation.ENRICH_COMPANY]: 2,
      [ProviderOperation.SEARCH_PEOPLE]: 5,
      [ProviderOperation.SEARCH_COMPANIES]: 5,
      [ProviderOperation.FIND_LOOKALIKE]: 10,
      [ProviderOperation.CHECK_ENRICHMENT_STATUS]: 0, // No cost for status check
    };
    return creditMap[operation] || 1;
  }

  // Enhanced utilities
  protected validateRequired(params: any, requiredFields: string[]): void {
    const missing = requiredFields.filter(field => 
      !params[field] || 
      (typeof params[field] === 'string' && params[field].trim() === '')
    );
    
    if (missing.length > 0) {
      throw new CustomError(
        ErrorCode.INVALID_INPUT,
        `Missing required fields: ${missing.join(', ')}`,
        400,
        { missingFields: missing }
      );
    }
  }

  protected cleanEmail(email: string): string | null {
    if (!email) return null;
    const cleaned = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(cleaned) ? cleaned : null;
  }

  // FIXED: Added proper null checks
  protected cleanDomain(input: string): string | null {
    if (!input) {
      return null;
    }
    
    let urlString = input.trim().toLowerCase();
    
    // The URL constructor requires a protocol. Add one if it's missing.
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = 'https://' + urlString;
    }
    
    try {
      const url = new URL(urlString);
      // The `hostname` property gives us exactly what we need (domain + subdomains).
      let domain = url.hostname;
      // We can still remove 'www.' if desired.
      domain = domain.replace(/^www\./, '');
      
      // Basic validation to ensure it's a proper domain
      const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
      return domainRegex.test(domain) ? domain : null;
      
    } catch (error) {
      // If new URL() fails, it's not a valid URL/domain.
      return null;
    }
  }

  protected cleanPhone(phone: string): string | null {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    return (cleaned.length >= 10 && cleaned.length <= 15) ? cleaned : null;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `${this.config.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  get name(): string {
    return this.config.name;
  }

  get id(): string {
    return this.config.id;
  }

  get category(): string {
    return this.config.category;
  }

  get isHealthy(): boolean {
    // Can be enhanced to check actual health
    return true;
  }

  // Health check method
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      await this.authenticate();
      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // FIXED: Proper typing for getCapabilities return type
  getCapabilities(): {
    operations: ProviderOperation[];
    rateLimits: ProviderConfig['rateLimits'];
    features: string[];
  } {
    return {
      operations: this.config.supportedOperations,
      rateLimits: this.config.rateLimits,
      features: Object.keys(this.config.customConfig || {}),
    };
  }
}