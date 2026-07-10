/**
 * Store - Nexus State store implementation
 *
 * @packageDocumentation
 * Provides the createStore function for creating store instances.
 */

import type { Store, Plugin } from './types';
import type { StoreOptions } from './store/types';
import { storeLogger as logger } from './debug';

// Import refactored components
import { StoreImpl } from './store/StoreImpl';

// Re-export types
export type { StoreOptions };

/**
 * @deprecated DevToolsConfig is deprecated. Use the `devtools()` plugin from
 * `@nexus-state/core/devtools` instead.
 */
export interface DevToolsConfig {
  enabled: boolean;
  enableStackTrace: boolean;
  debounceDelay: number;
}

/**
 * Legacy options for enhancing a store.
 * @deprecated Use `StoreOptions` instead.
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
 * Create a new store to hold atoms.
 *
 * Accepts either a plugins array (legacy API) or a StoreOptions object (new API).
 * Optional subsystems (plugins, devtools, batching) are only created when needed.
 *
 * @param pluginsOrOptions Array of plugins (legacy) OR StoreOptions (new)
 * @returns A new store instance
 * @example
 * ```typescript
 * // No optional subsystems — minimal store
 * const store = createStore();
 *
 * // Legacy API — plugins array
 * const store = createStore([plugin1, plugin2]);
 *
 * // New API — StoreOptions
 * const store = createStore({
 *   plugins: [plugin1],
 *   devtools: true,
 *   devtoolsConfig: { enableStackTrace: true },
 *   batching: true,
 * });
 * ```
 */
export function createStore(
  pluginsOrOptions?: Plugin[] | StoreOptions
): Store {
  let options: StoreOptions = {};

  if (Array.isArray(pluginsOrOptions)) {
    options = { plugins: pluginsOrOptions };
  } else if (pluginsOrOptions) {
    options = pluginsOrOptions;
  }

  // Deprecation warning for options.devtools
  if (options.devtools) {
    logger.log(
      '[createStore] options.devtools is deprecated. Use devtools() plugin instead:',
      'import { devtools } from "@nexus-state/core/devtools";',
      'createStore({ plugins: [devtools()] })'
    );
  }

  const pluginCount = options.plugins?.length ?? 0;
  logger.log('[createStore] Creating store with', pluginCount, 'plugins');
  return new StoreImpl(options);
}

/**
 * Create a store with DevTools enabled by default.
 *
 * Accepts plugins array, StoreOptions, or legacy StoreEnhancementOptions.
 * DevTools is enabled by default; pass `devtools: false` to disable.
 *
 * @param pluginsOrOptions Plugins array, StoreOptions, or legacy StoreEnhancementOptions
 * @param _options Legacy enhancement options (deprecated — use StoreOptions instead)
 * @returns A new store instance with DevTools enabled
 */
export function createEnhancedStore(
  pluginsOrOptions?: Plugin[] | StoreOptions | StoreEnhancementOptions,
  _options?: StoreEnhancementOptions
): Store {
  const options: StoreOptions = { devtools: true };

  if (Array.isArray(pluginsOrOptions)) {
    options.plugins = pluginsOrOptions;
  } else if (pluginsOrOptions) {
    Object.assign(options, pluginsOrOptions);
  }

  logger.log('[createEnhancedStore] Creating enhanced store');
  return new StoreImpl(options);
}
