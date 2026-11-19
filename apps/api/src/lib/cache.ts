import { LRUCache } from 'lru-cache';

type Entry<V> = { ok: true; value: V } | { ok: false; error: unknown };

/** `hit` — served from cache, `coalesced` — joined an identical in-flight request, `miss` — loaded. */
export type CacheStatus = 'hit' | 'coalesced' | 'miss';

export interface CacheResult<V> {
  value: V;
  status: CacheStatus;
}

export interface CachedLoaderOptions {
  max: number;
  /** TTL for a failed load, or `undefined` to not cache the failure (the default). */
  errorTtl?: (error: unknown) => number | undefined;
}

/**
 * LRU cache with per-entry TTL and request coalescing: concurrent loads of the same key share one upstream call.
 * Lives in process memory — the reason the API is a long-running server and not serverless functions.
 */
export class CachedLoader<V> {
  readonly #entries: LRUCache<string, Entry<V>>;
  readonly #inFlight = new Map<string, Promise<V>>();
  readonly #errorTtl: CachedLoaderOptions['errorTtl'];

  constructor({ max, errorTtl }: CachedLoaderOptions) {
    this.#entries = new LRUCache({ max, ttl: 60_000 });
    this.#errorTtl = errorTtl;
  }

  async load(key: string, ttlMs: number, loader: () => Promise<V>): Promise<CacheResult<V>> {
    const cached = this.#entries.get(key);
    if (cached) {
      if (cached.ok) return { value: cached.value, status: 'hit' };
      throw cached.error;
    }

    const pending = this.#inFlight.get(key);
    if (pending) return { value: await pending, status: 'coalesced' };

    const promise = loader()
      .then(
        (value) => {
          this.#entries.set(key, { ok: true, value }, { ttl: ttlMs });
          return value;
        },
        (error: unknown) => {
          const errorTtl = this.#errorTtl?.(error);
          if (errorTtl) this.#entries.set(key, { ok: false, error }, { ttl: errorTtl });
          throw error;
        },
      )
      .finally(() => this.#inFlight.delete(key));
    this.#inFlight.set(key, promise);

    return { value: await promise, status: 'miss' };
  }

  get size(): number {
    return this.#entries.size;
  }
}
