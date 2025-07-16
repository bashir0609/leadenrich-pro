# Complete Leads Data Enrichment App Development Guide

## 🎯 Project Overview

**App Name**: LeadEnrich Pro  
**Purpose**: Full-stack web application for leads data enrichment using Surfe API  
**Core Features**: People & Company search/enrichment, lookalike search, CSV export, live progress tracking

---

## 🏗️ Technology Stack Recommendation

### Backend
- **Framework**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **API Client**: Axios for HTTP requests
- **File Processing**: csv-parser, json2csv
- **Real-time**: Socket.IO for live progress
- **Validation**: Joi or Zod
- **Environment**: dotenv
- **Testing**: Jest
- **Caching**: Redis for sessions and rate limiting
- **Queue**: Bull Queue for background jobs

### Frontend
- **Framework**: React with TypeScript
- **State Management**: Zustand or Redux Toolkit
- **UI Library**: Tailwind CSS + shadcn/ui
- **File Upload**: react-dropzone
- **Charts**: Recharts for progress visualization
- **Real-time**: Socket.IO client
- **HTTP Client**: Axios
- **Table**: Tanstack Table
- **Notifications**: react-hot-toast

### Database (PostgreSQL)
- **ORM**: Prisma for type-safe database operations
- **Tables**: 
  - `providers` - Store provider configurations
  - `enrichment_jobs` - Track bulk operations
  - `api_logs` - API request/response logs
  - `user_preferences` - UI settings and column mappings
  - `rate_limits` - Provider-specific rate tracking
- **Redis**: For caching, sessions, and queue management

---

## 📋 Complete Feature Requirements

### Core Features
1. **People Search & Enrichment**
   - Advanced filtering by company (industry, size, location, domain)
   - People filters (job title, seniority, department)
   - Single person lookup and bulk CSV enrichment
   - Manual form-based search with real-time suggestions
   - LinkedIn profile enrichment with email/mobile discovery

2. **Company Search & Enrichment**
   - Industry-based filtering with 50+ categories
   - Company size filtering (employee ranges)
   - Geographic filtering by country/region
   - Technology stack filtering
   - Funding stage and financial data
   - Comprehensive company profiles with contact details

3. **Company Lookalike Search**
   - Find similar companies based on multiple criteria
   - Industry similarity matching with weighted algorithms
   - Employee size and revenue-based matching
   - Geographic proximity with distance controls
   - Technology stack similarity analysis

4. **Extended Provider Features (BetterEnrich Example)**
   - **Enrichment**: Single enrichment, Waterfall enrichment
   - **Email Discovery**: Work email finder, LinkedIn/Sales Nav email extraction, Personal email finder
   - **Phone Discovery**: Mobile phone number finder
   - **Ad Intelligence**: Google/Facebook/LinkedIn ads presence detection
   - **Social Enrichment**: Social media URL discovery, LinkedIn/Facebook profile finding
   - **Data Normalization**: Company/person name standardization
   - **Verification**: DNC list checking, phone status verification, ESP detection
   - **Utilities**: Gender detection, website discovery from company name

5. **Dynamic Feature Management**
   - Provider-specific feature catalogs
   - Feature categorization and organization
   - Custom parameter validation per feature
   - Usage tracking and analytics per feature
   - Bulk execution with progress tracking
   - Feature-specific rate limiting and credit management

6. **Advanced Data Processing**
   - CSV file upload with intelligent column detection
   - Domain cleaning and email validation
   - Smart column mapping with AI suggestions
   - Duplicate detection with fuzzy matching
   - Data standardization and formatting
   - Progress tracking with detailed console logs

7. **Bulk Operations & Export**
   - Async bulk processing with webhook notifications
   - Real-time progress bars and statistics
   - Custom CSV export with column selection
   - JSON export with nested data structures
   - Batch processing queue management
   - Operation history and logs

8. **Real-time Features**
   - Live progress tracking via WebSocket
   - Console logs streaming to frontend
   - Rate limit monitoring and alerts
   - Credit usage tracking and warnings
   - Error reporting with detailed context
   - Performance metrics and analytics

---

## 🛡️ Robustness & Development Continuity Features

### Code Quality & Error Prevention
- **ESLint + Prettier**: Automated code formatting and linting
- **Husky Git Hooks**: Pre-commit checks for code quality
- **TypeScript Strict Mode**: Maximum type safety
- **Zod Runtime Validation**: Type-safe runtime validation
- **Jest + Supertest**: Comprehensive testing suite
- **SonarQube**: Code quality analysis
- **Commitizen**: Standardized commit messages

### Development Workflow Protection
- **Docker Compose**: Consistent development environment
- **GitHub Actions**: Automated CI/CD pipeline
- **Dependency Security**: npm audit and Snyk integration
- **Code Coverage**: Minimum 80% coverage requirement
- **API Documentation**: Auto-generated OpenAPI specs
- **Database Migrations**: Version-controlled schema changes
- **Backup Strategies**: Automated database backups

### Chat Continuity & AI Development Support
- **Comprehensive Documentation**: Every function and class documented
- **State Tracking**: Development progress checkpoints
- **Modular Architecture**: Independent, self-contained modules
- **Code Generation Templates**: Consistent code patterns
- **Testing Templates**: Pre-defined test structures
- **Error Recovery**: Automatic error detection and fixes

### Provider System Design
The application is built with a flexible provider architecture to support multiple enrichment services:

**Current Provider**: Surfe (Primary)
**Planned Providers**: Apollo, Clay, BetterEnrich, and others

### Provider Interface Structure
```typescript
interface EnrichmentProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  rateLimit: number;
  quotas: ProviderQuotas;
  endpoints: ProviderEndpoints;
  
  // Core methods
  searchPeople(params: PeopleSearchParams): Promise<PeopleSearchResult>;
  enrichPeople(params: PeopleEnrichParams): Promise<PeopleEnrichResult>;
  searchCompanies(params: CompanySearchParams): Promise<CompanySearchResult>;
  enrichCompanies(params: CompanyEnrichParams): Promise<CompanyEnrichResult>;
  findLookalikes(params: LookalikeParams): Promise<LookalikeResult>;
  
  // Provider-specific methods
  validateCredentials(): Promise<boolean>;
  getUsageStats(): Promise<UsageStats>;
  transformResponse(data: any): StandardizedResponse;
}
```

## 🏗️ Multi-Provider Architecture

### Provider System Design
The application is built with a flexible provider architecture to support multiple enrichment services:

**Current Provider**: Surfe (Primary)
**Planned Providers**: Apollo, Clay, BetterEnrich, and others

## 🏗️ Multi-Provider Architecture

### Provider System Design
The application is built with a flexible provider architecture to support multiple enrichment services with varying feature sets:

**Current Provider**: Surfe (Primary)
**Planned Providers**: Apollo, Clay, BetterEnrich (30+ features), and others

### Enhanced Provider Interface Structure
```typescript
interface EnrichmentProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  rateLimit: number;
  quotas: ProviderQuotas;
  endpoints: ProviderEndpoints;
  features: ProviderFeatures;
  
  // Core methods (required for all providers)
  searchPeople(params: PeopleSearchParams): Promise<PeopleSearchResult>;
  enrichPeople(params: PeopleEnrichParams): Promise<PeopleEnrichResult>;
  searchCompanies(params: CompanySearchParams): Promise<CompanySearchResult>;
  enrichCompanies(params: CompanyEnrichParams): Promise<CompanyEnrichResult>;
  findLookalikes(params: LookalikeParams): Promise<LookalikeResult>;
  
  // Extended methods (provider-specific features)
  executeFeature(featureId: string, params: any): Promise<FeatureResult>;
  getAvailableFeatures(): ProviderFeature[];
  validateCredentials(): Promise<boolean>;
  getUsageStats(): Promise<UsageStats>;
  transformResponse(data: any): StandardizedResponse;
}

interface ProviderFeature {
  id: string;
  name: string;
  category: FeatureCategory;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params: FeatureParam[];
  responseSchema: any;
  credits: number;
  description: string;
  isActive: boolean;
}

interface FeatureCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// BetterEnrich feature categories
enum BetterEnrichCategories {
  ENRICHMENT = 'enrichment',
  EMAIL_FINDER = 'email-finder',
  PHONE_FINDER = 'phone-finder',
  AD_INTELLIGENCE = 'ad-intelligence',
  SOCIAL_ENRICHMENT = 'social-enrichment',
  NORMALIZATION = 'normalization',
  VERIFICATION = 'verification',
  OTHERS = 'others'
}
```

### Database Schema for Extensible Features
```sql
-- Enhanced providers table
CREATE TABLE providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  api_key_encrypted TEXT,
  base_url VARCHAR(255),
  rate_limit INTEGER DEFAULT 10,
  daily_quota INTEGER DEFAULT 2000,
  is_active BOOLEAN DEFAULT true,
  configuration JSONB,
  features_config JSONB, -- Dynamic feature configuration
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Feature categories
CREATE TABLE feature_categories (
  id SERIAL PRIMARY KEY,
  category_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0
);

-- Provider features
CREATE TABLE provider_features (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES providers(id),
  feature_id VARCHAR(100) NOT NULL,
  feature_name VARCHAR(200) NOT NULL,
  category_id VARCHAR(50) REFERENCES feature_categories(category_id),
  endpoint VARCHAR(500) NOT NULL,
  http_method VARCHAR(10) DEFAULT 'POST',
  request_schema JSONB,
  response_schema JSONB,
  credits_per_request INTEGER DEFAULT 1,
  rate_limit_override INTEGER,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  example_request JSONB,
  example_response JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_id, feature_id)
);

-- Feature usage tracking
CREATE TABLE feature_usage (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES providers(id),
  feature_id VARCHAR(100),
  credits_used INTEGER DEFAULT 1,
  requests_count INTEGER DEFAULT 1,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  INDEX(provider_id, feature_id, date)
);

-- Feature parameters definition
CREATE TABLE feature_parameters (
  id SERIAL PRIMARY KEY,
  provider_feature_id INTEGER REFERENCES provider_features(id),
  param_name VARCHAR(100) NOT NULL,
  param_type VARCHAR(50) NOT NULL, -- string, number, boolean, array, object
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  validation_rules JSONB,
  description TEXT,
  example_value TEXT
);
```

### BetterEnrich Provider Implementation
```typescript
class BetterEnrichProvider extends BaseProvider {
  name = 'betterenrich';
  baseUrl = 'https://api.betterenrich.com/v1';
  
  // Define all BetterEnrich features
  private features: ProviderFeature[] = [
    // Enrichment Category
    {
      id: 'single-enrichment',
      name: 'Single Enrichment',
      category: { id: 'enrichment', name: 'Enrichment', description: 'Data enrichment services' },
      endpoint: '/enrichment/single',
      method: 'POST',
      params: [
        { name: 'email', type: 'string', required: true },
        { name: 'first_name', type: 'string', required: false },
        { name: 'last_name', type: 'string', required: false }
      ],
      credits: 1,
      description: 'Enrich a single contact with comprehensive data'
    },
    {
      id: 'waterfall-enrichment',
      name: 'Waterfall Enrichment',
      category: { id: 'enrichment', name: 'Enrichment', description: 'Data enrichment services' },
      endpoint: '/enrichment/waterfall',
      method: 'POST',
      credits: 3,
      description: 'Multi-source enrichment with fallback providers'
    },
    
    // Email Finder Category
    {
      id: 'find-work-email',
      name: 'Find Work Email',
      category: { id: 'email-finder', name: 'Email Finder', description: 'Email discovery services' },
      endpoint: '/email/work',
      method: 'POST',
      credits: 1,
      description: 'Find work email address'
    },
    {
      id: 'find-email-from-linkedin',
      name: 'Find Work Email from LinkedIn URL',
      category: { id: 'email-finder', name: 'Email Finder', description: 'Email discovery services' },
      endpoint: '/email/linkedin',
      method: 'POST',
      credits: 1,
      description: 'Extract work email from LinkedIn profile'
    },
    {
      id: 'find-email-from-salesnav',
      name: 'Find Work Email from Sales Nav URL',
      category: { id: 'email-finder', name: 'Email Finder', description: 'Email discovery services' },
      endpoint: '/email/salesnav',
      method: 'POST',
      credits: 1,
      description: 'Extract work email from Sales Navigator'
    },
    {
      id: 'find-personal-email',
      name: 'Find Personal Email',
      category: { id: 'email-finder', name: 'Email Finder', description: 'Email discovery services' },
      endpoint: '/email/personal',
      method: 'POST',
      credits: 1,
      description: 'Find personal email address'
    },
    
    // Phone Finder Category
    {
      id: 'find-mobile-phone',
      name: 'Find Mobile Phone Number',
      category: { id: 'phone-finder', name: 'Phone Finder', description: 'Phone number discovery' },
      endpoint: '/phone/mobile',
      method: 'POST',
      credits: 2,
      description: 'Find mobile phone number'
    },
    
    // Ad Intelligence Category
    {
      id: 'check-google-ads',
      name: 'Check Google Ads Presence',
      category: { id: 'ad-intelligence', name: 'Ad Intelligence', description: 'Advertising data analysis' },
      endpoint: '/ads/google/check',
      method: 'POST',
      credits: 1,
      description: 'Check if company runs Google Ads'
    },
    {
      id: 'check-facebook-ads',
      name: 'Check Facebook Ads Presence',
      category: { id: 'ad-intelligence', name: 'Ad Intelligence', description: 'Advertising data analysis' },
      endpoint: '/ads/facebook/check',
      method: 'POST',
      credits: 1,
      description: 'Check if company runs Facebook Ads'
    },
    {
      id: 'check-linkedin-ads',
      name: 'Check LinkedIn Ads Presence',
      category: { id: 'ad-intelligence', name: 'Ad Intelligence', description: 'Advertising data analysis' },
      endpoint: '/ads/linkedin/check',
      method: 'POST',
      credits: 1,
      description: 'Check if company runs LinkedIn Ads'
    },
    
    // Social Enrichment Category
    {
      id: 'find-social-urls',
      name: 'Find Social Media URLs by Website',
      category: { id: 'social-enrichment', name: 'Social Enrichment', description: 'Social media data discovery' },
      endpoint: '/social/website',
      method: 'POST',
      credits: 1,
      description: 'Find social media profiles from website'
    },
    {
      id: 'find-linkedin-by-email',
      name: 'Find LinkedIn by Personal Email',
      category: { id: 'social-enrichment', name: 'Social Enrichment', description: 'Social media data discovery' },
      endpoint: '/linkedin/by-email',
      method: 'POST',
      credits: 1,
      description: 'Find LinkedIn profile using email'
    },
    {
      id: 'find-linkedin-by-name',
      name: 'Find LinkedIn Profile URL by Name',
      category: { id: 'social-enrichment', name: 'Social Enrichment', description: 'Social media data discovery' },
      endpoint: '/linkedin/by-name',
      method: 'POST',
      credits: 1,
      description: 'Find LinkedIn profile using name'
    },
    {
      id: 'find-facebook-profile',
      name: 'Find Facebook Profile URL',
      category: { id: 'social-enrichment', name: 'Social Enrichment', description: 'Social media data discovery' },
      endpoint: '/facebook/profile',
      method: 'POST',
      credits: 1,
      description: 'Find Facebook profile URL'
    },
    
    // Normalization Category
    {
      id: 'normalize-company',
      name: 'Normalize Company Name',
      category: { id: 'normalization', name: 'Normalization', description: 'Data standardization services' },
      endpoint: '/normalize/company',
      method: 'POST',
      credits: 0.1,
      description: 'Standardize company name format'
    },
    {
      id: 'normalize-person',
      name: 'Normalize Person Name',
      category: { id: 'normalization', name: 'Normalization', description: 'Data standardization services' },
      endpoint: '/normalize/person',
      method: 'POST',
      credits: 0.1,
      description: 'Standardize person name format'
    },
    
    // Verification Category
    {
      id: 'check-dnc-list',
      name: 'Check US Number on the DNC List',
      category: { id: 'verification', name: 'Verification', description: 'Data verification services' },
      endpoint: '/verify/dnc',
      method: 'POST',
      credits: 0.5,
      description: 'Check if US phone number is on Do Not Call list'
    },
    {
      id: 'check-phone-status',
      name: 'Check Phone Line Type & Status',
      category: { id: 'verification', name: 'Verification', description: 'Data verification services' },
      endpoint: '/verify/phone',
      method: 'POST',
      credits: 0.5,
      description: 'Verify phone number type and status'
    },
    {
      id: 'check-esp',
      name: 'Check ESP from Email or Domain',
      category: { id: 'verification', name: 'Verification', description: 'Data verification services' },
      endpoint: '/verify/esp',
      method: 'POST',
      credits: 0.1,
      description: 'Check Email Service Provider'
    },
    
    // Others Category
    {
      id: 'check-gender',
      name: 'Check Gender from Full Name',
      category: { id: 'others', name: 'Others', description: 'Additional utility services' },
      endpoint: '/utils/gender',
      method: 'POST',
      credits: 0.1,
      description: 'Determine gender from full name'
    },
    {
      id: 'find-website',
      name: 'Find Website from Company Name',
      category: { id: 'others', name: 'Others', description: 'Additional utility services' },
      endpoint: '/utils/website',
      method: 'POST',
      credits: 0.5,
      description: 'Find company website from name'
    }
  ];

  async executeFeature(featureId: string, params: any): Promise<FeatureResult> {
    const feature = this.features.find(f => f.id === featureId);
    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }

    const response = await this.makeRequest(feature.endpoint, params, feature.method);
    return this.transformFeatureResponse(featureId, response);
  }

  getAvailableFeatures(): ProviderFeature[] {
    return this.features.filter(f => f.isActive);
  }

  getFeaturesByCategory(categoryId: string): ProviderFeature[] {
    return this.features.filter(f => f.category.id === categoryId);
  }
}
```

