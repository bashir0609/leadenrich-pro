# Phase 2: Provider System & Queue Implementation

## 📋 Prerequisites
- ✅ Phase 1 completed successfully
- ✅ Backend server running without errors
- ✅ Database migrations applied
- ✅ All tests passing

## 🎯 Phase 2 Goals
1. Implement universal provider interface
2. Create provider registry and factory
3. Implement Surfe provider as first example
4. Set up BullMQ for async operations
5. Create job processing system
6. Implement rate limiting per provider

---

## 📦 Step 2.1: Install Additional Dependencies

```bash
cd backend
npm install --save-exact \
  bullmq@4.11.1 \
  ioredis@5.3.2 \
  axios@1.4.0 \
  crypto-js@4.1.1 \
  p-retry@5.1.2 \
  bottleneck@2.19.5
```

## 🏗️ Step 2.2: Provider Base Architecture

Create `backend/src/types/providers.ts`:
```typescript
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
  id: string;
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

export interface CompanyData {
  name: string;
  domain: string;
  description?: string;
  industry?: string;
  size?: string;
  location?: string;
  linkedinUrl?: string;
  technologies?: string[];
  additionalData?: Record<string, any>;
}
```

## 🔧 Step 2.3: Base Provider Implementation

Create `backend/src/services/providers/base/BaseProvider.ts`:
```typescript
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
```

## 🏭 Step 2.4: Provider Registry & Factory

Create `backend/src/services/providers/ProviderRegistry.ts`:
```typescript
import { BaseProvider } from './base/BaseProvider';
import { ProviderConfig } from '@/types/providers';
import { CustomError, ErrorCode } from '@/types/errors';
import { logger } from '@/utils/logger';

export class ProviderRegistry {
  private static providers: Map<string, typeof BaseProvider> = new Map();
  private static instances: Map<string, BaseProvider> = new Map();

  static register(providerId: string, providerClass: typeof BaseProvider): void {
    if (this.providers.has(providerId)) {
      logger.warn(`Provider ${providerId} is already registered. Overwriting.`);
    }
    this.providers.set(providerId, providerClass);
    logger.info(`Provider ${providerId} registered successfully`);
  }

  static async getInstance(
    providerId: string,
    config: ProviderConfig
  ): Promise<BaseProvider> {
    // Check if instance already exists
    if (this.instances.has(providerId)) {
      return this.instances.get(providerId)!;
    }

    // Get provider class
    const ProviderClass = this.providers.get(providerId);
    if (!ProviderClass) {
      throw new CustomError(
        ErrorCode.PROVIDER_NOT_FOUND,
        `Provider ${providerId} is not registered`,
        404
      );
    }

    // Create new instance
    const instance = new ProviderClass(config) as BaseProvider;
    
    // Validate and authenticate
    instance.validateConfig();
    await instance.authenticate();

    // Cache instance
    this.instances.set(providerId, instance);
    
    return instance;
  }

  static getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  static clearInstances(): void {
    this.instances.clear();
  }
}
```

Create `backend/src/services/providers/ProviderFactory.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import { ProviderRegistry } from './ProviderRegistry';
import { BaseProvider } from './base/BaseProvider';
import { ProviderConfig, ProviderCategory } from '@/types/providers';
import { CustomError, ErrorCode } from '@/types/errors';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export class ProviderFactory {
  static async getProvider(providerId: string): Promise<BaseProvider> {
    try {
      // Fetch provider config from database
      const providerData = await prisma.provider.findUnique({
        where: { name: providerId },
        include: { features: true },
      });

      if (!providerData || !providerData.isActive) {
        throw new CustomError(
          ErrorCode.PROVIDER_NOT_FOUND,
          `Provider ${providerId} not found or inactive`,
          404
        );
      }

      // Build provider config
      const config: ProviderConfig = {
        id: providerData.name,
        name: providerData.name,
        displayName: providerData.displayName,
        category: providerData.category as ProviderCategory,
        baseUrl: providerData.baseUrl,
        apiKey: providerData.apiKeyEncrypted || undefined,
        rateLimits: {
          requestsPerSecond: providerData.rateLimit,
          burstSize: providerData.rateLimit * 2,
          dailyQuota: providerData.dailyQuota,
        },
        supportedOperations: [], // Will be populated from features
        customConfig: providerData.configuration as Record<string, any>,
      };

      // Get provider instance
      const provider = await ProviderRegistry.getInstance(providerId, config);
      
      logger.info(`Provider ${providerId} instance created successfully`);
      return provider;
    } catch (error) {
      logger.error(`Failed to create provider ${providerId}:`, error);
      throw error;
    }
  }

  static async getProvidersByCategory(
    category: ProviderCategory
  ): Promise<BaseProvider[]> {
    const providers = await prisma.provider.findMany({
      where: {
        category,
        isActive: true,
      },
    });

    const instances = await Promise.all(
      providers.map((p) => this.getProvider(p.name))
    );

    return instances.filter(Boolean);
  }
}
```

