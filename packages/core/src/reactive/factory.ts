import type { Atom, Store } from '../types';
import type { IReactiveValue } from './types';
import { StoreBasedReactive } from './StoreBasedReactive';
import { SignalBasedReactive, NotImplementedError } from './SignalBasedReactive';
import { REACTIVE_CONFIG } from './config';

/**
 * Create reactive value for an atom
 *
 * Factory function that chooses backend based on configuration.
 * Supports A/B testing and gradual rollout.
 *
 * @param store Store instance
 * @param atom Atom to wrap
 * @returns Reactive value implementation
 *
 * @example
 * ```typescript
 * const store = createStore();
 * const atom = atom(0, 'count');
 * const reactive = createReactiveValue(store, atom);
 * ```
 */
export function createReactiveValue<T>(
  store: Store,
  atom: Atom<T>
): IReactiveValue<T> {
  // Check if Signal backend is enabled
  if (!REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND) {
    if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
      console.log(
        '[createReactiveValue] Using StoreBasedReactive (Signals disabled)'
      );
    }
    return new StoreBasedReactive(store, atom);
  }

  // Check if Signals are available
  if (typeof (globalThis as any).Signal === 'undefined') {
    if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
      console.log(
        '[createReactiveValue] Using StoreBasedReactive (Signals not available)'
      );
    }
    return new StoreBasedReactive(store, atom);
  }

  // A/B testing: random percentage
  const random = Math.random() * 100;
  const shouldUseSignals = random < REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE;

  if (!shouldUseSignals) {
    if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
      console.log(
        `[createReactiveValue] Using StoreBasedReactive (A/B: ${random.toFixed(2)}% > ${REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE}%)`
      );
    }
    return new StoreBasedReactive(store, atom);
  }

  // Try Signal backend
  try {
    const initialValue = store.get(atom);
    const signalReactive = new SignalBasedReactive(initialValue);

    if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
      console.log('[createReactiveValue] Using SignalBasedReactive');
    }

    return signalReactive;
  } catch (error) {
    if (error instanceof NotImplementedError) {
      if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
        console.warn('[createReactiveValue]', error.message);
      }
    }

    if (REACTIVE_CONFIG.FALLBACK_TO_STORE) {
      if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
        console.warn(
          '[createReactiveValue] Falling back to StoreBasedReactive'
        );
      }
      return new StoreBasedReactive(store, atom);
    }

    throw error;
  }
}
