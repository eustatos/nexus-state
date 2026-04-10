/**
 * Test utilities for Nexus State packages
 *
 * @packageDocumentation
 *
 * Provides utilities for testing:
 * - Test fixtures for common scenarios
 * - Helper functions for async testing
 * - Mock utilities
 * - State cleanup utilities
 * - Writable atom helpers
 *
 * @example
 * ```typescript
 * import { createTestAtom, mockConsole, sleep, createCounter } from '@nexus-state/core/test-utils';
 *
 * const testAtom = createTestAtom(42, 'test');
 * const counter = createCounter({ initial: 0 });
 * ```
 */

import { atom, createStore } from '../index';
import { batcher } from '../batching';
import type { Atom, Store, Setter } from '../types';

// ============================================================================
// Test Isolation
// ============================================================================

/**
 * Clean up all global state between tests
 * This ensures test isolation by clearing:
 * - Batcher queues and state
 *
 * Note: Atom registry is now per-store (ScopedRegistry),
 * so no global cleanup needed for atoms.
 */
export function cleanupGlobalState(): void {
  batcher.reset();
}

/**
 * Create test isolation helper
 * Returns functions to setup and cleanup test environment
 */
export function createTestIsolation() {
  return {
    setup: () => {
      cleanupGlobalState();
    },
    teardown: () => {
      cleanupGlobalState();
    },
  };
}

// ============================================================================
// Atom Factories
// ============================================================================

/**
 * Create a test atom with a name
 */
export function createTestAtom<T>(value: T, name?: string): Atom<T> {
  return atom(value, name || `test-atom-${Date.now()}`);
}

/**
 * Create a mock atom (simple object with id and name)
 */
export function createMockAtom<T = any>(name: string, initialValue: T): Atom<T> {
  const id = Symbol(name);
  let value: T = initialValue;
  return {
    id,
    name,
    type: 'primitive' as const,
    read: () => value,
    write: (_set: Setter, newValue: T) => {
      value = newValue;
    },
  };
}

/**
 * Create a test store with predefined atoms
 */
export function createTestStore(atoms: Record<string, Atom<any>> = {}): Store {
  const store = createStore();
  Object.entries(atoms).forEach(([, a]) => {
    store.get(a); // Initialize
  });
  return store;
}

/**
 * Create a mock store with basic functionality
 */
export function createMockStore(): Store {
  const atoms = new Map<symbol, any>();
  return {
    get: <T>(atom: Atom<T>): T => {
      if (!atoms.has(atom.id)) {
        if (atom.type === 'primitive') {
          atoms.set(atom.id, atom.read());
        } else {
          atoms.set(atom.id, atom.read((() => {}) as any));
        }
      }
      return atoms.get(atom.id) as T;
    },
    set: <T>(atom: Atom<T>, value: T | ((prev: T) => T)): void => {
      const currentValue = atoms.get(atom.id);
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(currentValue) : value;
      atoms.set(atom.id, newValue);
      if (atom.type === 'primitive' && atom.write) {
        atom.write((() => {}) as any, newValue);
      }
    },
    subscribe: () => () => {},
    batch: <T>(fn: () => T) => fn(),
    getState: () => ({}) as any,
  } as Store;
}

// ============================================================================
// Writable Atom Helpers (for testing)
// ============================================================================

/**
 * Create a counter atom for testing
 *
 * @example
 * ```typescript
 * const counter = createTestCounter({ initial: 0 });
 * store.set(counter, 'increment');
 * expect(store.get(counter)).toBe(1);
 * ```
 */
export function createTestCounter(
  options: {
    initial?: number;
    min?: number;
    max?: number;
    step?: number;
    name?: string;
  } = {}
): Atom<number> {
  const {
    initial = 0,
    min = -Infinity,
    max = Infinity,
    step = 1,
    name = 'test-counter',
  } = options;

  let count = initial;

  return atom(
    () => count,
    (_get, _set, action: any) => {
      switch (action) {
        case 'increment':
          count = Math.min(max, count + step);
          break;
        case 'decrement':
          count = Math.max(min, count - step);
          break;
        case 'reset':
          count = initial;
          break;
      }
    },
    name
  );
}

/**
 * Create a toggle atom for testing
 *
 * @example
 * ```typescript
 * const toggle = createTestToggle({ initial: false });
 * store.set(toggle, 'toggle');
 * expect(store.get(toggle)).toBe(true);
 * ```
 */
export function createTestToggle(
  options: {
    initial?: boolean;
    name?: string;
  } = {}
): Atom<boolean> {
  const { initial = false, name = 'test-toggle' } = options;

  let value = initial;

  return atom(
    () => value,
    (_get, _set, newValue: any) => {
      if (newValue === 'toggle') {
        value = !value;
      } else {
        value = newValue;
      }
    },
    name
  );
}

/**
 * Create a validated atom for testing
 *
 * @example
 * ```typescript
 * const validated = createTestValidatedAtom({
 *   initial: 0,
 *   validator: (v) => v >= 0
 * });
 * store.set(validated, -5); // Ignored
 * expect(store.get(validated)).toBe(0);
 * ```
 */
export function createTestValidatedAtom<T>(options: {
  initial: T;
  validator: (value: T) => boolean;
  default?: T;
  name?: string;
}): Atom<T> {
  const {
    initial,
    validator,
    default: defaultValue = initial,
    name = 'test-validated',
  } = options;

  let currentValue = initial;

  return atom(
    () => currentValue,
    (_get, _set, newValue: T) => {
      if (validator(newValue)) {
        currentValue = newValue;
      }
      // Invalid values silently ignored
    },
    name
  );
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 1000,
  interval = 10
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a deferred promise
 */
export function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// ============================================================================
// Mock Utilities
// ============================================================================

/**
 * Mock console methods for testing
 */
export function mockConsole() {
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  const mocks = {
    log: createSpyFn(),
    warn: createSpyFn(),
    error: createSpyFn(),
  };

  console.log = mocks.log;
  console.warn = mocks.warn;
  console.error = mocks.error;

  return {
    mocks,
    restore: () => {
      console.log = original.log;
      console.warn = original.warn;
      console.error = original.error;
    },
  };
}

function createSpyFn() {
  const fn = function () {
    // no-op
  };
  return fn;
}

/**
 * Create a spy for function calls
 */
export function createSpy<T extends (...args: any[]) => any>(fn?: T) {
  const calls: any[][] = [];
  const spy = function (...args: any[]) {
    calls.push(args);
    return fn?.(...args);
  };
  spy.calls = calls;
  spy.reset = () => {
    calls.length = 0;
  };
  return spy as T & { calls: any[][]; reset: () => void };
}
