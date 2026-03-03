import type { Atom, Store, Getter, Setter } from "@nexus-state/core"; // eslint-disable-line sort-imports
import {
  useCallback,
  useDebugValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useStore } from "./context";

/**
 * Hook to read an atom value (read-only).
 * Use when you only need to read, not write.
 * Optimized: only subscribes to changes, does not create setter.
 *
 * @template T - The type of the atom's value
 * @param {Atom<T>} atom - The atom to read from
 * @param {Store} [store] - The store to use (optional, uses context store if not provided)
 * @returns {T} The current value of the atom
 *
 * @example
 * ```typescript
 * function DisplayComponent() {
 *   const count = useAtomValue(countAtom);
 *   return <div>Count: {count}</div>;
 * }
 * ```
 */
export function useAtomValue<T>(
  atom: Atom<T>,
  store?: Store
): T {
  // Get store from context if not provided
  const contextStore = useStoreSafe();
  const resolvedStore: Store | undefined = store || contextStore;

  if (!resolvedStore) {
    throw new Error(
      "useAtomValue requires a store. Either provide one explicitly or wrap your component with <StoreProvider>."
    );
  }

  // Use useSyncExternalStore for better React 18 integration
  const value = useSyncExternalStoreWithSelector(
    useCallback(
      (onStoreChange) => {
        // Subscribe to atom changes
        return resolvedStore.subscribe(atom, onStoreChange);
      },
      [atom, resolvedStore]
    ),
    // Get current snapshot
    useCallback(() => resolvedStore.get(atom), [atom, resolvedStore]),
    // Get server snapshot (SSR)
    useCallback(() => resolvedStore.get(atom), [atom, resolvedStore])
  );

  // Display in React DevTools
  useDebugValue(value);

  return value;
}

/**
 * Hook to write to an atom (write-only).
 * Use when you only need to update, not read.
 * Optimized: does NOT subscribe to changes, so component won't re-render.
 *
 * @template T - The type of the atom's value
 * @param {Atom<T>} atom - The atom to write to
 * @param {Store} [store] - The store to use (optional, uses context store if not provided)
 * @returns {(value: T | ((prev: T) => T)) => void} A setter function
 *
 * @example
 * ```typescript
 * function IncrementButton() {
 *   const setCount = useSetAtom(countAtom);
 *   return <button onClick={() => setCount(prev => prev + 1)}>+</button>;
 * }
 * ```
 */
export function useSetAtom<T>(
  atom: Atom<T>,
  store?: Store
): (value: T | ((prev: T) => T)) => void {
  // Get store from context if not provided
  const contextStore = useStoreSafe();
  const resolvedStore: Store | undefined = store || contextStore;

  if (!resolvedStore) {
    throw new Error(
      "useSetAtom requires a store. Either provide one explicitly or wrap your component with <StoreProvider>."
    );
  }

  // Create stable setter that never changes
  const setAtom = useCallback(
    (update: T | ((prev: T) => T)) => {
      resolvedStore.set(atom, update);
    },
    [atom, resolvedStore]
  );

  return setAtom;
}

/**
 * Hook to read and write an atom value.
 * Use when you need both value and setter.
 * Combines useAtomValue and useSetAtom.
 *
 * @template T - The type of the atom's value
 * @param {Atom<T>} atom - The atom to read and write
 * @param {Store} [store] - The store to use (optional, uses context store if not provided)
 * @returns {[T, (value: T | ((prev: T) => T)) => void]} A tuple of [value, setter]
 *
 * @example
 * ```typescript
 * function Counter() {
 *   const [count, setCount] = useAtom(countAtom);
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={() => setCount(count + 1)}>+</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAtom<T>(
  atom: Atom<T>,
  store?: Store
): [T, (value: T | ((prev: T) => T)) => void] {
  const value = useAtomValue(atom, store);
  const setValue = useSetAtom(atom, store);
  return [value, setValue];
}

/**
 * Hook to create a callback that can read and write atoms.
 * Useful for complex operations that need to interact with multiple atoms.
 * The callback has access to get and set functions.
 *
 * @template Args - Argument types for the callback
 * @template Result - Return type of the callback
 * @param {(get: Getter, set: Setter, ...args: Args) => Result} callback - Function that receives get and set
 * @param {Store} [store] - The store to use (optional, uses context store if not provided)
 * @returns {(...args: Args) => Result} Memoized callback function
 *
 * @example
 * ```typescript
 * function TransferButton() {
 *   const handleTransfer = useAtomCallback(
 *     (get, set, amount: number) => {
 *       const balance = get(balanceAtom);
 *       if (balance >= amount) {
 *         set(balanceAtom, balance - amount);
 *         set(logAtom, [...get(logAtom), `Transferred ${amount}`]);
 *       }
 *     },
 *     store
 *   );
 *
 *   return <button onClick={() => handleTransfer(100)}>Transfer</button>;
 * }
 * ```
 */
