// Svelte adapter for nexus-state
import { Atom, Store, createStore } from '@nexus-state/core';
import { readable, Readable } from 'svelte/store';

/**
 * Function to use an atom in a Svelte component.
 * @template T - The type of the atom's value
 * @param {Atom<T>} atom - The atom to use
 * @param {Store} [store] - The store to use (defaults to a new store)
 * @returns {Readable<T>} A readable store with the atom's value
 * @example
 * let count = useAtom(countAtom);
 */
export function useAtom<T>(atom: Atom<T>, store: Store = createStore()): Readable<T> {
  return readable(store.get(atom), (set) => {
    const unsubscribe = store.subscribe(atom, () => {
      set(store.get(atom));
    });

    return unsubscribe;
  });
}