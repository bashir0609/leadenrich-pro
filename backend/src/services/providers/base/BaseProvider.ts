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
    
    // Initialize HTTP client
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'LeadEnrich/1.0',
      },
    });

    // Initialize rate limiter
    this.rateLimiter = new Bottleneck({
      maxConcurrent: 1,
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
            onFailedAttempt: (error) => {
              logger.warn(`Provider ${this.config.name} attempt ${error.attemptNumber} failed:`, error);
            },
          }
        )
      );

      return {
        success: true,
        data: result,
        metadata: {
          provider: this.config.name,
          operation: request.operation,
          creditsUsed: this.calculateCredits(request.operation),
          responseTime: Date.now() - startTime,
          requestId,
        },
      };
    } catch (error) {
      const mappedError = this.mapErrorToStandard(error);
      
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
          responseTime: Date.now() - startTime,
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
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Provider ${this.config.name} request:`, {
          method: config.method,
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        logger.error(`Provider ${this.config.name} request error:`, error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Provider ${this.config.name} response:`, {
          status: response.status,
          headers: response.headers,
        });
        return response;
      },
      (error) => {
        logger.error(`Provider ${this.config.name} response error:`, error);
        return Promise.reject(error);
      }
    );
  }

  // Helper methods
  protected supportsOperation(operation: ProviderOperation): boolean {
    return this.config.supportedOperations.includes(operation);
  }

  protected calculateCredits(operation: ProviderOperation): number {
    // Default credit calculation - override in child classes
    const creditMap: Record<ProviderOperation, number> = {
      [ProviderOperation.FIND_EMAIL]: 1,
      [ProviderOperation.ENRICH_PERSON]: 2,
      [ProviderOperation.ENRICH_COMPANY]: 2,
      [ProviderOperation.SEARCH_PEOPLE]: 5,
      [ProviderOperation.SEARCH_COMPANIES]: 5,
      [ProviderOperation.FIND_LOOKALIKE]: 10,
    };
    return creditMap[operation] || 1;
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
}