export function useAtomCallback<Args extends unknown[], Result>(
  callback: (get: Getter, set: Setter, ...args: Args) => Result,
  store?: Store
): (...args: Args) => Result {
  const contextStore = useStoreSafe();
  const resolvedStore: Store | undefined = store || contextStore;

  if (!resolvedStore) {
    throw new Error(
      "useAtomCallback requires a store. Either provide one explicitly or wrap your component with <StoreProvider>."
    );
  }

  // Use useMemo to memoize the callback wrapper, ensuring stable reference
  // The callback itself should be stable (useCallback in component)
  return useMemo(
    () => (...args: Args) => {
      const get: Getter = <T>(atom: Atom<T>) => resolvedStore.get(atom);
      const set: Setter = <T>(
        atom: Atom<T>,
        value: T | ((prev: T) => T)
      ) => {
        resolvedStore.set(atom, value);
      };

      return callback(get, set, ...args);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolvedStore]
  );
}

/**
 * Legacy useAtom for React 17 compatibility.
 * Uses useEffect and useState instead of useSyncExternalStore.
 *
 * @deprecated Use useAtom instead for React 18+
 */
export function useAtomLegacy<T>(
  atom: Atom<T>,
  store?: Store
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get store from context if not provided
  const contextStore = useStoreSafe();
  const resolvedStore: Store | undefined = store || contextStore;

  if (!resolvedStore) {
    throw new Error(
      "useAtomLegacy requires a store. Either provide one explicitly or wrap your component with <StoreProvider>."
    );
  }

  // Single get call - avoid double get
  const [value, setValue] = useState(() => resolvedStore.get(atom));
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = resolvedStore.subscribe(atom, (newValue: T) => {
      // Only update if value actually changed (using Object.is for NaN safety)
      if (!Object.is(valueRef.current, newValue)) {
        setValue(newValue);
      }
    });

    // Sync value immediately (but only once, and only if it changed)
    const currentValue = resolvedStore.get(atom);
    if (!Object.is(valueRef.current, currentValue)) {
      setValue(currentValue);
    }

    return unsubscribe;
  }, [atom, resolvedStore]);

  const setAtom = useCallback(
    (update: T | ((prev: T) => T)) => {
      resolvedStore.set(atom, update);
    },
    [atom, resolvedStore]
  );

  useDebugValue(value);

  return [value, setAtom];
}

/**
 * Safely get store from context, returns undefined if not in provider
 */
function useStoreSafe(): Store | undefined {
  try {
    return useStore();
  } catch {
    return undefined;
  }
}

/**
 * Shim for useSyncExternalStore for React 17 compatibility.
 * This is a simplified implementation that falls back to useEffect.
 */
function useSyncExternalStoreWithSelector<T>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T
): T {
  // Check if useSyncExternalStore is available (React 18+)
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const reactModule = (typeof window !== "undefined" && (window as any).React) || eval("require")("react");
  if (typeof reactModule.useSyncExternalStore === "function") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return (reactModule.useSyncExternalStore as <U>(subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => U, getServerSnapshot?: () => U) => U)(subscribe, getSnapshot, getServerSnapshot);
  }

  // Fallback for React 17
  const [state, setState] = useState(getSnapshot);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const handleChange = () => {
      const newValue = getSnapshot();
      if (!Object.is(stateRef.current, newValue)) {
        setState(newValue);
      }
    };

    const unsubscribe = subscribe(handleChange);

    // Sync value after subscription
    handleChange();

    return unsubscribe;
  }, [subscribe, getSnapshot]);

  return state;
}

// Re-export context and provider
export { StoreProvider, useStore } from "./context";
export type { StoreProviderProps } from "./context";

// Re-export core types
export type { Atom, Store, Getter, Setter } from "@nexus-state/core";

// Type for setter function
export type SetAtom<T> = (value: T | ((prev: T) => T)) => void;
