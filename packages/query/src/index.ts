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
export {
  QueryClientProvider,
  createQueryClient,
  useQueryClient,
  useQueryClientStore,
  useInvalidateQueries,
  useRefetchQueries,
} from '../react/QueryClientProvider';

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
} from '../react/types';
