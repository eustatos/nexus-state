// Vue adapter for nexus-state
import { Atom, Store, createStore } from '@nexus-state/core';
import { computed, ComputedRef, ref, Ref, watchEffect } from 'vue';

// Хук для использования атома в Vue
export function useAtom<T>(atom: Atom<T>, store: Store = createStore()): Ref<T> | ComputedRef<T> {
  const value = ref(store.get(atom)) as Ref<T>;

  watchEffect(() => {
    value.value = store.get(atom);
  });

  return value;
}