import type { QueryCacheEntry } from '../react/types';

/**
 * Enhanced cache for Suspense support
 * Manages promise-based caching for React Suspense integration
 */
export class SuspenseQueryCache {
  private cache = new Map<string, QueryCacheEntry<unknown>>();
  private promises = new Map<string, Promise<unknown>>();

  /**
   * Get cached data or throw promise for Suspense
   * @param queryKey - Unique key for the query
   * @param queryFn - Function to fetch data
   * @param staleTime - Time in ms before data is considered stale
   * @returns Cached data or throws promise/error for Suspense
   */
  public read<TData>(
    queryKey: string,
    queryFn: () => Promise<TData>,
    staleTime: number = 0
  ): TData {
    const cached = this.cache.get(queryKey) as QueryCacheEntry<TData> | undefined;

    // Check if data is fresh
    if (cached && !this.isStale(queryKey, staleTime)) {
      // Data is available and fresh
      if (cached.error) {
        throw cached.error;
      }
      return cached.data;
    }

    // Check for in-flight promise
    const existingPromise = this.promises.get(queryKey) as Promise<TData> | undefined;
    if (existingPromise) {
      // Throw existing promise for Suspense
      throw existingPromise;
    }

    // Start new fetch
    const promise = queryFn()
      .then((data) => {
        // Update cache
        this.cache.set(queryKey, {
          data,
          dataUpdatedAt: Date.now(),
        });
        this.promises.delete(queryKey);
        return data;
      })
      .catch((error) => {
        // Store error in cache
        this.cache.set(queryKey, {
          data: cached?.data as TData,
          error,
          dataUpdatedAt: cached?.dataUpdatedAt ?? 0,
        });
        this.promises.delete(queryKey);
        throw error;
      });

    this.promises.set(queryKey, promise);

    // Throw promise for Suspense
    throw promise;
  }

  /**
   * Prefetch query data without suspending
   * @param queryKey - Unique key for the query
   * @param queryFn - Function to fetch data
   * @param staleTime - Time in ms before data is considered stale
   */
  public async prefetch<TData>(
    queryKey: string,
    queryFn: () => Promise<TData>,
    staleTime: number = 0
  ): Promise<void> {
    const cached = this.cache.get(queryKey) as QueryCacheEntry<TData> | undefined;

    // Skip if fresh data exists
    if (cached && !this.isStale(queryKey, staleTime)) {
      return;
    }

    // Execute fetch
    try {
      const data = await queryFn();
      this.cache.set(queryKey, {
        data,
        dataUpdatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Prefetch error:', error);
      // Don't throw - prefetch failures are non-fatal
    }
  }

  /**
   * Check if data is stale
   * @param queryKey - Unique key for the query
   * @param staleTime - Time in ms before data is considered stale
   * @returns true if data is stale or not cached
   */
  private isStale(queryKey: string, staleTime: number): boolean {
    const cached = this.cache.get(queryKey);
    if (!cached) return true;

    const age = Date.now() - cached.dataUpdatedAt;
    return age > staleTime;
  }

  /**
   * Invalidate query cache
   * @param queryKey - Unique key for the query
   */
  public invalidate(queryKey: string): void {
    this.cache.delete(queryKey);
    this.promises.delete(queryKey);
  }

  /**
   * Set query data manually
   * @param queryKey - Unique key for the query
   * @param data - Data to set
   */
  public setQueryData<TData>(queryKey: string, data: TData): void {
    this.cache.set(queryKey, {
      data,
      dataUpdatedAt: Date.now(),
    });
  }

  /**
   * Get query data without suspending
   * @param queryKey - Unique key for the query
   * @returns Cached data or undefined
   */
  public getQueryData<TData>(queryKey: string): TData | undefined {
    const cached = this.cache.get(queryKey) as QueryCacheEntry<TData> | undefined;
    return cached?.data;
  }

  /**
   * Clear all cache
   */
  public clear(): void {
    this.cache.clear();
    this.promises.clear();
  }
}

// Global Suspense cache instance
let globalSuspenseCache: SuspenseQueryCache | null = null;

/**
 * Get or create global Suspense cache instance
 * @returns Global Suspense cache instance
 */
export function getSuspenseCache(): SuspenseQueryCache {
  if (!globalSuspenseCache) {
    globalSuspenseCache = new SuspenseQueryCache();
  }
  return globalSuspenseCache;
}

/**
 * Set custom Suspense cache instance (for testing or SSR)
 * @param cache - Custom cache instance
 */
export function setSuspenseCache(cache: SuspenseQueryCache): void {
  globalSuspenseCache = cache;
}
