/**
 * Store - Nexus State store implementation
 *
 * @packageDocumentation
 * Provides the createStore function for creating store instances.
 */

import type { Store, Plugin } from './types';
import { storeLogger as logger } from './debug';

// Import refactored components
import { StoreImpl } from './store/StoreImpl';

/**
 * Options for enhancing a store
 */
export type StoreEnhancementOptions = {
  /** Enable DevTools integration */
  enableDevTools?: boolean;
  /** Enable stack trace tracking */
  enableStackTrace?: boolean;
  /** Debounce delay for state updates */
  debounceDelay?: number;
};

/**
 * Create a new store to hold atoms
 * @param plugins Array of plugins to apply to the store
 * @returns A new store instance
 * @example
 * const store = createStore();
 * const storeWithPlugins = createStore([loggerPlugin, devToolsPlugin]);
 *
 * // SSR: each request creates an independent store
 * async function handleRequest() {
 *   const store = createStore(); // Already isolated!
 *   // ...
 * }
 */
export function createStore(plugins: Plugin[] = []): Store {
  logger.log('[createStore] Creating store with', plugins.length, 'plugins');
  return new StoreImpl(plugins);
}

/**
 * Create a store with enhancement options
 * @param pluginsOrOptions Array of plugins OR enhancement options (for backward compatibility)
 * @param _options Enhancement options (deprecated — use plugins only)
 * @returns A new store instance
 */
export function createEnhancedStore(
  pluginsOrOptions?: Plugin[] | StoreEnhancementOptions,
  _options?: StoreEnhancementOptions
): Store {
  // Backward compat: if first arg is an object (not array), treat as options
  if (pluginsOrOptions !== undefined && !Array.isArray(pluginsOrOptions)) {
    logger.log('[createStore] Creating enhanced store (options ignored)');
    return new StoreImpl([]);
  }
  logger.log('[createStore] Creating enhanced store');
  return new StoreImpl(pluginsOrOptions || []);
}