### Feature Management Service
```typescript
class FeatureManagementService {
  async getProviderFeatures(providerId: number): Promise<ProviderFeature[]> {
    // Get features from database
  }

  async executeProviderFeature(
    providerId: number, 
    featureId: string, 
    params: any
  ): Promise<FeatureResult> {
    const provider = await this.getProvider(providerId);
    return provider.executeFeature(featureId, params);
  }

  async getFeatureCategories(): Promise<FeatureCategory[]> {
    // Get all available feature categories
  }

  async bulkExecuteFeature(
    providerId: number,
    featureId: string,
    paramsList: any[]
  ): Promise<BulkFeatureResult> {
    // Execute feature for multiple inputs with progress tracking
  }

  async getFeatureUsageStats(
    providerId: number,
    featureId?: string,
    dateRange?: DateRange
  ): Promise<UsageStats> {
    // Get usage statistics for features
  }
}
```

## 🔧 Development Robustness Framework

### 1. Code Quality Enforcement
```json
// package.json scripts for robustness
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "nodemon --exec ts-node src/app.ts",
    "dev:client": "cd frontend && npm run dev",
    "build": "npm run build:server && npm run build:client",
    "build:server": "tsc && npm run copy-assets",
    "build:client": "cd frontend && npm run build",
    "test": "jest --coverage --detectOpenHandles",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "typecheck": "tsc --noEmit",
    "validate": "npm run typecheck && npm run lint && npm run test",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "ts-node prisma/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "prepare": "husky install"
  }
}
```

### 2. Development Checkpoint System
```typescript
// Development progress tracking
interface DevelopmentCheckpoint {
  phase: string;
  completedFeatures: string[];
  nextSteps: string[];
  codeLocations: {
    [feature: string]: string[];
  };
  testCoverage: number;
  knownIssues: Issue[];
  timestamp: string;
}

// Auto-generated development state
export const CURRENT_STATE: DevelopmentCheckpoint = {
  phase: "Phase 2 - Provider System",
  completedFeatures: [
    "Multi-provider architecture",
    "PostgreSQL setup",
    "Surfe provider implementation"
  ],
  nextSteps: [
    "Complete provider registry",
    "Implement rate limiting",
    "Add webhook handling"
  ],
  // ... automatically updated
};
```

### 3. Error Recovery Templates
```typescript
// Template for AI to use when fixing errors
interface ErrorRecoveryTemplate {
  errorType: 'typescript' | 'runtime' | 'test' | 'build';
  pattern: string;
  solution: string;
  codeExample: string;
}

export const ERROR_RECOVERY_TEMPLATES: ErrorRecoveryTemplate[] = [
  {
    errorType: 'typescript',
    pattern: 'Property does not exist on type',
    solution: 'Add proper type definition or type assertion',
    codeExample: `
// Before (error)
const result = response.data.items;

// After (fixed)
interface ApiResponse {
  data: {
    items: Item[];
  };
}
const result = (response as ApiResponse).data.items;
    `
  },
  // ... more templates
];
```

### 4. AI Development Continuity System
```markdown
## 🤖 AI Development Continuity Protocol

### Phase Completion Checklist
Before moving to next phase, ensure:
- [ ] All TypeScript compiles without errors
- [ ] All tests pass (npm run test)
- [ ] ESLint shows no errors (npm run lint)
- [ ] Code coverage above 80%
- [ ] Database migrations successful
- [ ] Docker containers start correctly
- [ ] API endpoints respond correctly
- [ ] Frontend components render without errors

### Code Standards Enforcement
1. **Naming Conventions**:
   - Files: camelCase for functions, PascalCase for classes
   - Variables: camelCase
   - Constants: UPPER_SNAKE_CASE
   - Interfaces: PascalCase with 'I' prefix (IUserData)

2. **File Structure Rules**:
   - Max 200 lines per file
   - One main export per file
   - Clear separation of concerns
   - Proper import organization

3. **Error Handling Pattern**:
   ```typescript
   try {
     const result = await riskyOperation();
     return { success: true, data: result };
   } catch (error) {
     logger.error('Operation failed', { error, context });
     return { success: false, error: error.message };
   }
   ```

### Chat Continuation Protocol
When chat limit is reached:

1. **Generate Handoff Report**:
   ```markdown
   ## Development Handoff Report
   **Current Phase**: [Phase Name]
   **Completion**: [X]% complete
   **Last Working State**: [Commit hash or description]
   **Next Immediate Task**: [Specific next step]
   **Files Modified**: [List of files]
   **Known Issues**: [Any current problems]
   **Test Status**: [All passing/specific failures]
   **Dependencies**: [Any pending installations]
   ```

2. **State Preservation**:
   - All code changes committed to git
   - Database schema exported
   - Environment variables documented
   - Current API endpoints tested and documented

3. **Resume Instructions**:
   ```bash
   # To resume development:
   git checkout [latest-branch]
   npm install
   docker-compose up -d
   npm run db:migrate
   npm run test
   npm run dev
   ```
```

### 5. Automated Development Validation
```typescript
// Automated validation before each development step
export class DevelopmentValidator {
  static async validatePhaseCompletion(phase: string): Promise<ValidationResult> {
    const results = await Promise.all([
      this.checkTypeScript(),
      this.runTests(),
      this.checkLinting(),
      this.validateAPI(),
      this.checkDatabase(),
      this.validateSecurity()
    ]);
    
    return {
      phase,
      passed: results.every(r => r.success),
      results,
      readyForNext: results.every(r => r.success)
    };
  }
  
  private static async checkTypeScript(): Promise<CheckResult> {
    // Run tsc --noEmit to check for TypeScript errors
  }
  
  private static async runTests(): Promise<CheckResult> {
    // Run jest and ensure all tests pass
  }
  
  // ... other validation methods
}
```

## 🛠️ Essential Development Tools & Configurations

### Complete Backend Package.json
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
    "copy-assets": "cp -r src/assets dist/ || true",
    "test": "jest --coverage --detectOpenHandles --forceExit",
    "test:watch": "jest --watch",
    "test:e2e": "jest --config jest.e2e.config.js",
    "lint": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "typecheck": "tsc --noEmit",
    "validate": "npm run typecheck && npm run lint && npm run test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "ts-node prisma/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "db:studio": "prisma studio",
    "docs:generate": "swagger-jsdoc -d swaggerDef.js src/routes/*.ts -o docs/swagger.json",
    "docs:serve": "swagger-ui-serve docs/swagger.json",
    "prepare": "husky install",
    "clean": "rm -rf dist coverage",
    "pm2:start": "pm2 start ecosystem.config.js",
    "pm2:stop": "pm2 stop ecosystem.config.js",
    "pm2:restart": "pm2 restart ecosystem.config.js"
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
    "prisma": "^5.1.1",
    "zod": "^3.21.4",
    "winston": "^3.10.0",
    "winston-daily-rotate-file": "^4.7.1",
    "csv-parser": "^3.0.0",
    "csv-writer": "^1.6.0",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.32.1",
    "archiver": "^5.3.1",
    "mime-types": "^2.1.35",
    "node-cron": "^3.0.2",
    "crypto-js": "^4.1.1",
    "dotenv": "^16.3.1",
    "joi": "^17.9.2",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0",
    "prometheus-api-metrics": "^3.2.2",
    "newrelic": "^11.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.4.2",
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13",
    "@types/compression": "^1.7.2",
    "@types/bcryptjs": "^2.4.2",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/multer": "^1.4.7",
    "@types/archiver": "^5.3.2",
    "@types/mime-types": "^2.1.1",
    "@types/node-cron": "^3.0.8",
    "@types/crypto-js": "^4.1.1",
    "@types/jest": "^29.5.3",
    "@types/supertest": "^2.0.12",
    "@types/swagger-jsdoc": "^6.0.1",
    "@types/swagger-ui-express": "^4.1.3",
    "@typescript-eslint/eslint-plugin": "^6.1.0",
    "@typescript-eslint/parser": "^6.1.0",
    "eslint": "^8.45.0",
    "eslint-config-prettier": "^8.8.0",
    "eslint-plugin-prettier": "^5.0.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.3",
    "lint-staged": "^13.2.3",
    "jest": "^29.6.1",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "nodemon": "^3.0.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.6",
    "concurrently": "^8.2.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "lint-staged": {
    "*.{ts,js}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

### Complete Prisma Schema
```prisma
// prisma/schema.prisma
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

  // Relations
  features      ProviderFeature[]
  rateLimits    RateLimit[]
  apiUsage      ApiUsage[]
  integrations  ProviderIntegration[]
  tiers         ProviderTier[]

  @@map("providers")
}

model FeatureCategory {
  id          Int    @id @default(autoincrement())
  categoryId  String @unique @db.VarChar(50)
  name        String @db.VarChar(100)
  description String?
  icon        String? @db.VarChar(50)
  color       String? @db.VarChar(20)
  sortOrder   Int    @default(0)
  isPremium   Boolean @default(false)

  // Relations
  features ProviderFeature[]

  @@map("feature_categories")
}

model ProviderFeature {
  id              Int      @id @default(autoincrement())
  providerId      Int
  featureId       String   @db.VarChar(100)
  featureName     String   @db.VarChar(200)
  categoryId      String   @db.VarChar(50)
  endpoint        String   @db.VarChar(500)
  httpMethod      String   @default("POST") @db.VarChar(10)
  requestSchema   Json?
  responseSchema  Json?
  creditsPerRequest Int    @default(1)
  rateLimitOverride Int?
  isActive        Boolean  @default(true)
  description     String?
  exampleRequest  Json?
  exampleResponse Json?
  createdAt       DateTime @default(now())

  // Relations
  provider  Provider        @relation(fields: [providerId], references: [id], onDelete: Cascade)
  category  FeatureCategory @relation(fields: [categoryId], references: [categoryId])
  parameters FeatureParameter[]
  usage     FeatureUsage[]

  @@unique([providerId, featureId])
  @@map("provider_features")
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

  // Relations
  providerFeature ProviderFeature @relation(fields: [providerFeatureId], references: [id], onDelete: Cascade)

  @@map("feature_parameters")
}

model ProviderTier {
  id                  Int     @id @default(autoincrement())
  providerId          Int
  tierName            String  @db.VarChar(50) // free, basic, pro, enterprise
  featuresIncluded    Json?
  rateLimits          Json?
  monthlyQuota        Int?
  pricingModel        String  @db.VarChar(50) // credit, subscription, pay-per-use
  costPerCredit       Decimal? @db.Decimal(10,4)
  minimumMonthlyCost  Decimal? @db.Decimal(10,2)

  // Relations
  provider Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@map("provider_tiers")
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

  // Relations
  provider Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@map("provider_integrations")
}

// Rate Limiting & Usage Tracking
model RateLimit {
  id           Int      @id @default(autoincrement())
  providerId   Int
  endpoint     String   @db.VarChar(100)
  requestsCount Int     @default(0)
  windowStart  DateTime @default(now())
  resetAt      DateTime?

  // Relations
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

  // Relations
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

  // Relations
  feature ProviderFeature @relation(fields: [providerId, featureId], references: [providerId, featureId], onDelete: Cascade)

  @@index([providerId, featureId, date])
  @@map("feature_usage")
}

// Enrichment Operations
model EnrichmentJob {
  id              String    @id @default(cuid())
  userId          String?   @db.VarChar(100)
  jobType         String    @db.VarChar(50) // people-search, company-enrich, etc.
  providerId      Int?
  featureId       String?   @db.VarChar(100)
  status          String    @default("pending") @db.VarChar(20) // pending, running, completed, failed
  totalRecords    Int       @default(0)
  processedRecords Int      @default(0)
  successfulRecords Int     @default(0)
  failedRecords   Int       @default(0)
  inputData       Json?
  outputData      Json?
  errorDetails    Json?
  creditsUsed     Int       @default(0)
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  logs EnrichmentLog[]

  @@index([userId, status])
  @@index([createdAt])
  @@map("enrichment_jobs")
}

model EnrichmentLog {
  id        Int      @id @default(autoincrement())
  jobId     String
  level     String   @db.VarChar(10) // info, warn, error
  message   String
  details   Json?
  timestamp DateTime @default(now())

  // Relations
  job EnrichmentJob @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@index([jobId, timestamp])
  @@map("enrichment_logs")
}

// User Preferences & Settings
model UserPreference {
  id              Int      @id @default(autoincrement())
  userId          String   @unique @db.VarChar(100)
  defaultProvider String?  @db.VarChar(50)
  theme           String   @default("light") @db.VarChar(20)
  timezone        String   @default("UTC") @db.VarChar(50)
  preferences     Json?
  columnMappings  Json?
  waterfallConfigs Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("user_preferences")
}

// System Health & Monitoring
model SystemHealth {
  id              Int      @id @default(autoincrement())
  component       String   @db.VarChar(50) // database, redis, provider-api
  status          String   @db.VarChar(20) // healthy, degraded, down
  responseTime    Int?     // milliseconds
  errorRate       Float?   // percentage
  lastChecked     DateTime @default(now())
  details         Json?

  @@index([component, lastChecked])
  @@map("system_health")
}

model ErrorLog {
  id            Int      @id @default(autoincrement())
  errorCode     String   @db.VarChar(50)
  errorMessage  String
  stackTrace    String?
  requestData   Json?
  userId        String?  @db.VarChar(100)
  endpoint      String?  @db.VarChar(200)
  httpMethod    String?  @db.VarChar(10)
  userAgent     String?  @db.VarChar(500)
  ipAddress     String?  @db.VarChar(45)
  timestamp     DateTime @default(now())

  @@index([errorCode, timestamp])
  @@index([timestamp])
  @@map("error_logs")
}
```

