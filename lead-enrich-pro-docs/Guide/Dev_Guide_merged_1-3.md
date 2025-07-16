# LeadEnrich Pro - Unified Development Guide

## 📋 Guide Metadata
- **Version**: Unified from 3 development guides
- **Approach**: Intelligent merge preserving best content
- **Consolidation Notes**: Marked with `[Merged]` tags

---

## 🎯 Project Overview
`[Merged from all 3 guides - combining comprehensive features with clear requirements]`

**App Name**: LeadEnrich Pro  
**Purpose**: Full-stack multi-provider leads data enrichment platform  
**Core Architecture**: No data storage - streaming results directly to users

### Core Features
1. **Multi-Provider Integration** (50+ providers)
   - Major databases: Apollo, ZoomInfo, Clearbit, Surfe
   - Email specialists: Hunter, ContactOut, Findymail
   - AI agents: OpenAI, Claude, Gemini
   - Specialized: PitchBook, Ocean.io, HG Insights

2. **Waterfall Enrichment System**
   - Automatic provider failover
   - Quality-based provider selection
   - Cost optimization algorithms
   - Clay-style enrichment chains

3. **Real-time Operations**
   - Live progress tracking via WebSocket
   - Console logs streaming to frontend
   - Credit usage monitoring
   - Rate limit notifications

4. **Data Processing**
   - CSV upload with intelligent column mapping
   - Domain cleaning and validation
   - Export with custom column selection
   - No data persistence (streaming only)

---

## 🤖 AI Development Instructions
`[From Guide 3 - Essential for AI-assisted development]`

### CRITICAL: How to Use This Guide with AI

1. **Starting Each Session**:
```
"I'm building LeadEnrich Pro using this guide: [paste guide]
Current position: Phase [X], Step [Y]
Last completed: [specific task]
Continue from this exact point with production-ready code."
```

2. **Quality Requirements**:
- NO placeholder code (`// TODO`, `console.log('implement later')`)
- Complete TypeScript types (no `any`)
- Full error handling
- Input validation on all endpoints
- Tests included

3. **Code Generation Rules**:
- Every function must be typed
- Every error must be handled
- Every input must be validated
- Every async operation must have timeout
- Every external call must have retry logic

---

## 🏗️ Technology Stack
`[Merged from all guides - Guide 1's complete configs + additions]`

### Backend
- **Framework**: Node.js with Express.js
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis with Bull Queue
- **Real-time**: Socket.IO
- **Validation**: Zod schemas
- **Testing**: Jest with 80% coverage requirement
- **API Design**: REST + tRPC for type safety
- **Documentation**: OpenAPI/Swagger auto-generated

### Frontend  
- **Framework**: React with TypeScript (or Next.js 14)
- **State Management**: Zustand + React Query
- **UI Library**: Tailwind CSS + shadcn/ui
- **File Upload**: react-dropzone
- **Charts**: Recharts for analytics
- **Real-time**: Socket.IO client
- **Tables**: TanStack Table for data display

### DevOps & Quality
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint + Prettier + Husky
- **Monitoring**: Prometheus + Grafana
- **Error Tracking**: Sentry
- **Security**: Helmet, rate limiting, input sanitization

### Complete Package.json
`[From Guide 1 - Most comprehensive dependency list]`

```json
{
  "name": "leadenrich-backend",
  "version": "1.0.0",
  "description": "Multi-provider leads enrichment API",
  "main": "dist/app.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc && npm run copy-assets",
    "start": "node dist/app.js",
    "test": "jest --coverage --detectOpenHandles --forceExit",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "typecheck": "tsc --noEmit",
    "validate": "npm run typecheck && npm run lint && npm run test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node prisma/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "prepare": "husky install"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^6.8.1",
    "express-validator": "^7.0.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.1",
    "axios": "^1.4.0",
    "socket.io": "^4.7.2",
    "bull": "^4.11.1",
    "ioredis": "^5.3.2",
    "@prisma/client": "^5.1.1",
    "zod": "^3.21.4",
    "winston": "^3.10.0",
    "winston-daily-rotate-file": "^4.7.1",
    "csv-parser": "^3.0.0",
    "csv-writer": "^1.6.0",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.3.1",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.4.2",
    "@types/express": "^4.17.17",
    "@typescript-eslint/eslint-plugin": "^6.1.0",
    "@typescript-eslint/parser": "^6.1.0",
    "eslint": "^8.45.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.3",
    "jest": "^29.6.1",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "nodemon": "^3.0.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.6"
  }
}
```

