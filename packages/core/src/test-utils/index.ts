/**
 * Test utilities for Nexus State packages
 */

import { atom, createStore } from '../index';
import type { Atom, Store } from '../types';

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
  Object.entries(atoms).forEach(([, atom]) => {
    store.get(atom); // Initialize
  });
  return store;
}

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
