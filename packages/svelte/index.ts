// Svelte adapter for nexus-state
import { Atom, Store, createStore } from '@nexus-state/core';
import { readable, Readable } from 'svelte/store';

// Хук для использования атома в Svelte
export function useAtom<T>(atom: Atom<T>, store: Store = createStore()): Readable<T> {
  return readable(store.get(atom), (set) => {
    const unsubscribe = store.subscribe(atom, () => {
      set(store.get(atom));
    });

    return unsubscribe;
  });
}