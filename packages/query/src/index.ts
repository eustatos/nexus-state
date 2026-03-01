export {
  useQuery,
  createQuery,
  executeQuery,
  setQueryCache,
  clearQueryCache,
  setRequestTracker,
  setRefetchManager,
  getQueryCache,
} from './query';

export { mutation, mutation as createMutation } from './mutation';
export { createQueryCache } from './cache';
export { createRequestTracker } from './request-tracker';
export { createRefetchManager, createIntervalRefetch } from './refetch-manager';
export {
  SuspenseQueryCache,
  getSuspenseCache,
  setSuspenseCache,
} from './suspense-cache';

export type {
  QueryOptions,
  QueryState,
  QueryResult,
  QueryStatus,
  QueryAtom,
  QueryCache,
  QueryCacheOptions,
  CacheEntry,
  RequestTracker,
  RefetchManager,
  RefetchManagerOptions,
  RefetchListener,
  MutationOptions,
  MutationState,
  MutationResult,
  MutationStatus,
} from './types';

// React exports
export { useQuery as useReactQuery } from '../react/useQuery';
export { useMutation } from '../react/useMutation';
export { useQueries } from '../react/useQueries';
export { useIsFetching } from '../react/useIsFetching';
export { useSuspenseQuery } from '../react/useSuspenseQuery';
export {
  QueryClientProvider,
  createQueryClient,
  useQueryClient,
  useQueryClientStore,
  useInvalidateQueries,
  useRefetchQueries,
} from '../react/QueryClientProvider';
export {
  prefetchQuery,
  prefetchQueries,
  setQueryData,
  getQueryData,
  invalidateQuery,
} from '../react/prefetch';

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
} from '../react/types';
