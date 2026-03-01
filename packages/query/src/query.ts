import { atom, createStore, Store } from '@nexus-state/core';
import { QueryOptions, QueryState, QueryAtom, QueryResult, QueryCache, RequestTracker, RefetchManager } from './types';
import { createQueryCache } from './cache';
import { createRequestTracker } from './request-tracker';
import { createRefetchManager, createIntervalRefetch } from './refetch-manager';

/**
 * Convert query key to string
 */
function serializeQueryKey(queryKey: string | readonly unknown[]): string {
  if (typeof queryKey === 'string') {
    return queryKey;
  }
  return JSON.stringify(queryKey);
}

/**
 * Create initial query state
 */
function createInitialState<TData, TError>(
  options: QueryOptions<TData, TError>
): QueryState<TData, TError> {
  const hasInitialData = options.initialData !== undefined;

  return {
    status: hasInitialData ? 'success' : 'idle',
    data: options.initialData,
    error: null,
    isLoading: false,
    isSuccess: hasInitialData,
    isError: false,
    isIdle: !hasInitialData,
    isFetching: false,
    dataUpdatedAt: hasInitialData ? Date.now() : 0,
    errorUpdatedAt: 0,
    failureCount: 0
  };
}

/**
 * Create a query atom
 */
export function createQuery<TData = unknown, TError = Error>(
  store: Store,
  options: QueryOptions<TData, TError>
): QueryAtom<TData, TError> {
  const queryKey = serializeQueryKey(options.queryKey);

  // Create atom with initial state
  const queryAtom = atom<QueryState<TData, TError>>(
    createInitialState(options),
    `query:${queryKey}`
  ) as unknown as QueryAtom<TData, TError>;

  // Attach metadata
  queryAtom.queryKey = queryKey;
  queryAtom.options = options;

  return queryAtom;
}

// Global cache instance
let globalCache: QueryCache | null = null;

/**
 * Get the global query cache
 */
export function getQueryCache(): QueryCache {
  if (!globalCache) {
    globalCache = createQueryCache();
  }
  return globalCache;
}

/**
 * Set custom query cache
 */
export function setQueryCache(cache: QueryCache): void {
  if (globalCache) {
    globalCache.dispose();
  }
  globalCache = cache;
}

/**
 * Clear query cache
 */
export function clearQueryCache(): void {
  getQueryCache().clear();
}

// Global request tracker
let globalRequestTracker: RequestTracker | null = null;

/**
 * Get or create global request tracker
 */
function getRequestTracker(): RequestTracker {
  if (!globalRequestTracker) {
    globalRequestTracker = createRequestTracker();
  }
  return globalRequestTracker;
}

/**
 * Set custom request tracker
 */
export function setRequestTracker(tracker: RequestTracker): void {
  globalRequestTracker = tracker;
}

// Global refetch manager
let globalRefetchManager: RefetchManager | null = null;

/**
 * Get or create global refetch manager
 */
function getRefetchManager(): RefetchManager {
  if (!globalRefetchManager) {
    globalRefetchManager = createRefetchManager();
  }
  return globalRefetchManager;
}

/**
 * Set custom refetch manager
 */
export function setRefetchManager(manager: RefetchManager): void {
  if (globalRefetchManager) {
    globalRefetchManager.dispose();
  }
  globalRefetchManager = manager;
}

/**
 * Execute query
 * @param store - Store instance
 * @param queryAtom - Query atom to execute
 * @param retryCount - Current retry attempt (internal)
 * @param force - Force execution even if disabled
 */
export async function executeQuery<TData, TError>(
  store: Store,
  queryAtom: QueryAtom<TData, TError>,
  retryCount: number = 0,
  force: boolean = false
): Promise<void> {
  const { options } = queryAtom;
  const requestTracker = getRequestTracker();
  const queryKey = queryAtom.queryKey;

  // Check if enabled (unless forced)
  if (options.enabled === false && !force) {
    return;
  }

  // Check for in-flight request (deduplication)
  const existingRequest = requestTracker.get<TData>(queryKey);
  if (existingRequest && !force) {
    // Wait for existing request to complete
    try {
      const data = await existingRequest;

      // Update state with result from deduplicated request
      const currentState = store.get(queryAtom);
      if (currentState.status !== 'success') {
        store.set(queryAtom, {
          status: 'success',
          data,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
          isIdle: false,
          isFetching: false,
          dataUpdatedAt: Date.now(),
          errorUpdatedAt: 0,
          failureCount: 0
        });
      }

      return;
    } catch (error) {
      // Error will be handled by the original request
      return;
    }
  }

  // Set loading state
  const currentState = store.get(queryAtom);
  store.set(queryAtom, {
    ...currentState,
    status: currentState.data ? 'success' : 'loading',
    isLoading: currentState.data === undefined,
    isFetching: true,
    isIdle: false
  });

  // Create and track new request
  const requestPromise = options.queryFn();

  // Only track if not a retry
  if (retryCount === 0) {
    requestTracker.set(queryKey, requestPromise);
  }

  try {
    // Execute query function
    const data = await requestPromise;

    // Set success state
    store.set(queryAtom, {
      status: 'success',
      data,
      error: null,
      isLoading: false,
      isSuccess: true,
      isError: false,
      isIdle: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0
    });

    // Call success callback
    if (options.onSuccess) {
      options.onSuccess(data);
    }

    // Call settled callback
    if (options.onSettled) {
      options.onSettled(data, null);
    }

  } catch (error) {
    const typedError = error as TError;
    const newFailureCount = retryCount + 1;

    // Determine if should retry
    const maxRetries = typeof options.retry === 'number'
      ? options.retry
      : options.retry === false
        ? 0
        : 3;

    const shouldRetry = newFailureCount <= maxRetries;

    if (shouldRetry) {
      // Calculate retry delay
      const retryDelay = typeof options.retryDelay === 'function'
        ? options.retryDelay(retryCount)
        : options.retryDelay ?? Math.min(1000 * 2 ** retryCount, 30000);

      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return executeQuery(store, queryAtom, newFailureCount, force);
    }

    // Set error state
    store.set(queryAtom, {
      status: 'error',
      data: currentState.data,
      error: typedError,
      isLoading: false,
      isSuccess: false,
      isError: true,
      isIdle: false,
      isFetching: false,
      dataUpdatedAt: currentState.dataUpdatedAt,
      errorUpdatedAt: Date.now(),
      failureCount: newFailureCount
    });

    // Call error callback
    if (options.onError) {
      options.onError(typedError);
    }

    // Call settled callback
    if (options.onSettled) {
      options.onSettled(undefined, typedError);
    }
  }
}

