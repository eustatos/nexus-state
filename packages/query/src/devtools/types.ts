/**
 * Configuration for Query DevTools panel
 */
export interface QueryDevToolsConfig {
  /**
   * Position of the toggle button when panel is closed
   * @default 'bottom-right'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  /**
   * Whether panel is initially open
   * @default false
   */
  initialIsOpen?: boolean;

  /**
   * Position of the panel when open
   * @default 'bottom'
   */
  panelPosition?: 'left' | 'right' | 'bottom';

  /**
   * Custom props for the close button
   */
  closeButtonProps?: React.ComponentProps<'button'>;

  /**
   * Custom props for the toggle button
   */
  toggleButtonProps?: React.ComponentProps<'button'>;
}

/**
 * Snapshot of a query state for DevTools
 */
export interface QuerySnapshot {
  /** Unique query key */
  queryKey: string;

  /** Current query status */
  status: 'idle' | 'loading' | 'success' | 'error';

  /** Query data */
  data: unknown;

  /** Query error */
  error: unknown;

  /** Timestamp of last successful data update */
  dataUpdatedAt: number;

  /** Timestamp of last error update */
  errorUpdatedAt: number;

  /** Whether query is currently fetching */
  isFetching: boolean;

  /** Whether data is stale */
  isStale: boolean;

  /** Number of consecutive failures */
  failureCount: number;
}

/**
 * Snapshot of a mutation state for DevTools
 */
export interface MutationSnapshot {
  /** Unique mutation identifier */
  mutationId: string;

  /** Current mutation status */
  status: 'idle' | 'loading' | 'success' | 'error';

  /** Variables passed to mutation */
  variables: unknown;

  /** Mutation result data */
  data: unknown;

  /** Mutation error */
  error: unknown;

  /** Number of consecutive failures */
  failureCount: number;
}

/**
 * Network activity entry for tracking requests
 */
export interface NetworkActivityEntry {
  /** Unique entry identifier */
  id: string;

  /** Query key associated with this activity */
  queryKey: string;

  /** Type of operation */
  type: 'query' | 'mutation';

  /** Current status */
  status: 'pending' | 'success' | 'error';

  /** When the request started */
  startedAt: number;

  /** When the request ended */
  endedAt?: number;

  /** Duration in milliseconds */
  duration?: number;
}

/**
 * Complete snapshot of the query cache
 */
export interface QueryCacheSnapshot {
  /** All tracked queries */
  queries: QuerySnapshot[];

  /** All tracked mutations */
  mutations: MutationSnapshot[];

  /** Timestamp of this snapshot */
  timestamp: number;
}

/**
 * DevTools store interface for managing query/mutation state
 */
export interface QueryDevToolsStore {
  /** Map of all tracked queries */
  queries: Map<string, QuerySnapshot>;

  /** Map of all tracked mutations */
  mutations: Map<string, MutationSnapshot>;

  /** Network activity log */
  networkActivity: NetworkActivityEntry[];

  /**
   * Subscribe to store updates
   * @param listener - Callback function to call on updates
   * @returns Unsubscribe function
   */
  subscribe: (listener: () => void) => () => void;

  /**
   * Invalidate a query (mark as stale)
   * @param queryKey - The query key to invalidate
   */
  invalidateQuery: (queryKey: string) => void;

  /**
   * Refetch a query
   * @param queryKey - The query key to refetch
   */
  refetchQuery: (queryKey: string) => Promise<void>;

  /**
   * Remove a query from the store
   * @param queryKey - The query key to remove
   */
  removeQuery: (queryKey: string) => void;

  /**
   * Clear all cached data
   */
  clearCache: () => void;
}
