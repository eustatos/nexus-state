import { useEffect, useRef, useCallback } from 'react';
import { useAtomValue, useStore } from '@nexus-state/react';
import { createQuery, executeQuery, getQueryCache } from '../src/query';
import { useSuspenseQuery } from './useSuspenseQuery';
import type {
  UseQueryOptions,
  UseQueryResult,
  SuspenseQueryOptions,
  SuspenseQueryResult,
} from './types';
import type { QueryAtom, QueryState } from '../src/types';

/**
 * Hook for fetching data with automatic caching and re-renders
 *
 * @param queryKey - Unique key for the query
 * @param queryFn - Function to fetch data
 * @param options - Query options
 * @returns Query result with data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: number }) {
 *   const { data, isLoading, error, refetch } = useQuery(
 *     `user-${userId}`,
 *     async () => {
 *       const response = await fetch(`/api/users/${userId}`);
 *       return response.json();
 *     },
 *     {
 *       staleTime: 5 * 60 * 1000,
 *       retry: 3,
 *     }
 *   );
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return <div>{data.name}</div>;
 * }
 * ```
 */
export function useQuery<TData = unknown, TError = Error>(
  queryKey: string | readonly unknown[],
  queryFn: () => Promise<TData>,
  options: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> = {}
): UseQueryResult<TData, TError> | SuspenseQueryResult<TData, TError> {
  // If suspense enabled, delegate to useSuspenseQuery
  if (options.suspense) {
    const suspenseOptions: SuspenseQueryOptions<TData, TError> = {
      ...options,
      staleTime: options.staleTime,
    };
    return useSuspenseQuery<TData, TError>(queryKey, queryFn, suspenseOptions);
  }

  const store = useStore();
  const queryRef = useRef<QueryAtom<TData, TError> | null>(null);
  const optionsRef = useRef<UseQueryOptions<TData, TError>>({ ...options, queryKey, queryFn });
  const queryFnRef = useRef<() => Promise<TData>>(queryFn);

  // Keep refs updated
  optionsRef.current = { ...options, queryKey, queryFn };
  queryFnRef.current = queryFn;

  // Create query instance once
  if (!queryRef.current) {
    queryRef.current = createQuery(store, { ...options, queryKey, queryFn });
  }

  const queryAtom = queryRef.current;

  // Subscribe to state changes using useAtomValue
  const state = useAtomValue(queryAtom);

  // Get cache for stale check
  const cache = getQueryCache();
  const stringQueryKey = typeof queryKey === 'string' ? queryKey : JSON.stringify(queryKey);

  // Check if data is stale
  const isStale = cache.isStale(stringQueryKey);

  // Handle enabled option and initial fetch
  useEffect(() => {
    const enabled = optionsRef.current.enabled ?? true;

    if (enabled && state.status === 'idle') {
      // Execute query on mount if enabled and idle
      executeQuery(store, queryAtom).then(() => {
        const newState = store.get(queryAtom);
        if (newState.status === 'success' && newState.data !== undefined) {
          cache.set(stringQueryKey, newState.data, optionsRef.current.staleTime);
        }
      });
    }
  }, [store, queryAtom, state.status, stringQueryKey, cache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optional: cleanup can be added here if needed
      // For now, queries remain in cache
    };
  }, []);

  // Error boundary integration
  if (options.useErrorBoundary && state.isError) {
    const shouldThrow =
      typeof options.useErrorBoundary === 'function'
        ? options.useErrorBoundary(state.error as TError)
        : true;

    if (shouldThrow && state.error) {
      throw state.error;
    }
  }

  // Suspense support
  if (options.suspense && state.isLoading) {
    throw executeQuery(store, queryAtom);
  }

  // Create stable refetch function
  const refetch = useCallback(async () => {
    await executeQuery(store, queryAtom, 0, true);
    const newState = store.get(queryAtom);
    if (newState.status === 'success' && newState.data !== undefined) {
      cache.set(stringQueryKey, newState.data, optionsRef.current.staleTime);
    }
  }, [store, queryAtom, stringQueryKey, cache]);

  // Create result object with all required properties
  const result: UseQueryResult<TData, TError> = {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    isError: state.isError,
    isSuccess: state.isSuccess,
    isFetching: state.isFetching,
    isStale,
    status: state.status,
    refetch,
    // Additional properties from QueryResult
    remove: () => {
      cache.remove(stringQueryKey);
    },
    isIdle: state.isIdle,
    dataUpdatedAt: state.dataUpdatedAt,
    errorUpdatedAt: state.errorUpdatedAt,
    failureCount: state.failureCount,
  };

  return result;
}