/**
 * Use query (framework-agnostic)
 */
export function useQuery<TData = unknown, TError = Error>(
  store: Store,
  options: QueryOptions<TData, TError>
): QueryResult<TData, TError> {
  const cache = getQueryCache();
  const requestTracker = getRequestTracker();
  const refetchManager = getRefetchManager();
  const queryKey = serializeQueryKey(options.queryKey);

  // Get or create query atom
  const queryAtom = createQuery(store, options);

  // Check cache first
  const cachedEntry = cache.get<TData>(queryKey);

  // Use cached data if available and not stale
  if (cachedEntry && !cache.isStale(queryKey)) {
    store.set(queryAtom, {
      ...store.get(queryAtom),
      data: cachedEntry.data,
      dataUpdatedAt: cachedEntry.dataUpdatedAt,
      status: 'success',
      isSuccess: true,
      isIdle: false
    });
  }

  // Execute query if no data or stale
  const currentState = store.get(queryAtom);
  const shouldFetch =
    (currentState.status === 'idle' || cache.isStale(queryKey)) &&
    options.enabled !== false;

  if (shouldFetch) {
    executeQuery(store, queryAtom).then(() => {
      // Update cache on success
      const newState = store.get(queryAtom);
      if (newState.status === 'success' && newState.data !== undefined) {
        cache.set(queryKey, newState.data, options.staleTime);
      }
    });
  }

  // Setup automatic refetching
  let intervalCleanup: (() => void) | null = null;
  let focusCleanup: (() => void) | null = null;

  // Window focus / reconnect refetch
  const shouldRegisterRefetch =
    options.refetchOnWindowFocus !== false || options.refetchOnReconnect !== false;

  if (shouldRegisterRefetch) {
    focusCleanup = refetchManager.register(queryKey, () => {
      // Only refetch if data is stale
      if (cache.isStale(queryKey)) {
        executeQuery(store, queryAtom, 0, true).then(() => {
          const state = store.get(queryAtom);
          if (state.status === 'success' && state.data !== undefined) {
            cache.set(queryKey, state.data, options.staleTime);
          }
        });
      }
    });
  }

  // Interval refetch
  if (options.refetchInterval && options.refetchInterval > 0) {
    intervalCleanup = createIntervalRefetch(() => {
      executeQuery(store, queryAtom, 0, true).then(() => {
        const state = store.get(queryAtom);
        if (state.status === 'success' && state.data !== undefined) {
          cache.set(queryKey, state.data, options.staleTime);
        }
      });
    }, options.refetchInterval);
  }

  // Helper to get current state from store
  const getState = (): QueryState<TData, TError> => store.get(queryAtom);

  // Create result object with getters for state properties
  const result: QueryResult<TData, TError> = {
    get status() {
      return getState().status;
    },
    get data() {
      return getState().data;
    },
    get error() {
      return getState().error;
    },
    get isLoading() {
      return getState().isLoading;
    },
    get isSuccess() {
      return getState().isSuccess;
    },
    get isError() {
      return getState().isError;
    },
    get isIdle() {
      return getState().isIdle;
    },
    get isFetching() {
      return getState().isFetching;
    },
    get dataUpdatedAt() {
      return getState().dataUpdatedAt;
    },
    get errorUpdatedAt() {
      return getState().errorUpdatedAt;
    },
    get failureCount() {
      return getState().failureCount;
    },
    refetch: async () => {
      await executeQuery(store, queryAtom, 0, true);
      const state = store.get(queryAtom);
      if (state.status === 'success' && state.data !== undefined) {
        cache.set(queryKey, state.data, options.staleTime);
      }
    },
    remove: () => {
      // Cleanup subscriptions
      if (focusCleanup) focusCleanup();
      if (intervalCleanup) intervalCleanup();
      
      cache.remove(queryKey);
      store.set(queryAtom, createInitialState(options));
    }
  };

  return result;
}