### Complete Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Create uploads directory
RUN mkdir -p uploads temp logs
RUN chown -R nodejs:nodejs uploads temp logs

USER nodejs

EXPOSE 3001

ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js || exit 1

CMD ["npm", "start"]
```

### PM2 Ecosystem Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'leadenrich-api',
      script: 'dist/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max_old_space_size=1024',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s'
    },
    {
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
    }
  ]
};
```

### ESLint Configuration (.eslintrc.js)
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-const': 'error',
    'no-console': 'warn',
    'no-debugger': 'error'
  },
  env: {
    node: true,
    jest: true
  }
};
```

### Prettier Configuration (.prettierrc)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### TypeScript Configuration (tsconfig.json)
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

### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts

## 🚨 **ULTIMATE DEVELOPMENT ROBUSTNESS CHECKLIST**

### **PRE-DEVELOPMENT SETUP (MANDATORY)**
```bash
# 1. Verify Node.js version
node --version  # Must be >= 18.0.0

# 2. Create project with exact structure
mkdir leadenrich-pro && cd leadenrich-pro
mkdir -p backend/{src,tests,prisma,logs,uploads,temp}
mkdir -p frontend/{src,public}
mkdir -p docs

# 3. Initialize with exact configurations
npm init -y
git init
git add .gitignore
git commit -m "Initial commit"

# 4. Set up development environment
cp .env.example .env
docker-compose up -d postgres redis
npm install
npx prisma generate
npx prisma migrate dev
npm run test

# 5. Verify all systems working
npm run validate  # Must pass 100%
```

### **DEVELOPMENT PHASE COMPLETION PROTOCOL**
Before proceeding to any next phase, **MANDATORY** completion checklist:

#### **Phase 1 Completion Checklist**
- [ ] ✅ TypeScript compiles with zero errors (`npm run typecheck`)
- [ ] ✅ ESLint passes with zero warnings (`npm run lint`)
- [ ] ✅ All tests pass with 80%+ coverage (`npm run test`)
- [ ] ✅ Docker containers start successfully (`docker-compose up`)
- [ ] ✅ Database migrations apply cleanly (`npm run db:migrate`)
- [ ] ✅ Prisma client generates without errors (`npm run db:generate`)
- [ ] ✅ Health check endpoint responds (`curl localhost:3001/health`)
- [ ] ✅ API documentation generates (`npm run docs:generate`)
- [ ] ✅ Pre-commit hooks work (`git commit` triggers validation)
- [ ] ✅ All environment variables documented
- [ ] ✅ Provider registry initializes correctly
- [ ] ✅ Redis connection established
- [ ] ✅ Queue system operational

**IF ANY ITEM FAILS, DO NOT PROCEED TO NEXT PHASE**

#### **Error Recovery Protocol**
When encountering errors, use this systematic approach:

1. **TypeScript Errors**:
```bash
# Fix compilation errors
npm run typecheck 2>&1 | tee typescript-errors.log
# Address each error systematically
# Re-run until zero errors
```

2. **Linting Errors**:
```bash
# Auto-fix what's possible
npm run lint --fix
# Manual fixes for remaining issues
# Verify: npm run lint (should show 0 problems)
```

3. **Test Failures**:
```bash
# Run tests with verbose output
npm run test -- --verbose
# Fix failing tests one by one
# Ensure coverage stays above 80%
```

4. **Database Issues**:
```bash
# Reset database if corrupted
npm run db:reset
# Re-run migrations
npm run db:migrate
# Verify with: npm run db:studio
```

### **AI PROMPT TEMPLATES FOR ROBUSTNESS**

#### **Phase 1 Bulletproof Prompt**
```
Create Phase 1 with MAXIMUM robustness and error prevention:

CRITICAL REQUIREMENTS:
1. Every file must compile without TypeScript errors
2. Every function must have explicit return types
3. Every interface must be complete and accurate
4. All dependencies must use EXACT versions (no ^)
5. Include comprehensive error handling for every operation
6. Add input validation for every function parameter
7. Include detailed JSDoc comments for all exports

VALIDATION REQUIREMENTS:
- Zero TypeScript errors (npm run typecheck)
- Zero ESLint warnings (npm run lint)
- 100% test coverage for utility functions
- All Docker services start successfully
- Health checks pass for all components

ERROR PREVENTION:
- Use strict TypeScript configuration
- Implement comprehensive input validation
- Add detailed error messages with error codes
- Include retry logic for all external calls
- Add timeout handling for all async operations

STRUCTURE REQUIREMENTS:
- Follow exact folder structure provided
- Use consistent naming conventions
- Include comprehensive type definitions
- Add proper error boundary implementations
- Include detailed logging for debugging

TESTING REQUIREMENTS:
- Unit tests for all utility functions
- Integration tests for all API endpoints
- Error scenario testing
- Performance testing for critical paths

If ANY requirement is not met, indicate what's missing and how to fix it.
Create code that will work perfectly across chat sessions.
```

#### **Error Recovery Prompt Template**
```
Fix the following development issue systematically:

CURRENT STATE:
- Error Type: [TypeScript/ESLint/Test/Runtime]
- Error Message: [Exact error message]
- Files Affected: [List of files]
- Last Working State: [Description]

REQUIRED FIXES:
1. Analyze the root cause of the error
2. Provide exact code fixes with line numbers
3. Ensure fixes don't break existing functionality
4. Add tests to prevent regression
5. Update documentation if needed

VALIDATION STEPS:
1. Run npm run typecheck (must pass)
2. Run npm run lint (must pass)
3. Run npm run test (must pass)
4. Verify all functionality works

Provide complete, working code that resolves the issue permanently.
```

### **CHAT CONTINUATION FAILSAFE SYSTEM**

#### **Emergency Handoff Template (USE BEFORE EVERY CHAT LIMIT)**
```markdown
# 🚨 CRITICAL DEVELOPMENT HANDOFF - IMMEDIATE ACTION REQUIRED

## EXACT CURRENT STATE
**Phase**: [Phase X - Specific Feature Being Worked On]
**Last Command Run**: [Exact command and result]
**Git Status**: [git status output]
**Build Status**: [✅ Working / ❌ Broken + exact error]

## FILES MODIFIED IN THIS SESSION
[List every file touched with what was changed]

## IMMEDIATE NEXT STEP
[Single, specific action to take next]

## VALIDATION COMMANDS (RUN IN ORDER)
```bash
# 1. Check git status
git status

# 2. Verify TypeScript
npm run typecheck

# 3. Check linting
npm run lint

# 4. Run tests
npm run test

# 5. Check build
npm run build

# 6. Start services
docker-compose up -d
npm run dev
```

## AI RESUME PROMPT
"Continue LeadEnrich Pro development. Current state: [paste above info]. 

Phase completion requirements:
- Zero TypeScript errors
- Zero ESLint warnings  
- All tests passing
- Docker services running
- API responding on localhost:3001

Next step: [specific action]

Use error recovery protocol if issues found. Validate everything before proceeding."

## KNOWN ISSUES TO FIX
[Any current problems that need resolution]
```

### **QUALITY GATES (AUTOMATIC ENFORCEMENT)**

#### **.husky/pre-commit** (Enhanced)
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running comprehensive pre-commit validation..."

# 1. Type checking (BLOCKING)
echo "📝 Type checking..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found. Commit blocked."
  echo "Fix errors with: npm run typecheck"
  exit 1
fi

# 2. Linting (BLOCKING)
echo "🧹 Linting..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint errors found. Commit blocked."
  echo "Auto-fix with: npm run lint --fix"
  exit 1
fi

# 3. Testing (BLOCKING)
echo "🧪 Running tests..."
npm run test -- --passWithNoTests --coverage --coverageThreshold='{"global":{"lines":80}}'
if [ $? -ne 0 ]; then
  echo "❌ Tests failed or coverage below 80%. Commit blocked."
  exit 1
fi

# 4. Build verification (BLOCKING)
echo "🏗️ Build verification..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Commit blocked."
  exit 1
fi

# 5. Security audit (WARNING)
echo "🔒 Security audit..."
npm audit --audit-level high
if [ $? -ne 0 ]; then
  echo "⚠️ Security vulnerabilities found. Review recommended."
fi

echo "✅ All quality gates passed! Proceeding with commit."
```

### **DEVELOPMENT ENVIRONMENT VERIFICATION SCRIPT**
```bash
#!/bin/bash
# scripts/verify-setup.sh

echo "🔍 LeadEnrich Pro Setup Verification"
echo "==================================="

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
if [ "$(printf '%s\n' "18.0.0" "$NODE_VERSION" | sort -V | head -n1)" = "18.0.0" ]; then
  echo "✅ Node.js version: $NODE_VERSION"
else
  echo "❌ Node.js must be >= 18.0.0. Current: $NODE_VERSION"
  exit 1
fi

# Check npm version
NPM_VERSION=$(npm --version)
echo "✅ npm version: $NPM_VERSION"

# Check Docker
if command -v docker &> /dev/null; then
  echo "✅ Docker installed"
  docker --version
else
  echo "❌ Docker not installed"
  exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
  echo "✅ Docker Compose installed"
else
  echo "❌ Docker Compose not installed"
  exit 1
fi

# Check required ports
for port in 3001 5432 6379; do
  if lsof -i :$port > /dev/null 2>&1; then
    echo "⚠️ Port $port is in use"
  else
    echo "✅ Port $port available"
  fi
done

# Verify project structure
REQUIRED_DIRS=(
  "backend/src"
  "backend/prisma"
  "frontend/src"
  "docs"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "✅ Directory exists: $dir"
  else
    echo "❌ Missing directory: $dir"
    exit 1
  fi
done

# Check environment files
if [ -f ".env" ]; then
  echo "✅ Environment file exists"
else
  echo "❌ Missing .env file"
  exit 1
fi

echo ""
echo "🎉 Setup verification complete!"
echo "Ready for development."
```

This enhanced robustness system now provides:

1. **Complete Configuration Files** - Exact versions, no ambiguity
2. **Comprehensive Error Handling** - Every possible error covered
3. **Bulletproof Chat Continuity** - Detailed handoff protocols
4. **Quality Gates** - Automatic prevention of bad code
5. **Verification Scripts** - Environment validation
6. **Recovery Protocols** - Systematic error resolution
7. **Production Configurations** - Ready for deployment

The system is now **bulletproof** against the issues you experienced before. Every potential failure point has been addressed with prevention, detection, and recovery mechanisms.

### Phase 1: Project Setup & Multi-Provider Foundation (Week 1)
**AI Prompt Template for Phase 1:**
```
Create a Node.js Express TypeScript backend with multi-provider architecture and maximum robustness:

PROJECT STRUCTURE & QUALITY:
1. TypeScript configuration with STRICT mode enabled
2. ESLint + Prettier configuration for code quality
3. Husky pre-commit hooks for validation
4. Jest testing setup with coverage requirements
5. Docker Compose for consistent development environment
6. GitHub Actions CI/CD pipeline configuration

DATABASE & INFRASTRUCTURE:
1. PostgreSQL setup with Prisma ORM (strict mode)
2. Redis integration for caching and queues
3. Database migration system with rollback capability
4. Backup and recovery scripts
5. Connection pooling and performance optimization

DEVELOPMENT ROBUSTNESS:
1. Comprehensive error handling with typed errors
2. Request/response validation with Zod schemas
3. API documentation with OpenAPI/Swagger
4. Logging system with structured logs (Winston)
5. Health check endpoints for monitoring
6. Rate limiting middleware
7. Security middleware (helmet, cors, sanitization)

MULTI-PROVIDER ARCHITECTURE:
1. Abstract provider interface with comprehensive typing
2. Provider factory pattern for dynamic loading
3. Provider registry with health monitoring
4. Standardized response transformation layer
5. Provider-specific configuration management with validation

DEVELOPMENT CONTINUITY FEATURES:
1. Development checkpoint tracking system
2. Code generation templates for consistency
3. Error recovery templates and patterns
4. Automated validation scripts
5. Git hooks for code quality enforcement
6. Development state preservation tools

CORE INFRASTRUCTURE:
1. Express server with comprehensive middleware stack
2. Socket.IO setup for real-time updates
3. Bull Queue for background job processing
4. File upload handling with validation and security
5. Webhook handling system
6. API versioning strategy

TESTING & VALIDATION:
1. Unit test templates for all components
2. Integration test setup
3. API endpoint testing
4. Database testing with test containers
5. Performance testing setup
6. Security testing configuration

Include:
- Complete package.json with all dev dependencies
- Prisma schema with comprehensive tables
- Docker compose with all services
- ESLint/Prettier configurations
- GitHub Actions workflow
- Detailed README with setup instructions
- Environment template files
- Development scripts and tools

IMPORTANT: Create this with maximum type safety and error prevention. 
Every function should be typed, every input validated, every error handled.
The code should be so robust that an AI can continue development without issues.
```

### Chat Continuation Emergency Protocol

