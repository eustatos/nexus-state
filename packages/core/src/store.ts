/**
 * Store - Nexus State store implementation
 *
 * @packageDocumentation
 * Provides the createStore function for creating store instances.
 */

// Implementation of createStore function

import type { Store, Plugin } from './types';
import { atomRegistry, type AtomRegistry } from './atom-registry';
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
 * @param pluginsOrRegistry Array of plugins to apply to the store, or an AtomRegistry for isolated SSR
 * @returns A new store instance
 * @example
 * const store = createStore();
 * const storeWithPlugins = createStore([loggerPlugin, devToolsPlugin]);
 * 
 * // SSR with isolated registry
 * const registry = createIsolatedRegistry();
 * const store = createStore(registry);
 */
export function createStore(pluginsOrRegistry: Plugin[] | AtomRegistry = []): Store {
  if (Array.isArray(pluginsOrRegistry)) {
    logger.log('[createStore] Creating store with', pluginsOrRegistry.length, 'plugins');
    return new StoreImpl(pluginsOrRegistry);
  } else {
    logger.log('[createStore] Creating store with isolated registry');
    return new StoreImpl([], pluginsOrRegistry);
  }
}

/**
 * Create a store with enhancement options
 * @param _options Enhancement options
 * @returns A new store instance
 */
export function createEnhancedStore(_options?: StoreEnhancementOptions): Store {
  logger.log('[createStore] Creating enhanced store');
  return new StoreImpl([]);
}
