import { describe, expect, it } from 'vitest';
import { loadEnv } from './env';

const KEY = 'k'.repeat(32);

describe('loadEnv', () => {
  it('applies defaults', () => {
    const env = loadEnv({});
    expect(env).toMatchObject({ NODE_ENV: 'development', PORT: 4000, RATE_LIMIT_MAX: 60, TRUST_PROXY: 0 });
    expect(env.GITHUB_TOKEN).toBeUndefined();
  });

  it('treats blank values from .env as not set', () => {
    expect(loadEnv({ GITHUB_TOKEN: '', INTERNAL_API_KEY: '' })).toMatchObject({
      GITHUB_TOKEN: undefined,
      INTERNAL_API_KEY: undefined,
    });
  });

  it('requires a token and an internal key in production', () => {
    expect(() => loadEnv({ NODE_ENV: 'production' })).toThrow(/GITHUB_TOKEN: is required[\s\S]*INTERNAL_API_KEY/);
    expect(loadEnv({ NODE_ENV: 'production', GITHUB_TOKEN: 'token', INTERNAL_API_KEY: KEY }).NODE_ENV).toBe(
      'production',
    );
  });

  it('rejects a short internal key', () => {
    expect(() => loadEnv({ INTERNAL_API_KEY: 'short' })).toThrow(/INTERNAL_API_KEY/);
  });
});
