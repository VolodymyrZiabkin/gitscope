import { setTimeout as delay } from 'node:timers/promises';
import { describe, expect, it, vi } from 'vitest';
import { CachedLoader } from './cache';

describe('CachedLoader', () => {
  it('loads once and then serves from cache', async () => {
    const cache = new CachedLoader<string>({ max: 10 });
    const loader = vi.fn(async () => 'value');

    await expect(cache.load('key', 1000, loader)).resolves.toEqual({ value: 'value', status: 'miss' });
    await expect(cache.load('key', 1000, loader)).resolves.toEqual({ value: 'value', status: 'hit' });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('reloads after the TTL expires', async () => {
    const cache = new CachedLoader<number>({ max: 10 });
    let calls = 0;
    const loader = async () => ++calls;

    await cache.load('key', 20, loader);
    await delay(40);
    await expect(cache.load('key', 20, loader)).resolves.toEqual({ value: 2, status: 'miss' });
  });

  it('coalesces concurrent loads of the same key into one call', async () => {
    const cache = new CachedLoader<string>({ max: 10 });
    const loader = vi.fn(async () => {
      await delay(10);
      return 'value';
    });

    const results = await Promise.all([
      cache.load('key', 1000, loader),
      cache.load('key', 1000, loader),
      cache.load('key', 1000, loader),
    ]);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(results.map((result) => result.status)).toEqual(['miss', 'coalesced', 'coalesced']);
  });

  it('does not cache failures by default and retries the next time', async () => {
    const cache = new CachedLoader<string>({ max: 10 });
    const loader = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('recovered');

    await expect(cache.load('key', 1000, loader)).rejects.toThrow('boom');
    await expect(cache.load('key', 1000, loader)).resolves.toEqual({ value: 'recovered', status: 'miss' });
  });

  it('caches failures selected by errorTtl', async () => {
    class NotFound extends Error {}
    const cache = new CachedLoader<string>({
      max: 10,
      errorTtl: (error) => (error instanceof NotFound ? 1000 : undefined),
    });
    const notFound = vi.fn(() => Promise.reject(new NotFound()));
    const broken = vi.fn(() => Promise.reject(new Error('boom')));

    await expect(cache.load('a', 1000, notFound)).rejects.toBeInstanceOf(NotFound);
    await expect(cache.load('a', 1000, notFound)).rejects.toBeInstanceOf(NotFound);
    expect(notFound).toHaveBeenCalledTimes(1);

    await expect(cache.load('b', 1000, broken)).rejects.toThrow('boom');
    await expect(cache.load('b', 1000, broken)).rejects.toThrow('boom');
    expect(broken).toHaveBeenCalledTimes(2);
  });

  it('evicts the least recently used entry', async () => {
    const cache = new CachedLoader<string>({ max: 2 });
    await cache.load('a', 1000, async () => 'a');
    await cache.load('b', 1000, async () => 'b');
    await cache.load('c', 1000, async () => 'c');
    expect(cache.size).toBe(2);
    await expect(cache.load('a', 1000, async () => 'a2')).resolves.toEqual({ value: 'a2', status: 'miss' });
  });
});
