import request from 'supertest';
import app from '../src/app';
import prisma from '../lib/prisma';
describe('Provider System Tests', () => {
  beforeAll(async () => {
    // Ensure test data exists
    await prisma.provider.upsert({
      where: { name: 'test-provider' },
      update: {},
      create: {
        name: 'test-provider',
        displayName: 'Test Provider',
        category: 'email-finder',
        baseUrl: 'https://api.test.com',
        rateLimit: 10,
        dailyQuota: 1000,
        isActive: true,
        configuration: { test: true },
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.provider.deleteMany({
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
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      
      const provider = response.body.data.find((p: any) => p.name === 'surfe');
      expect(provider).toBeDefined();
      expect(provider).toHaveProperty('displayName');
      expect(provider).toHaveProperty('category');
    });
  });

  describe('POST /api/providers/:id/execute', () => {
    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/providers/test-provider/execute')
        .send({})
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

  describe('POST /api/providers/:id/bulk', () => {
    it('should create enrichment job', async () => {
      const response = await request(app)
        .post('/api/providers/test-provider/bulk')
        .send({
          operation: 'enrich-person',
          records: [
            { email: 'test1@example.com' },
            { email: 'test2@example.com' },
          ],
        })
        .expect(202);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('jobId');
      expect(response.body.data).toHaveProperty('status', 'queued');
      expect(response.body.data).toHaveProperty('totalRecords', 2);
    });

    it('should validate records array', async () => {
      const response = await request(app)
        .post('/api/providers/test-provider/bulk')
        .send({
          operation: 'enrich-person',
          records: [], // Empty array
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });
  });
});

describe('Job System Tests', () => {
  let testJobId: string;

  beforeAll(async () => {
    // Create a test job
    const job = await prisma.enrichmentJob.create({
      data: {
        id: 'test-job-123',
        jobType: 'test',
        status: 'completed',
        totalRecords: 5,
        processedRecords: 5,
        successfulRecords: 4,
        failedRecords: 1,
        inputData: [{ test: 'data' }],
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });
    testJobId = job.id;
  });

  afterAll(async () => {
    await prisma.jobLog.deleteMany({ where: { jobId: testJobId } });
    await prisma.enrichmentJob.deleteMany({ where: { id: testJobId } });
  });

  describe('GET /api/jobs/:jobId', () => {
    it('should return job status', async () => {
      const response = await request(app)
        .get(`/api/jobs/${testJobId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testJobId);
      expect(response.body.data).toHaveProperty('status', 'completed');
      expect(response.body.data.progress).toHaveProperty('total', 5);
    });

    it('should return 404 for non-existent job', async () => {
      const response = await request(app)
        .get('/api/jobs/non-existent-job')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});