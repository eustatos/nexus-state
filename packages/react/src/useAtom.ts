import type { Atom, Store } from '@nexus-state/core';
import { useEffect, useMemo, useState } from 'react';
import { useStoreOptional } from './StoreProvider';

/**
 * Hook to use an atom in a React component.
 * @template T - The type of the atom's value
 * @param atom - The atom to use
 * @param store - The store to use (defaults to context store or a new store)
 * @returns {[T, (value: T | ((prev: T) => T)) => void]} A tuple of [value, setter]
 *
 * @example
 * ```tsx
 * import { atom } from '@nexus-state/core';
 * import { useAtom } from '@nexus-state/react';
 *
 * const countAtom = atom(0);
 *
 * function Counter() {
 *   const [count, setCount] = useAtom(countAtom);
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={() => setCount(count + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAtom<T>(atom: Atom<T>, store?: Store): [T, (value: T | ((prev: T) => T)) => void] {
  // Get store from context if not provided explicitly
  const contextStore = useStoreOptional();
  
  // Priority: explicit store > context store > new store
  const resolvedStore = useMemo(() => store ?? contextStore ?? createStore(), [store, contextStore]);

  const [value, setValue] = useState(() => resolvedStore.get(atom));

  useEffect(() => {
    const unsubscribe = resolvedStore.subscribe(atom, () => {
      setValue(resolvedStore.get(atom));
    });

    // Check if the value has changed immediately after subscription
    setValue(resolvedStore.get(atom));

    return unsubscribe;
  }, [atom, resolvedStore]);

  // Create a setter function that uses the store's set method
  const setter = useMemo(() => {
    return (update: T | ((prev: T) => T)) => {
      resolvedStore.set(atom, update);
    };
  }, [resolvedStore, atom]);

  return [value, setter];
}

// Import createStore from core
import { createStore } from '@nexus-state/core';
