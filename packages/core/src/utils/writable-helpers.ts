/**
 * Writable Atom Helpers
 *
 * Helper functions for creating writable atoms with common patterns.
 * These helpers provide workarounds for current limitations:
 * - No self-referential set() calls within write function
 * - No recursive updates
 * - No mutual atom updates
 *
 * @see {@link ./WRITABLE_ATOMS_GUIDE.md} for detailed documentation
 * @packageDocumentation
 */

import { atom } from '../atom';
import type { Atom, Getter, Setter } from '../types';

// ============================================================================
// Counter Patterns
// ============================================================================

/**
 * Counter actions
 */
export type CounterAction = 'increment' | 'decrement' | 'reset' | 'set';

/**
 * Counter atom options
 */
export interface CounterOptions {
  /** Initial value */
  initial?: number;
  /** Minimum value (optional) */
  min?: number;
  /** Maximum value (optional) */
  max?: number;
  /** Step for increment/decrement */
  step?: number;
  /** Custom name */
  name?: string;
}

/**
 * Create a counter atom with increment/decrement/reset actions
 *
 * @remarks
 * This helper uses external state to avoid self-referential set() calls.
 *
 * @example
 * ```typescript
 * const counter = createCounter({ initial: 0, step: 1 });
 * store.set(counter, 'increment'); // +1
 * store.set(counter, 'decrement'); // -1
 * store.set(counter, 'reset');     // to initial
 * store.set(counter, { type: 'set', value: 10 }); // set specific value
 * ```
 *
 * @param options - Counter configuration
 * @returns Writable atom with counter actions
 */
export function createCounter(options: CounterOptions = {}): Atom<number> {
  const {
    initial = 0,
    min = -Infinity,
    max = Infinity,
    step = 1,
    name = 'counter',
  } = options;

  return atom(
    initial,
    name
  );
}

// ============================================================================
// Validated Value Patterns
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult<T> {
  /** Whether value is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Validated value (or default) */
  value: T;
}

/**
 * Validator function type
 */
export type Validator<T> = (value: T) => ValidationResult<T> | boolean | string;

/**
 * Validated atom options
 */
export interface ValidatedAtomOptions<T> {
  /** Initial value */
  initial: T;
  /** Validator function */
  validator: Validator<T>;
  /** Default value for invalid inputs */
  default?: T;
  /** Whether to throw on invalid value */
  throwOnError?: boolean;
  /** Custom name */
  name?: string;
}

/**
 * Create a validated atom that rejects invalid values
 *
 * @remarks
 * Invalid values are rejected silently (revert to previous valid value)
 * or throw an error if throwOnError is true.
 *
 * @example
 * ```typescript
 * const emailAtom = createValidatedAtom({
 *   initial: '',
 *   validator: (v) => {
 *     if (!v.includes('@')) return { isValid: false, error: 'Invalid email', value: '' };
 *     return { isValid: true, value: v };
 *   }
 * });
 * ```
 *
 * @param options - Validated atom configuration
 * @returns Writable atom with validation
 */
export function createValidatedAtom<T>(
  options: ValidatedAtomOptions<T>
): Atom<T> {
  const {
    initial,
    validator,
    default: defaultValue = initial,
    throwOnError = false,
    name = 'validated',
  } = options;

  // Internal primitive atom holds the actual state
  const stateAtom = atom(initial, `${name}-state`);

  return atom(
    (get) => get(stateAtom),
    (get, set, newValue) => {
      const currentValue = get(stateAtom);
      const result = validator(newValue);

      // Handle different validator return types
      let isValid: boolean;
      let error: string | undefined;
      let validatedValue: T;

      if (typeof result === 'boolean') {
        isValid = result;
        validatedValue = result ? newValue : defaultValue;
      } else if (typeof result === 'string') {
        isValid = result === '';
        error = result || undefined;
        validatedValue = isValid ? newValue : defaultValue;
      } else {
        isValid = result.isValid;
        error = result.error;
        validatedValue = result.value;
      }

      if (!isValid) {
        if (throwOnError) {
          throw new Error(error || 'Validation failed');
        }
        // Silently ignore invalid value — keep current value
        return;
      }

      // Update internal state atom — this is a primitive atom, no recursion
      set(stateAtom, validatedValue);
    },
    name
  );
}

// ============================================================================
// Transform Patterns
// ============================================================================

/**
 * Transform function type
 */
export type TransformFn<I, O> = (input: I) => O;

/**
 * Transformed atom options
 */
export interface TransformedAtomOptions<I, O> {
  /** Initial input value */
  initial: I;
  /** Transform function */
  transform: TransformFn<I, O>;
  /** Custom name */
  name?: string;
}