**When Chat Limit is Reached - Use This Exact Template:**

```markdown
# 🚨 DEVELOPMENT HANDOFF REPORT

## Current Status
**Phase**: [Current Phase Name]  
**Completion**: [X]% complete  
**Last Successfully Completed**: [Last working feature]  
**Currently Working On**: [Specific current task]  

## Technical State
**Git Status**: [Committed/Uncommitted changes]  
**Build Status**: ✅ Compiles / ❌ Has errors  
**Test Status**: ✅ All passing / ❌ [X] failing  
**Database**: ✅ Migrated / ❌ Needs migration  

## Files Modified (Last Session)
- [file1.ts] - [what was changed]
- [file2.ts] - [what was changed]
- [etc...]

## Immediate Next Steps
1. [Very specific next task]
2. [Second task if needed]
3. [Third task if needed]

## Known Issues/Blockers
- [Any TypeScript errors]
- [Any failing tests]
- [Any configuration issues]

## Resume Commands
```bash
# To continue development:
git status
npm install
docker-compose up -d
npm run db:migrate
npm run test
npm run dev
```

## AI Instructions for Next Session
Use this EXACT prompt to continue:

"I need to continue development of the LeadEnrich Pro application. Here's the handoff report: [paste above report]. 

Please:
1. Analyze the current state
2. Fix any immediate issues
3. Continue with the next steps listed
4. Follow the original development guide patterns
5. Maintain the same code quality standards

If there are any errors, use the error recovery templates in the guide to fix them systematically."

## Code Quality Checklist (Before Handoff)
- [ ] TypeScript compiles (npm run typecheck)
- [ ] ESLint passes (npm run lint)
- [ ] Tests pass (npm run test)
- [ ] Code formatted (npm run format)
- [ ] Git committed with clear message
```

**Use this template EVERY TIME before chat limit!**

### Phase 2: Multi-Provider System & Clay Integration (Week 1-2)
**AI Prompt Template for Phase 2:**
```
Implement comprehensive multi-provider system supporting 50+ enrichment providers:

CORE PROVIDER ARCHITECTURE:
1. Universal provider interface supporting any provider type
2. Provider category system (Major Database, Email Specialists, AI Research, etc.)
3. Provider tier management (Free, Basic, Pro, Enterprise)
4. Dynamic capability discovery and validation
5. Waterfall enrichment system like Clay's approach

MAJOR PROVIDERS IMPLEMENTATION:
1. Surfe Provider (current) - All v2 endpoints
2. Apollo.io Provider - 275M contacts, people/company search, email finder
3. ZoomInfo Provider - 265M professionals, buyer intent, technographics
4. Clearbit/HubSpot Breeze - Real-time enrichment, visitor tracking
5. Hunter.io Provider - Email finder, verification, 107M emails
6. BetterEnrich Provider - All 20+ specialized features

AI & RESEARCH PROVIDERS:
1. OpenAI/ChatGPT integration for custom research
2. Anthropic Claude integration for advanced analysis
3. Google Gemini integration for multimodal AI

SPECIALIZED PROVIDERS:
1. ContactOut - LinkedIn email extraction, mobile numbers
2. Ocean.io - Company lookalikes, competitive intelligence
3. PitchBook - Private market data, funding information
4. HG Insights - Technology intelligence, software usage
5. Findymail - High-deliverability email finding
6. Datagma - Contact verification and validation

WATERFALL ENRICHMENT SYSTEM:
1. Provider priority matrix for different operations
2. Automatic fallback between providers
3. Quality scoring and threshold management
4. Cost optimization across providers
5. Real-time provider health monitoring

GEOGRAPHIC & SPECIALIZED:
1. Google Maps integration for local business data
2. Semrush for web analytics and SEO data
3. SimilarWeb for website intelligence
4. LinkedIn Sales Navigator for professional data

PROVIDER MANAGEMENT FEATURES:
1. Dynamic provider discovery and registration
2. Real-time capability assessment
3. Usage analytics across all providers
4. Cost tracking and optimization
5. Provider performance monitoring
6. Automatic provider rotation for rate limits
7. Bulk operation distribution across providers

DATABASE ENHANCEMENTS:
1. Provider categories and tiers tables
2. Provider capabilities matrix
3. Integration configurations
4. Usage tracking per provider per feature
5. Cost analysis and optimization data

WATERFALL CONFIGURATION:
1. Operation-specific provider chains
2. Conditional provider selection
3. Quality thresholds and scoring
4. Timeout and retry configurations
5. Cost-aware provider selection

Include:
- Complete provider implementation for all major services
- Waterfall enrichment engine
- Provider health monitoring system
- Cost optimization algorithms
- Real-time provider switching
- Comprehensive error handling per provider
- Usage analytics and reporting

IMPORTANT: Design this to handle Clay's 50+ provider ecosystem.
The system should automatically discover and integrate new providers.
Implement Clay-style waterfall enrichment with automatic fallbacks.
Support any provider configuration without code changes.
```

### Phase 3: File Processing & Data Management (Week 2)
**AI Prompt Template for Phase 3:**
```
Implement file processing and data management features:

1. CSV file parser with encoding detection
2. Domain cleaning and validation utilities
3. Column mapping and selection logic
4. Duplicate detection algorithms
5. Data transformation pipelines
6. Batch processing with progress tracking
7. Memory-efficient streaming for large files
8. Export functionality (CSV, JSON)
9. Data preview generation
10. Error handling for malformed data

Include utilities for:
- Email validation and cleaning
- Phone number formatting
- URL/domain standardization
- Name parsing and formatting
```

### Phase 4: Frontend Foundation & Feature Marketplace (Week 2-3)
**AI Prompt Template for Phase 4:**
```
Create a React TypeScript frontend with dynamic feature marketplace support:

PROJECT SETUP & ARCHITECTURE:
1. Vite + React + TypeScript with strict configuration
2. Tailwind CSS and shadcn/ui component library
3. React Router with feature-based routing
4. Zustand store with provider and feature management
5. React Query for server state management
6. Socket.IO client for real-time features

FEATURE MARKETPLACE SYSTEM:
1. Dynamic provider feature discovery
2. Feature categorization with visual organization
3. Feature search and filtering capabilities
4. Provider comparison interface
5. Feature usage analytics dashboard
6. Credit usage tracking per feature
7. Bulk operation support for all features

CORE COMPONENTS STRUCTURE:
1. Layout Components:
   - Header with provider switcher
   - Sidebar with feature categories
   - Footer with usage stats
2. Feature Marketplace:
   - FeatureMarketplace main component
   - FeatureCategoryCard for each category
   - FeatureCard for individual features
   - FeatureExecutionPanel for running features
   - BulkFeaturePanel for CSV operations
3. Provider Management:
   - ProviderSelector dropdown
   - ProviderSettings configuration
   - ProviderUsageStats dashboard
4. Data Processing:
   - FileUpload with drag-and-drop
   - ColumnMapping for CSV fields
   - DataPreview with real-time updates
   - ProgressTracking for bulk operations
5. Results Display:
   - ResultsTable with sorting/filtering
   - ResultsExport with format options
   - ResultsAnalytics with charts

DYNAMIC FEATURE SYSTEM:
1. Feature discovery API integration
2. Dynamic form generation based on feature parameters
3. Real-time parameter validation
4. Feature-specific input/output handling
5. Bulk operation queue management
6. Progress tracking for all feature types

PROVIDER-SPECIFIC INTEGRATIONS:
1. BetterEnrich feature categories (8 categories, 20+ features)
2. Surfe standard features (5 core features)
3. Apollo/Clay feature placeholders
4. Generic provider template for future additions

UI/UX REQUIREMENTS:
1. Responsive design for all screen sizes
2. Dark/light mode toggle
3. Feature search and filtering
4. Intuitive feature organization
5. Real-time progress indicators
6. Error handling with user-friendly messages
7. Tooltip help system for complex features

STATE MANAGEMENT:
1. Provider state (selected, available, configurations)
2. Feature state (available, selected, parameters)
3. Operation state (running, completed, failed)
4. UI state (theme, preferences, layout)
5. Cache management for feature definitions

REAL-TIME FEATURES:
1. Live progress updates via WebSocket
2. Real-time console logs display
3. Credit usage monitoring
4. Rate limit notifications
5. Error reporting and recovery

Include:
- Complete component architecture
- Zustand stores for all state management
- React Query integration for API calls
- Socket.IO client setup
- Feature marketplace UI designs
- Responsive layout system
- Error boundary implementation
- Toast notification system

IMPORTANT: Design this to handle ANY number of features from ANY provider.
The UI should dynamically adapt to new providers and features without code changes.
Make it user-friendly for both technical and non-technical users.
```

### Phase 5: Advanced Feature Implementation & Bulk Operations (Week 3)
**AI Prompt Template for Phase 5:**
```
Implement advanced feature execution and bulk operations system:

FEATURE EXECUTION SYSTEM:
1. Dynamic feature parameter validation
2. Real-time feature execution with progress tracking
3. Feature-specific error handling and recovery
4. Result standardization across all providers
5. Feature usage analytics and reporting

BULK OPERATIONS FRAMEWORK:
1. CSV upload and intelligent column mapping
2. Bulk feature execution with queue management
3. Progress tracking with detailed statistics
4. Partial failure handling and retry logic
5. Real-time progress updates via WebSocket
6. Background job management and monitoring

PROVIDER FEATURE INTEGRATION:
1. BetterEnrich all 20+ features implementation
2. Feature categorization and organization
3. Dynamic UI generation for each feature
4. Provider-specific parameter handling
5. Credit calculation and tracking per feature

ADVANCED DATA PROCESSING:
1. Smart column mapping with AI suggestions
2. Data validation and cleaning pipelines
3. Duplicate detection across multiple columns
4. Data transformation and standardization
5. Export customization for different feature outputs

UI IMPLEMENTATIONS:
1. Feature marketplace with search and filtering
2. Category-based feature organization
3. Feature comparison and selection tools
4. Bulk operation dashboard
5. Progress monitoring with real-time logs
6. Results analysis and visualization

PERFORMANCE OPTIMIZATIONS:
1. Lazy loading for feature definitions
2. Virtual scrolling for large datasets
3. Efficient state management for bulk operations
4. Memory optimization for large CSV files
5. Background processing with Web Workers

ERROR HANDLING & RECOVERY:
1. Feature-specific error messages
2. Automatic retry for failed operations
3. Partial success handling in bulk operations
4. User-friendly error reporting
5. Recovery suggestions and actions

REAL-TIME FEATURES:
1. Live progress bars for all operations
2. Console logs streaming to frontend
3. Credit usage monitoring and alerts
4. Rate limit notifications and handling
5. WebSocket connection management

Include:
- Complete feature execution engine
- Bulk operation management system
- Advanced data processing pipeline
- Real-time progress tracking
- Error handling and recovery system
- Performance optimization implementations
- User experience enhancements

Focus on making the system handle any provider feature seamlessly.
```

### Phase 6: Advanced Features (Week 3-4)
**AI Prompt Template for Phase 6:**
```
Implement advanced features and optimizations:

1. Advanced filtering and search capabilities
2. Data deduplication algorithms
3. Smart column mapping suggestions
4. Batch operation queue management
5. Progress analytics and reporting
6. Export customization options
7. Data validation and cleaning tools
8. Performance optimizations
9. Caching strategies
10. Error recovery mechanisms

Include comprehensive testing setup and documentation.
```

### Phase 7: Testing & Polish (Week 4)
**AI Prompt Template for Phase 7:**
```
Complete testing, optimization, and final polish:

1. Unit tests for all utility functions
2. Integration tests for API endpoints
3. Frontend component testing
4. End-to-end testing scenarios
5. Performance optimization
6. Security hardening
7. Error handling improvements
8. UI/UX refinements
9. Documentation completion
10. Deployment preparation

Include complete test coverage and deployment guides.
```

---

## 📁 Project Structure

```
leads-enrichment-app/
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
│   │   │   │   ├── BaseProvider.ts
│   │   │   │   ├── SurfeProvider.ts
│   │   │   │   ├── ApolloProvider.ts (skeleton)
│   │   │   │   ├── ClayProvider.ts (skeleton)
│   │   │   │   └── BetterEnrichProvider.ts (skeleton)
│   │   │   ├── ProviderFactory.ts
│   │   │   ├── ProviderRegistry.ts
│   │   │   ├── fileProcessingService.ts
│   │   │   ├── dataCleaningService.ts
│   │   │   ├── exportService.ts
│   │   │   └── queueService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── upload.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── errorHandler.ts
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   ├── encryption.ts
│   │   │   └── helpers.ts
│   │   ├── types/
│   │   │   ├── providers/
│   │   │   │   ├── BaseTypes.ts
│   │   │   │   ├── SurfeTypes.ts
│   │   │   │   ├── ApolloTypes.ts
│   │   │   │   └── ClayTypes.ts
│   │   │   ├── apiTypes.ts
│   │   │   └── commonTypes.ts
│   │   ├── routes/
│   │   │   ├── providers.ts
│   │   │   ├── people.ts
│   │   │   ├── companies.ts
│   │   │   ├── upload.ts
│   │   │   ├── jobs.ts
│   │   │   └── export.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── environment.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── jobs/
│   │   │   ├── enrichmentJob.ts
│   │   │   ├── exportJob.ts
│   │   │   └── cleanupJob.ts
│   │   └── app.ts
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── forms/
│   │   │   ├── tables/
│   │   │   ├── upload/
│   │   │   ├── progress/
│   │   │   └── common/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PeopleSearch.tsx
│   │   │   ├── CompanySearch.tsx
│   │   │   ├── LookalikeSearch.tsx
│   │   │   └── BulkEnrichment.tsx
│   │   ├── stores/
│   │   │   ├── appStore.ts
│   │   │   ├── dataStore.ts
│   │   │   └── progressStore.ts
│   │   ├── services/
│   │   │   ├── apiClient.ts
│   │   │   ├── socketClient.ts
│   │   │   └── fileService.ts
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── docs/
    ├── API.md
    ├── DEPLOYMENT.md
    └── USER_GUIDE.md
```

---

## 🔧 Environment Configuration

### Backend Environment Variables
```env
# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/leadenrich
DIRECT_URL=postgresql://username:password@localhost:5432/leadenrich

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-jwt-secret-key

# Provider API Keys (Encrypted in database)
SURFE_API_KEY=your_surfe_api_key
APOLLO_API_KEY=your_apollo_api_key
CLAY_API_KEY=your_clay_api_key
BETTERENRICH_API_KEY=your_betterenrich_api_key

# Provider Configuration
SURFE_API_BASE_URL=https://api.surfe.com
SURFE_RATE_LIMIT=10
SURFE_DAILY_QUOTA=2000

# File Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=csv,xlsx
TEMP_DIR=./temp

# Queue Configuration
QUEUE_REDIS_URL=redis://localhost:6379
QUEUE_CONCURRENCY=5

# Webhook Configuration
WEBHOOK_SECRET=your-webhook-secret
WEBHOOK_BASE_URL=https://your-app.com/webhooks

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_ROTATION=daily
```

