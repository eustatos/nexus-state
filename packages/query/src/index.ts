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

// DevTools exports
export {
  createQueryDevToolsStore,
  getQueryDevToolsStore,
  setQueryDevToolsStore,
  resetQueryDevToolsStore,
} from './devtools/devtools-store';
export {
  trackQuery,
  trackNetworkActivity,
  updateNetworkActivity,
  withDevToolsTracking,
  trackMutation,
  untrackQuery,
  untrackMutation,
} from './devtools/query-tracker';

// Prefetch exports
export {
  createPrefetchManager,
  getPrefetchManager,
  setPrefetchManager,
  resetPrefetchManager,
} from './prefetch/prefetch-manager';

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

// Re-export DevTools types
export type {
  QueryDevToolsConfig,
  QuerySnapshot,
  MutationSnapshot,
  NetworkActivityEntry,
  QueryCacheSnapshot,
  QueryDevToolsStore,
} from './devtools/types';

// Re-export Prefetch types
export type {
  PrefetchPriority,
  PrefetchTriggerType,
  PrefetchOptions as PrefetchOptionsBase,
  PrefetchTrigger,
  PrefetchStatus,
  PrefetchResult,
  PrefetchManager,
} from './prefetch/types';

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
