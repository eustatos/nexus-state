// enhanced-store.ts

import type { Store, Plugin } from './types';
import { createStore } from './store';

/**
 * Represents an enhanced store with additional capabilities.
 * @typedef {Object} EnhancedStore
 * @property {Function} get - Get the current value of an atom
 * @property {Function} set - Set the value of an atom
 * @property {Function} subscribe - Subscribe to changes in an atom
 * @property {Function} getState - Get the state of all atoms
 * @property {Function} [applyPlugin] - Apply a plugin to the store
 * @property {Function} [setWithMetadata] - Set the value of an atom with metadata
 * @property {Function} [serializeState] - Serialize the state of all atoms
 * @property {Function} [getIntercepted] - Get the current value of an atom with interception
 * @property {Function} [setIntercepted] - Set the value of an atom with interception
 * @property {Function} [getPlugins] - Get the list of applied plugins
 * @property {Function} [connectDevTools] - Connect to DevTools for debugging
 */

/**
 * Options for store enhancement.
 * @typedef {Object} StoreEnhancementOptions
 * @property {boolean} [enableDevTools] - Whether to enable DevTools integration
 * @property {string} [devToolsName] - Name to display in DevTools
 */

/**
 * Creates an enhanced store with DevTools integration capabilities.
 * @param {Array<Plugin>} [plugins] - Array of plugins to apply to the store
 * @param {StoreEnhancementOptions} [options] - Options for store enhancement
 * @returns {EnhancedStore} The created enhanced store
 * @example
 * // Create an enhanced store
 * const store = createEnhancedStore();
 * 
 * // Create an enhanced store with plugins and options
 * const store = createEnhancedStore([plugin1, plugin2], { enableDevTools: true });
 */
export function createEnhancedStore(plugins: Plugin[] = [], options: StoreEnhancementOptions = {}): EnhancedStore {
  // Create a basic store
  const store = createStore(plugins) as EnhancedStore;
  
  // Add DevTools connection if enabled
  if (options.enableDevTools) {
    store.connectDevTools = () => {
      console.log('DevTools connected for store:', options.devToolsName || 'Unnamed Store');
    };
  }
  
  return store;
}

// Export types
export type { EnhancedStore, StoreEnhancementOptions } from './types';