---

## 🌐 Multi-Provider Architecture
`[Merged: Guide 2's organization + Guide 1's BetterEnrich details + Guide 3's templates]`

### Provider Categories (50+ Total)

#### 1. Major Data Providers
- **Apollo.io**: 275M contacts, 73M companies
- **ZoomInfo**: 265M professionals, buyer intent data
- **Clearbit/HubSpot Breeze**: Real-time enrichment
- **Surfe**: People/company search, lookalike (current primary)

#### 2. Email & Contact Specialists  
- **Hunter.io**: 107M emails, domain search
- **ContactOut**: LinkedIn extraction, mobile numbers
- **Findymail**: High deliverability rates
- **Prospeo**: B2B email discovery
- **Voila Norbert**: Email finder with verification

#### 3. AI & Research Agents
- **OpenAI/ChatGPT**: Custom research, content generation
- **Anthropic Claude**: Advanced analysis, document processing
- **Google Gemini**: Multimodal AI capabilities
- **Perplexity**: Real-time web research

#### 4. Company Intelligence
- **Ocean.io**: Company lookalikes, market intelligence
- **PitchBook**: Private market data, valuations
- **HG Insights**: Technology intelligence
- **Crunchbase**: Funding data, company info
- **BuiltWith**: Technology stack detection

#### 5. Specialized Providers
- **BetterEnrich**: 20+ specialized features (see below)
- **Datagma**: Contact verification
- **LeadMagic**: Social URL enrichment
- **Google Maps**: Local business data
- **Semrush**: SEO and web analytics

### BetterEnrich Feature Breakdown
`[From Guide 1 - Most detailed provider example]`

```typescript
const BETTERENRICH_FEATURES = {
  enrichment: [
    { id: 'single-enrichment', name: 'Single Enrichment', credits: 1 },
    { id: 'waterfall-enrichment', name: 'Waterfall Enrichment', credits: 3 }
  ],
  emailFinder: [
    { id: 'find-work-email', name: 'Find Work Email', credits: 1 },
    { id: 'find-email-from-linkedin', name: 'LinkedIn Email Extract', credits: 1 },
    { id: 'find-email-from-salesnav', name: 'Sales Nav Email', credits: 1 },
    { id: 'find-personal-email', name: 'Personal Email', credits: 1 }
  ],
  phoneFinder: [
    { id: 'find-mobile-phone', name: 'Mobile Phone Number', credits: 2 }
  ],
  adIntelligence: [
    { id: 'check-google-ads', name: 'Google Ads Check', credits: 1 },
    { id: 'check-facebook-ads', name: 'Facebook Ads Check', credits: 1 },
    { id: 'check-linkedin-ads', name: 'LinkedIn Ads Check', credits: 1 }
  ],
  socialEnrichment: [
    { id: 'find-social-urls', name: 'Social URLs by Website', credits: 1 },
    { id: 'find-linkedin-by-email', name: 'LinkedIn by Email', credits: 1 }
  ],
  verification: [
    { id: 'check-dnc-list', name: 'DNC List Check', credits: 0.5 },
    { id: 'check-phone-status', name: 'Phone Status Check', credits: 0.5 }
  ]
};
```

### Universal Provider Interface
`[Merged from all guides - most comprehensive version]`

```typescript
interface UniversalProvider {
  // Provider metadata
  id: string;
  name: string;
  category: ProviderCategory;
  tier: ProviderTier;
  
  // Core capabilities
  capabilities: ProviderCapability[];
  supportedOperations: ProviderOperation[];
  
  // Configuration
  authentication: AuthConfig;
  rateLimits: RateLimitConfig;
  pricing: PricingConfig;
  
  // Required methods - all providers must implement
  initialize(): Promise<void>;
  validateCredentials(): Promise<boolean>;
  executeOperation(operation: string, params: any): Promise<ProviderResult>;
  getBulkOperation(operation: string, paramsList: any[]): Promise<BulkProviderResult>;
  getUsageStats(): Promise<UsageStats>;
  getQuotaRemaining(): Promise<QuotaInfo>;
  
  // Optional provider-specific extensions
  getCustomFeatures?(): CustomFeature[];
  executeCustomFeature?(featureId: string, params: any): Promise<any>;
}
```

