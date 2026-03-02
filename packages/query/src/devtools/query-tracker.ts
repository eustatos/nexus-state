import { getQueryDevToolsStore } from './devtools-store';
import type { QuerySnapshot, NetworkActivityEntry } from './types';

/**
 * Track query state in DevTools
 * @param queryKey - Unique query key
 * @param snapshot - Query state snapshot
 */
export function trackQuery(queryKey: string, snapshot: QuerySnapshot): void {
  if (typeof window === 'undefined') return;

  const store = getQueryDevToolsStore();
  store.queries.set(queryKey, snapshot);
}

/**
 * Track network activity start
 * @param queryKey - The query key being fetched
 * @param type - Type of operation (query or mutation)
 * @returns Activity ID for later updates
 */
export function trackNetworkActivity(
  queryKey: string,
  type: 'query' | 'mutation'
): string {
  if (typeof window === 'undefined') return '';

  const store = getQueryDevToolsStore();
  const activityId = `${type}-${queryKey}-${Date.now()}`;

  const entry: NetworkActivityEntry = {
    id: activityId,
    queryKey,
    type,
    status: 'pending',
    startedAt: Date.now(),
  };

  store.networkActivity.push(entry);

  // Keep only last 100 entries to prevent memory leaks
  if (store.networkActivity.length > 100) {
    store.networkActivity.shift();
  }

  return activityId;
}

/**
 * Update network activity status
 * @param activityId - The activity ID returned from trackNetworkActivity
 * @param status - New status (success or error)
 */
export function updateNetworkActivity(
  activityId: string,
  status: 'success' | 'error'
): void {
  if (typeof window === 'undefined') return;

  const store = getQueryDevToolsStore();
  const entry = store.networkActivity.find((e) => e.id === activityId);

  if (entry) {
    entry.status = status;
    entry.endedAt = Date.now();
    entry.duration = entry.endedAt - entry.startedAt;
  }
}

/**
 * Wrap a promise with DevTools tracking
 * @param queryKey - The query key being fetched
 * @param promise - The query promise to track
 * @returns The original promise with tracking side effects
 */
export function withDevToolsTracking<T>(
  queryKey: string,
  promise: Promise<T>
): Promise<T> {
  const activityId = trackNetworkActivity(queryKey, 'query');

  return promise
    .then((result) => {
      updateNetworkActivity(activityId, 'success');
      return result;
    })
    .catch((error) => {
      updateNetworkActivity(activityId, 'error');
      throw error;
    });
}

/**
 * Track mutation in DevTools
 * @param mutationId - Unique mutation identifier
 * @param snapshot - Mutation state snapshot
 */
export function trackMutation(
  mutationId: string,
  snapshot: {
    status: 'idle' | 'loading' | 'success' | 'error';
    variables?: unknown;
    data?: unknown;
    error?: unknown;
    failureCount?: number;
  }
): void {
  if (typeof window === 'undefined') return;

  const store = getQueryDevToolsStore();
  const existing = store.mutations.get(mutationId);

  store.mutations.set(mutationId, {
    mutationId,
    status: snapshot.status,
    variables: snapshot.variables ?? existing?.variables ?? null,
    data: snapshot.data ?? existing?.data ?? null,
    error: snapshot.error ?? existing?.error ?? null,
    failureCount: snapshot.failureCount ?? existing?.failureCount ?? 0,
  });
}

/**
 * Remove a tracked query from DevTools
 * @param queryKey - The query key to remove
 */
export function untrackQuery(queryKey: string): void {
  if (typeof window === 'undefined') return;

  const store = getQueryDevToolsStore();
  store.queries.delete(queryKey);
}

/**
 * Remove a tracked mutation from DevTools
 * @param mutationId - The mutation ID to remove
 */
export function untrackMutation(mutationId: string): void {
  if (typeof window === 'undefined') return;

  const store = getQueryDevToolsStore();
  store.mutations.delete(mutationId);
}