## 🔌 Step 2.5: Implement Surfe Provider

Create `backend/src/services/providers/implementations/SurfeProvider.ts`:
```typescript
import { BaseProvider } from '../base/BaseProvider';
import { CustomError, ErrorCode } from '@/types/errors';
import {
  ProviderOperation,
  ProviderRequest,
  EmailSearchParams,
  PersonEnrichParams,
  CompanyEnrichParams,
  EmailResult,
  PersonData,
  CompanyData,
} from '@/types/providers';

interface SurfeApiError {
  code: string;
  message: string;
  details?: any;
}

export class SurfeProvider extends BaseProvider {
  async authenticate(): Promise<void> {
    if (!this.config.apiKey) {
      throw new CustomError(
        ErrorCode.AUTHENTICATION_ERROR,
        'Surfe API key not configured',
        401
      );
    }

    // Decrypt API key and set auth header
    const apiKey = this.decryptApiKey(this.config.apiKey);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
  }

  validateConfig(): void {
    if (!this.config.baseUrl) {
      throw new CustomError(
        ErrorCode.VALIDATION_ERROR,
        'Surfe base URL not configured',
        400
      );
    }
  }

  mapErrorToStandard(error: any): CustomError {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as SurfeApiError;

      switch (status) {
        case 401:
          return new CustomError(
            ErrorCode.AUTHENTICATION_ERROR,
            'Surfe authentication failed',
            401,
            data
          );
        case 429:
          return new CustomError(
            ErrorCode.PROVIDER_RATE_LIMIT,
            'Surfe rate limit exceeded',
            429,
            data
          );
        case 400:
          return new CustomError(
            ErrorCode.INVALID_INPUT,
            data.message || 'Invalid request to Surfe',
            400,
            data
          );
        default:
          return new CustomError(
            ErrorCode.PROVIDER_ERROR,
            `Surfe API error: ${data.message || 'Unknown error'}`,
            status,
            data
          );
      }
    }

    return new CustomError(
      ErrorCode.PROVIDER_ERROR,
      'Surfe provider error',
      500,
      error
    );
  }

  protected async executeOperation(request: ProviderRequest): Promise<any> {
    switch (request.operation) {
      case ProviderOperation.FIND_EMAIL:
        return this.findEmail(request.params as EmailSearchParams);
      case ProviderOperation.ENRICH_PERSON:
        return this.enrichPerson(request.params as PersonEnrichParams);
      case ProviderOperation.ENRICH_COMPANY:
        return this.enrichCompany(request.params as CompanyEnrichParams);
      case ProviderOperation.SEARCH_PEOPLE:
        return this.searchPeople(request.params);
      case ProviderOperation.SEARCH_COMPANIES:
        return this.searchCompanies(request.params);
      default:
        throw new CustomError(
          ErrorCode.OPERATION_FAILED,
          `Operation ${request.operation} not implemented for Surfe`,
          501
        );
    }
  }

  private async findEmail(params: EmailSearchParams): Promise<EmailResult> {
    // Note: Surfe doesn't have direct email finder, this would use people search
    const searchResult = await this.searchPeople({
      firstName: params.firstName,
      lastName: params.lastName,
      companies: params.companyDomain ? { domains: [params.companyDomain] } : undefined,
    });

    if (searchResult.data && searchResult.data.length > 0) {
      const person = searchResult.data[0];
      return {
        email: person.email || '',
        confidence: person.email ? 0.9 : 0,
        sources: ['surfe'],
        verified: false,
      };
    }

    throw new CustomError(
      ErrorCode.NOT_FOUND,
      'Email not found',
      404
    );
  }

  private async enrichPerson(params: PersonEnrichParams): Promise<PersonData> {
    const response = await this.client.post('/v2/people/enrich', {
      email: params.email,
      linkedInUrl: params.linkedinUrl,
      include: ['email', 'mobile', 'linkedInUrl', 'jobTitle'],
    });

    const data = response.data;
    
    return {
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: data.fullName,
      email: data.email,
      phone: data.mobile,
      title: data.jobTitle,
      company: data.company?.name,
      linkedinUrl: data.linkedInUrl,
      location: data.location,
      additionalData: {
        seniority: data.seniority,
        department: data.department,
      },
    };
  }

  private async enrichCompany(params: CompanyEnrichParams): Promise<CompanyData> {
    const response = await this.client.post('/v2/companies/enrich', {
      domain: params.domain,
      companyName: params.companyName,
    });

    const data = response.data;
    
    return {
      name: data.name,
      domain: data.domain,
      description: data.description,
      industry: data.industry,
      size: data.employeeRange,
      location: data.location,
      linkedinUrl: data.linkedInUrl,
      technologies: data.technologies || [],
      additionalData: {
        founded: data.founded,
        revenue: data.revenue,
        fundingStage: data.fundingStage,
      },
    };
  }

  private async searchPeople(params: any): Promise<any> {
    const response = await this.client.post('/v2/people/search', params);
    return response.data;
  }

  private async searchCompanies(params: any): Promise<any> {
    const response = await this.client.post('/v2/companies/search', params);
    return response.data;
  }
}

// Register the provider
import { ProviderRegistry } from '../ProviderRegistry';
ProviderRegistry.register('surfe', SurfeProvider);
```

