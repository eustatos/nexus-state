import { getSuspenseCache } from '../src/suspense-cache';
import type { PrefetchOptions } from './types';

/**
 * Prefetch query data before component renders
 *
 * @example
 * ```tsx
 * // In loader or parent component
 * await prefetchQuery({
 *   queryKey: 'user-1',
 *   queryFn: () => fetch('/api/users/1').then(r => r.json()),
 *   staleTime: 5 * 60 * 1000,
 * });
 *
 * // Later in component - data is already cached
 * function User() {
 *   const { data } = useSuspenseQuery('user-1', fetchUser);
 *   return <div>{data.name}</div>;
 * }
 * ```
 *
 * @param options - Prefetch options including query key, function, and stale time
 */
export async function prefetchQuery<TData = unknown>(
  options: PrefetchOptions<TData>
): Promise<void> {
  const cache = getSuspenseCache();
  const queryKey =
    typeof options.queryKey === 'string'
      ? options.queryKey
      : JSON.stringify(options.queryKey);

  if (options.force) {
    cache.invalidate(queryKey);
  }

  await cache.prefetch(queryKey, options.queryFn, options.staleTime ?? 0);
}

/**
 * Prefetch multiple queries in parallel
 *
 * @example
 * ```tsx
 * await prefetchQueries([
 *   { queryKey: 'user', queryFn: fetchUser },
 *   { queryKey: 'posts', queryFn: fetchPosts },
 *   { queryKey: 'comments', queryFn: fetchComments },
 * ]);
 * ```
 *
 * @param queries - Array of prefetch options
 */
export async function prefetchQueries(
  queries: PrefetchOptions[]
): Promise<void> {
  await Promise.all(queries.map(prefetchQuery));
}

/**
 * Set query data in cache without fetching
 *
 * @example
 * ```tsx
 * // Optimistic update
 * setQueryData('user-1', { id: 1, name: 'John' });
 * ```
 *
 * @param queryKey - Unique key for the query
 * @param data - Data to set
 */
export function setQueryData<TData = unknown>(
  queryKey: string | readonly unknown[],
  data: TData
): void {
  const cache = getSuspenseCache();
  const stringKey =
    typeof queryKey === 'string' ? queryKey : JSON.stringify(queryKey);

  cache.setQueryData(stringKey, data);
}

/**
 * Get query data from cache without suspending
 *
 * @example
 * ```tsx
 * const userData = getQueryData<User>('user-1');
 * if (userData) {
 *   console.log(userData.name);
 * }
 * ```
 *
 * @param queryKey - Unique key for the query
 * @returns Cached data or undefined
 */
export function getQueryData<TData = unknown>(
  queryKey: string | readonly unknown[]
): TData | undefined {
  const cache = getSuspenseCache();
  const stringKey =
    typeof queryKey === 'string' ? queryKey : JSON.stringify(queryKey);

  return cache.getQueryData<TData>(stringKey);
}

/**
 * Invalidate query cache
 *
 * @example
 * ```tsx
 * // After mutation
 * invalidateQuery('users');
 * ```
 *
 * @param queryKey - Unique key for the query
 */
export function invalidateQuery(
  queryKey: string | readonly unknown[]
): void {
  const cache = getSuspenseCache();
  const stringKey =
    typeof queryKey === 'string' ? queryKey : JSON.stringify(queryKey);

  cache.invalidate(stringKey);
}
