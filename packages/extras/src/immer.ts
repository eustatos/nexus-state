// immer.ts
import { atom, Atom, Store } from "@nexus-state/core";
import { produce } from "immer";

// Store a mapping between each atom and its associated store instance
const atomStores = new WeakMap<object, Store>();

/**
 * Creates an atom that integrates with Immer for immutable updates.
 * Returns a tuple of [atom, setter] for convenient use.
 *
 * @param initialValue - Initial state value for the atom
 * @param store - The store instance to bind this atom to
 * @returns A tuple of [atom, setter] where setter accepts an Immer draft function
 *
 * @example
 * ```typescript
 * const [userAtom, setUser] = immerAtom({ name: 'John', age: 30 }, store);
 *
 * setUser((draft) => {
 *   draft.name = 'Jane';
 *   draft.age += 1;
 * });
 * ```
 */
export function immerAtom<T>(
  initialValue: T,
  store: Store,
): readonly [Atom<T>, (updater: (draft: T) => void) => void] {
  const baseAtom = atom(initialValue);
  atomStores.set(baseAtom, store);

  const set = (updater: (draft: T) => void) => {
    const currentValue = store.get(baseAtom);
    const nextValue = produce(currentValue, updater);
    store.set(baseAtom, nextValue);
  };

  return [baseAtom, set] as const;
}

/**
 * Updates an atom's value using an Immer-style draft function.
 * Alternative API for when you only need the setter.
 *
 * @param atom - The atom to update
 * @param updater - A function that receives a draft of the current value and mutates it
 *
 * @deprecated Use the setter function returned from immerAtom instead
 *
 * @example
 * ```typescript
 * // Old API
 * setImmer(userAtom, (draft) => {
 *   draft.name = 'Jane';
 * });
 *
 * // New API (preferred)
 * const [userAtom, setUser] = immerAtom(initialUser, store);
 * setUser((draft) => {
 *   draft.name = 'Jane';
 * });
 * ```
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
