import { getQueryCache } from '../query';
import type { PrefetchOptions, PrefetchResult, PrefetchManager } from './types';

/**
 * Create a new instance of the Prefetch Manager
 */
export function createPrefetchManager(): PrefetchManager {
  const cache = getQueryCache();
  const abortControllers = new Map<string, AbortController>();
  const prefetchResults = new Map<string, PrefetchResult>();

  /**
   * Serialize query key to string
   */
  const serializeKey = (queryKey: string | readonly unknown[]): string => {
    return typeof queryKey === 'string' ? queryKey : JSON.stringify(queryKey);
  };

  /**
   * Prefetch a query
   */
  const prefetch = async (options: PrefetchOptions): Promise<void> => {
    const queryKey = serializeKey(options.queryKey);
    const staleTime = options.staleTime ?? 0;

    // Check if already cached and fresh (unless force is true)
    if (!options.force && !cache.isStale(queryKey)) {
      return;
    }

    // Cancel existing prefetch for same key
    cancel(options.queryKey);

    // Create abort controller
    const controller = new AbortController();
    abortControllers.set(queryKey, controller);

    // Track prefetch
    const result: PrefetchResult = {
      queryKey,
      status: 'pending',
      startedAt: Date.now(),
    };
    prefetchResults.set(queryKey, result);

    try {
      // Execute with timeout
      const fetchPromise = options.queryFn();
      const timeoutPromise = options.timeout
        ? new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('Prefetch timeout')),
              options.timeout!
            )
          )
        : null;

      const data = timeoutPromise
        ? await Promise.race([fetchPromise, timeoutPromise])
        : await fetchPromise;

      // Check if cancelled
      if (controller.signal.aborted) {
        result.status = 'cancelled';
        return;
      }

      // Update cache
      cache.set(queryKey, data, staleTime);

      // Update result
      result.status = 'success';
      result.endedAt = Date.now();
    } catch (error) {
      if (controller.signal.aborted) {
        result.status = 'cancelled';
      } else {
        result.status = 'error';
        result.endedAt = Date.now();
        result.error = error;
        console.error('Prefetch error:', error);
      }
    } finally {
      abortControllers.delete(queryKey);
    }
  };

  /**
   * Cancel a specific prefetch
   */
  const cancel = (queryKey: string | readonly unknown[]): void => {
    const key = serializeKey(queryKey);
    const controller = abortControllers.get(key);
    if (controller) {
      controller.abort();
      abortControllers.delete(key);
    }
  };

  /**
   * Cancel all pending prefetches
   */
  const cancelAll = (): void => {
    abortControllers.forEach((controller) => controller.abort());
    abortControllers.clear();
  };

  /**
   * Get prefetch status for a query
   */
  const getPrefetchStatus = (
    queryKey: string | readonly unknown[]
  ): PrefetchResult | null => {
    const key = serializeKey(queryKey);
    return prefetchResults.get(key) ?? null;
  };

  /**
   * Get all prefetch results
   */
  const getAllPrefetchResults = (): PrefetchResult[] => {
    return Array.from(prefetchResults.values());
  };

  return {
    prefetch,
    cancel,
    cancelAll,
    getPrefetchStatus,
    getAllPrefetchResults,
  };
}

// Global prefetch manager instance
let globalPrefetchManager: PrefetchManager | null = null;

/**
 * Get or create the global prefetch manager instance
 */
export function getPrefetchManager(): PrefetchManager {
  if (typeof window === 'undefined') {
    // SSR: return a new instance
    return createPrefetchManager();
  }

  if (!globalPrefetchManager) {
    globalPrefetchManager = createPrefetchManager();
  }
  return globalPrefetchManager;
}

/**
 * Set a custom prefetch manager instance (for testing)
 */
export function setPrefetchManager(manager: PrefetchManager): void {
  globalPrefetchManager = manager;
}

/**
 * Reset the global prefetch manager (for testing)
 */
export function resetPrefetchManager(): void {
  globalPrefetchManager = null;
}