## 📤 Step 2.6: Queue System Implementation

Create `backend/src/config/queue.ts`:
```typescript
import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '@/utils/logger';

// Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Queue definitions
export const enrichmentQueue = new Queue('enrichment', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // 1 hour
      count: 100,
    },
    removeOnFail: {
      age: 24 * 3600, // 24 hours
    },
  },
});

export const exportQueue = new Queue('export', { connection });

// Queue events for monitoring
export const enrichmentQueueEvents = new QueueEvents('enrichment', { connection });

enrichmentQueueEvents.on('completed', ({ jobId, returnvalue }) => {
  logger.info(`Job ${jobId} completed`);
});

enrichmentQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Job ${jobId} failed: ${failedReason}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await enrichmentQueue.close();
  await exportQueue.close();
  connection.disconnect();
});
```

Create `backend/src/services/QueueService.ts`:
```typescript
import { enrichmentQueue } from '@/config/queue';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface EnrichmentJobData {
  jobId: string;
  providerId: string;
  operation: string;
  records: any[];
  options?: {
    webhookUrl?: string;
    columnMapping?: Record<string, string>;
  };
}

export class QueueService {
  static async createEnrichmentJob(
    data: Omit<EnrichmentJobData, 'jobId'>
  ): Promise<string> {
    const jobId = uuidv4();

    // Create job record in database
    await prisma.enrichmentJob.create({
      data: {
        id: jobId,
        providerId: parseInt(data.providerId), // Assuming provider ID from DB
        jobType: data.operation,
        status: 'queued',
        totalRecords: data.records.length,
        inputData: data.records,
        configuration: data.options,
      },
    });

    // Add to queue
    await enrichmentQueue.add(
      'process-enrichment',
      {
        ...data,
        jobId,
      },
      {
        jobId,
        priority: 1,
      }
    );

    logger.info(`Enrichment job ${jobId} created with ${data.records.length} records`);
    return jobId;
  }

  static async getJobStatus(jobId: string): Promise<any> {
    const job = await enrichmentQueue.getJob(jobId);
    const dbJob = await prisma.enrichmentJob.findUnique({
      where: { id: jobId },
      include: { logs: true },
    });

    if (!job || !dbJob) {
      return null;
    }

    return {
      id: jobId,
      status: dbJob.status,
      progress: {
        total: dbJob.totalRecords,
        processed: dbJob.processedRecords,
        successful: dbJob.successfulRecords,
        failed: dbJob.failedRecords,
      },
      createdAt: dbJob.createdAt,
      completedAt: dbJob.completedAt,
      logs: dbJob.logs,
    };
  }
}
```

