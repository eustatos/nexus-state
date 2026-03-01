/**
 * @nexus-state/query/react
 *
 * React hooks for @nexus-state/query
 *
 * @example
 * ```tsx
 * import { useQuery, useMutation, QueryClientProvider, createQueryClient } from '@nexus-state/query/react';
 *
 * const queryClient = createQueryClient({
 *   defaultOptions: {
 *     queries: {
 *       staleTime: 5 * 60 * 1000,
 *     },
 *   },
 * });
 *
 * function App() {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       <YourApp />
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 */

export { useQuery } from './useQuery';
export { useMutation } from './useMutation';
export { useQueries } from './useQueries';
export { useIsFetching } from './useIsFetching';
export { useSuspenseQuery } from './useSuspenseQuery';
export {
  QueryClientProvider,
  createQueryClient,
  useQueryClient,
  useQueryClientStore,
  useInvalidateQueries,
  useRefetchQueries,
} from './QueryClientProvider';
export {
  prefetchQuery,
  prefetchQueries,
  setQueryData,
  getQueryData,
  invalidateQuery,
} from './prefetch';

export type {
  UseQueryOptions,
  UseQueryResult,
  UseMutationOptions,
  UseMutationResult,
  QueryConfig,
  QueryClient,
  QueryClientConfig,
  UseIsFetchingOptions,
  QueryClientProviderProps,
  SuspenseQueryOptions,
  SuspenseQueryResult,
  QueryCacheEntry,
  PrefetchOptions,
} from './types';
