/**
 * Unsubscribe function returned from subscribe
 */
export type Unsubscribe = () => void;

/**
 * Context metadata for reactive operations
 *
 * Provides additional information about state changes for advanced use cases
 * like time-travel debugging, silent updates, and operation tracing.
 */
export interface AtomContext {
  /**
   * Suppress notifications/effects during update
   * Used for time-travel, undo/redo, silent operations
   *
   * @example
   * ```typescript
   * // Silent update - subscribers won't be notified
   * store.set(atom, value, { silent: true });
   * ```
   */
  silent?: boolean;

  /**
   * Indicates this is a time-travel operation
   * Effects with suppressDuringTravel will be skipped
   *
   * @example
   * ```typescript
   * // During time-travel, suppressed effects won't run
   * store.set(atom, value, { timeTravel: true });
   * ```
   */
  timeTravel?: boolean;

  /**
   * Source of the change (for debugging)
   *
   * @example 'user-action', 'api-response', 'time-travel'
   */
  source?: string;

  /**
   * Additional custom metadata
   *
   * @example
   * ```typescript
   * store.set(atom, value, {
   *   metadata: { userId: 123, action: 'increment' }
   * });
   * ```
   */
  metadata?: Record<string, unknown>;
}

/**
 * Core reactive value abstraction
 *
 * This interface allows switching between Store-based and Signal-based
 * implementations without breaking changes. It provides a unified API
 * for reactive state management regardless of the underlying backend.
 *
 * @template T The type of value held by this reactive
 *
 * @example
 * ```typescript
 * const reactive: IReactiveValue<number> = createReactiveValue(store, atom);
 *
 * // Get value
 * const value = reactive.getValue();
 *
 * // Set value with context
 * reactive.setValue(10, { silent: true });
 *
 * // Subscribe to changes
 * const unsubscribe = reactive.subscribe((value) => {
 *   console.log('Value changed:', value);
 * });
 * ```
 */
export interface IReactiveValue<T> {
  /**
   * Get current value
   * @returns Current value of the reactive
   */
  getValue(): T;

  /**
   * Set new value with optional context
   * @param value New value
   * @param context Optional metadata for the operation
   */
  setValue(value: T, context?: AtomContext): void;

  /**
   * Subscribe to value changes
   * @param fn Callback invoked when value changes
   * @returns Unsubscribe function
   */
  subscribe(fn: (value: T) => void): Unsubscribe;
}
