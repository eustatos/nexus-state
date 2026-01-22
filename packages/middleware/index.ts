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
    
    store.set = <Value>(a: Atom<Value>, update: Value | ((prev: Value) => Value)) => {
      if (a === atom) {
        // Get the current value
        let processedValue: Value;
        if (typeof update === 'function') {
          // Handle function updates
          const currentValue = store.get(a as unknown as Atom<T>) as unknown as T;
          processedValue = (update as (prev: Value) => Value)(currentValue as unknown as Value);
        } else {
          // Handle direct value updates
          processedValue = update;
        }
        
        // Apply beforeSet middleware
        if (beforeSet) {
          const result = beforeSet(a as Atom<T>, processedValue as unknown as T);
          if (result !== undefined) {
            processedValue = result as unknown as Value;
          }
        }
        
        // Set the value
        originalSet(a, processedValue);
        
        // Apply afterSet middleware
        if (afterSet) {
          afterSet(a as Atom<T>, processedValue as unknown as T);
        }
      } else {
        // For other atoms, use the original implementation
        originalSet(a, update);
      }
    };
  };
}