### Frontend Environment Variables
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001

# App Configuration
VITE_APP_NAME=LeadEnrich Pro
VITE_MAX_FILE_SIZE=52428800
VITE_SUPPORTED_FORMATS=csv,xlsx

# Feature Configuration
VITE_ENABLE_ADVANCED_FEATURES=true
VITE_ENABLE_BULK_OPERATIONS=true
VITE_ENABLE_FEATURE_MARKETPLACE=true
VITE_DEFAULT_PROVIDER=surfe

# Provider Features
VITE_SURFE_FEATURES=people-search,people-enrich,company-search,company-enrich,lookalike
VITE_BETTERENRICH_FEATURES=all
VITE_APOLLO_FEATURES=people-search,company-search,email-finder
VITE_CLAY_FEATURES=enrichment,social-enrichment
```

## 🎛️ Feature Management System

### Dynamic Feature Discovery
```typescript
// Frontend feature management
interface ProviderFeatureConfig {
  providerId: string;
  features: {
    [categoryId: string]: {
      name: string;
      features: FeatureItem[];
      icon: string;
      color: string;
    };
  };
}

interface FeatureItem {
  id: string;
  name: string;
  description: string;
  credits: number;
  inputFields: FeatureInputField[];
  outputSchema: any;
  isPopular: boolean;
  isBulkSupported: boolean;
}

// BetterEnrich feature categories for UI
const BETTERENRICH_FEATURE_CONFIG: ProviderFeatureConfig = {
  providerId: 'betterenrich',
  features: {
    enrichment: {
      name: 'Enrichment',
      icon: '🔍',
      color: 'blue',
      features: [
        {
          id: 'single-enrichment',
          name: 'Single Enrichment',
          description: 'Enrich contact with comprehensive data',
          credits: 1,
          isPopular: true,
          isBulkSupported: true,
          inputFields: [
            { name: 'email', type: 'email', required: true },
            { name: 'first_name', type: 'text', required: false },
            { name: 'last_name', type: 'text', required: false }
          ]
        },
        {
          id: 'waterfall-enrichment',
          name: 'Waterfall Enrichment',
          description: 'Multi-source enrichment with fallback',
          credits: 3,
          isPopular: true,
          isBulkSupported: true
        }
      ]
    },
    'email-finder': {
      name: 'Email Finder',
      icon: '📧',
      color: 'green',
      features: [
        {
          id: 'find-work-email',
          name: 'Find Work Email',
          description: 'Discover professional email addresses',
          credits: 1,
          isPopular: true,
          isBulkSupported: true
        },
        {
          id: 'find-email-from-linkedin',
          name: 'Email from LinkedIn',
          description: 'Extract email from LinkedIn profile',
          credits: 1,
          isPopular: false,
          isBulkSupported: true
        }
      ]
    },
    'ad-intelligence': {
      name: 'Ad Intelligence',
      icon: '📊',
      color: 'purple',
      features: [
        {
          id: 'check-google-ads',
          name: 'Google Ads Check',
          description: 'Check if company runs Google Ads',
          credits: 1,
          isPopular: false,
          isBulkSupported: true
        },
        {
          id: 'check-facebook-ads',
          name: 'Facebook Ads Check',
          description: 'Check if company runs Facebook Ads',
          credits: 1,
          isPopular: false,
          isBulkSupported: true
        },
        {
          id: 'check-linkedin-ads',
          name: 'LinkedIn Ads Check',
          description: 'Check if company runs LinkedIn Ads',
          credits: 1,
          isPopular: false,
          isBulkSupported: true
        }
      ]
    },
    'social-enrichment': {
      name: 'Social Enrichment',
      icon: '👥',
      color: 'indigo',
      features: [
        {
          id: 'find-social-urls',
          name: 'Social URLs by Website',
          description: 'Find social media profiles from website',
          credits: 1,
          isPopular: false,
          isBulkSupported: true
        },
        {
          id: 'find-linkedin-by-email',
          name: 'LinkedIn by Email',
          description: 'Find LinkedIn profile using email',
          credits: 1,
          isPopular: true,
          isBulkSupported: true
        }
      ]
    },
    normalization: {
      name: 'Normalization',
      icon: '🔧',
      color: 'orange',
      features: [
        {
          id: 'normalize-company',
          name: 'Normalize Company',
          description: 'Standardize company name format',
          credits: 0.1,
          isPopular: false,
          isBulkSupported: true
        },
        {
          id: 'normalize-person',
          name: 'Normalize Person',
          description: 'Standardize person name format',
          credits: 0.1,
          isPopular: false,
          isBulkSupported: true
        }
      ]
    },
    verification: {
      name: 'Verification',
      icon: '✅',
      color: 'red',
      features: [
        {
          id: 'check-dnc-list',
          name: 'DNC List Check',
          description: 'Check if US number is on Do Not Call list',
          credits: 0.5,
          isPopular: false,
          isBulkSupported: true
        },
        {
          id: 'check-phone-status',
          name: 'Phone Status Check',
          description: 'Verify phone number type and status',
          credits: 0.5,
          isPopular: false,
          isBulkSupported: true
        }
      ]
    },
    others: {
      name: 'Utilities',
      icon: '🛠️',
      color: 'gray',
      features: [
        {
          id: 'check-gender',
          name: 'Gender Detection',
          description: 'Determine gender from full name',
          credits: 0.1,
          isPopular: false,
          isBulkSupported: true
        },
        {
          id: 'find-website',
          name: 'Website Finder',
          description: 'Find company website from name',
          credits: 0.5,
          isPopular: false,
          isBulkSupported: true
        }
      ]
    }
  }
};
```

### Feature Marketplace UI Components
```typescript
// React components for feature management
interface FeatureMarketplaceProps {
  providers: Provider[];
  selectedProvider: string;
  onProviderChange: (providerId: string) => void;
  onFeatureSelect: (feature: FeatureItem) => void;
}

interface FeatureCategoryCardProps {
  category: FeatureCategory;
  features: FeatureItem[];
  onFeatureSelect: (feature: FeatureItem) => void;
}

interface FeatureExecutionPanelProps {
  feature: FeatureItem;
  provider: Provider;
  onExecute: (params: any) => void;
  onBulkExecute: (csvData: any[]) => void;
}
```

---

## 📚 Multi-Provider API Integration

### Current Provider: Surfe (v2 API)
**Base URL**: `https://api.surfe.com`
**Authentication**: `Bearer YOUR_API_KEY`

### Future Providers Configuration (50+ Providers)

#### Major Data Providers
**Apollo.io**
- **Base URL**: `https://api.apollo.io/v1`
- **Authentication**: `Api-Key: YOUR_API_KEY`
- **Features**: People search, company search, email finder, technology detection, CRM integration
- **Database**: 275+ million contacts, 73+ million companies

**ZoomInfo**
- **Base URL**: `https://api.zoominfo.com/v1`
- **Authentication**: `Authorization: Bearer YOUR_API_KEY`
- **Features**: Contact enrichment, company data, buyer intent, technographics, org charts
- **Database**: 265+ million professionals, 100+ million companies

**Clearbit (HubSpot Breeze)**
- **Base URL**: `https://person.clearbit.com/v2`
- **Authentication**: `Authorization: Bearer YOUR_API_KEY`
- **Features**: Real-time enrichment, visitor tracking, form optimization, 100+ data points

#### Email & Contact Providers
**Hunter.io**
- **Features**: Email finder, email verification, domain search, bulk operations
- **Database**: 107+ million emails

**ContactOut**
- **Features**: LinkedIn email extraction, mobile numbers, personal emails
- **Specialty**: LinkedIn profile enrichment

**Findymail**
- **Features**: Email finder, email cleaning, bounce prevention
- **Specialty**: High deliverability rates

**Prospeo**
- **Features**: Work email finder, LinkedIn email extraction, email verification
- **Specialty**: B2B email discovery

#### Specialized Enrichment Providers
**Ocean.io**
- **Features**: Company lookalikes, market intelligence, competitive analysis
- **Specialty**: Similar company discovery

**HG Insights**
- **Features**: Technology intelligence, software usage data, digital footprint
- **Specialty**: Technographic data

**PitchBook**
- **Features**: Private market intelligence, funding data, valuations
- **Specialty**: Investment and financial data

**Owler**
- **Features**: Company news, competitive intelligence, funding updates
- **Specialty**: Company monitoring and alerts

#### AI & Research Agents
**OpenAI/GPT**
- **Features**: AI-powered research, content generation, data analysis
- **Integration**: ChatGPT API for custom research

**Anthropic Claude**
- **Features**: Advanced AI analysis, document processing, reasoning
- **Specialty**: Complex data interpretation

**Google Gemini**
- **Features**: Multimodal AI, advanced NLP, research capabilities
- **Specialty**: Google's advanced AI models

#### Social & Professional Networks
**LinkedIn Sales Navigator**
- **Features**: LinkedIn data extraction, professional profiles, company insights
- **Specialty**: Professional networking data

**Facebook/Meta**
- **Features**: Social profiles, advertising intelligence, company pages
- **Specialty**: Social media presence

#### Verification & Validation Providers
**Datagma**
- **Features**: Contact verification, data validation, enrichment
- **Specialty**: Data accuracy and verification

**LeadMagic**
- **Features**: Email verification, mobile validation, social URL enrichment
- **Specialty**: Contact validation

#### Geographic & Local Providers
**Google Maps**
- **Features**: Local business data, reviews, location intelligence
- **Specialty**: Local and geographic data

**Semrush**
- **Features**: Website analytics, SEO data, competitive intelligence
- **Specialty**: Digital marketing intelligence

**SimilarWeb**
- **Features**: Website traffic, engagement metrics, technology stack
- **Specialty**: Web analytics and insights

### Provider Category Classification
```typescript
enum ProviderCategory {
  // Core Data Providers
  MAJOR_DATABASE = 'major-database',           // Apollo, ZoomInfo, Clearbit
  EMAIL_SPECIALISTS = 'email-specialists',     // Hunter, ContactOut, Findymail
  COMPANY_INTELLIGENCE = 'company-intel',      // Ocean.io, PitchBook, Owler
  
  // AI & Research
  AI_RESEARCH = 'ai-research',                 // OpenAI, Claude, Gemini
  SOCIAL_NETWORKS = 'social-networks',         // LinkedIn, Facebook, Twitter
  
  // Specialized Services
  VERIFICATION = 'verification',               // Datagma, LeadMagic
  TECHNOGRAPHICS = 'technographics',          // HG Insights, BuiltWith
  GEOGRAPHIC = 'geographic',                   // Google Maps, Local data
  WEB_ANALYTICS = 'web-analytics',            // Semrush, SimilarWeb
  
  // Utilities
  NORMALIZATION = 'normalization',            // Clay utilities, BetterEnrich
  COMPLIANCE = 'compliance',                  // DNC, GDPR tools
  INTEGRATION = 'integration'                 // CRM, Email tools
}
```

### Provider Priority Matrix
```typescript
// Provider priority for different use cases
const PROVIDER_PRIORITY_MATRIX = {
  // People & Contact Data
  peopleSearch: ['apollo', 'zoominfo', 'surfe', 'clearbit'],
  emailFinder: ['hunter', 'contactout', 'findymail', 'apollo'],
  phoneNumber: ['contactout', 'surfe', 'betterenrich', 'apollo'],
  
  // Company Data
  companySearch: ['apollo', 'zoominfo', 'clearbit', 'surfe'],
  companyIntel: ['pitchbook', 'owler', 'ocean', 'zoominfo'],
  technographics: ['hginsights', 'clearbit', 'similarweb'],
  
  // AI & Research
  aiResearch: ['openai', 'claude', 'gemini'],
  socialIntel: ['linkedin', 'facebook', 'contactout'],
  
  // Verification & Quality
  emailVerification: ['hunter', 'findymail', 'datagma'],
  dataValidation: ['clearbit', 'datagma', 'leadmagic'],
  
  // Geographic & Local
  localBusiness: ['googlemaps', 'yelp'],
  webAnalytics: ['semrush', 'similarweb', 'hginsights']
};
```

### Comprehensive Provider Database Schema
```sql
-- Enhanced provider categories
CREATE TABLE provider_categories (
  id SERIAL PRIMARY KEY,
  category_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false
);

-- Provider tiers (Free, Paid, Enterprise)
CREATE TABLE provider_tiers (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES providers(id),
  tier_name VARCHAR(50) NOT NULL, -- free, basic, pro, enterprise
  features_included JSONB,
  rate_limits JSONB,
  monthly_quota INTEGER,
  pricing_model VARCHAR(50), -- credit, subscription, pay-per-use
  cost_per_credit DECIMAL(10,4),
  minimum_monthly_cost DECIMAL(10,2)
);

-- Provider capabilities matrix
CREATE TABLE provider_capabilities (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES providers(id),
  capability_type VARCHAR(100) NOT NULL,
  is_supported BOOLEAN DEFAULT true,
  quality_score INTEGER DEFAULT 80, -- 1-100 quality rating
  coverage_regions JSONB, -- geographic coverage
  data_freshness_hours INTEGER DEFAULT 24,
  notes TEXT
);

-- Provider integration configs
CREATE TABLE provider_integrations (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES providers(id),
  integration_type VARCHAR(50), -- webhook, polling, realtime
  webhook_url VARCHAR(500),
  auth_method VARCHAR(50), -- bearer, api-key, oauth
  custom_headers JSONB,
  retry_config JSONB,
  timeout_seconds INTEGER DEFAULT 30
);
```

### Waterfall Enrichment System
```typescript
// Clay-style waterfall enrichment
interface WaterfallConfig {
  operation: string;
  providers: WaterfallStep[];
  fallbackBehavior: 'continue' | 'stop' | 'retry';
  maxProviders: number;
  qualityThreshold: number;
}

interface WaterfallStep {
  providerId: string;
  priority: number;
  conditions?: WaterfallCondition[];
  timeout: number;
  retryAttempts: number;
}

// Example: Email finding waterfall
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

### Universal Provider Interface
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
  
  // Methods - all providers implement these
  initialize(): Promise<void>;
  validateCredentials(): Promise<boolean>;
  executeOperation(operation: string, params: any): Promise<ProviderResult>;
  getBulkOperation(operation: string, paramsList: any[]): Promise<BulkProviderResult>;
  getUsageStats(): Promise<UsageStats>;
  getQuotaRemaining(): Promise<QuotaInfo>;
  
  // Provider-specific extensions
  getCustomFeatures?(): CustomFeature[];
  executeCustomFeature?(featureId: string, params: any): Promise<any>;
}
```

---

