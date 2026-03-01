// Middleware plugin for nexus-state
import { Atom, Store, Plugin, PluginHooks } from '@nexus-state/core';

/**
 * Configuration options for the middleware plugin.
 * @template T - The type of the atom's value
 */
export interface MiddlewareConfig<T> {
  /**
   * Hook called before setting a new value. Can modify the value.
   * @param atom - The atom being set
   * @param newValue - The new value (or computed value from function update)
   * @returns Modified value or void to keep original
   */
  beforeSet?: (atom: any, newValue: T) => T | void;

  /**
   * Hook called after setting a new value. Side effects only.
   * @param atom - The atom that was set
   * @param newValue - The final value that was set
   */
  afterSet?: (atom: any, newValue: T) => void;
}

/**
 * Internal state for a middleware plugin instance.
 * @template T - The type of the atom's value
 */
interface MiddlewareState<T> {
  atom: Atom<T>;
  config: MiddlewareConfig<T>;
  disposed: boolean;
}

/**
 * Creates a middleware plugin that intercepts store operations for a specific atom.
 * 
 * @template T - The type of the atom's value
 * @param atom - The target atom to intercept
 * @param config - Configuration options with beforeSet and afterSet hooks
 * @returns A plugin function that can be applied to a store
 * 
 * @example
 * ```typescript
 * import { createStore } from '@nexus-state/core';
 * import { createMiddlewarePlugin } from '@nexus-state/middleware';
 * 
 * const store = createStore();
 * const countAtom = atom(0);
 * 
 * // Apply middleware as plugin
 * store.applyPlugin(
 *   createMiddlewarePlugin(countAtom, {
 *     beforeSet: (atom, value) => {
 *       console.log('Before set:', value);
 *       return Math.max(0, value); // Ensure non-negative
 *     },
 *     afterSet: (atom, value) => {
 *       console.log('After set:', value);
 *     }
 *   })
 * );
 * ```
 */
export function createMiddlewarePlugin<T>(
  atom: Atom<T>,
  config: MiddlewareConfig<T>
): Plugin {
  const state: MiddlewareState<T> = {
    atom,
    config,
    disposed: false,
  };

  const plugin: Plugin = (): PluginHooks => {
    return {
      /**
       * onSet hook - intercepts value before it's set
       * Can modify the value by returning a new value
       */
      onSet: <Value>(targetAtom: Atom<Value>, value: Value): Value | void => {
        if (state.disposed) {
          return;
        }

        // Check if this is the target atom
        if (targetAtom.id === state.atom.id) {
          if (state.config.beforeSet) {
            const result = state.config.beforeSet(
              state.atom,
              value as unknown as T
            );
            if (result !== undefined) {
              return result as unknown as Value;
            }
          }
        }
        return value;
      },

      /**
       * afterSet hook - called after value is set
       * Side effects only, cannot modify the value
       */
      afterSet: <Value>(targetAtom: Atom<Value>, value: Value): void => {
        if (state.disposed) {
          return;
        }

        // Check if this is the target atom
        if (targetAtom.id === state.atom.id) {
          if (state.config.afterSet) {
            state.config.afterSet(
              state.atom,
              value as unknown as T
            );
          }
        }
      },
    };
  };

  // Add dispose method to the plugin function
  (plugin as Plugin & { dispose?: () => void }).dispose = () => {
    state.disposed = true;
    state.config = {} as MiddlewareConfig<T>;
  };

  return plugin;
}

/**
 * Legacy middleware function - creates a plugin that wraps store.set method.
 * 
 * @deprecated Use {@link createMiddlewarePlugin} instead. This function will be removed in the next major version.
 * 
 * @template T - The type of the atom's value
 * @param atom - The atom to add middleware to
 * @param config - Configuration options for the middleware
 * @returns A function that applies the plugin to a store
 * 
 * @example
 * ```typescript
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
 * ```
 */
export function middleware<T>(atom: Atom<T>, config: MiddlewareConfig<T>): (store: Store) => void {
  return (store: Store) => {
    const { beforeSet, afterSet } = config;

    // Extend store functionality to support middleware
    const originalSet = store.set.bind(store);

    // Override the set method to add middleware functionality
    store.set = <Value>(a: Atom<Value>, update: Value | ((prev: Value) => Value)) => {
      if (a.id === (atom as unknown as Atom<Value>).id) {
        // Handle updates for the target atom
        let processedValue: Value;

        if (typeof update === 'function') {
          // Handle function updates
          const currentValue = store.get(a);
          processedValue = (update as (prev: Value) => Value)(currentValue);
        } else {
          // Handle direct value updates
          processedValue = update;
        }

        // Apply beforeSet middleware
        if (beforeSet) {
          const result = beforeSet(atom, processedValue as unknown as T);
          if (result !== undefined) {
            processedValue = result as unknown as Value;
          }
        }

        // Set the value using the original set method
        originalSet(a, processedValue);

        // Apply afterSet middleware
        if (afterSet) {
          afterSet(atom, processedValue as unknown as T);
        }
      } else {
        // For other atoms, use the original implementation
        originalSet(a, update);
      }
    };
  };
}

// Re-export for convenience
export { createMiddlewarePlugin as middlewarePlugin };
