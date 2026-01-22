// Vue adapter for nexus-state
import { Atom, Store, createStore } from '@nexus-state/core';
import { computed, ComputedRef, ref, Ref, watchEffect } from 'vue';

/**
 * Composable to use an atom in a Vue component.
 * @template T - The type of the atom's value
 * @param {Atom<T>} atom - The atom to use
 * @param {Store} [store] - The store to use (defaults to a new store)
 * @returns {Ref<T> | ComputedRef<T>} A ref or computed ref with the atom's value
 * @example
 * export default {
 *   setup() {
 *     const count = useAtom(countAtom);
 *     
 *     return { count };
 *   }
 * };
 */
export function useAtom<T>(atom: Atom<T>, store: Store = createStore()): Ref<T> | ComputedRef<T> {
  const value = ref(store.get(atom)) as Ref<T>;

  watchEffect(() => {
    value.value = store.get(atom);
  });

  return value;
}