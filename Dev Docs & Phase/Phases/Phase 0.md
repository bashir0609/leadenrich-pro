# Phase 0: Development Preparation & Environment Setup

## ✅ Prerequisites Checklist

Before starting, ensure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Git installed (`git --version`)
- [ ] PostgreSQL 15+ installed or Docker Desktop
- [ ] VS Code with extensions: ESLint, Prettier, Prisma
- [ ] Terminal/Command line access

## 📁 Step 0.1: Create Project Structure

```bash
# Create main project directory
mkdir leadenrich-pro
cd leadenrich-pro

# Initialize git
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo "dist/" >> .gitignore
echo "*.log" >> .gitignore

# Create directory structure
mkdir -p backend/src/{controllers,services,middleware,routes,types,utils,config}
mkdir -p backend/src/services/providers/{base,implementations}
mkdir -p backend/{prisma,tests,scripts,logs,uploads,temp}
mkdir -p frontend/src/{components,pages,services,stores,types,hooks}
mkdir -p docs

# Initial commit
git add .
git commit -m "Initial project structure"
```

## 🔧 Step 0.2: Backend Setup

```bash
cd backend

# Initialize package.json
npm init -y

# Install core dependencies (EXACT versions for consistency)
npm install --save-exact \
  express@4.18.2 \
  typescript@5.1.6 \
  @types/node@20.4.2 \
  @types/express@4.17.17 \
  dotenv@16.3.1 \
  cors@2.8.5 \
  helmet@7.0.0 \
  compression@1.7.4 \
  express-rate-limit@6.8.1 \
  winston@3.10.0 \
  zod@3.21.4

# Install dev dependencies
npm install --save-exact --save-dev \
  ts-node@10.9.1 \
  nodemon@3.0.1 \
  @typescript-eslint/eslint-plugin@6.1.0 \
  @typescript-eslint/parser@6.1.0 \
  eslint@8.45.0 \
  prettier@3.0.0 \
  jest@29.6.1 \
  ts-jest@29.1.1 \
  @types/jest@29.5.3 \
  supertest@6.3.3 \
  @types/supertest@2.0.12
```

## 📝 Step 0.3: TypeScript Configuration

Create `backend/tsconfig.json`:
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
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## 🎨 Step 0.4: Code Quality Setup

Create `backend/.eslintrc.js`:
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': 'warn',
  },
};
```

Create `backend/.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## 🧪 Step 0.5: Jest Configuration

Create `backend/jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
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
};
```

## 🐳 Step 0.6: Docker Setup

Create `docker-compose.yml` in root directory:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: leadenrich_postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: leadenrich
      POSTGRES_PASSWORD: leadenrich_dev_2024
      POSTGRES_DB: leadenrich_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U leadenrich"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: leadenrich_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass leadenrich_redis_2024
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

## 🔐 Step 0.7: Environment Configuration

Create `backend/.env.example`:
```env
# Server
NODE_ENV=development
PORT=3001
HOST=localhost

# Database
DATABASE_URL=postgresql://leadenrich:leadenrich_dev_2024@localhost:5432/leadenrich_db
DIRECT_URL=postgresql://leadenrich:leadenrich_dev_2024@localhost:5432/leadenrich_db

# Redis
REDIS_URL=redis://:leadenrich_redis_2024@localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ENCRYPTION_KEY=32-character-encryption-key-here!!

# CORS
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads
TEMP_DIR=./temp

# Logging
LOG_LEVEL=debug
LOG_DIR=./logs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Provider API Keys (will be encrypted in database)
# These are just for initial setup
SURFE_API_KEY=your_surfe_api_key_here
```

Create `backend/.env` by copying `.env.example`:
```bash
cp .env.example .env
```

## 📋 Step 0.8: Update package.json Scripts

Update `backend/package.json`:
```json
{
  "name": "leadenrich-backend",
  "version": "0.1.0",
  "description": "LeadEnrich Pro Backend API",
  "main": "dist/app.js",
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/app.js",
    "lint": "eslint 'src/**/*.ts'",
    "lint:fix": "eslint 'src/**/*.ts' --fix",
    "format": "prettier --write 'src/**/*.ts'",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "validate": "npm run typecheck && npm run lint && npm run test",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  },
  "keywords": ["leadenrich", "api", "enrichment"],
  "author": "Your Name",
  "license": "MIT"
}
```

Create `backend/nodemon.json`:
```json
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts", "src/**/*.test.ts"],
  "exec": "ts-node -r tsconfig-paths/register ./src/app.ts",
  "env": {
    "NODE_ENV": "development"
  }
}
```

## ✅ Step 0.9: Verification

Run these commands to verify everything is set up correctly:

```bash
# Start Docker services
npm run docker:up

# Wait 10 seconds for services to start
sleep 10

# Check Docker services
docker ps

# Test TypeScript compilation
npm run typecheck

# Test linting
npm run lint

# Create a simple test file
echo "console.log('Setup complete!');" > src/test.ts
npm run dev

# If you see "Setup complete!", everything is working!
# Clean up test file
rm src/test.ts
```

## 🎯 Step 0.10: Git Checkpoint

```bash
# Add all configuration files
git add .
git commit -m "Complete Phase 0: Development environment setup"

# Create a backup branch
git branch phase-0-complete
```

## ✅ Phase 0 Completion Checklist

Before proceeding to Phase 1, verify:
- [ ] Docker containers running (`docker ps` shows postgres and redis)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] ESLint configured (`npm run lint`)
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Git repository initialized with backup branch

## 🚨 Troubleshooting

If you encounter issues:

1. **Port conflicts**: Change ports in docker-compose.yml
2. **Permission errors**: Run with sudo (Linux/Mac) or as Administrator (Windows)
3. **Docker not starting**: Ensure Docker Desktop is running
4. **TypeScript errors**: Delete node_modules and reinstall

## 📝 Next Phase

You're now ready for Phase 1! The development environment is:
- ✅ Fully configured
- ✅ Type-safe
- ✅ Linted and formatted
- ✅ Ready for development

Proceed to: **Phase 1: Core Backend Foundation**