### Waterfall Enrichment Configuration
`[From Guide 2 - Clearest implementation example]`

```typescript
const EMAIL_FINDER_WATERFALL: WaterfallConfig = {
  operation: 'find-email',
  providers: [
    { providerId: 'hunter', priority: 1, timeout: 5000, retryAttempts: 2 },
    { providerId: 'apollo', priority: 2, timeout: 8000, retryAttempts: 1 },
    { providerId: 'contactout', priority: 3, timeout: 10000, retryAttempts: 1 },
    { providerId: 'findymail', priority: 4, timeout: 5000, retryAttempts: 1 }
  ],
  fallbackBehavior: 'continue',
  maxProviders: 3,
  qualityThreshold: 85
};
```

---

## 🗄️ Database Schema
`[From Guide 1 - Most complete schema with all features]`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Provider Management
model Provider {
  id              Int       @id @default(autoincrement())
  name            String    @unique @db.VarChar(50)
  displayName     String    @db.VarChar(100)
  apiKeyEncrypted String?   @db.Text
  baseUrl         String    @db.VarChar(255)
  rateLimit       Int       @default(10)
  dailyQuota      Int       @default(2000)
  isActive        Boolean   @default(true)
  category        String    @db.VarChar(50)
  tier            String    @db.VarChar(20) // free, basic, pro, enterprise
  configuration   Json?
  featuresConfig  Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  features      ProviderFeature[]
  rateLimits    RateLimit[]
  apiUsage      ApiUsage[]
  integrations  ProviderIntegration[]

  @@map("providers")
}

model ProviderFeature {
  id                Int      @id @default(autoincrement())
  providerId        Int
  featureId         String   @db.VarChar(100)
  featureName       String   @db.VarChar(200)
  categoryId        String   @db.VarChar(50)
  endpoint          String   @db.VarChar(500)
  httpMethod        String   @default("POST") @db.VarChar(10)
  requestSchema     Json?
  responseSchema    Json?
  creditsPerRequest Int      @default(1)
  rateLimitOverride Int?
  isActive          Boolean  @default(true)
  description       String?
  createdAt         DateTime @default(now())

  provider    Provider         @relation(fields: [providerId], references: [id])
  parameters  FeatureParameter[]
  usage       FeatureUsage[]

  @@unique([providerId, featureId])
  @@map("provider_features")
}

// Enrichment Operations
model EnrichmentJob {
  id                String    @id @default(cuid())
  userId            String?   @db.VarChar(100)
  jobType           String    @db.VarChar(50)
  providerId        Int?
  status            String    @default("pending") @db.VarChar(20)
  totalRecords      Int       @default(0)
  processedRecords  Int       @default(0)
  successfulRecords Int       @default(0)
  failedRecords     Int       @default(0)
  inputData         Json?
  outputData        Json?     // Streamed, not stored
  errorDetails      Json?
  creditsUsed       Int       @default(0)
  startedAt         DateTime?
  completedAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  logs EnrichmentLog[]

  @@index([userId, status])
  @@map("enrichment_jobs")
}

model EnrichmentLog {
  id        Int      @id @default(autoincrement())
  jobId     String
  level     String   @db.VarChar(10) // info, warn, error
  message   String
  details   Json?
  timestamp DateTime @default(now())

  job EnrichmentJob @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@index([jobId, timestamp])
  @@map("enrichment_logs")
}

// Rate Limiting & Usage Tracking
model RateLimit {
  id           Int      @id @default(autoincrement())
  providerId   Int
  endpoint     String   @db.VarChar(100)
  requestsCount Int     @default(0)
  windowStart  DateTime @default(now())
  resetAt      DateTime?

  provider Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@index([providerId, endpoint, windowStart])
  @@map("rate_limits")
}

model ApiUsage {
  id            Int      @id @default(autoincrement())
  providerId    Int
  endpoint      String   @db.VarChar(100)
  creditsUsed   Int      @default(0)
  requestsCount Int      @default(1)
  date          DateTime @default(now()) @db.Date

  provider Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@index([providerId, date])
  @@map("api_usage")
}

