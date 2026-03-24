import type { Atom, Store } from '../types';
import type { IReactiveValue, AtomContext, Unsubscribe } from './types';
import { BaseReactive } from './BaseReactive';

/**
 * Store-based reactive implementation
 *
 * Provides IReactiveValue interface over existing Store infrastructure.
 * This is the current implementation (2026-2027) before TC39 Signals migration.
 *
 * @template T The type of value
 *
 * @example
 * ```typescript
 * const store = createStore();
 * const atom = atom(0, 'count');
 * const reactive = new StoreBasedReactive(store, atom);
 *
 * reactive.setValue(10);
 * console.log(reactive.getValue()); // 10
 * ```
 */
export class StoreBasedReactive<T> extends BaseReactive<T> {
  constructor(
    private store: Store,
    private atom: Atom<T>
  ) {
    super();
  }

  /**
   * Get current value from store
   * @returns Current atom value
   */
  getValue(): T {
    return this.store.get(this.atom);
  }

  /**
   * Set new value with optional context
   * @param value New value
   * @param context Optional operation metadata
   */
  setValue(value: T, context?: AtomContext): void {
    // Check if store supports context parameter
    if (typeof (this.store as any).set === 'function') {
      const setMethod = (this.store as any).set;

      // Try to pass context (Phase 11 SR-006 feature)
      try {
        setMethod.call(this.store, this.atom, value, context);
      } catch (error) {
        // Fallback: call without context for older Store versions
        if (context?.silent) {
          console.warn(
            '[StoreBasedReactive] Store does not support silent context, falling back to normal set'
          );
        }
        this.store.set(this.atom, value);
      }
    } else {
      this.store.set(this.atom, value);
    }
  }

  /**
   * Subscribe to value changes
   * @param fn Callback invoked on changes
   * @returns Unsubscribe function
   */
  subscribe(fn: (value: T) => void): Unsubscribe {
    return this.store.subscribe(this.atom, fn);
  }

  /**
   * Get the underlying store
   * @internal For testing and debugging
   */
  getStore(): Store {
    return this.store;
  }

  /**
   * Get the underlying atom
   * @internal For testing and debugging
   */
  getAtom(): Atom<T> {
    return this.atom;
  }
}