## 🏃 Step 2.7: Worker Implementation

Create `backend/src/workers/enrichmentWorker.ts`:
```typescript
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { ProviderFactory } from '@/services/providers/ProviderFactory';
import { logger } from '@/utils/logger';
import { EnrichmentJobData } from '@/services/QueueService';

const prisma = new PrismaClient();

export const enrichmentWorker = new Worker(
  'enrichment',
  async (job: Job<EnrichmentJobData>) => {
    const { jobId, providerId, operation, records } = job.data;
    
    logger.info(`Processing enrichment job ${jobId}`);
    
    try {
      // Update job status
      await prisma.enrichmentJob.update({
        where: { id: jobId },
        data: {
          status: 'processing',
          startedAt: new Date(),
        },
      });

      // Get provider
      const provider = await ProviderFactory.getProvider(providerId);
      
      // Process records
      let processed = 0;
      let successful = 0;
      let failed = 0;
      const results = [];

      for (const record of records) {
        try {
          // Update progress
          await job.updateProgress({
            processed,
            total: records.length,
          });

          // Execute provider operation
          const result = await provider.execute({
            operation: operation as any,
            params: record,
          });

          if (result.success) {
            successful++;
            results.push(result.data);
          } else {
            failed++;
            await logJobError(jobId, `Failed to process record: ${result.error?.message}`);
          }
        } catch (error) {
          failed++;
          await logJobError(jobId, `Error processing record: ${error}`);
        }

        processed++;
      }

      // Update final status
      await prisma.enrichmentJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          processedRecords: processed,
          successfulRecords: successful,
          failedRecords: failed,
          completedAt: new Date(),
        },
      });

      return {
        jobId,
        processed,
        successful,
        failed,
        results,
      };
    } catch (error) {
      logger.error(`Job ${jobId} failed:`, error);
      
      await prisma.enrichmentJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorDetails: { error: String(error) },
        },
      });
      
      throw error;
    }
  },
  {
    connection: {
      host: 'localhost',
      port: 6379,
    },
    concurrency: 5,
  }
);

async function logJobError(jobId: string, message: string): Promise<void> {
  await prisma.jobLog.create({
    data: {
      jobId,
      level: 'error',
      message,
    },
  });
}

// Error handling
enrichmentWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed with error:`, err);
});

enrichmentWorker.on

## 🌐 Step 2.8: Provider API Routes

