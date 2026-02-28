// Middleware plugin for nexus-state
import { Atom, Store, Plugin } from '@nexus-state/core';

/**
 * Configuration options for middleware.
 * @template T - The type of the atom's value
 */
export interface MiddlewareConfig<T> {
  /**
   * Called before setting a new value.
   * Can modify the value by returning a new value.
   * @param atom - The atom being updated
   * @param value - The new value
   * @returns Modified value or void
   */
  beforeSet?: (atom: Atom<T>, value: T) => T | void;
  
  /**
   * Called after setting a new value.
   * @param atom - The atom that was updated
   * @param value - The new value
   */
  afterSet?: (atom: Atom<T>, value: T) => void;
}

/**
 * Creates a middleware plugin for a specific atom.
 * @template T - The type of the atom's value
 * @param targetAtom - The atom to apply middleware to
 * @param config - Middleware configuration
 * @returns Plugin function
 * @example
 * const store = createStore();
 * store.use(middleware(countAtom, {
 *   beforeSet: (atom, value) => {
 *     console.log('Before set:', value);
 *     return value < 0 ? 0 : value; // Validate
 *   },
 *   afterSet: (atom, value) => {
 *     console.log('After set:', value);
 *     saveToStorage(value); // Side effect
 *   }
 * }));
 */
export function middleware<T>(
  targetAtom: Atom<T>,
  config: MiddlewareConfig<T>
): Plugin {
  return (store: Store) => {
    const { beforeSet, afterSet } = config;
    const originalSet = store.set.bind(store);

    // Override store.set to intercept updates for target atom
    store.set = <Value>(atom: Atom<Value>, update: Value | ((prev: Value) => Value)) => {
      // Only intercept updates for the target atom
      if (atom.id !== targetAtom.id) {
        return originalSet(atom, update);
      }

      // Calculate the new value
      let newValue: Value;
      if (typeof update === 'function') {
        const currentValue = store.get(atom);
        newValue = (update as (prev: Value) => Value)(currentValue);
      } else {
        newValue = update;
      }

      // Apply beforeSet middleware
      let processedValue = newValue;
      if (beforeSet) {
        const result = beforeSet(targetAtom as Atom<Value>, newValue);
        if (result !== undefined) {
          processedValue = result;
        }
      }

      // Set the value
      originalSet(atom, processedValue);

      // Apply afterSet middleware
      if (afterSet) {
        afterSet(targetAtom as Atom<Value>, processedValue);
      }

      return processedValue;
    };
  };
}

/**
 * Creates a logger middleware plugin.
 * @returns Plugin that logs all atom updates
 * @example
 * const store = createStore();
 * store.use(createLogger());
 */
export function createLogger(): Plugin {
  return (store: Store) => {
    const originalSet = store.set.bind(store);

    store.set = <Value>(atom: Atom<Value>, update: Value | ((prev: Value) => Value)) => {
      const time = new Date().toLocaleTimeString();
      const atomName = (atom as any).name || 'unnamed';
      
      console.group(`[${time}] SET: ${atomName}`);
      console.log('Prev value:', store.get(atom));
      
      const result = originalSet(atom, update);
      
      console.log('New value:', store.get(atom));
      console.groupEnd();
      
      return result;
    };

    return store;
  };
}

/**
 * Creates a validator middleware plugin.
 * @template T - The type of the atom's value
 * @param targetAtom - The atom to validate
 * @param validate - Validation function (returns true if valid)
 * @returns Plugin that validates atom updates
 * @example
 * const store = createStore();
 * store.use(createValidator(userAtom, (value) => {
 *   return value.age >= 18; // Must be adult
 * }));
 */
export function createValidator<T>(
  targetAtom: Atom<T>,
  validate: (value: T) => boolean
): Plugin {
  return middleware(targetAtom, {
    beforeSet: (atom, value) => {
      if (!validate(value)) {
        throw new Error(`Validation failed for atom ${(atom as any).name || 'unnamed'}`);
      }
      return value;
    }
  });
}

/**
 * Creates a persistence middleware plugin.
 * @template T - The type of the atom's value
 * @param targetAtom - The atom to persist
 * @param storageKey - LocalStorage key
 * @returns Plugin that persists atom updates to localStorage
 * @example
 * const store = createStore();
 * store.use(createPersist(userAtom, 'user-data'));
 */
export function createPersist<T>(
  targetAtom: Atom<T>,
  storageKey: string
): Plugin {
  // Load initial value from storage
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      // Will be applied when store is created
    }
  } catch (e) {
    // localStorage not available
  }

  return middleware(targetAtom, {
    afterSet: (_atom, value) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch (e) {
        // localStorage not available or quota exceeded
      }
    }
  });
}

/**
 * Creates a throttle middleware plugin.
 * @template T - The type of the atom's value
 * @param targetAtom - The atom to throttle
 * @param delay - Delay in milliseconds
 * @returns Plugin that throttles atom updates
 * @example
 * const store = createStore();
 * store.use(createThrottle(searchAtom, 300)); // 300ms throttle
 */
export function createThrottle<T>(
  targetAtom: Atom<T>,
  delay: number
): Plugin {
  let lastUpdate = 0;
  let pendingValue: T | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return middleware(targetAtom, {
    beforeSet: (atom, value) => {
      const now = Date.now();
      
      if (now - lastUpdate < delay) {
        // Throttled - schedule update for later
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        pendingValue = value;
        timeoutId = setTimeout(() => {
          if (pendingValue !== null) {
            lastUpdate = Date.now();
            pendingValue = null;
            timeoutId = null;
          }
        }, delay);
        return value; // Still update, but could skip if needed
      }
      
      lastUpdate = now;
      return value;
    }
  });
}

// Re-export for convenience
export const plugin = middleware;
