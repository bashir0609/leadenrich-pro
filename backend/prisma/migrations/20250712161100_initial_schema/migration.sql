/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "providers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "apiKeyEncrypted" TEXT,
    "baseUrl" VARCHAR(255) NOT NULL,
    "rateLimit" INTEGER NOT NULL DEFAULT 10,
    "dailyQuota" INTEGER NOT NULL DEFAULT 2000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_features" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "featureId" VARCHAR(100) NOT NULL,
    "featureName" VARCHAR(200) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "endpoint" VARCHAR(500) NOT NULL,
    "httpMethod" VARCHAR(10) NOT NULL DEFAULT 'POST',
    "creditsPerRequest" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parameters" JSONB,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrichment_jobs" (
    "id" TEXT NOT NULL,
    "providerId" INTEGER,
    "jobType" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "processedRecords" INTEGER NOT NULL DEFAULT 0,
    "successfulRecords" INTEGER NOT NULL DEFAULT 0,
    "failedRecords" INTEGER NOT NULL DEFAULT 0,
    "inputData" JSONB,
    "configuration" JSONB,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrichment_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_logs" (
    "id" SERIAL NOT NULL,
    "jobId" TEXT NOT NULL,
    "level" VARCHAR(10) NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "endpoint" VARCHAR(200) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "responseTime" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_name_key" ON "providers"("name");

-- CreateIndex
CREATE INDEX "providers_category_idx" ON "providers"("category");

-- CreateIndex
CREATE INDEX "providers_isActive_idx" ON "providers"("isActive");

-- CreateIndex
CREATE INDEX "provider_features_providerId_idx" ON "provider_features"("providerId");

-- CreateIndex
CREATE INDEX "provider_features_category_idx" ON "provider_features"("category");

-- CreateIndex
CREATE UNIQUE INDEX "provider_features_providerId_featureId_key" ON "provider_features"("providerId", "featureId");

-- CreateIndex
CREATE INDEX "enrichment_jobs_status_idx" ON "enrichment_jobs"("status");

-- CreateIndex
CREATE INDEX "enrichment_jobs_createdAt_idx" ON "enrichment_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "job_logs_jobId_timestamp_idx" ON "job_logs"("jobId", "timestamp");

-- CreateIndex
CREATE INDEX "api_usage_providerId_timestamp_idx" ON "api_usage"("providerId", "timestamp");

-- CreateIndex
CREATE INDEX "api_usage_timestamp_idx" ON "api_usage"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- AddForeignKey
ALTER TABLE "provider_features" ADD CONSTRAINT "provider_features_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrichment_jobs" ADD CONSTRAINT "enrichment_jobs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_logs" ADD CONSTRAINT "job_logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "enrichment_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
