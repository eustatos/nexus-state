import type { IReactiveValue, Unsubscribe, AtomContext } from './types';

/**
 * Abstract base class for reactive implementations
 *
 * Provides common utilities and structure for reactive value implementations.
 * Subclasses must implement the core methods: getValue, setValue, and subscribe.
 *
 * @template T The type of value held by this reactive
 *
 * @example
 * ```typescript
 * class MyReactive<T> extends BaseReactive<T> {
 *   getValue(): T {
 *     // Implementation
 *   }
 *
 *   setValue(value: T, context?: AtomContext): void {
 *     // Implementation
 *   }
 *
 *   subscribe(fn: (value: T) => void): Unsubscribe {
 *     // Implementation
 *   }
 * }
 * ```
 */
export abstract class BaseReactive<T> implements IReactiveValue<T> {
  /**
   * Get current value (must be implemented by subclasses)
   * @returns Current value of the reactive
   */
  abstract getValue(): T;

  /**
   * Set new value (must be implemented by subclasses)
   * @param value New value
   * @param context Optional operation metadata
   */
  abstract setValue(value: T, context?: AtomContext): void;

  /**
   * Subscribe to changes (must be implemented by subclasses)
   * @param fn Callback invoked when value changes
   * @returns Unsubscribe function
   */
  abstract subscribe(fn: (value: T) => void): Unsubscribe;

  /**
   * Helper: Check if context has silent flag
   *
   * @param context Optional context to check
   * @returns True if silent mode is enabled
   *
   * @example
   * ```typescript
   * if (this.isSilent(context)) {
   *   // Skip notifications
   * }
   * ```
   */
  protected isSilent(context?: AtomContext): boolean {
    return context?.silent === true;
  }

  /**
   * Helper: Check if context is time-travel operation
   *
   * @param context Optional context to check
   * @returns True if this is a time-travel operation
   *
   * @example
   * ```typescript
   * if (this.isTimeTravel(context)) {
   *   // Skip effects during time-travel
   * }
   * ```
   */
  protected isTimeTravel(context?: AtomContext): boolean {
    return context?.timeTravel === true;
  }
}
