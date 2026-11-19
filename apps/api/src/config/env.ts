import { z } from 'zod';

/** `.env` files produce empty strings for blank values — treat them as "not set". */
const optionalString = z.preprocess((value) => (value === '' ? undefined : value), z.string().optional());

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().default(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    GITHUB_TOKEN: optionalString,
    INTERNAL_API_KEY: optionalString.pipe(z.string().min(32).optional()),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    FIXTURES_DIR: z.string().default('fixtures'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    if (!env.GITHUB_TOKEN) {
      ctx.addIssue({ code: 'custom', path: ['GITHUB_TOKEN'], message: 'is required in production' });
    }
    if (!env.INTERNAL_API_KEY) {
      ctx.addIssue({ code: 'custom', path: ['INTERNAL_API_KEY'], message: 'is required in production' });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${details}`);
  }
  return result.data;
}
