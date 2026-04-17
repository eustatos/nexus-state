// Core implementation of nexus-state

/**
 * Represents an atom which holds a value and can be updated and subscribed to.
 * @typedef {Object} Atom
 * @property {symbol} id - Unique identifier for the atom
 * @property {Function} read - Function to read the atom's value
 * @property {Function} [write] - Function to write to the atom
 */

/**
 * Represents a store which holds atoms and provides methods to interact with them.
 * @typedef {Object} Store
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
 */

/**
 * Creates an atom with an initial value or a computed atom based on other atoms.
 * Atoms are lazily registered in each store's ScopedRegistry on first access (get/set/subscribe).
 * You can provide an optional name for better debugging experience.
 * @param {any|Function} initialValue - The initial value or a function to compute the value
 * @param {string} [name] - Optional name for the atom for DevTools display
 * @returns {Atom} The created atom
 * @example
 * // Create an atom with an initial value
 * const countAtom = atom(0);
 *
 * // Create an atom with a name for DevTools
 * const countAtom = atom(0, 'count');
 *
 * // Create a computed atom
 * const doubleCountAtom = atom((get) => get(countAtom) * 2);
 *
 * // Create a computed atom with a name
 * const doubleCountAtom = atom((get) => get(countAtom) * 2, 'doubleCount');
 */
export { atom } from './atom';

/**
 * Creates a store to hold atoms.
 * @param {Array<Function>} [plugins] - Array of plugins to apply to the store
 * @returns {Store} The created store
 * @example
 * // Create a basic store
 * const store = createStore();
 *
 * // Create a store with plugins
 * const store = createStore([plugin1, plugin2]);
 */
export { createStore, createEnhancedStore } from './store';
export type { StoreEnhancementOptions } from './store';

// Export utility functions
export {
  serializeState,
  serializeMap,
  serializeSet,
} from './utils/serialization';
export {
  ActionTracker,
  globalActionTracker,
  createActionWithStackTrace,
} from './utils/action-tracker';

// Export types
export type {
  Atom,
  BaseAtom,
  PrimitiveAtom,
  ComputedAtom,
  WritableAtom,
  Store,
  Plugin,
  PluginHooks,
  ActionMetadata,
  AtomValue,
  AnyAtom,
  Getter,
  Setter,
  Subscriber,
} from './types';
// Export type guards
export { isPrimitiveAtom, isComputedAtom, isWritableAtom } from './types';
export type { EnhancedStore } from './enhanced-store';
export type {
  ActionTrackingOptions,
  ActionMetadata as TrackedActionMetadata,
} from './utils/action-tracker';

// Debug logger (development only)
export { logger, storeLogger, atomLogger, reactLogger } from './debug';

// Batching utility
export { batch, batcher, isBatching, type Batcher } from './batching';

// Reactive abstractions (Phase 11: Signal-Ready Architecture)
export type {
  IReactiveValue,
  AtomContext,
  Unsubscribe,
  ReactiveConfig,
} from './reactive';
export { BaseReactive } from './reactive';
export {
  REACTIVE_CONFIG,
  updateReactiveConfig,
  resetReactiveConfig,
  getReactiveConfig,
  loadConfigFromEnv,
} from './reactive';