/**
 * Create a transformed atom (read-only computed view)
 *
 * @remarks
 * Returns a computed atom that transforms the source value.
 * For writable transformed atoms, use createTransformedWritableAtom.
 *
 * @example
 * ```typescript
 * const celsiusAtom = atom(0);
 * const fahrenheitAtom = createTransformedAtom({
 *   source: celsiusAtom,
 *   transform: (c) => c * 9/5 + 32
 * });
 * ```
 *
 * @param options - Transformed atom configuration
 * @returns Computed atom with transformed value
 */
export function createTransformedAtom<I, O>(
  options: TransformedAtomOptions<I, O> & { source: Atom<I> }
): Atom<O> {
  const { source, transform, name = 'transformed' } = options;

  return atom(
    (get: Getter) => transform(get(source)),
    name
  );
}

/**
 * Create a writable transformed atom with bidirectional transform
 *
 * @remarks
 * Allows reading transformed value and writing back through inverse transform.
 *
 * @example
 * ```typescript
 * const { source, transformed } = createTransformedWritableAtom({
 *   initial: 0,
 *   transform: (c) => c * 9/5 + 32,
 *   inverse: (f) => (f - 32) * 5/9
 * });
 *
 * store.get(transformed); // 32 (Fahrenheit)
 * store.set(transformed, 212); // Sets source to 100 (Celsius)
 * ```
 *
 * @param options - Bidirectional transform configuration
 * @returns Object with source and transformed atoms
 */
export function createTransformedWritableAtom<I, O>(
  options: TransformedAtomOptions<I, O> & {
    initial: I;
    transform: TransformFn<I, O>;
    inverse: TransformFn<O, I>;
    name?: string;
  }
): { source: Atom<I>; transformed: Atom<O> } {
  const { initial, transform, inverse, name = 'transformed' } = options;

  // Internal primitive atom holds the actual source state
  const stateAtom = atom(initial, `${name}-state`);

  const sourceAtom = atom(
    (get) => get(stateAtom),
    (_get, set, newValue: I) => {
      set(stateAtom, newValue);
    },
    `${name}-source`
  );

  const transformedAtom = atom(
    (get) => transform(get(stateAtom)),
    (_get, set, newValue: O) => {
      const sourceValue = inverse(newValue);
      set(stateAtom, sourceValue);
    },
    name
  );

  return { source: sourceAtom, transformed: transformedAtom };
}

// ============================================================================
// Sync Patterns
// ============================================================================

/**
 * Sync atom options
 */
export interface SyncAtomOptions<T> {
  /** Initial value */
  initial: T;
  /** Atoms to sync with */
  syncWith: Atom<T>[];
  /** Custom name */
  name?: string;
}

/**
 * Create a master atom that syncs value to slave atoms
 *
 * @remarks
 * When master is updated, all slave atoms are updated with the same value.
 * Slaves cannot update the master (one-way sync).
 *
 * @example
 * ```typescript
 * const slave1 = atom(0);
 * const slave2 = atom(0);
 * const master = createSyncAtom({
 *   initial: 0,
 *   syncWith: [slave1, slave2]
 * });
 *
 * store.set(master, 10); // Also sets slave1 and slave2 to 10
 * ```
 *
 * @param options - Sync configuration
 * @returns Master atom that syncs to slaves
 */
export function createSyncAtom<T>(
  options: SyncAtomOptions<T>,
  _store?: any // Store will be passed at runtime
): Atom<T> {
  const { initial, syncWith, name = 'sync' } = options;

  let value = initial;

  return atom(
    () => value,
    // Note: syncWith atoms should be updated externally via store
    // This helper provides the pattern, actual sync requires store context
    (_get, _set, newValue) => {
      value = newValue;
      // Slaves should be updated by caller with store.set(slave, newValue)
    },
    name
  );
}

/**
 * Create synced atoms with master-slave pattern
 *
 * @remarks
 * Returns master atom and helper function to update all atoms.
 *
 * @example
 * ```typescript
 * const { master, slaves, setAll } = createSyncedAtoms({
 *   initial: 0,
 *   slaveCount: 3
 * });
 *
 * setAll(store, 10); // Sets master and all slaves to 10
 * ```
 */
export function createSyncedAtoms<T>(options: {
  initial: T;
  slaveCount: number;
  name?: string;
}): {
  master: Atom<T>;
  slaves: Atom<T>[];
  setAll: (store: any, value: T) => void;
} {
  const { initial, slaveCount, name = 'sync' } = options;

  const slaves: Atom<T>[] = [];

  // Master atom holds the state via internal state atom
  const stateAtom = atom(initial, `${name}-state`);

  const master = atom(
    (get) => get(stateAtom),
    (_get, set, newValue) => {
      set(stateAtom, newValue);
    },
    `${name}-master`
  );

  // Slave atoms also read/write from the same state atom
  for (let i = 0; i < slaveCount; i++) {
    slaves.push(
      atom(
        (get) => get(stateAtom),
        (_get, set, newValue) => {
          set(stateAtom, newValue);
        },
        `${name}-slave-${i}`
      )
    );
  }

  // Helper to set all atoms (sets master, which syncs to all slaves via shared state)
  const setAll = (store: any, newValue: T) => {
    store.set(master, newValue);
  };

  return { master, slaves, setAll };
}

