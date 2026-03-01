import type {
  QueryOptions,
  QueryResult,
  MutationOptions,
  MutationResult,
} from '../src/types';
import type { Store } from '@nexus-state/core';
import type * as React from 'react';

/**
 * Options for useQuery hook
 */
export interface UseQueryOptions<TData = unknown, TError = Error>
  extends Omit<QueryOptions<TData, TError>, 'store'> {
  /**
   * Enable/disable query
   * @default true
   */
  enabled?: boolean;

  /**
   * Enable React Suspense mode
   * @default false
   */
  suspense?: boolean;

  /**
   * Throw errors to React Error Boundary
   * @default false
   */
  useErrorBoundary?: boolean | ((error: TError) => boolean);
}

/**
 * Result from useQuery hook
 */
export interface UseQueryResult<TData = unknown, TError = Error> {
  /**
   * The fetched data
   */
  data: TData | undefined;

  /**
   * Error if failed
   */
  error: TError | null;

  /**
   * Initial loading state
   */
  isLoading: boolean;

  /**
   * Query succeeded
   */
  isSuccess: boolean;

  /**
   * Query failed
   */
  isError: boolean;

  /**
   * Query hasn't run yet
   */
  isIdle: boolean;

  /**
   * Currently fetching
   */
  isFetching: boolean;

  /**
   * Data is stale
   */
  isStale: boolean;

  /**
   * Query status
   */
  status: 'idle' | 'loading' | 'error' | 'success';

  /**
   * Manually refetch
   */
  refetch: () => Promise<void>;

  /**
   * Remove from cache
   */
  remove: () => void;

  /**
   * Timestamp of last data update
   */
  dataUpdatedAt: number;

  /**
   * Timestamp of last error update
   */
  errorUpdatedAt: number;

  /**
   * Number of failed attempts
   */
  failureCount: number;
}

/**
 * Options for useMutation hook
 */
export interface UseMutationOptions<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> extends Omit<MutationOptions<TData, TError, TVariables, TContext>, 'store'> {}

/**
 * Result from useMutation hook
 */
export interface UseMutationResult<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> {
  /**
   * Current mutation data
   */
  data: TData | undefined;

  /**
   * Current mutation error
   */
  error: TError | null;

  /**
   * Whether mutation is idle
   */
  isIdle: boolean;

  /**
   * Whether mutation is pending
   */
  isPending: boolean;

  /**
   * Whether mutation has errored
   */
  isError: boolean;

  /**
   * Whether mutation has succeeded
   */
  isSuccess: boolean;

  /**
   * Mutation status
   */
  status: 'idle' | 'loading' | 'error' | 'success';

  /**
   * Execute mutation (fire and forget)
   */
  mutate: (variables: TVariables) => void;

  /**
   * Execute mutation and return promise
   */
  mutateAsync: (variables: TVariables) => Promise<TData>;

  /**
   * Reset mutation state to initial
   */
  reset: () => void;

  /**
   * Variables from last mutation execution
   */
  variables: TVariables | undefined;

  /**
   * Number of failed attempts
   */
  failureCount: number;
}

/**
 * Configuration for a single query in useQueries
 */
export interface QueryConfig<TData = unknown, TError = Error> {
  /**
   * Unique key for the query
   */
  queryKey: string | readonly unknown[];

  /**
   * Function to fetch data
   */
  queryFn: () => Promise<TData>;

  /**
   * Query options
   */
  options?: UseQueryOptions<TData, TError>;
}

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
 * Query client configuration
 */
export interface QueryClientConfig {
  /**
   * Default query options
   */
  defaultOptions?: {
    queries?: Partial<UseQueryOptions>;
    mutations?: Partial<UseMutationOptions>;
  };

  /**
   * Store instance (optional, creates default if not provided)
   */
  store?: Store;
}

/**
 * Query client for managing queries
 */
export interface QueryClient {
  /**
   * Get store instance
   */
  getStore(): Store;

  /**
   * Get default query options
   */
  getDefaultOptions(): Partial<UseQueryOptions> | undefined;

  /**
   * Get default mutation options
   */
  getDefaultMutationOptions(): Partial<UseMutationOptions> | undefined;

  /**
   * Set default query options
   */
  setDefaultOptions(options: QueryClientConfig['defaultOptions']): void;

  /**
   * Clear all query cache
   */
  clearCache(): void;

  /**
   * Invalidate queries by key pattern
   */
  invalidateQueries(queryKey?: string): void;

  /**
   * Refetch queries by key pattern
   */
  refetchQueries(queryKey?: string): Promise<void>;
}

/**
 * Props for QueryClientProvider component
 */
export interface QueryClientProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Query client instance */
  client: QueryClient;
}

// ============================================================================
// Suspense Types
// ============================================================================

/**
 * Options for useSuspenseQuery hook
 * Suspense is always enabled, so 'suspense' option is not needed
 */
export interface SuspenseQueryOptions<TData = unknown, TError = Error>
  extends Omit<
    UseQueryOptions<TData, TError>,
    'suspense' | 'enabled' | 'queryKey' | 'queryFn'
  > {
  /**
   * Time in milliseconds before data is considered stale
   * @default 0
   */
  staleTime?: number;
}

/**
 * Result from useSuspenseQuery hook
 * In Suspense mode, data is always available when rendered
 */
export interface SuspenseQueryResult<TData = unknown, TError = Error> {
  /**
   * The fetched data (never undefined in Suspense mode)
   */
  data: TData;

  /**
   * Error is always null (errors are thrown to boundary)
   */
  error: null;

  /**
   * Always false in Suspense mode (suspends instead)
   */
  isLoading: false;

  /**
   * Always true when component is rendered
   */
  isSuccess: true;

  /**
   * Currently fetching in background
   */
  isFetching: boolean;

  /**
   * Data is stale
   */
  isStale: boolean;

  /**
   * Manually refetch
   */
  refetch: () => Promise<void>;

  /**
   * Remove from cache
   */
  remove: () => void;
}

/**
 * Cache entry for Suspense queries
 */
export interface QueryCacheEntry<TData = unknown> {
  /** Cached data */
  data: TData;
  /** In-flight promise (if fetching) */
  promise?: Promise<TData>;
  /** Cached error (if failed) */
  error?: Error;
  /** Timestamp of last data update */
  dataUpdatedAt: number;
}

/**
 * Options for prefetching queries
 */
export interface PrefetchOptions<TData = unknown> {
  /** Unique key for the query */
  queryKey: string | readonly unknown[];
  /** Function to fetch data */
  queryFn: () => Promise<TData>;
  /** Time in milliseconds before data is considered stale */
  staleTime?: number;
  /** Force refetch even if cached */
  force?: boolean;
}
