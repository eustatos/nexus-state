/**
 * Prefetch priority levels
 */
export type PrefetchPriority = 'high' | 'normal' | 'low';

/**
 * Prefetch trigger types
 */
export type PrefetchTriggerType = 'hover' | 'focus' | 'viewport' | 'idle' | 'manual';

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

  /** Priority level for prefetching */
  priority?: PrefetchPriority;

  /** Abort prefetch after timeout (ms) */
  timeout?: number;
}

/**
 * Trigger configuration for automatic prefetching
 */
export interface PrefetchTrigger {
  /** Trigger type */
  type: PrefetchTriggerType;

  /** Delay before prefetch (ms) */
  delay?: number;

  /** Intersection Observer threshold (0-1) for viewport trigger */
  threshold?: number;
}

/**
 * Prefetch result status
 */
export type PrefetchStatus = 'pending' | 'success' | 'error' | 'cancelled';

/**
 * Result of a prefetch operation
 */
export interface PrefetchResult {
  /** Query key */
  queryKey: string;

  /** Current status */
  status: PrefetchStatus;

  /** When prefetch started */
  startedAt: number;

  /** When prefetch ended */
  endedAt?: number;

  /** Error if failed */
  error?: unknown;
}

/**
 * Prefetch manager interface
 */
export interface PrefetchManager {
  /** Prefetch a query */
  prefetch(options: PrefetchOptions): Promise<void>;

  /** Cancel a specific prefetch */
  cancel(queryKey: string | readonly unknown[]): void;

  /** Cancel all pending prefetches */
  cancelAll(): void;

  /** Get prefetch status */
  getPrefetchStatus(queryKey: string | readonly unknown[]): PrefetchResult | null;

  /** Get all prefetch results */
  getAllPrefetchResults(): PrefetchResult[];
}
