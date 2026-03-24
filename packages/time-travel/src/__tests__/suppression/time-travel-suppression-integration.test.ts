import { atom, createStore } from '@nexus-state/core';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { SimpleTimeTravel } from '../../SimpleTimeTravel';

describe('Time Travel Suppression Integration', () => {
  let store: ReturnType<typeof createStore>;
  let timeTravel: SimpleTimeTravel;
  let atomCounter = 0;

  beforeEach(() => {
    store = createStore();
    atomCounter = 0;
  });

  const createTestAtom = <T>(initialValue: T, name: string) => {
    return atom(initialValue, `${name}-${atomCounter++}`);
  };

  it('should handle e-commerce cart scenario', () => {
    const cartAtom = createTestAtom<any[]>([], 'cart');
    const totalAtom = atom((get) => {
      const cart = get(cartAtom);
      return cart.reduce((sum: number, item: any) => sum + item.price, 0);
    }, `total-${atomCounter++}`);

    const notifications: string[] = [];

    // Subscribe to cart changes (simulating effect)
    store.subscribe(cartAtom, (cart) => {
      if (cart.length === 0) {
        notifications.push('Cart is empty');
      }
    });

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('initial');
    expect(notifications).toHaveLength(0);

    store.set(cartAtom, [{ id: 1, name: 'Laptop', price: 999 }]);
    timeTravel.capture('add-item');
    expect(notifications).toHaveLength(0);

    store.set(cartAtom, []);
    timeTravel.capture('remove-item');
    expect(notifications).toHaveLength(1); // "Cart is empty"

    // Undo - should NOT trigger notification
    timeTravel.undo();
    expect(notifications).toHaveLength(1); // Still 1, not 2
    expect(store.get(cartAtom)).toHaveLength(1);
    expect(store.get(totalAtom)).toBe(999);
  });

  it('should handle rapid undo/redo without notification spam', () => {
    const testAtom = createTestAtom(0, 'test');
    const subscriber = vi.fn();

    store.subscribe(testAtom, subscriber);
    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('s0');
    store.set(testAtom, 1);
    timeTravel.capture('s1');
    store.set(testAtom, 2);
    timeTravel.capture('s2');
    store.set(testAtom, 3);
    timeTravel.capture('s3');

    expect(subscriber).toHaveBeenCalledTimes(3);

    // Rapid undo/redo
    timeTravel.undo();
    timeTravel.undo();
    timeTravel.redo();
    timeTravel.redo();
    timeTravel.undo();

    // Should NOT have additional notifications
    expect(subscriber).toHaveBeenCalledTimes(3);
  });

  it('should preserve isTraveling flag during nested operations', () => {
    const testAtom = createTestAtom(0, 'test');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    timeTravel.capture('initial');

    expect(timeTravel.isTraveling()).toBe(false);

    store.set(testAtom, 10);
    timeTravel.capture('step1');

    // Manually trigger nested undo
    let travelingDuringNested = false;
    const originalUndo = timeTravel.undo.bind(timeTravel);
    timeTravel.undo = () => {
      const result = originalUndo();
      travelingDuringNested = timeTravel.isTraveling();
      return result;
    };

    originalUndo();

    // Flag should be reset
    expect(timeTravel.isTraveling()).toBe(false);
    expect(travelingDuringNested).toBe(false);
  });

  it('should handle form state scenario', () => {
    const formAtom = createTestAtom(
      { name: '', email: '', age: 0 },
      'form',
    );
    const isValidAtom = atom((get) => {
      const form = get(formAtom);
      return form.name.length > 0 && form.email.includes('@');
    }, `isValid-${atomCounter++}`);

    const validationErrors: string[] = [];

    store.subscribe(formAtom, (form) => {
      if (!form.name) {
        validationErrors.push('Name is required');
      }
      if (!form.email.includes('@')) {
        validationErrors.push('Invalid email');
      }
    });

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Initial state - callback is not called on subscribe
    timeTravel.capture('initial');
    // Set initial state to trigger callback
    store.set(formAtom, { name: '', email: '', age: 0 });
    expect(validationErrors).toHaveLength(2); // Both errors present

    store.set(formAtom, { name: 'John', email: 'john@example.com', age: 30 });
    timeTravel.capture('filled');
    expect(validationErrors).toHaveLength(2); // Still 2 (no new errors)

    // Clear form
    store.set(formAtom, { name: '', email: '', age: 0 });
    timeTravel.capture('cleared');
    expect(validationErrors).toHaveLength(4); // 2 more errors added

    // Undo - should NOT trigger validation callback
    const errorsBeforeUndo = validationErrors.length;
    timeTravel.undo();
    expect(validationErrors).toHaveLength(errorsBeforeUndo); // No new errors
    expect(store.get(formAtom).name).toBe('John');
    expect(store.get(isValidAtom)).toBe(true);
  });

  it('should handle multiple subscribers to same atom', () => {
    const testAtom = createTestAtom(0, 'test');
    const sub1 = vi.fn();
    const sub2 = vi.fn();
    const sub3 = vi.fn();

    store.subscribe(testAtom, sub1);
    store.subscribe(testAtom, sub2);
    store.subscribe(testAtom, sub3);

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('initial');
    store.set(testAtom, 10);
    timeTravel.capture('step1');

    expect(sub1).toHaveBeenCalledTimes(1);
    expect(sub2).toHaveBeenCalledTimes(1);
    expect(sub3).toHaveBeenCalledTimes(1);

    // Undo - should NOT notify any subscriber
    timeTravel.undo();

    expect(sub1).toHaveBeenCalledTimes(1);
    expect(sub2).toHaveBeenCalledTimes(1);
    expect(sub3).toHaveBeenCalledTimes(1);
  });

  it('should handle undo/redo cycle multiple times', () => {
    const testAtom = createTestAtom(0, 'test');
    const subscriber = vi.fn();

    store.subscribe(testAtom, subscriber);
    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Create history: 0 -> 10 -> 20 -> 30
    timeTravel.capture('s0');
    store.set(testAtom, 10);
    timeTravel.capture('s1');
    store.set(testAtom, 20);
    timeTravel.capture('s2');
    store.set(testAtom, 30);
    timeTravel.capture('s3');

    expect(subscriber).toHaveBeenCalledTimes(3);

    // Multiple undo/redo cycles
    for (let i = 0; i < 3; i++) {
      timeTravel.undo();
      timeTravel.undo();
      timeTravel.redo();
      timeTravel.redo();
    }

    // Should NOT have additional notifications
    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(store.get(testAtom)).toBe(30);
  });

  it('should handle computed atoms with dependencies', () => {
    const countAtom = createTestAtom(0, 'count');
    const doubleAtom = atom((get) => get(countAtom) * 2, `double-${atomCounter++}`);
    const tripleAtom = atom((get) => get(countAtom) * 3, `triple-${atomCounter++}`);
    const sumAtom = atom((get) => get(doubleAtom) + get(tripleAtom), `sum-${atomCounter++}`);

    const countSub = vi.fn();

    store.subscribe(countAtom, countSub);

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('initial');
    expect(store.get(sumAtom)).toBe(0);

    store.set(countAtom, 5);
    timeTravel.capture('step1');
    expect(store.get(sumAtom)).toBe(25); // 10 + 15

    store.set(countAtom, 10);
    timeTravel.capture('step2');
    expect(store.get(sumAtom)).toBe(50); // 20 + 30

    // Subscriber should have been called twice (once for each set)
    expect(countSub).toHaveBeenCalledTimes(2);

    // Undo - should NOT notify but should restore values
    timeTravel.undo();

    // Count subscriber should NOT be called during silent restore
    expect(countSub).toHaveBeenCalledTimes(2); // Still 2, no new calls

    expect(store.get(countAtom)).toBe(5);
    expect(store.get(doubleAtom)).toBe(10);
    expect(store.get(tripleAtom)).toBe(15);
    expect(store.get(sumAtom)).toBe(25);
  });
});