## 🎨 UI/UX Requirements

### Design Principles
- Clean, professional interface
- Intuitive navigation
- Real-time feedback
- Responsive design
- Accessibility compliance

### Key Screens
1. **Provider Marketplace**: Browse and configure 50+ providers
2. **Feature Discovery**: Explore capabilities across all providers
3. **Waterfall Builder**: Create custom enrichment waterfalls
4. **People Search**: Multi-provider people discovery
5. **Company Search**: Company lookup with provider comparison
6. **Lookalike Search**: Find similar companies across databases
7. **Bulk Processing**: Multi-provider bulk operations
8. **AI Research**: Custom research with AI agents
9. **Results Analytics**: Cross-provider performance analysis
10. **Cost Optimization**: Provider usage and cost analysis

### Component Requirements
- **Provider Selector**: Dynamic provider switching
- **Feature Marketplace**: Browse capabilities by category
- **Waterfall Designer**: Visual workflow builder
- **Data Quality Scorer**: Real-time quality assessment
- **Provider Comparison**: Side-by-side provider analysis
- **Cost Calculator**: Real-time cost estimation
- **Quality Metrics**: Provider performance dashboards

---

## 🔒 Security & Performance

### Security Measures
- API key protection
- Input validation and sanitization
- Rate limiting implementation
- File upload restrictions
- CORS configuration
- Error message sanitization

### Performance Optimizations
- Streaming for large file processing
- Pagination for large datasets
- Debounced search inputs
- Lazy loading components
- Memory management for batch operations
- Caching strategies

---

## 🧪 Testing Strategy

### Backend Testing
- Unit tests for all services
- Integration tests for API endpoints
- Mock Surfe API for testing
- File processing tests
- Error handling tests

### Frontend Testing
- Component unit tests
- Integration tests with React Testing Library
- User interaction tests
- API integration tests
- Accessibility tests

---

## 🚀 Deployment & DevOps

### Development Environment
- Docker containers for consistency
- Hot reloading for development
- Environment-specific configurations
- Local testing setup

### Production Deployment
- Cloud hosting (AWS, Vercel, Railway)
- Environment variable management
- CI/CD pipeline setup
- Monitoring and logging
- Backup strategies

---

## 📖 AI Prompting Guidelines

### For Each Development Phase
1. **Be Specific**: Include exact requirements and expected outcomes
2. **Provide Context**: Reference previous phases and dependencies
3. **Include Examples**: Show expected data structures and interfaces
4. **Specify Standards**: Mention coding standards and best practices
5. **Request Documentation**: Ask for inline comments and README updates

### Prompt Structure Template
```
Phase [X]: [Feature Name]

Context: [Brief description of current state and dependencies]

Requirements:
1. [Specific requirement 1]
2. [Specific requirement 2]
...

Technical Specifications:
- [Technology/framework requirements]
- [Performance requirements]
- [Integration requirements]

Expected Deliverables:
- [File/component 1]
- [File/component 2]
...

Additional Notes:
- [Any special considerations]
- [Testing requirements]
- [Documentation needs]
```

---

## 🎯 Success Metrics

### Functional Requirements
- [ ] All Surfe API endpoints integrated
- [ ] File processing works with large datasets
- [ ] Real-time progress tracking functional
- [ ] CSV export with custom columns
- [ ] Error handling covers all scenarios
- [ ] Responsive design on all devices

### Performance Requirements
- [ ] Handles 10,000+ records efficiently
- [ ] API response time under 2 seconds
- [ ] File upload supports up to 50MB
- [ ] UI remains responsive during processing
- [ ] Memory usage stays within limits

### Quality Requirements
- [ ] 90%+ test coverage
- [ ] Zero critical security vulnerabilities
- [ ] Accessibility compliance (WCAG 2.1)
- [ ] Cross-browser compatibility
- [ ] Complete documentation

---

## 📞 Support & Maintenance

### Monitoring
- API usage tracking
- Error rate monitoring
- Performance metrics
- User activity analytics

### Maintenance Tasks
- Regular dependency updates
- API endpoint monitoring
- Log rotation and cleanup
- Performance optimization
- Security audit reviews

---

