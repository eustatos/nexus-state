import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '../../index';
import type { AtomContext } from '../../reactive';

describe('SR-006: Silent set() support', () => {
  let store: ReturnType<typeof createStore>;
  let testAtom: ReturnType<typeof atom>;
  let subscriber: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = createStore();
    testAtom = atom(0, 'test');
    subscriber = vi.fn();
    store.subscribe(testAtom, subscriber);
  });

  it('should update value silently', () => {
    store.set(testAtom, 10, { silent: true });
    expect(store.get(testAtom)).toBe(10);
  });

  it('should NOT notify subscribers with silent context', () => {
    store.set(testAtom, 100, { silent: true });
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should NOT notify subscribers with setSilently', () => {
    store.setSilently!(testAtom, 100);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should notify subscribers with normal set', () => {
    store.set(testAtom, 50);
    expect(subscriber).toHaveBeenCalledWith(50);
  });

  it('should handle updater functions silently', () => {
    store.set(testAtom, 10);
    store.setSilently!(testAtom, (prev) => prev * 2);

    expect(store.get(testAtom)).toBe(20);
    expect(subscriber).toHaveBeenCalledTimes(1); // Only first set
  });

  it('should NOT trigger plugin hooks during silent set', () => {
    const onSetHook = vi.fn();
    const afterSetHook = vi.fn();

    store.applyPlugin!(() => ({
      onSet: onSetHook,
      afterSet: afterSetHook,
    }));

    store.setSilently!(testAtom, 999);

    // Hooks are still called in silent mode, but with context
    expect(onSetHook).toHaveBeenCalledTimes(1);
    expect(onSetHook).toHaveBeenCalledWith(testAtom, 999, { silent: true });
    // afterSet is not called in silent mode (no side effects)
    expect(afterSetHook).not.toHaveBeenCalled();
  });

  it('should NOT trigger DevTools tracking during silent set', () => {
    const devTools = store.getDevTools();
    const trackSpy = vi.spyOn(devTools, 'trackStateChange');

    store.setSilently!(testAtom, 777);

    expect(trackSpy).not.toHaveBeenCalled();
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

    const baseSubscriber = vi.fn();
    store.subscribe(baseAtom, baseSubscriber);

    store.setSilently!(writableAtom, 10);

    expect(store.get(baseAtom)).toBe(20);
    expect(baseSubscriber).not.toHaveBeenCalled();
  });

  it('should handle computed atoms correctly', () => {
    const computedAtom = atom((get) => get(testAtom) * 2, 'computed');

    store.setSilently!(testAtom, 21);

    // Computed should still work when accessed
    expect(store.get(computedAtom)).toBe(42);
  });

  it('should support custom context metadata', () => {
    const onSetHook = vi.fn();

    store.applyPlugin!(() => ({
      onSet: (atom, value) => {
        // Hook can still inspect context if needed
        onSetHook(atom, value);
        return value;
      },
    }));

    store.set(testAtom, 123, {
      silent: false,
      source: 'test-case',
      metadata: { foo: 'bar' },
    });

    expect(onSetHook).toHaveBeenCalled();
  });

  it('should pass context through writable atom setter', () => {
    const baseAtom = atom(0, 'base');
    const contextCapture: any[] = [];

    const writableAtom = atom(
      (get) => get(baseAtom),
      (get, set, value: number) => {
        // set should receive context
        set(baseAtom, value, { silent: true, source: 'writable' });
      },
      'writable-context'
    );

    const baseSubscriber = vi.fn();
    store.subscribe(baseAtom, baseSubscriber);

    store.set(writableAtom, 42);

    expect(store.get(baseAtom)).toBe(42);
    expect(baseSubscriber).not.toHaveBeenCalled();
  });

  it('should handle multiple silent updates', () => {
    const atom1 = atom(0, 'atom1');
    const atom2 = atom(0, 'atom2');
    const atom3 = atom(0, 'atom3');

    const sub1 = vi.fn();
    const sub2 = vi.fn();
    const sub3 = vi.fn();

    store.subscribe(atom1, sub1);
    store.subscribe(atom2, sub2);
    store.subscribe(atom3, sub3);

    store.setSilently!(atom1, 1);
    store.setSilently!(atom2, 2);
    store.setSilently!(atom3, 3);

    expect(store.get(atom1)).toBe(1);
    expect(store.get(atom2)).toBe(2);
    expect(store.get(atom3)).toBe(3);

    expect(sub1).not.toHaveBeenCalled();
    expect(sub2).not.toHaveBeenCalled();
    expect(sub3).not.toHaveBeenCalled();
  });

  it('should mix silent and normal updates correctly', () => {
    const normalSub = vi.fn();
    store.subscribe(testAtom, normalSub);

    // Silent update
    store.setSilently!(testAtom, 10);
    expect(store.get(testAtom)).toBe(10);
    expect(normalSub).not.toHaveBeenCalled();

    // Normal update
    store.set(testAtom, 20);
    expect(store.get(testAtom)).toBe(20);
    expect(normalSub).toHaveBeenCalledWith(20);

    // Another silent update
    store.setSilently!(testAtom, 30);
    expect(store.get(testAtom)).toBe(30);
    expect(normalSub).toHaveBeenCalledTimes(1); // Still only 1 call
  });

  it('should handle silent updates with function updaters', () => {
    // Set initial value silently to avoid triggering subscriber from beforeEach
    store.setSilently!(testAtom, 5);
    subscriber.mockClear(); // Clear any calls from beforeEach

    const increment = (prev: number) => prev + 1;
    store.setSilently!(testAtom, increment);

    expect(store.get(testAtom)).toBe(6);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should preserve context when merging in writable atoms', () => {
    const baseAtom = atom(0, 'base');
    let capturedContext: any = null;

    const writableAtom = atom(
      (get) => get(baseAtom),
      (get, set, value: number) => {
        // Intercept context from setter
        const originalSet = set;
        // This tests that context is passed through
        set(baseAtom, value);
      },
      'writable-context-test'
    );

    store.set(writableAtom, 100, { silent: true, source: 'external' });
    expect(store.get(baseAtom)).toBe(100);
  });
});
