// enhanced-store/index.ts

import type {
  Plugin,
  EnhancedStore as EnhancedStoreType,
  StoreEnhancementOptions as StoreEnhancementOptionsType,
  TimeTravelOptions,
  Snapshot,
} from "./types";
import { createStore } from "./store";
import { atomRegistry } from "./atom-registry";
import { SimpleTimeTravel } from "./time-travel";

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
 * @property {Function} [captureSnapshot] - Capture a new snapshot
 * @property {Function} [undo] - Undo to the previous state
 * @property {Function} [redo] - Redo to the next state
 * @property {Function} [canUndo] - Check if undo is available
 * @property {Function} [canRedo] - Check if redo is available
 * @property {Function} [jumpTo] - Jump to a specific snapshot
 * @property {Function} [clearHistory] - Clear all history
 * @property {Function} [getHistory] - Get all snapshots in history
 */

/**
 * Options for store enhancement.
 * @typedef {Object} StoreEnhancementOptions
 * @property {boolean} [enableDevTools] - Whether to enable DevTools integration
 * @property {string} [devToolsName] - Name to display in DevTools
 * @property {string} [registryMode] - Registry mode: 'global' or 'isolated'
 * @property {boolean} [enableTimeTravel] - Whether to enable Time Travel functionality
 * @property {number} [maxHistory] - Maximum number of snapshots to keep (default: 50)
 * @property {boolean} [autoCapture] - Automatically capture snapshots on store changes (default: true)
 */

// Export the types
export type EnhancedStore = EnhancedStoreType;
export type StoreEnhancementOptions = StoreEnhancementOptionsType;

/**
 * Creates an enhanced store with DevTools and Time Travel capabilities.
 * @param {Array<Plugin>} [plugins] - Array of plugins to apply to the store
 * @param {StoreEnhancementOptions} [options] - Options for store enhancement
 * @returns {EnhancedStore} The created enhanced store
 * @example
 * // Create an enhanced store
 * const store = createEnhancedStore();
 *
 * // Create an enhanced store with plugins and options
 * const store = createEnhancedStore([plugin1, plugin2], { enableDevTools: true });
 *
 * // Create an enhanced store with time travel
 * const store = createEnhancedStore([], { enableTimeTravel: true, maxHistory: 100 });
 */
export function createEnhancedStore(
  plugins: Plugin[] = [],
  options: StoreEnhancementOptions = {},
): EnhancedStore {
  const {
    enableDevTools = true,
    devToolsName = "EnhancedStore",
    registryMode = "global",
    enableTimeTravel = false,
    maxHistory = 50,
    autoCapture = true,
  } = options;

  // Create a basic store
  const store = createStore(plugins) as EnhancedStore & {
    captureSnapshot?: (action?: string) => Snapshot | undefined;
    undo?: () => boolean;
    redo?: () => boolean;
    canUndo?: () => boolean;
    canRedo?: () => boolean;
    jumpTo?: (index: number) => boolean;
    clearHistory?: () => void;
    getHistory?: () => Snapshot[];
  };

  // Auto-attach to registry with specified mode (CORE-001 requirement)
  if (typeof atomRegistry.attachStore === "function") {
    atomRegistry.attachStore(store, registryMode);
  }

  // Add DevTools connection if enabled
  if (enableDevTools) {
    store.connectDevTools = () => {
      console.log("DevTools connected for store:", devToolsName);
    };
  }

  // Add Time Travel functionality if enabled
  if (enableTimeTravel) {
    const timeTravelOptions: TimeTravelOptions = {
      maxHistory,
      autoCapture,
    };
    const timeTravel = new SimpleTimeTravel(store, timeTravelOptions);

    // Add time travel methods to store
    store.captureSnapshot = (action?: string) => timeTravel.capture(action);
    store.undo = () => timeTravel.undo();
    store.redo = () => timeTravel.redo();
    store.canUndo = () => timeTravel.canUndo();
    store.canRedo = () => timeTravel.canRedo();
    store.jumpTo = (index: number) => timeTravel.jumpTo(index);
    store.clearHistory = () => timeTravel.clearHistory();
    store.getHistory = () => timeTravel.getHistory();
  }

  return store as EnhancedStore;
}
