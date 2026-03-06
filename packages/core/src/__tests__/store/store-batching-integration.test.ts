/**
 * Store Batching Integration Tests
 * Tests for store operations with batching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore, atom, batch, isBatching } from '../../index';
import { batcher } from '../../batching';
import type { Getter } from '../../types';

describe('store with batch', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    batcher.reset();
  });

  describe('Batch Multiple Sets', () => {
    it('should batch multiple state updates', () => {
      const atom1 = atom(0);
      const atom2 = atom(0);
      const atom3 = atom(0);

      batch(() => {
        store.set(atom1, 1);
        store.set(atom2, 2);
        store.set(atom3, 3);
      });

      expect(store.get(atom1)).toBe(1);
      expect(store.get(atom2)).toBe(2);
      expect(store.get(atom3)).toBe(3);
    });

    it('should schedule notifications during batch', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();

      store.subscribe(countAtom, subscriber);

      batch(() => {
        store.set(countAtom, 1);
        store.set(countAtom, 2);
        store.set(countAtom, 3);
      });

      // Each set triggers a notification
      expect(subscriber).toHaveBeenCalledTimes(3);
      expect(subscriber).toHaveBeenNthCalledWith(3, 3);
    });

    it('should return value from batch function', () => {
      const result = batch(() => {
        return 42;
      });

      expect(result).toBe(42);
    });
  });

  describe('Batch with Computed Atoms', () => {
    it('should handle computed atoms in batch', () => {
      const baseAtom = atom(0);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);
      const subscriber = vi.fn();

      store.subscribe(doubleAtom, subscriber);

      batch(() => {
        store.set(baseAtom, 1);
        store.set(baseAtom, 2);
        store.set(baseAtom, 3);
      });

      // Subscriber is called for base atom changes
      // Computed value is recalculated on get
      expect(store.get(doubleAtom)).toBe(6);
    });
  });

  describe('Nested Batches with Store', () => {
    it('should handle nested batches', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();

      store.subscribe(countAtom, subscriber);

      batch(() => {
        store.set(countAtom, 1);
        batch(() => {
          store.set(countAtom, 2);
          batch(() => {
            store.set(countAtom, 3);
          });
        });
      });

      // Each set triggers notification
      expect(subscriber).toHaveBeenCalledTimes(3);
      expect(subscriber).toHaveBeenLastCalledWith(3);
    });

    it('should collect values during batch', () => {
      const countAtom = atom(0);
      const values: number[] = [];

      store.subscribe(countAtom, (value: number) => {
        values.push(value);
      });

      batch(() => {
        store.set(countAtom, 1);
        store.set(countAtom, 2);
      });

      expect(values).toEqual([1, 2]);
    });
  });

  describe('Multiple Atoms in Batch', () => {
    it('should update multiple atoms and notify each', () => {
      const atom1 = atom(0);
      const atom2 = atom(0);
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();

      store.subscribe(atom1, subscriber1);
      store.subscribe(atom2, subscriber2);

      batch(() => {
        store.set(atom1, 10);
        store.set(atom2, 20);
      });

      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber1).toHaveBeenCalledWith(10);

      expect(subscriber2).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledWith(20);
    });

    it('should handle dependent atoms in batch', () => {
      const baseAtom = atom(0);
      const derivedAtom = atom((get: Getter) => get(baseAtom) * 2);
      const baseSub = vi.fn();
      const derivedSub = vi.fn();

      store.subscribe(baseAtom, baseSub);
      store.subscribe(derivedAtom, derivedSub);

      batch(() => {
        store.set(baseAtom, 5);
      });

      expect(baseSub).toHaveBeenCalledTimes(1);
      // Derived atom subscriber not called until value is retrieved
      expect(derivedSub).not.toHaveBeenCalled();
    });
  });

  describe('Batch Error Handling', () => {
    it('should end batch even if function throws', () => {
      const countAtom = atom(0);

      expect(() => {
        batch(() => {
          store.set(countAtom, 1);
          throw new Error('Test error');
        });
      }).toThrow('Test error');

      // Batch should be ended
      expect(batcher.getDepth()).toBe(0);
    });

    it('should flush callbacks even after error in batch', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();

      store.subscribe(countAtom, subscriber);

      try {
        batch(() => {
          store.set(countAtom, 1);
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      // Subscriber should have been called before error
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe('Batch with Function Updates', () => {
    it('should handle function updates in batch', () => {
      const countAtom = atom(0);

      batch(() => {
        store.set(countAtom, (prev: number) => prev + 1);
        store.set(countAtom, (prev: number) => prev + 1);
        store.set(countAtom, (prev: number) => prev + 1);
      });

      expect(store.get(countAtom)).toBe(3);
    });

    it('should notify with final value after function updates', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();

      store.subscribe(countAtom, subscriber);

      batch(() => {
        store.set(countAtom, (prev: number) => prev + 1);
        store.set(countAtom, (prev: number) => prev * 2);
        store.set(countAtom, (prev: number) => prev + 10);
      });

      // Each function update triggers notification
      expect(subscriber).toHaveBeenCalledTimes(3);
      expect(subscriber).toHaveBeenLastCalledWith(12);
    });
  });
});

describe('isBatching with store', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    batcher.reset();
  });

  it('should return false outside batch', () => {
    expect(isBatching()).toBe(false);
  });

  it('should return true inside batch', () => {
    let batchingInside = false;
    batch(() => {
      batchingInside = isBatching();
    });
    expect(batchingInside).toBe(true);
  });

  it('should work with store operations', () => {
    const countAtom = atom(0);
    const batchingValues: boolean[] = [];

    batch(() => {
      batchingValues.push(isBatching());
      store.set(countAtom, 1);
      batchingValues.push(isBatching());
    });

    expect(batchingValues).toEqual([true, true]);
  });
});
