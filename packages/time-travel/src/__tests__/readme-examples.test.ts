/**
 * Tests for README examples
 *
 * Purpose:
 * - Verify all code examples in README work correctly
 * - Detect broken API usage before publication
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { TimeTravelController, SimpleTimeTravel } from '../index';

describe('README: Basic Usage', () => {
  it('basic time travel should work', () => {
    const store = createStore();
    const countAtom = atom(0, 'count');
    const nameAtom = atom('', 'name');

    const controller = new TimeTravelController(store, {
      maxHistory: 100,
      autoCapture: true,
    });

    // Initial state
    expect(store.get(countAtom)).toBe(0);

    controller.capture('init');

    store.set(countAtom, 5);
    controller.capture('update-1');

    store.set(countAtom, 10);
    controller.capture('update-2');

    // Navigate through history
    controller.undo();
    expect(store.get(countAtom)).toBe(5);

    controller.undo();
    expect(store.get(countAtom)).toBe(0);
  });
});

describe('README: How capture() Works', () => {
  it('capture should snapshot initialized atoms', () => {
    const atom1 = atom('initial', 'atom1');
    const atom2 = atom(42, 'atom2');

    const store = createStore();
    const controller = new TimeTravelController(store);

    // Ensure atoms are initialized in this store before capturing
    store.get(atom1);
    store.get(atom2);

    // First capture - state is captured as-is
    controller.capture('init');

    expect(store.get(atom1)).toBe('initial');
    expect(store.get(atom2)).toBe(42);
  });
});

describe('README: Using SimpleTimeTravel', () => {
  it('SimpleTimeTravel should work with capture, undo, redo', () => {
    const store = createStore();
    const countAtom = atom(0, 'count');

    const timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 100,
      autoCapture: true,
    });

    store.set(countAtom, 5);
    timeTravel.capture('set-5');

    store.set(countAtom, 10);
    timeTravel.capture('set-10');

    timeTravel.undo();
    expect(store.get(countAtom)).toBe(5);

    timeTravel.redo();
    expect(store.get(countAtom)).toBe(10);
  });
});

describe('README: Compression', () => {
  it('compression should be configurable', () => {
    const store = createStore();
    const countAtom = atom(0, 'count');

    const controller = new TimeTravelController(store, {
      compression: {
        strategy: 'time-based' as const,
        maxAge: 3600000, // 1 hour
      },
    });

    store.set(countAtom, 1);
    controller.capture('init');

    expect(controller.getHistory().length).toBeGreaterThan(0);
  });
});

describe('README: Multiple Stores', () => {
  it('each store should maintain independent timeline', () => {
    const atom1 = atom('initial', 'store1-atom');
    const atom2 = atom('initial', 'store2-atom');

    const store1 = createStore();
    const controller1 = new TimeTravelController(store1);

    const store2 = createStore();
    const controller2 = new TimeTravelController(store2);

    // Initialize atoms in each store
    store1.get(atom1);
    store2.get(atom2);

    // Capture initial state
    controller1.capture('store1-init');
    controller2.capture('store2-init');

    store1.set(atom1, 'store1-value');
    controller1.capture('store1-snapshot');

    store2.set(atom2, 'store2-value');
    controller2.capture('store2-snapshot');

    // Each store has its own history
    expect(controller1.getHistory().length).toBe(2);
    expect(controller2.getHistory().length).toBe(2);

    // store1 and store2 are independent
    expect(store1.get(atom1)).toBe('store1-value');
    expect(store2.get(atom2)).toBe('store2-value');
  });
});

describe('README: Best Practices - Unique Atom Names', () => {
  it('should allow unique atom names', () => {
    const userAtom = atom(null, 'user');
    const userSettingsAtom = atom({}, 'userSettings');
    const themeAtom = atom('light', 'theme');

    const store = createStore();
    expect(store.get(themeAtom)).toBe('light');
  });

  it('should warn about duplicate atom names', () => {
    const warnSpy = vi.fn();
    const originalWarn = console.warn;
    console.warn = warnSpy;

    const atom1 = atom('value1', 'data');
    const atom2 = atom('value2', 'data');

    const store = createStore();
    store.get(atom1);
    store.get(atom2);

    console.warn = originalWarn;

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('already exists')
    );
  });
});

describe('README: API - TimeTravelController methods', () => {
  it('should expose all documented methods', () => {
    const store = createStore();
    const countAtom = atom(0, 'count');

    const controller = new TimeTravelController(store, {
      maxHistory: 100,
      autoCapture: true,
    });

    store.set(countAtom, 1);
    controller.capture('action-1');

    store.set(countAtom, 2);
    controller.capture('action-2');

    // canUndo / canRedo
    expect(controller.canUndo()).toBe(true);
    expect(controller.canRedo()).toBe(false);

    // undo / redo
    controller.undo();
    expect(controller.canUndo()).toBe(false); // At the first snapshot
    expect(controller.canRedo()).toBe(true);

    controller.redo();
    expect(controller.canUndo()).toBe(true);
    expect(controller.canRedo()).toBe(false);

    // jumpTo
    controller.jumpTo(0);

    // getHistory
    expect(controller.getHistory().length).toBeGreaterThan(0);

    // clearHistory
    controller.clearHistory();
    expect(controller.getHistory().length).toBe(0);
  });

  it('subscribe should listen to events', () => {
    const store = createStore();
    const countAtom = atom(0, 'count');
    const controller = new TimeTravelController(store);

    const undoListener = vi.fn();
    controller.subscribe('undo', undoListener);

    store.set(countAtom, 1);
    controller.capture('init');

    store.set(countAtom, 2);
    controller.capture('second');

    controller.undo();

    expect(undoListener).toHaveBeenCalled();
  });
});

describe('README: Effect Suppression', () => {
  it('subscribers should NOT be called during time-travel', async () => {
    const store = createStore();
    const cartAtom = atom({ items: [] }, 'cart');

    const subscriber = vi.fn();
    store.subscribe(cartAtom, subscriber);

    const controller = new TimeTravelController(store, {
      autoCapture: true,
    });

    // Initial state
    store.set(cartAtom, { items: ['item1'] });
    controller.capture('add-item');

    // Clear subscriber calls from capture
    subscriber.mockClear();

    // Perform undo — subscriber should NOT be called
    controller.undo();

    expect(subscriber).not.toHaveBeenCalled();
  });
});
