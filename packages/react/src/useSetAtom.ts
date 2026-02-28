import type { Atom, Store } from '@nexus-state/core';
import { createStore } from '@nexus-state/core';
import { useMemo } from 'react';
import { useStoreOptional } from './StoreProvider';

/**
 * Hook to get only the setter function for an atom.
 * Use this when you only need to update the atom and don't need its value.
 * This component will NOT re-render when the atom's value changes.
 *
 * @template T - The type of the atom's value
 * @param atom - The atom to get the setter for
 * @param store - Optional store instance (defaults to context store or auto-created store)
 * @returns A setter function to update the atom
 *
 * @example
 * ```tsx
 * import { atom } from '@nexus-state/core';
 * import { useSetAtom } from '@nexus-state/react';
 *
 * const countAtom = atom(0);
 *
 * function IncrementButton() {
 *   const setCount = useSetAtom(countAtom);
 *   return (
 *     <button onClick={() => setCount(c => c + 1)}>
 *       Increment
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Works with any atom type
 * const userAtom = atom({ name: 'John', age: 30 });
 *
 * function UpdateUserButton() {
 *   const setUser = useSetAtom(userAtom);
 *   return (
 *     <button onClick={() => setUser({ name: 'Jane', age: 25 })}>
 *       Update User
 *     </button>
 *   );
 * }
 * ```
 */
export function useSetAtom<T>(
  atom: Atom<T>,
  store?: Store
): (value: T | ((prev: T) => T)) => void {
  // Get store from context if not provided explicitly
  const contextStore = useStoreOptional();
  
  // Priority: explicit store > context store > new store
  const resolvedStore = useMemo(() => store ?? contextStore ?? createStore(), [store, contextStore]);

  const setter = useMemo(() => {
    return (update: T | ((prev: T) => T)) => {
      resolvedStore.set(atom, update);
    };
  }, [resolvedStore, atom]);

  return setter;
}
