// immer.ts
import { atom, Atom, Store } from "@nexus-state/core";
import { produce } from "immer";

// Store a mapping between each atom and its associated store instance
const atomStores = new WeakMap<object, Store>();

/**
 * Creates an atom that integrates with Immer for immutable updates.
 * This atom must be used with a specific store instance.
 *
 * @param initialValue - Initial state value for the atom
 * @param store - The store instance to bind this atom to
 * @returns An atom that can be updated via setImmer
 */
export function immerAtom<T>(initialValue: T, store: Store): Atom<T> {
  const baseAtom = atom(initialValue);
  atomStores.set(baseAtom, store);
  return baseAtom;
}

/**
 * Updates an atom's value using an Immer-style draft function.
 *
 * @param atom - The atom to update
 * @param updater - A function that receives a draft of the current value and mutates it
 */
export function setImmer<T>(atom: Atom<T>, updater: (draft: T) => void): void {
  const store = atomStores.get(atom);
  if (!store) {
    throw new Error(
      "Store not found for atom. Did you create this atom with immerAtom?",
    );
  }

  store.set(atom, produce(store.get(atom), updater));
}