Create `backend/src/routes/providers.ts`:
```typescript
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '@/utils/validation';
import { ProviderFactory } from '@/services/providers/ProviderFactory';
import { QueueService } from '@/services/QueueService';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all active providers
router.get('/', async (req, res, next) => {
  try {
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        category: true,
        features: {
          select: {
            featureId: true,
            featureName: true,
            category: true,
            creditsPerRequest: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    next(error);
  }
});

// Test provider connection
router.post('/:providerId/test', async (req, res, next) => {
  try {
    const { providerId } = req.params;
    
    const provider = await ProviderFactory.getProvider(providerId);
    
    // Try a simple operation to test connection
    const result = await provider.execute({
      operation: 'test' as any,
      params: {},
    });

    res.json({
      success: true,
      data: {
        provider: providerId,
        connected: result.success,
        message: result.success ? 'Provider connected successfully' : 'Provider connection failed',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Execute single operation
const executeSchema = z.object({
  operation: z.string(),
  params: z.record(z.any()),
  options: z.object({
    timeout: z.number().optional(),
    retries: z.number().optional(),
  }).optional(),
});

router.post(
  '/:providerId/execute',
  validate(executeSchema),
  async (req, res, next) => {
    try {
      const { providerId } = req.params;
      const { operation, params, options } = req.body;

      const provider = await ProviderFactory.getProvider(providerId);
      const result = await provider.execute({
        operation,
        params,
        options,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Create bulk enrichment job
const bulkEnrichSchema = z.object({
  operation: z.string(),
  records: z.array(z.record(z.any())).min(1).max(10000),
  options: z.object({
    webhookUrl: z.string().url().optional(),
    columnMapping: z.record(z.string()).optional(),
  }).optional(),
});

router.post(
  '/:providerId/bulk',
  validate(bulkEnrichSchema),
  async (req, res, next) => {
    try {
      const { providerId } = req.params;
      const { operation, records, options } = req.body;

      const jobId = await QueueService.createEnrichmentJob({
        providerId,
        operation,
        records,
        options,
      });

      res.status(202).json({
        success: true,
        data: {
          jobId,
          status: 'queued',
          totalRecords: records.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as providersRouter };
```

Create `backend/src/routes/jobs.ts`:
```typescript
import { Router } from 'express';
import { QueueService } from '@/services/QueueService';
import { NotFoundError } from '@/types/errors';

const router = Router();

// Get job status
router.get('/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    const status = await QueueService.getJobStatus(jobId);
    
    if (!status) {
      throw NotFoundError(`Job ${jobId} not found`);
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

// Get job logs
router.get('/:jobId/logs', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    const status = await QueueService.getJobStatus(jobId);
    
    if (!status) {
      throw NotFoundError(`Job ${jobId} not found`);
    }

    res.json({
      success: true,
      data: status.logs || [],
    });
  } catch (error) {
    next(error);
  }
});

export { router as jobsRouter };
```

## 🔄 Step 2.9: Update Main App

Update `backend/src/app.ts` to include new routes:
```typescript
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { healthRouter } from './routes/health';
import { providersRouter } from './routes/providers';
import { jobsRouter } from './routes/jobs';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Routes
app.use('/health', healthRouter);
app.use('/api/providers', providersRouter);
app.use('/api/jobs', jobsRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Import worker to start it
import './workers/enrichmentWorker';

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
```

## 🌱 Step 2.10: Seed Initial Provider Data