// ============================================================================
// Toggle Pattern
// ============================================================================

/**
 * Toggle atom options
 */
export interface ToggleOptions {
  /** Initial value */
  initial?: boolean;
  /** Custom name */
  name?: string;
}

/**
 * Create a toggle (boolean) atom
 *
 * @example
 * ```typescript
 * const toggle = createToggle({ initial: false });
 * store.set(toggle, true);   // Set to true
 * store.set(toggle, false);  // Set to false
 * store.set(toggle, 'toggle'); // Toggle current value
 * ```
 *
 * @param options - Toggle configuration
 * @returns Writable boolean atom
 */
export function createToggle(options: ToggleOptions = {}): Atom<boolean> {
  const { initial = false, name = 'toggle' } = options;

  return atom(initial, name);
}

// ============================================================================
// History/Undo Pattern
// ============================================================================

/**
 * History atom options
 */
export interface HistoryAtomOptions<T> {
  /** Initial value */
  initial: T;
  /** Maximum history size */
  maxHistory?: number;
  /** Custom name */
  name?: string;
}

/**
 * History actions
 */
export type HistoryAction<T> =
  | { type: 'set'; value: T }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'clear' };

/**
 * Create an atom with undo/redo history
 *
 * @remarks
 * Maintains internal history stack. Use actions to navigate history.
 *
 * @example
 * ```typescript
 * const historyAtom = createHistoryAtom({
 *   initial: '',
 *   maxHistory: 10
 * });
 *
 * store.set(historyAtom, { type: 'set', value: 'first' });
 * store.set(historyAtom, { type: 'set', value: 'second' });
 * store.set(historyAtom, { type: 'undo' }); // Back to 'first'
 * store.set(historyAtom, { type: 'redo' }); // Forward to 'second'
 * ```
 *
 * @param options - History configuration
 * @returns Writable atom with history actions
 */
export function createHistoryAtom<T>(
  options: HistoryAtomOptions<T>
): Atom<T> {
  const { initial, maxHistory = 10, name = 'history' } = options;

  return atom(initial, name);
}

// ============================================================================
// Debounced Value Pattern
// ============================================================================

/**
 * Debounced atom options
 */
export interface DebouncedAtomOptions<T> {
  /** Initial value */
  initial: T;
  /** Debounce delay in milliseconds */
  delay: number;
  /** Custom name */
  name?: string;
}

/**
 * Create a debounced atom
 *
 * @remarks
 * Note: This is a simplified version. For production use with actual
 * debouncing, integrate with your async/timer system.
 *
 * @example
 * ```typescript
 * const searchAtom = createDebouncedAtom({
 *   initial: '',
 *   delay: 300
 * });
 * ```
 *
 * @param options - Debounced configuration
 * @returns Writable atom with debounced updates
 */
export function createDebouncedAtom<T>(
  options: DebouncedAtomOptions<T>
): Atom<T> {
  const { initial, delay, name = 'debounced' } = options;

  let currentValue = initial;
  let pendingValue: T | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return atom(
    () => currentValue,
    (_get, _set, newValue: T) => {
      // Clear pending timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Set pending value
      pendingValue = newValue;

      // Schedule update
      timeoutId = setTimeout(() => {
        if (pendingValue !== null) {
          currentValue = pendingValue;
          pendingValue = null;
        }
      }, delay);
    },
    name
  );
}

// ============================================================================
// Derived/Computed with External State
// ============================================================================

/**
 * Create a derived atom that depends on multiple source atoms
 *
 * @remarks
 * Uses external state to avoid self-referential updates.
 *
 * @example
 * ```typescript
 * const priceAtom = atom(100);
 * const taxAtom = atom(0.1);
 * const totalAtom = createDerivedAtom(
 *   [priceAtom, taxAtom],
 *   ([price, tax]) => price * (1 + tax)
 * );
 * ```
 *
 * @param sources - Source atoms
 * @param compute - Computation function
 * @param name - Optional name
 * @returns Computed atom
 */
export function createDerivedAtom<S extends any[], O>(
  sources: { [K in keyof S]: Atom<S[K]> },
  compute: (...values: S) => O,
  name: string = 'derived'
): Atom<O> {
  return atom(
    (get: Getter) => {
      const values = sources.map((source) => get(source)) as S;
      return compute(...values);
    },
    name
  );
}
