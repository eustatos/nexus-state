import type {
  QueryDevToolsStore,
  QuerySnapshot,
  MutationSnapshot,
  NetworkActivityEntry,
} from './types';

/**
 * Create a new instance of the Query DevTools store
 * @returns QueryDevToolsStore instance
 */
export function createQueryDevToolsStore(): QueryDevToolsStore {
  const queries = new Map<string, QuerySnapshot>();
  const mutations = new Map<string, MutationSnapshot>();
  const networkActivity: NetworkActivityEntry[] = [];
  const listeners = new Set<() => void>();

  /**
   * Notify all listeners of store updates
   */
  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    queries,
    mutations,
    networkActivity,

    /**
     * Subscribe to store updates
     * @param listener - Callback function to call on updates
     * @returns Unsubscribe function
     */
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    /**
     * Invalidate a query (mark as stale)
     * @param queryKey - The query key to invalidate
     */
    invalidateQuery(queryKey: string) {
      const query = queries.get(queryKey);
      if (query) {
        query.isStale = true;
        notify();
      }
    },

    /**
     * Refetch a query
     * Note: This is a placeholder - actual refetch is handled by the query system
     * @param queryKey - The query key to refetch
     */
    async refetchQuery(queryKey: string) {
      // Trigger refetch through query system
      // Actual implementation depends on query cache integration
      console.log('[Query DevTools] Refetch:', queryKey);
      notify();
    },

    /**
     * Remove a query from the store
     * @param queryKey - The query key to remove
     */
    removeQuery(queryKey: string) {
      queries.delete(queryKey);
      notify();
    },

    /**
     * Clear all cached data
     */
    clearCache() {
      queries.clear();
      mutations.clear();
      networkActivity.length = 0;
      notify();
    },
  };
}

// Global DevTools store instance
let globalDevToolsStore: QueryDevToolsStore | null = null;

/**
 * Get or create the global DevTools store instance
 * @returns Global DevTools store instance
 */
export function getQueryDevToolsStore(): QueryDevToolsStore {
  if (typeof window === 'undefined') {
    // SSR: return a mock store
    return createQueryDevToolsStore();
  }

  if (!globalDevToolsStore) {
    globalDevToolsStore = createQueryDevToolsStore();
  }
  return globalDevToolsStore;
}

/**
 * Set a custom DevTools store instance (for testing or SSR)
 * @param store - Custom store instance
 */
export function setQueryDevToolsStore(store: QueryDevToolsStore): void {
  globalDevToolsStore = store;
}

/**
 * Reset the global DevTools store (for testing)
 */
export function resetQueryDevToolsStore(): void {
  globalDevToolsStore = null;
}
