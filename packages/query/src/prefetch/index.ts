/**
 * @nexus-state/query/prefetch
 *
 * Advanced prefetching utilities for @nexus-state/query
 */

export type {
  PrefetchPriority,
  PrefetchTriggerType,
  PrefetchOptions,
  PrefetchTrigger,
  PrefetchStatus,
  PrefetchResult,
  PrefetchManager,
} from './types';

export {
  createPrefetchManager,
  getPrefetchManager,
  setPrefetchManager,
  resetPrefetchManager,
} from './prefetch-manager';
