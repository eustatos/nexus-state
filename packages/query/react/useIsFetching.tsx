import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@nexus-state/react';
import { getQueryCache } from '../src/query';
import type { QueryCache } from '../src/types';

/**
 * Options for useIsFetching hook
 */
export interface UseIsFetchingOptions {
  /**
   * Filter by query key prefix
   */
  queryKey?: string;
}

/**
 * Hook to get the number of fetching queries
 *
 * @param options - Options for filtering queries
 * @returns Number of currently fetching queries
 *
 * @example
 * ```tsx
 * function GlobalLoadingIndicator() {
 *   const isFetching = useIsFetching();
 *
 *   return (
 *     <div>
 *       {isFetching > 0 && (
 *         <div className="loading-spinner">
 *           Loading {isFetching} query...
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Filter by query key prefix
 * function UserLoadingIndicator() {
 *   const isFetching = useIsFetching({ queryKey: 'user' });
 *
 *   return isFetching > 0 ? <div>Loading users...</div> : null;
 * }
 * ```
 */
export function useIsFetching(options: UseIsFetchingOptions = {}): number {
  const store = useStore();
  const cache = getQueryCache();
  const [fetchingCount, setFetchingCount] = useState(0);

  // Function to calculate fetching count
  const calculateFetchingCount = useCallback(() => {
    // This is a simplified implementation
    // In a real scenario, we would need to track all active queries
    // For now, we return 0 as the core implementation doesn't expose
    // a way to get all queries
    return 0;
  }, []);

  // Subscribe to cache changes
  useEffect(() => {
    // Update initial count
    setFetchingCount(calculateFetchingCount());

    // Note: Full implementation would require a subscription mechanism
    // in the QueryCache to notify when queries start/stop fetching
    // This is a placeholder for future enhancement

    return () => {
      // Cleanup if needed
    };
  }, [calculateFetchingCount]);

  return fetchingCount;
}
