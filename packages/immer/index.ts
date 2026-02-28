// immer.ts - Immer integration for nexus-state
import { atom, Atom, Store } from "@nexus-state/core";
import { produce, setAutoFreeze } from "immer";

// Disable auto-freeze for better performance in production
// Users can re-enable it if needed via setAutoFreeze(true)
setAutoFreeze(false);

// Store a mapping between each atom and its associated store instance
const atomStores = new WeakMap<Atom<unknown>, Store>();

/**
 * Configuration options for immer atoms.
 */
export interface ImmerAtomConfig {
  /** Optional name for debugging */
  name?: string;
}

/**
 * Creates an atom that integrates with Immer for immutable updates.
 * 
 * @template T - The type of the atom's value
 * @param initialValue - Initial state value for the atom
 * @param store - The store instance to bind this atom to
 * @param config - Optional configuration (e.g., name for debugging)
 * @returns An atom that can be updated via setImmer
 * 
 * @example
 * const store = createStore();
 * const userAtom = immerAtom({ name: 'John' }, store, { name: 'user' });
 * 
 * setImmer(userAtom, (draft) => {
 *   draft.name = 'Jane';
 * });
 */
export function immerAtom<T>(
  initialValue: T,
  store: Store,
  config?: ImmerAtomConfig
): Atom<T> {
  const baseAtom: Atom<T> = config?.name ? atom(initialValue, config.name) : atom(initialValue);
  atomStores.set(baseAtom as Atom<unknown>, store);
  return baseAtom;
}

/**
 * Updates an atom's value using an Immer-style draft function.
 * 
 * @template T - The type of the atom's value
 * @param atom - The atom to update
 * @param updater - A function that receives a draft of the current value and mutates it
 * 
 * @throws {Error} If the atom was not created with immerAtom
 * 
 * @example
 * setImmer(userAtom, (draft) => {
 *   draft.profile.name = 'Jane';
 *   draft.posts.push({ id: 1, title: 'Hello' });
 * });
 */
export function setImmer<T>(atom: Atom<T>, updater: (draft: T) => void): void {
  const store = atomStores.get(atom as Atom<unknown>);
  if (!store) {
    throw new Error(
      "Store not found for atom. Did you create this atom with immerAtom?",
    );
  }

  const currentValue = store.get(atom);
  const newValue = produce(currentValue, updater);
  store.set(atom, newValue);
}

/**
 * Creates a store wrapper with Immer support for all atoms.
 * This is an alternative to using immerAtom for each atom individually.
 * 
 * @param store - The store to wrap
 * @returns The same store (for chaining)
 * 
 * @deprecated Use immerAtom() for individual atoms instead.
 * This function may be removed in a future version.
 */
export function createImmerStore(store: Store): Store {
  // This is a no-op now, kept for backward compatibility
  // Future versions may add store-wide immer support
  return store;
}

/**
 * Re-export atom for convenience.
 */
export { atom };

/**
 * Re-export immer utilities for advanced configuration.
 */
export { produce, setAutoFreeze } from "immer";
