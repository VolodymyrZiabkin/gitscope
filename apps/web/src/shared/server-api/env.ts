import 'server-only';
import { z } from 'zod';

const serverEnvSchema = z.object({
  API_URL: z.url().default('http://localhost:4000'),
  INTERNAL_API_KEY: z.preprocess((value) => (value === '' ? undefined : value), z.string().min(32).optional()),
});

export const serverEnv = serverEnvSchema.parse({
  API_URL: process.env.API_URL || undefined,
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
});