model FeatureUsage {
  id            Int      @id @default(autoincrement())
  providerId    Int
  featureId     String   @db.VarChar(100)
  creditsUsed   Int      @default(1)
  requestsCount Int      @default(1)
  successCount  Int      @default(0)
  errorCount    Int      @default(0)
  date          DateTime @default(now()) @db.Date

  feature ProviderFeature @relation(fields: [providerId, featureId], references: [providerId, featureId], onDelete: Cascade)

  @@index([providerId, featureId, date])
  @@map("feature_usage")
}

model FeatureParameter {
  id                Int     @id @default(autoincrement())
  providerFeatureId Int
  paramName         String  @db.VarChar(100)
  paramType         String  @db.VarChar(50) // string, number, boolean, array, object
  isRequired        Boolean @default(false)
  defaultValue      String?
  validationRules   Json?
  description       String?
  exampleValue      String?

  providerFeature ProviderFeature @relation(fields: [providerFeatureId], references: [id], onDelete: Cascade)

  @@map("feature_parameters")
}

model ProviderIntegration {
  id              Int     @id @default(autoincrement())
  providerId      Int
  integrationType String  @db.VarChar(50) // webhook, polling, realtime
  webhookUrl      String? @db.VarChar(500)
  authMethod      String  @db.VarChar(50) // bearer, api-key, oauth
  customHeaders   Json?
  retryConfig     Json?
  timeoutSeconds  Int     @default(30)

  provider Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@map("provider_integrations")
}

