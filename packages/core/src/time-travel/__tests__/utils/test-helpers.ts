/**
 * Test helpers for edge case testing
 * Provides type-safe utilities for creating test data and mocking
 */

import { describe as _describe, it as _it, expect as _expect, beforeEach as _beforeEach, afterEach as _afterEach, vi } from "vitest";
import type { Store, Atom, Snapshot, SnapshotStateEntry } from "../../../types";

/**
 * Helper class for creating test data and mocking
 */
export class TestHelper {
  /**
   * Create a test store with mock implementations
   * @param initialAtoms Initial atoms to populate the store with
   * @returns Mock store implementation
   */
  static createTestStore(initialAtoms: Record<string, unknown> = {}): Store {
    const atoms = new Map<symbol, unknown>();

    // Populate initial atoms
    Object.entries(initialAtoms).forEach(([key, value]) => {
      const id = Symbol(key);
      atoms.set(id, value);
    });

    return {
      get: <T>(atom: Atom<T>): T => {
        const value = atoms.get(atom.id);
        if (value === undefined) {
          throw new Error(`Atom ${atom.name || atom.id.toString()} not found`);
        }
        return value as T;
      },
      set: <T>(atom: Atom<T>, value: T): void => {
        atoms.set(atom.id, value);
      },
      subscribe: <T>(
        _atom: Atom<T>,
        _subscriber: (value: T) => void,
      ): (() => void) => {
        // No-op for tests
        return () => {};
      },
      getState: (): Record<string, unknown> => {
        const state: Record<string, unknown> = {};
        atoms.forEach((value, key) => {
          state[key.toString()] = value;
        });
        return state;
      },
    } as Store;
  }

  /**
   * Generate a test atom
   * @param name Atom name
   * @param type Atom type (primitive, computed, or writable)
   * @returns Generated atom
   */
  static generateAtom(
    name: string,
    type: "primitive" | "computed" | "writable" = "primitive",
  ): Atom<unknown> {
    return {
      id: Symbol(name),
      name,
      type,
      toString: () => name,
    } as Atom<unknown>;
  }

  /**
   * Generate a test snapshot
   * @param id Snapshot ID
   * @param state Snapshot state
   * @param options Optional partial snapshot overrides
   * @returns Generated snapshot
   */
  static generateSnapshot(
    id: string,
    state: Record<string, unknown> = {},
    options?: Partial<Snapshot>,
  ): Snapshot {
    const snapshotState: Record<string, SnapshotStateEntry> = Object.entries(
      state,
    ).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: {
          value,
          type: "primitive",
          name: key,
          atomId: `atom-${key}`,
        },
      }),
      {},
    );

    return {
      id,
      state: snapshotState,
      metadata: {
        timestamp: Date.now(),
        action: `test-${id}`,
        atomCount: Object.keys(state).length,
        ...options?.metadata,
      },
    } as Snapshot;
  }

  /**
   * Wait for a specified number of milliseconds
   * @param ms Milliseconds to wait
   * @returns Promise that resolves after the delay
   */
  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Repeat an async function multiple times
   * @param fn Function to repeat
   * @param times Number of times to repeat
   */
  static async repeat(
    fn: () => Promise<void>,
    times: number,
  ): Promise<void> {
    for (let i = 0; i < times; i++) {
      await fn();
    }
  }

  /**
   * Execute multiple async functions concurrently with a limit
   * @param fns Array of functions to execute
   * @param parallel Maximum number of concurrent executions
   * @returns Array of results
   */
  static async concurrent<T>(
    fns: Array<() => Promise<T>>,
    parallel: number = 10,
  ): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < fns.length; i += parallel) {
      const batch = fns.slice(i, i + parallel);
      const batchResults = await Promise.all(batch.map((fn) => fn()));
      results.push(...batchResults);
    }
    return results;
  }

  /**
   * Mock the store.get method to return a specific value
   * @param store Store to mock
   * @param value Value to return
   */
  static mockStoreGet(store: Store, value: unknown): void {
    vi.spyOn(store, "get").mockReturnValue(value as never);
  }

  /**
   * Mock the store.set method to optionally throw an error
   * @param store Store to mock
   * @param shouldFail Whether to throw an error on set
   */
  static mockStoreSet(store: Store, shouldFail: boolean = false): void {
    if (shouldFail) {
      vi.spyOn(store, "set").mockImplementation(() => {
        throw new Error("Store set failed");
      });
    }
  }
}

/**
 * Calculate benchmark metrics from an array of times
 * @param times Array of times in milliseconds
 * @returns Metrics object with avg, p95, and max
 */
export function calculateMetrics(times: number[]): {
  avg: number;
  p95: number;
  max: number;
} {
  const sorted = [...times].sort((a, b) => a - b);
  return {
    avg: sorted.reduce((a, b) => a + b, 0) / sorted.length,
    p95: sorted[Math.floor(sorted.length * 0.95)],
    max: sorted[sorted.length - 1],
  };
}
