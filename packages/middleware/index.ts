// Middleware plugin for nexus-state
import { Atom, Store } from '@nexus-state/core';

/**
 * Configuration options for the middleware plugin.
 * @typedef {Object} MiddlewareConfig
 * @property {Function} [beforeSet] - Function to run before setting a new value
 * @property {Function} [afterSet] - Function to run after setting a new value
 */
type MiddlewareConfig<T> = {
  beforeSet?: (atom: Atom<T>, newValue: T) => T | void;
  afterSet?: (atom: Atom<T>, newValue: T) => void;
};

/**
 * Plugin to add middleware to atoms.
 * @template T - The type of the atom's value
 * @param {Atom<T>} atom - The atom to add middleware to
 * @param {MiddlewareConfig<T>} config - Configuration options for the middleware
 * @returns {Function} A function that applies the plugin to a store
 * @example
 * const store = createStore([
 *   middleware(countAtom, {
 *     beforeSet: (atom, value) => {
 *       console.log('Before set:', value);
 *       return value;
 *     },
 *     afterSet: (atom, value) => {
 *       console.log('After set:', value);
 *     }
 *   })
 * ]);
 */
export function middleware<T>(atom: Atom<T>, config: MiddlewareConfig<T>): (store: Store) => void {
  return (store: Store) => {
    const { beforeSet, afterSet } = config;
    
    // Extend store functionality to support middleware
    const originalSet = store.set.bind(store);
    
    // Override the set method to add middleware functionality
    store.set = (a: Atom<unknown>, update: unknown) => {
      if (a.id === atom.id) {
        // Handle updates for the target atom
        let processedValue: T;
        
        if (typeof update === 'function') {
          // Handle function updates
          const currentValue = store.get(atom);
          processedValue = (update as (prev: T) => T)(currentValue);
        } else {
          // Handle direct value updates
          processedValue = update as T;
        }
        
        // Apply beforeSet middleware
        if (beforeSet) {
          const result = beforeSet(atom, processedValue);
          if (result !== undefined) {
            processedValue = result;
          }
        }
        
        // Set the value using the original set method
        originalSet(atom, processedValue);
        
        // Apply afterSet middleware
        if (afterSet) {
          afterSet(atom, processedValue);
        }
      } else {
        // For other atoms, use the original implementation
        originalSet(a, update);
      }
    };
  };
}