// User Management
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  apiKeyHash      String?
  role            String   @default("user")
  settings        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("users")
}
```

---

## 📦 Development Phases
`[Merged: Guide 3's AI-friendly structure + Guide 1's detail + Guide 2's features]`

### Phase 1: Foundation & Provider System
`[Consolidated from all guides - most comprehensive approach]`

**AI Prompt**:
```
Create bulletproof Node.js TypeScript backend with multi-provider architecture:

CORE REQUIREMENTS:
1. TypeScript strict mode with zero errors
2. Express server with complete security middleware
3. PostgreSQL + Prisma with full schema from guide
4. Redis + Bull Queue for async operations
5. Universal provider interface supporting 50+ providers
6. Comprehensive error handling (use error codes from guide)
7. Health checks and monitoring endpoints

PROVIDER SYSTEM:
1. Abstract BaseProvider class
2. Provider factory with dynamic loading
3. Provider registry with health monitoring
4. Waterfall enrichment like Clay
5. Feature discovery and validation

QUALITY REQUIREMENTS:
1. Pre-commit hooks with TypeScript/ESLint/Jest checks
2. Docker Compose for all services
3. Environment validation with Zod
4. API documentation generation
5. Structured logging with Winston

Include ALL configuration files from guide.
Must pass: npm run validate (typecheck + lint + test)
```

### Phase 2: Core Provider Implementations
`[Specific implementation details from all guides]`

**AI Prompt**:
```
Implement these providers with production quality:

1. SURFE PROVIDER (Primary):
   - All v2 endpoints from API docs
   - Rate limiting: 10 req/sec (burst to 20)
   - Implement all 5 operations
   - Webhook support for async

2. APOLLO PROVIDER:
   - 275M contact database
   - People/company search
   - Email finder with waterfall
   - Technology detection

3. BETTERENRICH PROVIDER:
   - Implement all 20+ features from guide
   - Category-based organization
   - Dynamic feature discovery

Each provider must:
- Follow UniversalProvider interface
- Include retry logic with exponential backoff
- Map errors to standard error codes
- Track usage and costs
- Support bulk operations
- Include comprehensive tests
```

### Phase 3: Frontend & Real-time Features
`[Combined UI requirements from all guides]`

**AI Prompt**:
```
Create Next.js 14 frontend with TypeScript and Shadcn/ui:

CORE FEATURES:
1. Provider marketplace with 50+ providers
2. Feature discovery UI with categories
3. Waterfall designer (drag-drop interface)
4. Real-time progress with console logs
5. CSV upload/mapping/export
6. Usage analytics dashboard

REAL-TIME REQUIREMENTS:
1. Socket.IO for live updates
2. Progress bars with percentage
3. Console log streaming
4. Credit usage tracking
5. Rate limit warnings

Use Zustand for state, React Query for API.
Must be fully responsive and accessible.
Include loading states and error boundaries.
```

### Phase 4: Advanced Features & Production
`[Production features from Guide 1 + AI features from others]`

**AI Prompt**:
```
Complete production features:

1. AI RESEARCH AGENTS:
   - OpenAI/Claude/Gemini integration
   - Custom research operations
   - Prompt template library
   - Cost management

2. DOMAIN CLEANING:
   - Email validation/normalization
   - Phone formatting (international)
   - Company name standardization
   - Duplicate detection

3. PRODUCTION INFRASTRUCTURE:
   - PM2 ecosystem configuration
   - Nginx with SSL/rate limiting
   - GitHub Actions CI/CD
   - Monitoring (Prometheus/Grafana)
   - Error tracking (Sentry)

Include all production configs from guide.
Must handle 10,000+ record bulk operations.
```

---

## 🛡️ Error Handling & Robustness
`[From Guide 1 - Most comprehensive error system]`

### Error Code System

```typescript
export enum ErrorCode {
  // Provider Errors
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_API_ERROR = 'PROVIDER_API_ERROR',
  PROVIDER_RATE_LIMIT = 'PROVIDER_RATE_LIMIT',
  PROVIDER_INSUFFICIENT_CREDITS = 'PROVIDER_INSUFFICIENT_CREDITS',
  PROVIDER_AUTHENTICATION_FAILED = 'PROVIDER_AUTHENTICATION_FAILED',
  
  // Feature Errors
  FEATURE_NOT_SUPPORTED = 'FEATURE_NOT_SUPPORTED',
  FEATURE_PARAMETERS_INVALID = 'FEATURE_PARAMETERS_INVALID',
  FEATURE_EXECUTION_FAILED = 'FEATURE_EXECUTION_FAILED',
  
  // Data Errors
  DATA_VALIDATION_FAILED = 'DATA_VALIDATION_FAILED',
  CSV_PARSING_ERROR = 'CSV_PARSING_ERROR',
  DATA_TRANSFORMATION_ERROR = 'DATA_TRANSFORMATION_ERROR',
  
  // System Errors
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  REDIS_CONNECTION_ERROR = 'REDIS_CONNECTION_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  QUEUE_PROCESSING_ERROR = 'QUEUE_PROCESSING_ERROR',
  
  // Business Logic Errors
  ENRICHMENT_JOB_NOT_FOUND = 'ENRICHMENT_JOB_NOT_FOUND',
  BULK_OPERATION_FAILED = 'BULK_OPERATION_FAILED',
  WATERFALL_EXECUTION_FAILED = 'WATERFALL_EXECUTION_FAILED'
}

export class AppErrorHandler {
  static createError(
    code: ErrorCode, 
    message: string, 
    statusCode = 500,
    details?: any
  ): AppError {
    const error = new Error(message) as AppError;
    error.code = code;
    error.statusCode = statusCode;
    error.details = details;
    error.recoverable = this.isRecoverable(code);
    return error;
  }

  static isRecoverable(code: ErrorCode): boolean {
    const recoverableErrors = [
      ErrorCode.PROVIDER_RATE_LIMIT,
      ErrorCode.PROVIDER_API_ERROR,
      ErrorCode.QUEUE_PROCESSING_ERROR
    ];
    return recoverableErrors.includes(code);
  }

  static getRetryDelay(error: AppError, attempt: number): number {
    if (error.code === ErrorCode.PROVIDER_RATE_LIMIT) {
      return error.retryAfter || Math.pow(2, attempt) * 1000;
    }
    return Math.pow(2, attempt) * 1000;
  }
}
```

### Pre-commit Quality Gates
`[From Guide 1 - Complete validation setup]`

```bash
#!/usr/bin/env sh
# .husky/pre-commit

echo "🔍 Running pre-commit validation..."

# 1. TypeScript check (BLOCKING)
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found. Commit blocked."
  exit 1
fi

# 2. Linting (BLOCKING)
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint errors found. Commit blocked."
  exit 1
fi

# 3. Tests (BLOCKING)
npm run test -- --passWithNoTests --coverage
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Commit blocked."
  exit 1
fi

# 4. Build verification (BLOCKING)
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Commit blocked."
  exit 1
fi

echo "✅ All quality gates passed!"
```

---

## 🔄 Chat Continuation Protocol
`[From Guide 3 - Essential for AI development continuity]`

### MANDATORY Before Chat Limit

```markdown
# 🚨 DEVELOPMENT HANDOFF REPORT

## Current State
**Phase**: [Current Phase Name]  
**Completion**: [X]% complete  
**Last Working Feature**: [Specific feature]  
**Currently Working On**: [Current task]  

## Technical State
**Build Status**: ✅ Compiles / ❌ Has errors  
**Test Status**: ✅ All passing / ❌ [X] failing  
**TypeScript**: ✅ No errors / ❌ [X] errors  

## Files Modified
- [file1.ts] - [what was changed]
- [file2.ts] - [what was changed]

## Next Steps
1. [Immediate next task]
2. [Following task]

## Resume Commands
```bash
git status
npm install
npm run validate
docker-compose up -d
npm run dev
```

## AI Resume Prompt
"Continue LeadEnrich Pro development from: [paste above].
Maintain all quality requirements. Fix any errors first."
```

### Emergency Recovery
`[From Guide 3 - Troubleshooting procedures]`

```bash
# If build fails
rm -rf node_modules package-lock.json
npm install
npm run typecheck

# If types missing
npm run db:generate
npm run build

# If tests fail
npm run test -- --verbose
```

---

## 🚀 Production Deployment
`[From Guide 1 - Complete production configs]`

### PM2 Ecosystem Configuration

```javascript
module.exports = {
  apps: [{
    name: 'leadenrich-api',
    script: 'dist/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024',
    wait_ready: true,
    listen_timeout: 10000,
    restart_delay: 5000,
    max_restarts: 5
  }, {
    name: 'leadenrich-worker',
    script: 'dist/worker.js',
    instances: 2,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/worker-err.log',
    out_file: './logs/worker-out.log',
    max_memory_restart: '512M'
  }]
};
```

### Nginx Configuration

```nginx
upstream leadenrich_backend {
    least_conn;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    server_name api.leadenrichpro.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.leadenrichpro.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/leadenrichpro.crt;
    ssl_certificate_key /etc/ssl/private/leadenrichpro.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000";
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # File Upload Limits
    client_max_body_size 50M;
    client_body_timeout 60s;
    
    location / {
        proxy_pass http://leadenrich_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    location /health {
        proxy_pass http://leadenrich_backend/health;
        access_log off;
    }
}
```

### Docker Configuration

```dockerfile
# Multi-stage Dockerfile
FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p uploads temp logs
RUN chown -R nodejs:nodejs uploads temp logs

USER nodejs
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js || exit 1

CMD ["npm", "start"]
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/types/*": ["src/types/*"],
      "@/services/*": ["src/services/*"],
      "@/utils/*": ["src/utils/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 📁 Project Structure

```
leadenrich-pro/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── providersController.ts
│   │   │   ├── peopleController.ts
│   │   │   ├── companyController.ts
│   │   │   ├── uploadController.ts
│   │   │   ├── jobsController.ts
│   │   │   └── exportController.ts
│   │   ├── services/
│   │   │   ├── providers/
│   │   │   │   ├── base/
│   │   │   │   │   └── BaseProvider.ts
│   │   │   │   ├── implementations/
│   │   │   │   │   ├── SurfeProvider.ts
│   │   │   │   │   ├── ApolloProvider.ts
│   │   │   │   │   ├── BetterEnrichProvider.ts
│   │   │   │   │   └── [50+ other providers]
│   │   │   │   ├── ProviderFactory.ts
│   │   │   │   ├── ProviderRegistry.ts
│   │   │   │   └── WaterfallEngine.ts
│   │   │   ├── fileProcessingService.ts
│   │   │   ├── dataCleaningService.ts
│   │   │   ├── exportService.ts
│   │   │   └── queueService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── rateLimit.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── logging.ts
│   │   ├── types/
│   │   │   ├── providers/
│   │   │   ├── errors.ts
│   │   │   └── common.ts
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   ├── encryption.ts
│   │   │   └── retry.ts
│   │   ├── routes/
│   │   │   └── v1/
│   │   ├── config/
│   │   ├── app.ts
│   │   ├── worker.ts
│   │   └── healthcheck.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── tests/
│   ├── docker/
│   ├── scripts/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 📊 Success Metrics
`[Consolidated from all guides]`

### Development Milestones
- [ ] Phase 1: Foundation with provider system
- [ ] Phase 2: 5+ providers integrated (Surfe, Apollo, BetterEnrich)
- [ ] Phase 3: Complete frontend with real-time features
- [ ] Phase 4: Production ready with 50+ providers

### Quality Requirements
- TypeScript coverage: 100% (strict mode, no any)
- Test coverage: >80%
- Build time: <60 seconds
- API response: <200ms (p95)
- Provider success rate: >95%
- Zero runtime errors
- Zero security vulnerabilities

### Feature Checklist
- [ ] 50+ provider support with dynamic loading
- [ ] Waterfall enrichment with fallback
- [ ] Real-time progress with console logs
- [ ] CSV import/export with column mapping
- [ ] Domain cleaning and validation
- [ ] AI research agents (OpenAI, Claude, Gemini)
- [ ] Usage analytics and cost tracking
- [ ] Provider health monitoring
- [ ] Bulk operations (10,000+ records)
- [ ] No data storage (streaming only)

---

## 📝 Provider Implementation Template
`[From Guide 3 - Template for adding new providers]`

```typescript
// Template for adding any new provider
import { BaseProvider } from '../base/BaseProvider';
import { ProviderCategory, ProviderTier } from '@/types/providers';

class [ProviderName]Provider extends BaseProvider {
  name = '[provider-id]';
  displayName = '[Provider Display Name]';
  category = ProviderCategory.EMAIL_FINDER;
  tier = ProviderTier.PRO;
  baseUrl = 'https://api.[provider].com/v1';
  
  constructor() {
    super();
    this.rateLimits = {
      requestsPerSecond: 10,
      burstAllowed: 20,
      dailyQuota: 5000
    };
  }
  
  async authenticate(): Promise<void> {
    // Implement based on provider auth type
    const apiKey = await this.getDecryptedApiKey();
    this.client.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
  }
  
  async findEmail(params: EmailSearchParams): Promise<EmailResult> {
    return this.executeWithRetry(async () => {
      const response = await this.client.post('/email/find', {
        // Map params to provider-specific format
        first_name: params.firstName,
        last_name: params.lastName,
        company_domain: params.companyDomain
      });
      
      // Normalize response to standard format
      return this.normalizeEmailResult(response.data);
    });
  }
  
  async enrichPerson(email: string): Promise<PersonData> {
    return this.executeWithRetry(async () => {
      const response = await this.client.post('/person/enrich', { email });
      return this.normalizePersonData(response.data);
    });
  }
  
  // Map provider-specific errors to standard errors
  protected handleProviderError(error: any): never {
    if (error.response?.status === 429) {
      throw AppErrorHandler.createError(
        ErrorCode.PROVIDER_RATE_LIMIT,
        'Rate limit exceeded',
        429,
        { retryAfter: error.response.headers['retry-after'] }
      );
    }
    // Handle other provider-specific errors...
    super.handleProviderError(error);
  }
}

// Register the provider
ProviderRegistry.register('[provider-id]', [ProviderName]Provider);
```

---

## 🎯 Key Consolidation Notes

1. **Project Architecture**: Combined streaming-only approach (Guide 3) with comprehensive features (Guides 1 & 2)

2. **Provider System**: Used Guide 2's clean 50+ provider organization with Guide 1's detailed implementations

3. **Development Approach**: Guide 3's AI-friendly phases enhanced with Guide 1's production configs

4. **Error Handling**: Guide 1's comprehensive system preserved entirely

5. **Configuration Files**: All configs from Guide 1 retained (most complete)

6. **Frontend**: Merged React (Guides 1&2) with Next.js 14 option (Guide 3)

7. **Testing**: Unified 80% coverage requirement with specific test types

8. **Production**: Guide 1's complete deployment setup preserved

This unified guide maintains all critical information while providing a clear, logical progression from setup through deployment. The AI-friendly structure from Guide 3 is preserved while incorporating the robustness features from Guide 1 and the clean organization from Guide 2.