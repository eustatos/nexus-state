import { useQuery } from './useQuery';
import type { QueryConfig, UseQueryResult } from './types';

/**
 * Hook for executing multiple queries in parallel
 *
 * @param queries - Array of query configurations
 * @returns Array of query results
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const [user, posts, comments] = useQueries([
 *     {
 *       queryKey: 'user',
 *       queryFn: () => fetch('/api/user').then((r) => r.json()),
 *     },
 *     {
 *       queryKey: 'posts',
 *       queryFn: () => fetch('/api/posts').then((r) => r.json()),
 *     },
 *     {
 *       queryKey: 'comments',
 *       queryFn: () => fetch('/api/comments').then((r) => r.json()),
 *     },
 *   ]);
 *
 *   if (user.isLoading || posts.isLoading || comments.isLoading) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>{user.data?.name}</h1>
 *       <p>Posts: {posts.data?.length}</p>
 *       <p>Comments: {comments.data?.length}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useQueries<
  TResults extends readonly unknown[] = readonly unknown[],
>(
  queries: readonly [
    ...{
      [K in keyof TResults]: QueryConfig<TResults[K], Error>;
    },
  ]
): { [K in keyof TResults]: UseQueryResult<TResults[K], Error> } {
  // Execute all queries in parallel using useQuery
  const results = queries.map((config) =>
    useQuery(config.queryKey, config.queryFn, config.options)
  );

  return results as {
    [K in keyof TResults]: UseQueryResult<TResults[K], Error>;
  };
}
