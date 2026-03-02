/**
 * @nexus-state/query/devtools
 *
 * DevTools utilities for @nexus-state/query
 */

export type {
  QueryDevToolsConfig,
  QuerySnapshot,
  MutationSnapshot,
  NetworkActivityEntry,
  QueryCacheSnapshot,
  QueryDevToolsStore,
} from './types';

export {
  createQueryDevToolsStore,
  getQueryDevToolsStore,
  setQueryDevToolsStore,
  resetQueryDevToolsStore,
} from './devtools-store';

export {
  trackQuery,
  trackNetworkActivity,
  updateNetworkActivity,
  withDevToolsTracking,
  trackMutation,
  untrackQuery,
  untrackMutation,
} from './query-tracker';

export {
  formatDevToolsValue,
  getQueryStatus,
  getSafeBoolean,
  getSafeNumber,
  toDisplayableQuery,
  toDisplayableMutation,
  isQuerySnapshot,
  isMutationSnapshot,
} from './type-guards';
