import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { StoreBasedReactive } from '../StoreBasedReactive';

describe('SR-002: StoreBasedReactive', () => {
  let store: ReturnType<typeof createStore>;
  let testAtom: ReturnType<typeof atom>;
  let reactive: StoreBasedReactive<number>;

  beforeEach(() => {
    store = createStore();
    testAtom = atom(42, 'test');
    reactive = new StoreBasedReactive(store, testAtom);
  });

  describe('getValue()', () => {
    it('should get value from store', () => {
      expect(reactive.getValue()).toBe(42);
    });

    it('should reflect store changes', () => {
      store.set(testAtom, 100);
      expect(reactive.getValue()).toBe(100);
    });

    it('should work with computed atoms', () => {
      const baseAtom = atom(10, 'base');
      const computedAtom = atom((get) => get(baseAtom) * 2, 'computed');
      const computedReactive = new StoreBasedReactive(store, computedAtom);

      expect(computedReactive.getValue()).toBe(20);

      store.set(baseAtom, 20);
      expect(computedReactive.getValue()).toBe(40);
    });
  });

  describe('setValue()', () => {
    it('should set value in store', () => {
      reactive.setValue(999);
      expect(store.get(testAtom)).toBe(999);
    });

    it('should notify subscribers', () => {
      const subscriber = vi.fn();
      reactive.subscribe(subscriber);

      reactive.setValue(123);
      expect(subscriber).toHaveBeenCalledWith(123);
    });

    it('should pass context to store.set() when provided', () => {
      const subscriber = vi.fn();
      reactive.subscribe(subscriber);

      // Set with silent context
      reactive.setValue(456, { silent: true });

      // Value should be set
      expect(store.get(testAtom)).toBe(456);

      // Subscriber should NOT be called with silent: true
      expect(subscriber).not.toHaveBeenCalled();
    });

    it('should handle context metadata', () => {
      const context: any = { source: 'test', metadata: { userId: 123 } };
      reactive.setValue(789, context);

      expect(store.get(testAtom)).toBe(789);
    });

    it('should work with writable atoms', () => {
      const baseAtom = atom(0, 'base');
      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, value: number) => {
          set(baseAtom, value * 2);
        },
        'writable'
      );

      const writableReactive = new StoreBasedReactive(store, writableAtom);
      writableReactive.setValue(10);

      expect(store.get(baseAtom)).toBe(20);
    });
  });

  describe('subscribe()', () => {
    it('should subscribe to store changes', () => {
      const subscriber = vi.fn();
      const unsubscribe = reactive.subscribe(subscriber);

      reactive.setValue(777);
      expect(subscriber).toHaveBeenCalledWith(777);

      unsubscribe();
      reactive.setValue(888);
      expect(subscriber).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle multiple subscribers', () => {
      const sub1 = vi.fn();
      const sub2 = vi.fn();
      const sub3 = vi.fn();

      reactive.subscribe(sub1);
      reactive.subscribe(sub2);
      reactive.subscribe(sub3);

      reactive.setValue(111);

      expect(sub1).toHaveBeenCalledWith(111);
      expect(sub2).toHaveBeenCalledWith(111);
      expect(sub3).toHaveBeenCalledWith(111);
    });

    it('should return working unsubscribe function', () => {
      const subscriber = vi.fn();
      const unsubscribe = reactive.subscribe(subscriber);

      expect(typeof unsubscribe).toBe('function');

      reactive.setValue(1);
      expect(subscriber).toHaveBeenCalledTimes(1);

      unsubscribe();

      reactive.setValue(2);
      expect(subscriber).toHaveBeenCalledTimes(1); // Still 1
    });
  });

  describe('integration with Store', () => {
    it('should work seamlessly with direct store access', () => {
      // Set via reactive
      reactive.setValue(100);
      expect(store.get(testAtom)).toBe(100);

      // Set via store
      store.set(testAtom, 200);
      expect(reactive.getValue()).toBe(200);
    });

    it('should share subscribers with store', () => {
      const reactiveSubscriber = vi.fn();
      const storeSubscriber = vi.fn();

      reactive.subscribe(reactiveSubscriber);
      store.subscribe(testAtom, storeSubscriber);

      reactive.setValue(333);

      expect(reactiveSubscriber).toHaveBeenCalledWith(333);
      expect(storeSubscriber).toHaveBeenCalledWith(333);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid updates', () => {
      for (let i = 0; i < 100; i++) {
        reactive.setValue(i);
      }
      expect(reactive.getValue()).toBe(99);
    });

    it('should handle same value updates', () => {
      const subscriber = vi.fn();
      reactive.subscribe(subscriber);

      reactive.setValue(42); // Same as initial
      reactive.setValue(42);
      reactive.setValue(42);

      // Should still notify (Store behavior)
      expect(subscriber).toHaveBeenCalledTimes(3);
    });

    it('should handle undefined values', () => {
      const undefinedAtom = atom<number | undefined>(undefined, 'undefined');
      const undefinedReactive = new StoreBasedReactive(store, undefinedAtom);

      expect(undefinedReactive.getValue()).toBeUndefined();

      undefinedReactive.setValue(42);
      expect(undefinedReactive.getValue()).toBe(42);

      undefinedReactive.setValue(undefined);
      expect(undefinedReactive.getValue()).toBeUndefined();
    });
  });

  describe('getStore() and getAtom()', () => {
    it('should return the underlying store', () => {
      expect(reactive.getStore()).toBe(store);
    });

    it('should return the underlying atom', () => {
      expect(reactive.getAtom()).toBe(testAtom);
    });
  });
});
