import type { IReactiveValue, AtomContext, Unsubscribe } from './types';
import { BaseReactive } from './BaseReactive';

/**
 * Error thrown when trying to use unimplemented Signal features
 *
 * This error indicates that the SignalBasedReactive class is a stub
 * and will be fully implemented when TC39 Native Signals reach Stage 3-4
 * (estimated 2027-2028).
 *
 * @see https://github.com/tc39/proposal-signals
 */
export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
  }
}

/**
 * Signal-based reactive implementation (STUB)
 *
 * This is a placeholder for future TC39 Native Signals implementation.
 * Will be fully implemented when Signals reach Stage 3-4 (estimated 2027-2028).
 *
 * @see https://github.com/tc39/proposal-signals
 *
 * @template T The type of value
 *
 * @example Future usage (not yet implemented):
 * ```typescript
 * const reactive = new SignalBasedReactive(0);
 * reactive.setValue(10);
 * console.log(reactive.getValue()); // 10
 * ```
 */
export class SignalBasedReactive<T> extends BaseReactive<T> {
  private signal?: any; // Signal.State<T> when available
  private watcher?: any; // Signal.subtle.Watcher when available

  /**
   * Create Signal-based reactive value
   *
   * @param initialValue Initial value
   * @throws {NotImplementedError} Signals not available yet
   */
  constructor(_initialValue: T) {
    super();

    // Check if native Signals are available
    if (typeof (globalThis as any).Signal === 'undefined') {
      throw new NotImplementedError(
        'TC39 Native Signals not available. SignalBasedReactive will be implemented when Signals reach Stage 3-4 (estimated 2027-2028).'
      );
    }

    // TODO (Phase 11 → Signals Migration):
    // Initialize native Signal when available:
    // this.signal = new Signal.State(initialValue);

    throw new NotImplementedError(
      'SignalBasedReactive not implemented yet. This is a stub for future TC39 Signals migration (2027-2028).'
    );
  }

  /**
   * Get current value
   * @returns Current value
   * @throws {NotImplementedError}
   */
  getValue(): T {
    // TODO (Phase 11 → Signals Migration):
    // Return value from native Signal:
    // return this.signal.get();

    throw new NotImplementedError(
      'SignalBasedReactive.getValue not implemented. This is a stub for future TC39 Signals migration (2027-2028).'
    );
  }

  /**
   * Set new value with optional context
   * @param _value New value
   * @param _context Optional operation metadata
   * @throws {NotImplementedError}
   */
  setValue(_value: T, _context?: AtomContext): void {
    // TODO (Phase 11 → Signals Migration):
    // Set value on native Signal:
    // this.signal.set(value);
    //
    // Handle silent context:
    // if (context?.silent) {
    //   // Mechanism for silent updates with Signals
    //   // May require Signal.subtle.Watcher pause/resume
    //   // or custom batching mechanism
    // }

    throw new NotImplementedError(
      'SignalBasedReactive.setValue not implemented. This is a stub for future TC39 Signals migration (2027-2028).'
    );
  }

  /**
   * Subscribe to value changes
   * @param _fn Callback invoked on changes
   * @returns Unsubscribe function
   * @throws {NotImplementedError}
   */
  subscribe(_fn: (value: T) => void): Unsubscribe {
    // TODO (Phase 11 → Signals Migration):
    // Subscribe using native Signal watcher:
    // this.watcher = new Signal.subtle.Watcher(() => {
    //   fn(this.getValue());
    // });
    // this.watcher.watch(this.signal);
    // return () => this.watcher!.unwatch(this.signal);

    throw new NotImplementedError(
      'SignalBasedReactive.subscribe not implemented. This is a stub for future TC39 Signals migration (2027-2028).'
    );
  }
}
