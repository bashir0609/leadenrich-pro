import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('localhost'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  ENCRYPTION_KEY: z.string().length(32),
  CORS_ORIGIN: z.string().url(),
  SURFE_API_KEY: z.string().default(''),
});

export const env = envSchema.parse(process.env);