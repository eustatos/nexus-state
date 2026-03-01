// Tests for @nexus-state/middleware
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore, Store } from '@nexus-state/core';
import { middleware } from '../index';

describe('middleware', () => {
  let store: ReturnType<typeof createStore>;
  let testAtom: ReturnType<typeof atom<number>>;

  beforeEach(() => {
    store = createStore();
    testAtom = atom(0);
  });

  it('should apply middleware to an atom', () => {
    const middlewareFn = middleware(testAtom, {
      beforeSet: vi.fn(),
      afterSet: vi.fn(),
    });

    store.applyPlugin(middlewareFn);

    store.set(testAtom, 5);

    expect(store.get(testAtom)).toBe(5);
  });

  it('should call beforeSet before updating value', () => {
    const beforeSetSpy = vi.fn((atom, value) => value);

    const middlewareFn = middleware(testAtom, {
      beforeSet: beforeSetSpy,
    });

    store.applyPlugin(middlewareFn);
    store.set(testAtom, 10);

    expect(beforeSetSpy).toHaveBeenCalledTimes(1);
    expect(beforeSetSpy).toHaveBeenCalledWith(testAtom, 10);
    expect(store.get(testAtom)).toBe(10);
  });

  it('should call afterSet after updating value', () => {
    const afterSetSpy = vi.fn();

    const middlewareFn = middleware(testAtom, {
      afterSet: afterSetSpy,
    });

    store.applyPlugin(middlewareFn);
    store.set(testAtom, 15);

    expect(afterSetSpy).toHaveBeenCalledTimes(1);
    expect(afterSetSpy).toHaveBeenCalledWith(testAtom, 15);
  });

  it('should allow beforeSet to modify the value', () => {
    const middlewareFn = middleware(testAtom, {
      beforeSet: (atom, value) => value * 2,
    });

    store.applyPlugin(middlewareFn);
    store.set(testAtom, 5);

    expect(store.get(testAtom)).toBe(10);
  });

  it('should work with function updates', () => {
    const beforeSetSpy = vi.fn((atom, value) => value);

    const middlewareFn = middleware(testAtom, {
      beforeSet: beforeSetSpy,
    });

    store.applyPlugin(middlewareFn);
    store.set(testAtom, (prev) => prev + 5);

    expect(store.get(testAtom)).toBe(5);
    expect(beforeSetSpy).toHaveBeenCalledWith(testAtom, 5);
  });

  it('should not affect other atoms', () => {
    const otherAtom = atom(100);
    const beforeSetSpy = vi.fn();

    const middlewareFn = middleware(testAtom, {
      beforeSet: beforeSetSpy,
    });

    store.applyPlugin(middlewareFn);
    store.set(otherAtom, 200);

    expect(beforeSetSpy).not.toHaveBeenCalled();
    expect(store.get(otherAtom)).toBe(200);
    expect(store.get(testAtom)).toBe(0);
  });

  it('should call both beforeSet and afterSet in correct order', () => {
    const calls: string[] = [];

    const middlewareFn = middleware(testAtom, {
      beforeSet: () => calls.push('before'),
      afterSet: () => calls.push('after'),
    });

    store.applyPlugin(middlewareFn);
    store.set(testAtom, 25);

    expect(calls).toEqual(['before', 'after']);
  });

  it('should handle multiple middleware on the same atom', () => {
    const middleware1 = middleware(testAtom, {
      beforeSet: (atom, value) => value + 1,
    });

    const middleware2 = middleware(testAtom, {
      beforeSet: (atom, value) => value * 2,
    });

    store.applyPlugin(middleware1);
    store.applyPlugin(middleware2);

    store.set(testAtom, 5);

    // The last applied middleware wraps the previous one
    // So middleware2 runs last: 5 * 2 = 10, then + 1 = 11
    expect(store.get(testAtom)).toBe(11);
  });

  it('should handle afterSet with value verification', () => {
    const loggedValues: number[] = [];

    const middlewareFn = middleware(testAtom, {
      afterSet: (atom, value) => {
        loggedValues.push(value);
      },
    });

    store.applyPlugin(middlewareFn);

    store.set(testAtom, 10);
    store.set(testAtom, 20);
    store.set(testAtom, 30);

    expect(loggedValues).toEqual([10, 20, 30]);
  });

  it('should handle beforeSet that returns undefined (no modification)', () => {
    const middlewareFn = middleware(testAtom, {
      beforeSet: (atom, value) => {
        // Return undefined to not modify the value
        return undefined;
      },
    });

    store.applyPlugin(middlewareFn);
    store.set(testAtom, 42);

    expect(store.get(testAtom)).toBe(42);
  });

  it('should work with object values', () => {
    type State = { count: number; name: string };
    const objectAtom = atom<State>({ count: 0, name: 'test' });

    const beforeSetSpy = vi.fn((atom, value) => value);

    const middlewareFn = middleware(objectAtom, {
      beforeSet: beforeSetSpy,
    });

    store.applyPlugin(middlewareFn);
    store.set(objectAtom, { count: 5, name: 'updated' });

    expect(beforeSetSpy).toHaveBeenCalled();
    expect(store.get(objectAtom)).toEqual({ count: 5, name: 'updated' });
  });

  it('should handle function updates with middleware transformation', () => {
    const middlewareFn = middleware(testAtom, {
      beforeSet: (atom, value) => value + 10,
    });

    store.applyPlugin(middlewareFn);

    // Start with initial value 0
    store.set(testAtom, 5); // beforeSet adds 10, result is 15
    store.set(testAtom, (prev) => prev + 1); // prev is 15, +1 = 16, beforeSet adds 10 = 26

    expect(store.get(testAtom)).toBe(26);
  });
});

describe('middleware with multiple atoms', () => {
  let store: ReturnType<typeof createStore>;
  let atom1: ReturnType<typeof atom<number>>;
  let atom2: ReturnType<typeof atom<number>>;

  beforeEach(() => {
    store = createStore();
    atom1 = atom(0);
    atom2 = atom(0);
  });

  it('should only apply middleware to specified atom', () => {
    const middlewareFn = middleware(atom1, {
      beforeSet: (atom, value) => value * 2,
    });

    store.applyPlugin(middlewareFn);

    store.set(atom1, 5);
    store.set(atom2, 5);

    expect(store.get(atom1)).toBe(10);
    expect(store.get(atom2)).toBe(5);
  });

  it('should support different middleware for different atoms', () => {
    const middleware1 = middleware(atom1, {
      beforeSet: (atom, value) => value * 2,
    });

    const middleware2 = middleware(atom2, {
      beforeSet: (atom, value) => value + 10,
    });

    store.applyPlugin(middleware1);
    store.applyPlugin(middleware2);

    store.set(atom1, 5);
    store.set(atom2, 5);

    expect(store.get(atom1)).toBe(10);
    expect(store.get(atom2)).toBe(15);
  });
});