Create `backend/prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto-js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Encryption key from env
  const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-this';

  // Seed Surfe provider
  const surfe = await prisma.provider.upsert({
    where: { name: 'surfe' },
    update: {},
    create: {
      name: 'surfe',
      displayName: 'Surfe',
      category: 'major-database',
      baseUrl: 'https://api.surfe.com',
      apiKeyEncrypted: process.env.SURFE_API_KEY 
        ? crypto.AES.encrypt(process.env.SURFE_API_KEY, encryptionKey).toString()
        : null,
      rateLimit: 10,
      dailyQuota: 2000,
      isActive: true,
      configuration: {
        version: 'v2',
        features: ['people', 'companies', 'enrichment'],
      },
    },
  });

  // Seed Surfe features
  const surfeFeatures = [
    {
      featureId: 'people-search',
      featureName: 'People Search',
      category: 'search',
      endpoint: '/v2/people/search',
      httpMethod: 'POST',
      creditsPerRequest: 5,
    },
    {
      featureId: 'people-enrich',
      featureName: 'People Enrichment',
      category: 'enrichment',
      endpoint: '/v2/people/enrich',
      httpMethod: 'POST',
      creditsPerRequest: 2,
    },
    {
      featureId: 'company-search',
      featureName: 'Company Search',
      category: 'search',
      endpoint: '/v2/companies/search',
      httpMethod: 'POST',
      creditsPerRequest: 5,
    },
    {
      featureId: 'company-enrich',
      featureName: 'Company Enrichment',
      category: 'enrichment',
      endpoint: '/v2/companies/enrich',
      httpMethod: 'POST',
      creditsPerRequest: 2,
    },
    {
      featureId: 'company-lookalike',
      featureName: 'Company Lookalike',
      category: 'lookalike',
      endpoint: '/v2/companies/lookalike',
      httpMethod: 'POST',
      creditsPerRequest: 10,
    },
  ];

  for (const feature of surfeFeatures) {
    await prisma.providerFeature.upsert({
      where: {
        providerId_featureId: {
          providerId: surfe.id,
          featureId: feature.featureId,
        },
      },
      update: {},
      create: {
        ...feature,
        providerId: surfe.id,
        isActive: true,
      },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Update `backend/package.json` scripts:
```json
{
  "scripts": {
    // ... existing scripts ...
    "db:seed": "ts-node prisma/seed.ts"
  }
}
```

## 🧪 Step 2.11: Create Provider Tests

Create `backend/tests/providers.test.ts`:
```typescript
import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Provider Endpoints', () => {
  beforeAll(async () => {
    // Ensure test provider exists
    await prisma.provider.create({
      data: {
        name: 'test-provider',
        displayName: 'Test Provider',
        category: 'email-finder',
        baseUrl: 'https://api.test.com',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.provider.delete({
      where: { name: 'test-provider' },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/providers', () => {
    it('should return list of active providers', async () => {
      const response = await request(app)
        .get('/api/providers')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/providers/:id/execute', () => {
    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/providers/test-provider/execute')
        .send({
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should handle non-existent provider', async () => {
      const response = await request(app)
        .post('/api/providers/non-existent/execute')
        .send({
          operation: 'find-email',
          params: { email: 'test@example.com' },
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('PROVIDER_NOT_FOUND');
    });
  });
});
```

## 🚀 Step 2.12: Run and Verify

1. **Run database seed**:
```bash
npm run db:seed
```

2. **Start the server with worker**:
```bash
npm run dev
```

3. **Test provider endpoints**:
```bash
# Get all providers
curl http://localhost:3001/api/providers

# Test provider connection
curl -X POST http://localhost:3001/api/providers/surfe/test

# Execute single operation (if you have a Surfe API key)
curl -X POST http://localhost:3001/api/providers/surfe/execute \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "enrich-person",
    "params": {
      "email": "test@example.com"
    }
  }'

# Create bulk job
curl -X POST http://localhost:3001/api/providers/surfe/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "enrich-person",
    "records": [
      {"email": "test1@example.com"},
      {"email": "test2@example.com"}
    ]
  }'
```

4. **Run tests**:
```bash
npm test
```

## ✅ Phase 2 Completion Checklist

- [ ] Provider base architecture implemented
- [ ] Provider registry and factory working
- [ ] Surfe provider implemented
- [ ] Queue system operational
- [ ] Worker processing jobs
- [ ] API routes for providers
- [ ] Rate limiting per provider
- [ ] Tests passing
- [ ] No TypeScript errors

## 🎯 Git Checkpoint

```bash
git add .
git commit -m "Complete Phase 2: Provider system with Surfe and queue implementation"
git branch phase-2-complete
```

## 📊 Current Project State

You now have:
- ✅ Universal provider interface
- ✅ Working Surfe provider
- ✅ Queue system for bulk operations
- ✅ Rate limiting and error handling
- ✅ Provider registry for 50+ providers
- ✅ Job tracking and monitoring

## 🚨 Common Issues & Solutions

1. **Redis connection failed**: Ensure Docker Redis is running
2. **Provider not found**: Run `npm run db:seed` to add providers
3. **Worker not processing**: Check Redis connection and logs
4. **Rate limit errors**: Adjust rate limits in provider config

## 📝 Next Phase

Ready for Phase 3! The backend now has:
- Complete provider system
- Queue processing
- Ready for frontend

Proceed to: **Phase 3: Frontend Foundation & Provider UI**