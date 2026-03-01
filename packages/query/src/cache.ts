import { QueryCache, QueryCacheOptions, CacheEntry } from './types';

const DEFAULT_STALE_TIME = 0;
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_GC_INTERVAL = 60 * 1000; // 1 minute

interface CacheRecord<TData = unknown> {
  entry: CacheEntry<TData>;
  cacheTime: number;
  lastAccessedAt: number;
}

/**
 * Create a query cache
 */
export function createQueryCache(options: QueryCacheOptions = {}): QueryCache {
  const {
    defaultStaleTime = DEFAULT_STALE_TIME,
    defaultCacheTime = DEFAULT_CACHE_TIME,
    gcInterval = DEFAULT_GC_INTERVAL
  } = options;

  const cache = new Map<string, CacheRecord>();
  let gcTimer: ReturnType<typeof setInterval> | null = null;

  // Start garbage collection
  const startGC = (): void => {
    if (gcTimer) return;

    gcTimer = setInterval(() => {
      gc();
    }, gcInterval);
  };

  // Stop garbage collection
  const stopGC = (): void => {
    if (gcTimer) {
      clearInterval(gcTimer);
      gcTimer = null;
    }
  };

  // Garbage collection
  const gc = (): void => {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, record] of cache.entries()) {
      const timeSinceLastAccess = now - record.lastAccessedAt;
      if (timeSinceLastAccess > record.cacheTime) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => cache.delete(key));
  };

  // Check if data is stale
  const isStale = (queryKey: string): boolean => {
    const record = cache.get(queryKey);
    if (!record) return true;

    return record.entry.isStale;
  };

  // Get cached entry
  const get = <TData>(queryKey: string): CacheEntry<TData> | undefined => {
    const record = cache.get(queryKey) as CacheRecord<TData> | undefined;
    if (!record) return undefined;

    // Update last accessed time
    record.lastAccessedAt = Date.now();

    return record.entry;
  };

  // Set cached entry
  const set = <TData>(
    queryKey: string,
    data: TData,
    staleTime: number = defaultStaleTime
  ): void => {
    const now = Date.now();

    cache.set(queryKey, {
      entry: {
        data,
        dataUpdatedAt: now,
        isStale: staleTime === 0
      },
      cacheTime: defaultCacheTime,
      lastAccessedAt: now
    });

    // Update stale status after staleTime
    if (staleTime > 0) {
      setTimeout(() => {
        const record = cache.get(queryKey);
        if (record) {
          record.entry.isStale = true;
        }
      }, staleTime);
    }
  };

  // Remove entry
  const remove = (queryKey: string): void => {
    cache.delete(queryKey);
  };

  // Clear all
  const clear = (): void => {
    cache.clear();
  };

  // Dispose
  const dispose = (): void => {
    stopGC();
    cache.clear();
  };

  // Start GC on creation
  startGC();

  return {
    get,
    set,
    remove,
    clear,
    isStale,
    gc,
    dispose
  };
}
