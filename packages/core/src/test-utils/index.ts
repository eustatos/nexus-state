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

import { atom, createStore, atomRegistry } from '../index';
import { batcher } from '../batching';
import type { Atom, Store } from '../types';

// ============================================================================
// Test Isolation
// ============================================================================

/**
 * Clean up all global state between tests
 * This ensures test isolation by clearing:
 * - Atom registry
 * - Batcher queues and state
 */
export function cleanupGlobalState(): void {
  atomRegistry.clear();
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
 * Create a test store with predefined atoms
 */
export function createTestStore(atoms: Record<string, Atom<any>> = {}): Store {
  const store = createStore();
  Object.entries(atoms).forEach(([, a]) => {
    store.get(a); // Initialize
  });
  return store;
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
export function createTestCounter(options: {
  initial?: number;
  min?: number;
  max?: number;
  step?: number;
  name?: string;
} = {}): Atom<undefined, 'increment' | 'decrement' | 'reset'> {
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
    (get, set, action) => {
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
export function createTestToggle(options: {
  initial?: boolean;
  name?: string;
} = {}): Atom<boolean, boolean | 'toggle'> {
  const { initial = false, name = 'test-toggle' } = options;

  let value = initial;

  return atom(
    () => value,
    (get, set, newValue) => {
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
}): Atom<T, T> {
  const {
    initial,
    validator,
    default: defaultValue = initial,
    name = 'test-validated',
  } = options;

  let currentValue = initial;

  return atom(
    () => currentValue,
    (get, set, newValue) => {
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
