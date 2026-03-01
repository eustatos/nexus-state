import { PrimitiveAtom, Store } from '@nexus-state/core';

/**
 * Query status types
 */
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Query state structure
 */
export interface QueryState<TData = unknown, TError = Error> {
  status: QueryStatus;
  data: TData | undefined;
  error: TError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  isFetching: boolean;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  failureCount: number;
}

/**
 * Query options
 */
export interface QueryOptions<TData = unknown, TError = Error> {
  /**
   * Unique key for the query
   */
  queryKey: string | readonly unknown[];

  /**
   * Function to fetch data
   */
  queryFn: () => Promise<TData>;

  /**
   * Time in ms before data is considered stale
   * @default 0
   */
  staleTime?: number;

  /**
   * Time in ms before inactive cache data is garbage collected
   * @default 5 * 60 * 1000 (5 minutes)
   */
  cacheTime?: number;

  /**
   * Number of retry attempts
   * @default 3
   */
  retry?: number | boolean;

  /**
   * Delay in ms between retries
   * @default attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
   */
  retryDelay?: number | ((attemptIndex: number) => number);

  /**
   * Enable/disable query
   * @default true
   */
  enabled?: boolean;

  /**
   * Refetch on window focus
   * @default true
   */
  refetchOnWindowFocus?: boolean;

  /**
   * Refetch on reconnect
   * @default true
   */
  refetchOnReconnect?: boolean;

  /**
   * Refetch interval in ms
   */
  refetchInterval?: number | false;

  /**
   * Initial data
   */
  initialData?: TData;

  /**
   * Callback on success
   */
  onSuccess?: (data: TData) => void;

  /**
   * Callback on error
   */
  onError?: (error: TError) => void;

  /**
   * Callback on settled (success or error)
   */
  onSettled?: (data: TData | undefined, error: TError | null) => void;
}

/**
 * Query result
 */
export interface QueryResult<TData = unknown, TError = Error>
  extends QueryState<TData, TError> {
  /**
   * Refetch the query
   */
  refetch: () => Promise<void>;

  /**
   * Remove the query from cache
   */
  remove: () => void;
}

/**
 * Internal query atom type
 */
export interface QueryAtom<TData = unknown, TError = Error>
  extends PrimitiveAtom<QueryState<TData, TError>> {
  queryKey: string;
  options: QueryOptions<TData, TError>;
}

/**
 * Cache entry metadata
 */
export interface CacheEntry<TData = unknown> {
  data: TData;
  dataUpdatedAt: number;
  isStale: boolean;
}

/**
 * Query cache options
 */
export interface QueryCacheOptions {
  /**
   * Default stale time in ms
   * @default 0
   */
  defaultStaleTime?: number;

  /**
   * Default cache time in ms
   * @default 5 * 60 * 1000 (5 minutes)
   */
  defaultCacheTime?: number;

  /**
   * Garbage collection interval in ms
   * @default 60 * 1000 (1 minute)
   */
  gcInterval?: number;
}

/**
 * Query cache interface
 */
export interface QueryCache {
  /**
   * Get cached data for query key
   */
  get<TData>(queryKey: string): CacheEntry<TData> | undefined;

  /**
   * Set cached data for query key
   */
  set<TData>(queryKey: string, data: TData, staleTime?: number): void;

  /**
   * Remove cached data for query key
   */
  remove(queryKey: string): void;

  /**
   * Clear all cached data
   */
  clear(): void;

  /**
   * Check if data is stale
   */
  isStale(queryKey: string): boolean;

  /**
   * Run garbage collection
   */
  gc(): void;

  /**
   * Dispose cache and stop GC
   */
  dispose(): void;
}

/**
 * In-flight request tracker
 */
export interface RequestTracker {
  /**
   * Get active request promise for query key
   */
  get<TData>(queryKey: string): Promise<TData> | undefined;

  /**
   * Track new request for query key
   */
  set<TData>(queryKey: string, promise: Promise<TData>): void;

  /**
   * Remove tracked request for query key
   */
  remove(queryKey: string): void;

  /**
   * Clear all tracked requests
   */
  clear(): void;

  /**
   * Check if request is in-flight
   */
  has(queryKey: string): boolean;
}

/**
 * Refetch listener callback
 */
export type RefetchListener = (queryKey: string) => void;

/**
 * Refetch manager for handling automatic refetches
 */
export interface RefetchManager {
  /**
   * Register query for refetch events
   */
  register(queryKey: string, listener: RefetchListener): () => void;

  /**
   * Unregister query from refetch events
   */
  unregister(queryKey: string): void;

  /**
   * Trigger refetch for all registered queries
   */
  refetchAll(): void;

  /**
   * Dispose and cleanup all listeners
   */
  dispose(): void;
}

/**
 * Refetch manager options
 */
export interface RefetchManagerOptions {
  /**
   * Enable window focus refetching
   * @default true
   */
  refetchOnWindowFocus?: boolean;

  /**
   * Enable network reconnect refetching
   * @default true
   */
  refetchOnReconnect?: boolean;

  /**
   * Window focus event throttle time in ms
   * @default 1000
   */
  focusThrottleMs?: number;
}

/**
 * Mutation options
 */
export interface MutationOptions<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
> {
  /**
   * Mutation function
   */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * Callback on success
   */
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined
  ) => void;

  /**
   * Callback on error
   */
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined
  ) => void;

  /**
   * Callback on settled (success or error)
   */
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined
  ) => void;

  /**
   * Callback for optimistic updates
   */
  onMutate?: (variables: TVariables) => TContext | Promise<TContext>;

  /**
   * Number of retry attempts
   * @default 0
   */
  retry?: number | boolean;

  /**
   * Delay in ms between retries
   * @default 1000
   */
  retryDelay?: number | ((failureCount: number) => number);

  /**
   * Query keys to invalidate after successful mutation
   */
  invalidateQueries?: string[];

  /**
   * Query keys to refetch after successful mutation
   */
  refetchQueries?: string[];

  /**
   * Store instance (optional, creates default if not provided)
   */
  store?: Store;
}

/**
 * Mutation status types
 */
export type MutationStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Mutation state structure
 */
export interface MutationState<
  TData = unknown,
  TError = Error,
  TVariables = void
> {
  status: MutationStatus;
  data: TData | undefined;
  error: TError | null;
  variables: TVariables | undefined;
  failureCount: number;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
}

/**
 * Mutation result
 */
export interface MutationResult<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
> {
  /**
   * Atom containing mutation state
   */
  state: PrimitiveAtom<MutationState<TData, TError, TVariables>>;

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
}
