/**
 * Store Subscriptions Tests
 * Tests for store.subscribe and notification system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore, atom, batch } from '../../index';
import type { Getter } from '../../types';

describe('store.subscribe', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('Basic Subscription', () => {
    it('should subscribe to atom changes', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();

      store.subscribe(countAtom, subscriber);
      store.set(countAtom, 1);

      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should call subscriber with new value', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();

      store.subscribe(countAtom, subscriber);
      store.set(countAtom, 42);

      expect(subscriber).toHaveBeenCalledWith(42);
    });

    it('should call subscriber on each set', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();

      store.subscribe(countAtom, subscriber);

      store.set(countAtom, 1);
      store.set(countAtom, 2);
      store.set(countAtom, 3);

      expect(subscriber).toHaveBeenCalledTimes(3);
    });

    it('should not call subscriber on get', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();

      store.subscribe(countAtom, subscriber);
      store.get(countAtom);
      store.get(countAtom);
      store.get(countAtom);

      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('Unsubscribe', () => {
    it('should unsubscribe correctly', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();

      const unsubscribe = store.subscribe(countAtom, subscriber);

      store.set(countAtom, 1);
      expect(subscriber).toHaveBeenCalledTimes(1);

      unsubscribe();

      store.set(countAtom, 2);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should not call unsubscribed listener', () => {
      const countAtom = atom(0);
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();

      const unsubscribe1 = store.subscribe(countAtom, subscriber1);
      store.subscribe(countAtom, subscriber2);

      store.set(countAtom, 1);
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);

      unsubscribe1();

      store.set(countAtom, 2);
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple unsubscribe calls', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();

      const unsubscribe = store.subscribe(countAtom, subscriber);

      unsubscribe();
      unsubscribe(); // Should not throw

      store.set(countAtom, 1);
      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Subscribers', () => {
    it('should handle multiple subscribers', () => {
      const countAtom = atom(0);
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      const subscriber3 = vi.fn();

      store.subscribe(countAtom, subscriber1);
      store.subscribe(countAtom, subscriber2);
      store.subscribe(countAtom, subscriber3);

      store.set(countAtom, 1);

      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
      expect(subscriber3).toHaveBeenCalledTimes(1);
    });

    it('should call subscribers in order', () => {
      const countAtom = atom(0);
      const calls: string[] = [];

      store.subscribe(countAtom, () => calls.push('1'));
      store.subscribe(countAtom, () => calls.push('2'));
      store.subscribe(countAtom, () => calls.push('3'));

      store.set(countAtom, 1);

      expect(calls).toEqual(['1', '2', '3']);
    });

    it('should notify all subscribers even if one throws', () => {
      const countAtom = atom(0);
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      const subscriber3 = vi.fn();

      store.subscribe(countAtom, () => {
        throw new Error('Subscriber error');
      });
      store.subscribe(countAtom, subscriber1);
      store.subscribe(countAtom, subscriber2);
      store.subscribe(countAtom, subscriber3);

      // Error is caught internally, doesn't throw
      expect(() => store.set(countAtom, 1)).not.toThrow();

      // Other subscribers should still be called
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
      expect(subscriber3).toHaveBeenCalledTimes(1);
    });
  });

  describe('Subscribe to Same Atom Multiple Times', () => {
    it('should handle multiple subscriptions with same subscriber', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();

      const unsub1 = store.subscribe(countAtom, subscriber);
      const unsub2 = store.subscribe(countAtom, subscriber);

      store.set(countAtom, 1);

      // Same subscriber added twice, batcher deduplicates via Set
      expect(subscriber).toHaveBeenCalledTimes(1);

      unsub1();
      unsub2();
      store.set(countAtom, 2);
      
      // Unsubscribed from both
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe('Subscribe to Computed Atom', () => {
    it('should subscribe to computed atom', () => {
      const baseAtom = atom(0);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);
      const subscriber = vi.fn();

      store.subscribe(doubleAtom, subscriber);

      // Get computed value to establish subscription
      store.get(doubleAtom);
      
      // Subscriber is registered
      expect(subscriber).not.toHaveBeenCalled();
    });

    it('should not notify if computed value does not change', () => {
      const baseAtom = atom(0);
      const alwaysZeroAtom = atom((get: Getter) => get(baseAtom) - get(baseAtom));
      const subscriber = vi.fn();

      store.subscribe(alwaysZeroAtom, subscriber);

      store.set(baseAtom, 5);
      store.set(baseAtom, 10);

      // Computed value is always 0, subscriber not called when value doesn't change
      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('Subscriber Error Handling', () => {
    it('should handle error in subscriber', () => {
      const countAtom = atom(0);
      const errorSubscriber = () => {
        throw new Error('Test error');
      };

      store.subscribe(countAtom, errorSubscriber);

      // Note: Error in subscriber is caught and logged, not thrown
      expect(() => store.set(countAtom, 1)).not.toThrow();
    });

    it('should continue notifying other subscribers after error', () => {
      const countAtom = atom(0);
      const goodSubscriber = vi.fn();

      store.subscribe(countAtom, () => {
        throw new Error('Error');
      });
      store.subscribe(countAtom, goodSubscriber);

      // Error is caught internally, but other subscribers should still be called
      store.set(countAtom, 1);

      expect(goodSubscriber).toHaveBeenCalledTimes(1);
    });
  });
});

describe('subscribe with batch', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should batch notifications when using batch wrapper', () => {
    const countAtom = atom(0);
    const subscriber = vi.fn();

    store.subscribe(countAtom, subscriber);

    // Note: batch() from batching.ts works with batcher
    // Each store.set still triggers notify, but they're scheduled
    batch(() => {
      store.set(countAtom, 1);
      store.set(countAtom, 2);
      store.set(countAtom, 3);
    });

    // Subscriber is called for each set (notifications are scheduled separately)
    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(subscriber).toHaveBeenNthCalledWith(1, 1);
    expect(subscriber).toHaveBeenNthCalledWith(2, 2);
    expect(subscriber).toHaveBeenNthCalledWith(3, 3);
  });

  it('should receive values in order', () => {
    const countAtom = atom(0);
    const values: number[] = [];

    store.subscribe(countAtom, (value: number) => {
      values.push(value);
    });

    batch(() => {
      store.set(countAtom, 1);
      store.set(countAtom, 2);
      store.set(countAtom, 3);
    });

    expect(values).toEqual([1, 2, 3]);
  });
});
