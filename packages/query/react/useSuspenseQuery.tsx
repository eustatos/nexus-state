import { useCallback, useRef } from 'react';
import { getSuspenseCache } from '../src/suspense-cache';
import type { SuspenseQueryOptions, SuspenseQueryResult } from './types';

/**
 * Hook for fetching data with React Suspense
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: number }) {
 *   const { data } = useSuspenseQuery(
 *     `user-${userId}`,
 *     async () => {
 *       const response = await fetch(`/api/users/${userId}`);
 *       return response.json();
 *     }
 *   );
 *
 *   return <div>{data.name}</div>; // No loading check needed
 * }
 *
 * // Wrap with Suspense
 * <Suspense fallback={<Loading />}>
 *   <UserProfile userId={1} />
 * </Suspense>
 * ```
 *
 * @param queryKey - Unique key for the query
 * @param queryFn - Function to fetch data
 * @param options - Suspense query options
 * @returns Query result with guaranteed data (or throws to Suspense)
 */
export function useSuspenseQuery<TData = unknown, TError = Error>(
  queryKey: string | readonly unknown[],
  queryFn: () => Promise<TData>,
  options: SuspenseQueryOptions<TData, TError> = {}
): SuspenseQueryResult<TData, TError> {
  const cache = getSuspenseCache();
  const queryFnRef = useRef(queryFn);

  // Keep queryFn ref updated
  queryFnRef.current = queryFn;

  // Serialize query key
  const stringQueryKey =
    typeof queryKey === 'string' ? queryKey : JSON.stringify(queryKey);

  // Read from cache (will throw promise or error)
  const data = cache.read<TData>(
    stringQueryKey,
    queryFnRef.current,
    options.staleTime ?? 0
  );

  // Create stable refetch function
  const refetch = useCallback(async () => {
    cache.invalidate(stringQueryKey);
    await cache.prefetch(stringQueryKey, queryFnRef.current, options.staleTime ?? 0);
  }, [cache, stringQueryKey, options.staleTime]);

  const remove = useCallback(() => {
    cache.invalidate(stringQueryKey);
  }, [cache, stringQueryKey]);

  // Data is guaranteed to exist here (or Suspense threw)
  return {
    data: data as TData,
    error: null,
    isLoading: false,
    isSuccess: true,
    isFetching: false,
    isStale: false,
    refetch,
    remove,
  };
}
