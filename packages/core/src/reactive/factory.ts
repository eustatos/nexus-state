import type { Atom, Store } from '../types';
import type { IReactiveValue } from './types';
import { StoreBasedReactive } from './StoreBasedReactive';

/**
 * Create reactive value for an atom
 *
 * Wraps an atom in a reactive value backed by the Nexus Store.
 *
 * @param store Store instance
 * @param atom Atom to wrap
 * @returns Reactive value implementation
 *
 * @example
 * ```typescript
 * const store = createStore();
 * const myAtom = atom(0, 'count');
 * const reactive = createReactiveValue(store, myAtom);
 * ```
 */
export function createReactiveValue<T>(
  store: Store,
  atom: Atom<T>
): IReactiveValue<T> {
  return new StoreBasedReactive(store, atom);
}
