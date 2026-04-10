import { atom, createStore } from '@nexus-state/core';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { SimpleTimeTravel } from '../../SimpleTimeTravel';

describe('TT-005: restoreSnapshot silent updates', () => {
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

  it('should NOT notify subscribers during undo', () => {
    const testAtom = createTestAtom(0, 'test');
    const subscriber = vi.fn();

    store.subscribe(testAtom, subscriber);

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Capture initial state (value: 0)
    timeTravel.capture('initial');
    expect(subscriber).toHaveBeenCalledTimes(0);

    // Change value (value: 10)
    store.set(testAtom, 10);
    expect(subscriber).toHaveBeenCalledTimes(1);

    // Capture new state
    timeTravel.capture('step1');

    // Undo - should NOT notify subscriber
    timeTravel.undo();
    expect(subscriber).toHaveBeenCalledTimes(1); // Still 1, not 2

    // Verify value was restored
    expect(store.get(testAtom)).toBe(0);
  });

  it('should NOT notify subscribers during redo', () => {
    const testAtom = createTestAtom(0, 'test');
    const subscriber = vi.fn();

    store.subscribe(testAtom, subscriber);

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Setup: capture 0 -> set 10 -> capture 10 -> set 20 -> capture 20
    timeTravel.capture('initial'); // captures 0
    store.set(testAtom, 10);
    timeTravel.capture('step1'); // captures 10
    store.set(testAtom, 20);
    timeTravel.capture('step2'); // captures 20

    expect(subscriber).toHaveBeenCalledTimes(2);

    // Undo twice
    timeTravel.undo(); // back to 10
    expect(store.get(testAtom)).toBe(10);
    timeTravel.undo(); // back to 0
    expect(store.get(testAtom)).toBe(0);
    expect(subscriber).toHaveBeenCalledTimes(2); // No new calls

    // Redo - should NOT notify subscriber
    timeTravel.redo(); // to 10
    expect(subscriber).toHaveBeenCalledTimes(2); // Still 2

    // Verify value was restored
    expect(store.get(testAtom)).toBe(10);
  });

  it('should NOT notify subscribers during jumpTo', () => {
    const testAtom = createTestAtom(0, 'test');
    const subscriber = vi.fn();

    store.subscribe(testAtom, subscriber);

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Setup: capture 0 -> set 10 -> capture 10 -> set 20 -> capture 20 -> set 30 -> capture 30
    timeTravel.capture('initial'); // captures 0
    store.set(testAtom, 10);
    timeTravel.capture('step1'); // captures 10
    store.set(testAtom, 20);
    timeTravel.capture('step2'); // captures 20
    store.set(testAtom, 30);
    timeTravel.capture('step3'); // captures 30

    expect(subscriber).toHaveBeenCalledTimes(3);

    // Jump to middle - should NOT notify subscriber
    timeTravel.jumpTo(1); // Jump to step1 (value: 10)
    expect(subscriber).toHaveBeenCalledTimes(3); // Still 3

    // Verify value was restored
    expect(store.get(testAtom)).toBe(10);
  });

  it('should properly restore computed atoms', () => {
    const countAtom = createTestAtom(0, 'count');
    const doubleAtom = atom((get) => get(countAtom) * 2, `double-${atomCounter++}`);

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('initial');
    expect(store.get(doubleAtom)).toBe(0);

    store.set(countAtom, 5);
    timeTravel.capture('step1');
    expect(store.get(doubleAtom)).toBe(10);

    store.set(countAtom, 10);
    timeTravel.capture('step2');
    expect(store.get(doubleAtom)).toBe(20);

    // Undo - should restore both count and double
    timeTravel.undo();
    expect(store.get(countAtom)).toBe(5);
    expect(store.get(doubleAtom)).toBe(10); // Computed should be re-evaluated
  });

  it('should handle multiple atoms silently', () => {
    const atom1 = createTestAtom(0, 'atom1');
    const atom2 = createTestAtom('', 'atom2');
    const atom3 = createTestAtom(false, 'atom3');

    const sub1 = vi.fn();
    const sub2 = vi.fn();
    const sub3 = vi.fn();

    store.subscribe(atom1, sub1);
    store.subscribe(atom2, sub2);
    store.subscribe(atom3, sub3);

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('initial');

    store.set(atom1, 10);
    store.set(atom2, 'hello');
    store.set(atom3, true);

    timeTravel.capture('step1');

    expect(sub1).toHaveBeenCalledTimes(1);
    expect(sub2).toHaveBeenCalledTimes(1);
    expect(sub3).toHaveBeenCalledTimes(1);

    // Undo
    timeTravel.undo();

    // No new notifications
    expect(sub1).toHaveBeenCalledTimes(1);
    expect(sub2).toHaveBeenCalledTimes(1);
    expect(sub3).toHaveBeenCalledTimes(1);

    // Values restored
    expect(store.get(atom1)).toBe(0);
    expect(store.get(atom2)).toBe('');
    expect(store.get(atom3)).toBe(false);
  });

  it('should reset isTraveling flag after undo', () => {
    const testAtom = createTestAtom(0, 'test');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    timeTravel.capture('initial');

    expect(timeTravel.isTraveling()).toBe(false);

    store.set(testAtom, 10);
    timeTravel.capture('step1');

    timeTravel.undo();

    // Flag should be reset after undo completes
    expect(timeTravel.isTraveling()).toBe(false);
  });
});