This comprehensive guide ensures your leads enrichment application will be built with all necessary features, proper architecture, and maintainable code structure. Each phase builds upon the previous one, making development manageable and ensuring no critical features are missed.: 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapping: {
    '^@/(.*)

### Phase 1: Project Setup & Multi-Provider Foundation (Week 1)
**AI Prompt Template for Phase 1:**
```
Create a Node.js Express TypeScript backend with multi-provider architecture and maximum robustness:

PROJECT STRUCTURE & QUALITY:
1. TypeScript configuration with STRICT mode enabled
2. ESLint + Prettier configuration for code quality
3. Husky pre-commit hooks for validation
4. Jest testing setup with coverage requirements
5. Docker Compose for consistent development environment
6. GitHub Actions CI/CD pipeline configuration

DATABASE & INFRASTRUCTURE:
1. PostgreSQL setup with Prisma ORM (strict mode)
2. Redis integration for caching and queues
3. Database migration system with rollback capability
4. Backup and recovery scripts
5. Connection pooling and performance optimization

DEVELOPMENT ROBUSTNESS:
1. Comprehensive error handling with typed errors
2. Request/response validation with Zod schemas
3. API documentation with OpenAPI/Swagger
4. Logging system with structured logs (Winston)
5. Health check endpoints for monitoring
6. Rate limiting middleware
7. Security middleware (helmet, cors, sanitization)

MULTI-PROVIDER ARCHITECTURE:
1. Abstract provider interface with comprehensive typing
2. Provider factory pattern for dynamic loading
3. Provider registry with health monitoring
4. Standardized response transformation layer
5. Provider-specific configuration management with validation

DEVELOPMENT CONTINUITY FEATURES:
1. Development checkpoint tracking system
2. Code generation templates for consistency
3. Error recovery templates and patterns
4. Automated validation scripts
5. Git hooks for code quality enforcement
6. Development state preservation tools

CORE INFRASTRUCTURE:
1. Express server with comprehensive middleware stack
2. Socket.IO setup for real-time updates
3. Bull Queue for background job processing
4. File upload handling with validation and security
5. Webhook handling system
6. API versioning strategy

TESTING & VALIDATION:
1. Unit test templates for all components
2. Integration test setup
3. API endpoint testing
4. Database testing with test containers
5. Performance testing setup
6. Security testing configuration

Include:
- Complete package.json with all dev dependencies
- Prisma schema with comprehensive tables
- Docker compose with all services
- ESLint/Prettier configurations
- GitHub Actions workflow
- Detailed README with setup instructions
- Environment template files
- Development scripts and tools

IMPORTANT: Create this with maximum type safety and error prevention. 
Every function should be typed, every input validated, every error handled.
The code should be so robust that an AI can continue development without issues.
```

### Phase 2: Surfe Provider & Provider System (Week 1-2)
**AI Prompt Template for Phase 2:**
```
Implement the complete provider system with Surfe as the first provider:

PROVIDER SYSTEM CORE:
1. Abstract BaseProvider class with standardized methods
2. Provider factory for dynamic provider instantiation
3. Provider registry for managing active providers
4. Response transformation layer for standardized outputs
5. Provider-specific error handling and retry logic

SURFE PROVIDER IMPLEMENTATION:
- Authentication: Bearer token management
- Base URL: https://api.surfe.com
- Rate limiting: 10 req/sec (bursts to 20)
- All v2 endpoints implementation:

PEOPLE SEARCH (POST /v2/people/search):
- Advanced filtering: companies (countries, domains, industries, employeeSizes)
- People filters: jobTitles, seniorities, departments
- Pagination with pageToken, limit control (max 100)
- peoplePerCompany parameter

PEOPLE ENRICHMENT (POST /v2/people/enrich):
- Bulk enrichment with webhook support
- Include options: email, mobile, linkedInUrl, jobTitle
- External ID tracking for CSV mapping
- Async operation handling with enrichment IDs

COMPANY SEARCH (POST /v2/companies/search):
- Industry, size, geographic filtering
- Technology stack and funding stage filters
- Employee size ranges and revenue brackets

COMPANY ENRICHMENT (POST /v2/companies/enrich):
- Comprehensive company profiles
- Financial data and employee information
- Technology stack details

COMPANY LOOKALIKE (POST /v2/companies/lookalike):
- Similarity matching algorithms
- Industry and size-based matching
- Geographic proximity options

PROVIDER MANAGEMENT FEATURES:
1. Provider configuration CRUD operations
2. API key encryption/decryption
3. Rate limit tracking per provider
4. Usage monitoring and quota management
5. Provider health checks and status monitoring
6. Automatic provider failover logic
7. Provider-specific response caching
8. Bulk operation queue management
9. Webhook handling for async operations
10. Provider performance analytics

FUTURE PROVIDER PREPARATION:
- Apollo provider skeleton (ready for implementation)
- Clay provider skeleton (ready for implementation)
- BetterEnrich provider skeleton (ready for implementation)
- Generic provider template for easy addition

Include comprehensive TypeScript interfaces, error handling, and database operations.
Implement provider switching logic and response standardization.
```

### Phase 3: File Processing & Data Management (Week 2)
**AI Prompt Template for Phase 3:**
```
Implement file processing and data management features:

1. CSV file parser with encoding detection
2. Domain cleaning and validation utilities
3. Column mapping and selection logic
4. Duplicate detection algorithms
5. Data transformation pipelines
6. Batch processing with progress tracking
7. Memory-efficient streaming for large files
8. Export functionality (CSV, JSON)
9. Data preview generation
10. Error handling for malformed data

Include utilities for:
- Email validation and cleaning
- Phone number formatting
- URL/domain standardization
- Name parsing and formatting
```

### Phase 4: Frontend Foundation (Week 2-3)
**AI Prompt Template for Phase 4:**
```
Create a React TypeScript frontend for the leads enrichment app:

1. Project setup with Vite and TypeScript
2. Tailwind CSS and shadcn/ui integration
3. React Router setup for navigation
4. Zustand store for state management
5. Axios client with interceptors
6. Socket.IO client for real-time updates
7. Component structure:
   - Layout components (Header, Sidebar, Footer)
   - Upload components (Dropzone, FilePreview)
   - Search components (Forms, Filters)
   - Table components (DataTable, Pagination)
   - Progress components (ProgressBar, Stats)
8. Basic responsive design
9. Error boundary implementation
10. Toast notifications setup

Include complete component architecture and routing structure.
```

### Phase 5: Search & Enrichment UI (Week 3)
**AI Prompt Template for Phase 5:**
```
Implement search and enrichment user interfaces:

1. People Search Form with all Surfe API parameters
2. Company Search Form with filtering options
3. Lookalike Search interface with similarity controls
4. Bulk enrichment interface with file upload
5. Column mapping interface for CSV processing
6. Search results display with pagination
7. Data preview tables with sorting/filtering
8. Export options panel
9. Progress monitoring dashboard
10. Real-time console logs display

Include form validation, loading states, and error handling.
Make all components responsive and accessible.
```

### Phase 6: Advanced Features (Week 3-4)
**AI Prompt Template for Phase 6:**
```
Implement advanced features and optimizations:

1. Advanced filtering and search capabilities
2. Data deduplication algorithms
3. Smart column mapping suggestions
4. Batch operation queue management
5. Progress analytics and reporting
6. Export customization options
7. Data validation and cleaning tools
8. Performance optimizations
9. Caching strategies
10. Error recovery mechanisms

Include comprehensive testing setup and documentation.
```

### Phase 7: Testing & Polish (Week 4)
**AI Prompt Template for Phase 7:**
```
Complete testing, optimization, and final polish:

1. Unit tests for all utility functions
2. Integration tests for API endpoints
3. Frontend component testing
4. End-to-end testing scenarios
5. Performance optimization
6. Security hardening
7. Error handling improvements
8. UI/UX refinements
9. Documentation completion
10. Deployment preparation

Include complete test coverage and deployment guides.
```

---

## 📁 Project Structure

```
leads-enrichment-app/
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
│   │   │   │   ├── BaseProvider.ts
│   │   │   │   ├── SurfeProvider.ts
│   │   │   │   ├── ApolloProvider.ts (skeleton)
│   │   │   │   ├── ClayProvider.ts (skeleton)
│   │   │   │   └── BetterEnrichProvider.ts (skeleton)
│   │   │   ├── ProviderFactory.ts
│   │   │   ├── ProviderRegistry.ts
│   │   │   ├── fileProcessingService.ts
│   │   │   ├── dataCleaningService.ts
│   │   │   ├── exportService.ts
│   │   │   └── queueService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── upload.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── errorHandler.ts
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   ├── encryption.ts
│   │   │   └── helpers.ts
│   │   ├── types/
│   │   │   ├── providers/
│   │   │   │   ├── BaseTypes.ts
│   │   │   │   ├── SurfeTypes.ts
│   │   │   │   ├── ApolloTypes.ts
│   │   │   │   └── ClayTypes.ts
│   │   │   ├── apiTypes.ts
│   │   │   └── commonTypes.ts
│   │   ├── routes/
│   │   │   ├── providers.ts
│   │   │   ├── people.ts
│   │   │   ├── companies.ts
│   │   │   ├── upload.ts
│   │   │   ├── jobs.ts
│   │   │   └── export.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── environment.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── jobs/
│   │   │   ├── enrichmentJob.ts
│   │   │   ├── exportJob.ts
│   │   │   └── cleanupJob.ts
│   │   └── app.ts
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── forms/
│   │   │   ├── tables/
│   │   │   ├── upload/
│   │   │   ├── progress/
│   │   │   └── common/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PeopleSearch.tsx
│   │   │   ├── CompanySearch.tsx
│   │   │   ├── LookalikeSearch.tsx
│   │   │   └── BulkEnrichment.tsx
│   │   ├── stores/
│   │   │   ├── appStore.ts
│   │   │   ├── dataStore.ts
│   │   │   └── progressStore.ts
│   │   ├── services/
│   │   │   ├── apiClient.ts
│   │   │   ├── socketClient.ts
│   │   │   └── fileService.ts
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── docs/
    ├── API.md
    ├── DEPLOYMENT.md
    └── USER_GUIDE.md
```

---

## 🔧 Environment Configuration

### Backend Environment Variables
```env
# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/leadenrich
DIRECT_URL=postgresql://username:password@localhost:5432/leadenrich

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-jwt-secret-key

# Provider API Keys (Encrypted in database)
SURFE_API_KEY=your_surfe_api_key
APOLLO_API_KEY=your_apollo_api_key
CLAY_API_KEY=your_clay_api_key
BETTERENRICH_API_KEY=your_betterenrich_api_key

# Provider Configuration
SURFE_API_BASE_URL=https://api.surfe.com
SURFE_RATE_LIMIT=10
SURFE_DAILY_QUOTA=2000

# File Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=csv,xlsx
TEMP_DIR=./temp

# Queue Configuration
QUEUE_REDIS_URL=redis://localhost:6379
QUEUE_CONCURRENCY=5

# Webhook Configuration
WEBHOOK_SECRET=your-webhook-secret
WEBHOOK_BASE_URL=https://your-app.com/webhooks

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_ROTATION=daily
```

### Frontend Environment Variables
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001

# App Configuration
VITE_APP_NAME=LeadEnrich Pro
VITE_MAX_FILE_SIZE=52428800
VITE_SUPPORTED_FORMATS=csv,xlsx
```

---

## 📚 Multi-Provider API Integration

### Current Provider: Surfe (v2 API)
**Base URL**: `https://api.surfe.com`
**Authentication**: `Bearer YOUR_API_KEY`

### Future Providers Configuration

#### Apollo (Planned)
**Base URL**: `https://api.apollo.io/v1`
**Authentication**: `Api-Key: YOUR_API_KEY`
**Features**: People/Company search, Email finder, Technology detection

#### Clay (Planned)
**Base URL**: `https://api.clay.run/v1`
**Authentication**: `Authorization: Bearer YOUR_API_KEY`
**Features**: Enrichment, Company data, Social profiles

#### BetterEnrich (Planned)
**Base URL**: `https://api.betterenrich.com/v1`
**Authentication**: `X-API-Key: YOUR_API_KEY`
**Features**: Contact enrichment, Company intelligence

### Provider Priority & Failover
```typescript
// Provider priority for different operations
const PROVIDER_PRIORITY = {
  peopleSearch: ['surfe', 'apollo', 'clay'],
  peopleEnrich: ['surfe', 'betterenrich', 'apollo'],
  companySearch: ['surfe', 'apollo', 'clay'],
  companyEnrich: ['surfe', 'clay', 'apollo'],
  lookalike: ['surfe', 'apollo']
};
```

### Standardized Response Format
All providers return data in this standardized format:
```typescript
interface StandardizedResponse<T> {
  success: boolean;
  data: T;
  provider: string;
  credits_used: number;
  rate_limit_remaining: number;
  metadata: {
    request_id: string;
    timestamp: string;
    processing_time_ms: number;
  };
  errors?: ErrorDetail[];
}
```

---

## 🎨 UI/UX Requirements

### Design Principles
- Clean, professional interface
- Intuitive navigation
- Real-time feedback
- Responsive design
- Accessibility compliance

### Key Screens
1. **Dashboard**: Overview of operations and quick actions
2. **People Search**: Single and bulk people enrichment
3. **Company Search**: Company lookup and enrichment
4. **Lookalike Search**: Find similar companies
5. **Bulk Processing**: File upload and batch operations
6. **Results**: Data display with export options
7. **Progress Monitor**: Real-time operation tracking

### Component Requirements
- Reusable form components
- Data table with sorting/filtering
- File upload with drag-and-drop
- Progress bars and status indicators
- Modal dialogs for confirmations
- Toast notifications for feedback

---

## 🔒 Security & Performance

### Security Measures
- API key protection
- Input validation and sanitization
- Rate limiting implementation
- File upload restrictions
- CORS configuration
- Error message sanitization

### Performance Optimizations
- Streaming for large file processing
- Pagination for large datasets
- Debounced search inputs
- Lazy loading components
- Memory management for batch operations
- Caching strategies

---

## 🧪 Testing Strategy

### Backend Testing
- Unit tests for all services
- Integration tests for API endpoints
- Mock Surfe API for testing
- File processing tests
- Error handling tests

### Frontend Testing
- Component unit tests
- Integration tests with React Testing Library
- User interaction tests
- API integration tests
- Accessibility tests

---

## 🚀 Deployment & DevOps

### Development Environment
- Docker containers for consistency
- Hot reloading for development
- Environment-specific configurations
- Local testing setup

### Production Deployment
- Cloud hosting (AWS, Vercel, Railway)
- Environment variable management
- CI/CD pipeline setup
- Monitoring and logging
- Backup strategies

---

## 📖 AI Prompting Guidelines

### For Each Development Phase
1. **Be Specific**: Include exact requirements and expected outcomes
2. **Provide Context**: Reference previous phases and dependencies
3. **Include Examples**: Show expected data structures and interfaces
4. **Specify Standards**: Mention coding standards and best practices
5. **Request Documentation**: Ask for inline comments and README updates

### Prompt Structure Template
```
Phase [X]: [Feature Name]

Context: [Brief description of current state and dependencies]

Requirements:
1. [Specific requirement 1]
2. [Specific requirement 2]
...

Technical Specifications:
- [Technology/framework requirements]
- [Performance requirements]
- [Integration requirements]

Expected Deliverables:
- [File/component 1]
- [File/component 2]
...

Additional Notes:
- [Any special considerations]
- [Testing requirements]
- [Documentation needs]
```

---

## 🎯 Success Metrics

### Functional Requirements
- [ ] All Surfe API endpoints integrated
- [ ] File processing works with large datasets
- [ ] Real-time progress tracking functional
- [ ] CSV export with custom columns
- [ ] Error handling covers all scenarios
- [ ] Responsive design on all devices

### Performance Requirements
- [ ] Handles 10,000+ records efficiently
- [ ] API response time under 2 seconds
- [ ] File upload supports up to 50MB
- [ ] UI remains responsive during processing
- [ ] Memory usage stays within limits

### Quality Requirements
- [ ] 90%+ test coverage
- [ ] Zero critical security vulnerabilities
- [ ] Accessibility compliance (WCAG 2.1)
- [ ] Cross-browser compatibility
- [ ] Complete documentation

---

## 📞 Support & Maintenance

### Monitoring
- API usage tracking
- Error rate monitoring
- Performance metrics
- User activity analytics

### Maintenance Tasks
- Regular dependency updates
- API endpoint monitoring
- Log rotation and cleanup
- Performance optimization
- Security audit reviews

---

This comprehensive guide ensures your leads enrichment application will be built with all necessary features, proper architecture, and maintainable code structure. Each phase builds upon the previous one, making development manageable and ensuring no critical features are missed.: '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

### Docker Compose (docker-compose.yml)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: leadenrich
      POSTGRES_PASSWORD: password123
      POSTGRES_DB: leadenrich
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U leadenrich"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://leadenrich:password123@postgres:5432/leadenrich
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
```

### Husky Configuration (.husky/pre-commit)
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Type checking
echo "📝 Type checking..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found. Please fix them before committing."
  exit 1
fi

# Linting
echo "🧹 Linting code..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint errors found. Please fix them before committing."
  exit 1
fi

# Testing
echo "🧪 Running tests..."
npm run test -- --passWithNoTests
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Please fix them before committing."
  exit 1
fi

# Staged files formatting
npx lint-staged

echo "✅ All checks passed! Proceeding with commit."
```

### Comprehensive Error Handling System
```typescript
// src/types/errors.ts
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

export interface AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: any;
  provider?: string;
  feature?: string;
  recoverable: boolean;
  retryAfter?: number;
}

export class AppErrorHandler {
  static createError(
    code: ErrorCode, 
    message: string, 
    statusCode: number = 500,
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
      return error.retryAfter || Math.pow(2, attempt) * 1000; // Exponential backoff
    }
    return Math.pow(2, attempt) * 1000;
  }
}
```

### Complete TypeScript Interfaces
```typescript
// src/types/providers.ts
export interface ProviderConfig {
  id: string;
  name: string;
  displayName: string;
  category: ProviderCategory;
  tier: ProviderTier;
  authentication: AuthConfig;
  rateLimits: RateLimitConfig;
  features: FeatureDefinition[];
  endpoints: EndpointConfig;
  pricing: PricingConfig;
}

export interface AuthConfig {
  type: 'bearer' | 'api-key' | 'oauth' | 'basic';
  headerName?: string;
  prefix?: string;
  encryptionRequired: boolean;
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  burstAllowed: number;
  dailyQuota: number;
  resetTime: string; // cron expression
}

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  endpoint: string;
  method: HttpMethod;
  parameters: ParameterDefinition[];
  responseSchema: any;
  credits: number;
  isActive: boolean;
  isBulkSupported: boolean;
  maxBatchSize?: number;
}

export interface ParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  validation?: ValidationRule[];
  description?: string;
  example?: any;
  defaultValue?: any;
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'enum' | 'custom';
  value: any;
  message?: string;
}

export interface ProviderResult<T = any> {
  success: boolean;
  data: T;
  provider: string;
  feature?: string;
  creditsUsed: number;
  rateLimitRemaining: number;
  responseTime: number;
  metadata: {
    requestId: string;
    timestamp: string;
    quality: number; // 0-100 quality score
  };
  errors?: ErrorDetail[];
}

export interface BulkProviderResult<T = any> {
  success: boolean;
  results: ProviderResult<T>[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    creditsUsed: number;
    processingTime: number;
  };
  errors?: ErrorDetail[];
}

export interface ErrorDetail {
  code: string;
  message: string;
  field?: string;
  provider?: string;
  recoverable: boolean;
}
```

### API Documentation Generation
```typescript
// src/swagger/swaggerConfig.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LeadEnrich Pro API',
      version: '1.0.0',
      description: 'Multi-provider leads enrichment platform API',
      contact: {
        name: 'API Support',
        email: 'support@leadenrichpro.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    security: [
      { BearerAuth: [] },
      { ApiKeyAuth: [] }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const specs = swaggerJsdoc(options);
```

### Health Check Implementation
```typescript
// src/healthcheck.ts
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import axios from 'axios';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    providers: ProviderHealth[];
  };
  uptime: number;
  memory: {
    used: number;
    free: number;
    total: number;
  };
}

interface ServiceHealth {
  status: 'up' | 'down';
  responseTime: number;
  error?: string;
}

interface ProviderHealth {
  name: string;
  status: 'up' | 'down' | 'rate-limited';
  responseTime: number;
  error?: string;
}

class HealthChecker {
  async checkHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    const [dbHealth, redisHealth, providersHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkProviders()
    ]);

    const overallStatus = this.determineOverallStatus(dbHealth, redisHealth, providersHealth);
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        redis: redisHealth,
        providers: providersHealth
      },
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        free: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal
      }
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      await redis.ping();
      return {
        status: 'up',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkProviders(): Promise<ProviderHealth[]> {
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      select: { name: name, baseUrl: true }
    });

    const checks = providers.map(async (provider): Promise<ProviderHealth> => {
      const startTime = Date.now();
      try {
        // Basic connectivity check
        await axios.get(`${provider.baseUrl}/health`, { timeout: 5000 });
        return {
          name: provider.name,
          status: 'up',
          responseTime: Date.now() - startTime
        };
      } catch (error) {
        return {
          name: provider.name,
          status: 'down',
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    return Promise.all(checks);
  }

  private determineOverallStatus(
    db: ServiceHealth, 
    redis: ServiceHealth, 
    providers: ProviderHealth[]
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // Critical services must be up
    if (db.status === 'down' || redis.status === 'down') {
      return 'unhealthy';
    }

    // Check provider health
    const downProviders = providers.filter(p => p.status === 'down').length;
    const totalProviders = providers.length;
    
    if (totalProviders === 0) return 'healthy';
    
    const healthyRatio = (totalProviders - downProviders) / totalProviders;
    
    if (healthyRatio < 0.5) return 'degraded';
    if (healthyRatio < 1.0) return 'degraded';
    
    return 'healthy';
  }
}

// For Docker health check
if (require.main === module) {
  const healthChecker = new HealthChecker();
  healthChecker.checkHealth()
    .then(health => {
      if (health.status === 'unhealthy') {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

export { HealthChecker };
```

### Production Environment Configuration
```bash
# .env.production
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://username:password@db-host:5432/leadenrich_prod
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://redis-host:6379
REDIS_PASSWORD=secure_redis_password
REDIS_DB=0

# Security
JWT_SECRET=super-secure-jwt-secret-change-in-production
ENCRYPTION_KEY=32-character-encryption-key-here
SESSION_SECRET=super-secure-session-secret

# API Keys (Encrypted)
SURFE_API_KEY=encrypted_surfe_key
APOLLO_API_KEY=encrypted_apollo_key
ZOOMINFO_API_KEY=encrypted_zoominfo_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# File Upload
MAX_FILE_SIZE=104857600
UPLOAD_PATH=/app/uploads
TEMP_PATH=/app/temp

# Monitoring
NEW_RELIC_LICENSE_KEY=your_new_relic_key
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log

# External Services
WEBHOOK_BASE_URL=https://your-app.com
CORS_ORIGIN=https://your-frontend.com

# Queue Configuration
QUEUE_CONCURRENCY=10
QUEUE_REDIS_URL=redis://redis-host:6379

# Provider Configurations
DEFAULT_PROVIDER=surfe
ENABLE_PROVIDER_FAILOVER=true
WATERFALL_MAX_PROVIDERS=3
```

### Nginx Production Configuration
```nginx
# nginx.conf
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
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';";

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # File Upload Limits
    client_max_body_size 50M;
    client_body_timeout 60s;
    client_header_timeout 60s;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml;

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

    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Phase 1: Project Setup & Multi-Provider Foundation (Week 1)
**AI Prompt Template for Phase 1:**
```
Create a Node.js Express TypeScript backend with multi-provider architecture and maximum robustness:

PROJECT STRUCTURE & QUALITY:
1. TypeScript configuration with STRICT mode enabled
2. ESLint + Prettier configuration for code quality
3. Husky pre-commit hooks for validation
4. Jest testing setup with coverage requirements
5. Docker Compose for consistent development environment
6. GitHub Actions CI/CD pipeline configuration

DATABASE & INFRASTRUCTURE:
1. PostgreSQL setup with Prisma ORM (strict mode)
2. Redis integration for caching and queues
3. Database migration system with rollback capability
4. Backup and recovery scripts
5. Connection pooling and performance optimization

DEVELOPMENT ROBUSTNESS:
1. Comprehensive error handling with typed errors
2. Request/response validation with Zod schemas
3. API documentation with OpenAPI/Swagger
4. Logging system with structured logs (Winston)
5. Health check endpoints for monitoring
6. Rate limiting middleware
7. Security middleware (helmet, cors, sanitization)

MULTI-PROVIDER ARCHITECTURE:
1. Abstract provider interface with comprehensive typing
2. Provider factory pattern for dynamic loading
3. Provider registry with health monitoring
4. Standardized response transformation layer
5. Provider-specific configuration management with validation

DEVELOPMENT CONTINUITY FEATURES:
1. Development checkpoint tracking system
2. Code generation templates for consistency
3. Error recovery templates and patterns
4. Automated validation scripts
5. Git hooks for code quality enforcement
6. Development state preservation tools

CORE INFRASTRUCTURE:
1. Express server with comprehensive middleware stack
2. Socket.IO setup for real-time updates
3. Bull Queue for background job processing
4. File upload handling with validation and security
5. Webhook handling system
6. API versioning strategy

TESTING & VALIDATION:
1. Unit test templates for all components
2. Integration test setup
3. API endpoint testing
4. Database testing with test containers
5. Performance testing setup
6. Security testing configuration

Include:
- Complete package.json with all dev dependencies
- Prisma schema with comprehensive tables
- Docker compose with all services
- ESLint/Prettier configurations
- GitHub Actions workflow
- Detailed README with setup instructions
- Environment template files
- Development scripts and tools

IMPORTANT: Create this with maximum type safety and error prevention. 
Every function should be typed, every input validated, every error handled.
The code should be so robust that an AI can continue development without issues.
```

### Phase 2: Surfe Provider & Provider System (Week 1-2)
**AI Prompt Template for Phase 2:**
```
Implement the complete provider system with Surfe as the first provider:

PROVIDER SYSTEM CORE:
1. Abstract BaseProvider class with standardized methods
2. Provider factory for dynamic provider instantiation
3. Provider registry for managing active providers
4. Response transformation layer for standardized outputs
5. Provider-specific error handling and retry logic

SURFE PROVIDER IMPLEMENTATION:
- Authentication: Bearer token management
- Base URL: https://api.surfe.com
- Rate limiting: 10 req/sec (bursts to 20)
- All v2 endpoints implementation:

PEOPLE SEARCH (POST /v2/people/search):
- Advanced filtering: companies (countries, domains, industries, employeeSizes)
- People filters: jobTitles, seniorities, departments
- Pagination with pageToken, limit control (max 100)
- peoplePerCompany parameter

PEOPLE ENRICHMENT (POST /v2/people/enrich):
- Bulk enrichment with webhook support
- Include options: email, mobile, linkedInUrl, jobTitle
- External ID tracking for CSV mapping
- Async operation handling with enrichment IDs

COMPANY SEARCH (POST /v2/companies/search):
- Industry, size, geographic filtering
- Technology stack and funding stage filters
- Employee size ranges and revenue brackets

COMPANY ENRICHMENT (POST /v2/companies/enrich):
- Comprehensive company profiles
- Financial data and employee information
- Technology stack details

COMPANY LOOKALIKE (POST /v2/companies/lookalike):
- Similarity matching algorithms
- Industry and size-based matching
- Geographic proximity options

PROVIDER MANAGEMENT FEATURES:
1. Provider configuration CRUD operations
2. API key encryption/decryption
3. Rate limit tracking per provider
4. Usage monitoring and quota management
5. Provider health checks and status monitoring
6. Automatic provider failover logic
7. Provider-specific response caching
8. Bulk operation queue management
9. Webhook handling for async operations
10. Provider performance analytics

FUTURE PROVIDER PREPARATION:
- Apollo provider skeleton (ready for implementation)
- Clay provider skeleton (ready for implementation)
- BetterEnrich provider skeleton (ready for implementation)
- Generic provider template for easy addition

Include comprehensive TypeScript interfaces, error handling, and database operations.
Implement provider switching logic and response standardization.
```

### Phase 3: File Processing & Data Management (Week 2)
**AI Prompt Template for Phase 3:**
```
Implement file processing and data management features:

1. CSV file parser with encoding detection
2. Domain cleaning and validation utilities
3. Column mapping and selection logic
4. Duplicate detection algorithms
5. Data transformation pipelines
6. Batch processing with progress tracking
7. Memory-efficient streaming for large files
8. Export functionality (CSV, JSON)
9. Data preview generation
10. Error handling for malformed data

Include utilities for:
- Email validation and cleaning
- Phone number formatting
- URL/domain standardization
- Name parsing and formatting
```

### Phase 4: Frontend Foundation (Week 2-3)
**AI Prompt Template for Phase 4:**
```
Create a React TypeScript frontend for the leads enrichment app:

1. Project setup with Vite and TypeScript
2. Tailwind CSS and shadcn/ui integration
3. React Router setup for navigation
4. Zustand store for state management
5. Axios client with interceptors
6. Socket.IO client for real-time updates
7. Component structure:
   - Layout components (Header, Sidebar, Footer)
   - Upload components (Dropzone, FilePreview)
   - Search components (Forms, Filters)
   - Table components (DataTable, Pagination)
   - Progress components (ProgressBar, Stats)
8. Basic responsive design
9. Error boundary implementation
10. Toast notifications setup

Include complete component architecture and routing structure.
```

### Phase 5: Search & Enrichment UI (Week 3)
**AI Prompt Template for Phase 5:**
```
Implement search and enrichment user interfaces:

1. People Search Form with all Surfe API parameters
2. Company Search Form with filtering options
3. Lookalike Search interface with similarity controls
4. Bulk enrichment interface with file upload
5. Column mapping interface for CSV processing
6. Search results display with pagination
7. Data preview tables with sorting/filtering
8. Export options panel
9. Progress monitoring dashboard
10. Real-time console logs display

Include form validation, loading states, and error handling.
Make all components responsive and accessible.
```

### Phase 6: Advanced Features (Week 3-4)
**AI Prompt Template for Phase 6:**
```
Implement advanced features and optimizations:

1. Advanced filtering and search capabilities
2. Data deduplication algorithms
3. Smart column mapping suggestions
4. Batch operation queue management
5. Progress analytics and reporting
6. Export customization options
7. Data validation and cleaning tools
8. Performance optimizations
9. Caching strategies
10. Error recovery mechanisms

Include comprehensive testing setup and documentation.
```

### Phase 7: Testing & Polish (Week 4)
**AI Prompt Template for Phase 7:**
```
Complete testing, optimization, and final polish:

1. Unit tests for all utility functions
2. Integration tests for API endpoints
3. Frontend component testing
4. End-to-end testing scenarios
5. Performance optimization
6. Security hardening
7. Error handling improvements
8. UI/UX refinements
9. Documentation completion
10. Deployment preparation

Include complete test coverage and deployment guides.
```

---

## 📁 Project Structure

```
leads-enrichment-app/
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
│   │   │   │   ├── BaseProvider.ts
│   │   │   │   ├── SurfeProvider.ts
│   │   │   │   ├── ApolloProvider.ts (skeleton)
│   │   │   │   ├── ClayProvider.ts (skeleton)
│   │   │   │   └── BetterEnrichProvider.ts (skeleton)
│   │   │   ├── ProviderFactory.ts
│   │   │   ├── ProviderRegistry.ts
│   │   │   ├── fileProcessingService.ts
│   │   │   ├── dataCleaningService.ts
│   │   │   ├── exportService.ts
│   │   │   └── queueService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── upload.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── errorHandler.ts
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   ├── encryption.ts
│   │   │   └── helpers.ts
│   │   ├── types/
│   │   │   ├── providers/
│   │   │   │   ├── BaseTypes.ts
│   │   │   │   ├── SurfeTypes.ts
│   │   │   │   ├── ApolloTypes.ts
│   │   │   │   └── ClayTypes.ts
│   │   │   ├── apiTypes.ts
│   │   │   └── commonTypes.ts
│   │   ├── routes/
│   │   │   ├── providers.ts
│   │   │   ├── people.ts
│   │   │   ├── companies.ts
│   │   │   ├── upload.ts
│   │   │   ├── jobs.ts
│   │   │   └── export.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── environment.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── jobs/
│   │   │   ├── enrichmentJob.ts
│   │   │   ├── exportJob.ts
│   │   │   └── cleanupJob.ts
│   │   └── app.ts
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── forms/
│   │   │   ├── tables/
│   │   │   ├── upload/
│   │   │   ├── progress/
│   │   │   └── common/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PeopleSearch.tsx
│   │   │   ├── CompanySearch.tsx
│   │   │   ├── LookalikeSearch.tsx
│   │   │   └── BulkEnrichment.tsx
│   │   ├── stores/
│   │   │   ├── appStore.ts
│   │   │   ├── dataStore.ts
│   │   │   └── progressStore.ts
│   │   ├── services/
│   │   │   ├── apiClient.ts
│   │   │   ├── socketClient.ts
│   │   │   └── fileService.ts
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── docs/
    ├── API.md
    ├── DEPLOYMENT.md
    └── USER_GUIDE.md
```

---

## 🔧 Environment Configuration

### Backend Environment Variables
```env
# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/leadenrich
DIRECT_URL=postgresql://username:password@localhost:5432/leadenrich

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-jwt-secret-key

# Provider API Keys (Encrypted in database)
SURFE_API_KEY=your_surfe_api_key
APOLLO_API_KEY=your_apollo_api_key
CLAY_API_KEY=your_clay_api_key
BETTERENRICH_API_KEY=your_betterenrich_api_key

# Provider Configuration
SURFE_API_BASE_URL=https://api.surfe.com
SURFE_RATE_LIMIT=10
SURFE_DAILY_QUOTA=2000

# File Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=csv,xlsx
TEMP_DIR=./temp

# Queue Configuration
QUEUE_REDIS_URL=redis://localhost:6379
QUEUE_CONCURRENCY=5

# Webhook Configuration
WEBHOOK_SECRET=your-webhook-secret
WEBHOOK_BASE_URL=https://your-app.com/webhooks

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_ROTATION=daily
```

### Frontend Environment Variables
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001

# App Configuration
VITE_APP_NAME=LeadEnrich Pro
VITE_MAX_FILE_SIZE=52428800
VITE_SUPPORTED_FORMATS=csv,xlsx
```

---

## 📚 Multi-Provider API Integration

### Current Provider: Surfe (v2 API)
**Base URL**: `https://api.surfe.com`
**Authentication**: `Bearer YOUR_API_KEY`

### Future Providers Configuration

#### Apollo (Planned)
**Base URL**: `https://api.apollo.io/v1`
**Authentication**: `Api-Key: YOUR_API_KEY`
**Features**: People/Company search, Email finder, Technology detection

#### Clay (Planned)
**Base URL**: `https://api.clay.run/v1`
**Authentication**: `Authorization: Bearer YOUR_API_KEY`
**Features**: Enrichment, Company data, Social profiles

#### BetterEnrich (Planned)
**Base URL**: `https://api.betterenrich.com/v1`
**Authentication**: `X-API-Key: YOUR_API_KEY`
**Features**: Contact enrichment, Company intelligence

### Provider Priority & Failover
```typescript
// Provider priority for different operations
const PROVIDER_PRIORITY = {
  peopleSearch: ['surfe', 'apollo', 'clay'],
  peopleEnrich: ['surfe', 'betterenrich', 'apollo'],
  companySearch: ['surfe', 'apollo', 'clay'],
  companyEnrich: ['surfe', 'clay', 'apollo'],
  lookalike: ['surfe', 'apollo']
};
```

### Standardized Response Format
All providers return data in this standardized format:
```typescript
interface StandardizedResponse<T> {
  success: boolean;
  data: T;
  provider: string;
  credits_used: number;
  rate_limit_remaining: number;
  metadata: {
    request_id: string;
    timestamp: string;
    processing_time_ms: number;
  };
  errors?: ErrorDetail[];
}
```

---

## 🎨 UI/UX Requirements

### Design Principles
- Clean, professional interface
- Intuitive navigation
- Real-time feedback
- Responsive design
- Accessibility compliance

### Key Screens
1. **Dashboard**: Overview of operations and quick actions
2. **People Search**: Single and bulk people enrichment
3. **Company Search**: Company lookup and enrichment
4. **Lookalike Search**: Find similar companies
5. **Bulk Processing**: File upload and batch operations
6. **Results**: Data display with export options
7. **Progress Monitor**: Real-time operation tracking

### Component Requirements
- Reusable form components
- Data table with sorting/filtering
- File upload with drag-and-drop
- Progress bars and status indicators
- Modal dialogs for confirmations
- Toast notifications for feedback

---

## 🔒 Security & Performance

### Security Measures
- API key protection
- Input validation and sanitization
- Rate limiting implementation
- File upload restrictions
- CORS configuration
- Error message sanitization

### Performance Optimizations
- Streaming for large file processing
- Pagination for large datasets
- Debounced search inputs
- Lazy loading components
- Memory management for batch operations
- Caching strategies

---

## 🧪 Testing Strategy

### Backend Testing
- Unit tests for all services
- Integration tests for API endpoints
- Mock Surfe API for testing
- File processing tests
- Error handling tests

### Frontend Testing
- Component unit tests
- Integration tests with React Testing Library
- User interaction tests
- API integration tests
- Accessibility tests

---

## 🚀 Deployment & DevOps

### Development Environment
- Docker containers for consistency
- Hot reloading for development
- Environment-specific configurations
- Local testing setup

### Production Deployment
- Cloud hosting (AWS, Vercel, Railway)
- Environment variable management
- CI/CD pipeline setup
- Monitoring and logging
- Backup strategies

---

## 📖 AI Prompting Guidelines

### For Each Development Phase
1. **Be Specific**: Include exact requirements and expected outcomes
2. **Provide Context**: Reference previous phases and dependencies
3. **Include Examples**: Show expected data structures and interfaces
4. **Specify Standards**: Mention coding standards and best practices
5. **Request Documentation**: Ask for inline comments and README updates

### Prompt Structure Template
```
Phase [X]: [Feature Name]

Context: [Brief description of current state and dependencies]

Requirements:
1. [Specific requirement 1]
2. [Specific requirement 2]
...

Technical Specifications:
- [Technology/framework requirements]
- [Performance requirements]
- [Integration requirements]

Expected Deliverables:
- [File/component 1]
- [File/component 2]
...

Additional Notes:
- [Any special considerations]
- [Testing requirements]
- [Documentation needs]
```

---

## 🎯 Success Metrics

### Functional Requirements
- [ ] All Surfe API endpoints integrated
- [ ] File processing works with large datasets
- [ ] Real-time progress tracking functional
- [ ] CSV export with custom columns
- [ ] Error handling covers all scenarios
- [ ] Responsive design on all devices

### Performance Requirements
- [ ] Handles 10,000+ records efficiently
- [ ] API response time under 2 seconds
- [ ] File upload supports up to 50MB
- [ ] UI remains responsive during processing
- [ ] Memory usage stays within limits

### Quality Requirements
- [ ] 90%+ test coverage
- [ ] Zero critical security vulnerabilities
- [ ] Accessibility compliance (WCAG 2.1)
- [ ] Cross-browser compatibility
- [ ] Complete documentation

---

## 📞 Support & Maintenance

### Monitoring
- API usage tracking
- Error rate monitoring
- Performance metrics
- User activity analytics

### Maintenance Tasks
- Regular dependency updates
- API endpoint monitoring
- Log rotation and cleanup
- Performance optimization
- Security audit reviews

---

This comprehensive guide ensures your leads enrichment application will be built with all necessary features, proper architecture, and maintainable code structure. Each phase builds upon the previous one, making development manageable and ensuring no critical features are missed.