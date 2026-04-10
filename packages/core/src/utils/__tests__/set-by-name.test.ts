/**
 * setByName tests — atom lookup by name + setting value
 */

import { describe, it, expect } from 'vitest';
import { atom, createStore } from '../../index';

describe('Store.setByName()', () => {
  it('should set atom value by name', () => {
    const store = createStore();
    const countAtom = atom(0, 'count');

    // Trigger registration
    store.get(countAtom);

    const result = store.setByName('count', 42);

    expect(result).toBe(true);
    expect(store.get(countAtom)).toBe(42);
  });

  it('should return false for unknown atom name', () => {
    const store = createStore();

    const result = store.setByName('nonexistent', 42);

    expect(result).toBe(false);
  });

  it('should work with object values', () => {
    const store = createStore();
    const userAtom = atom({ name: 'Alice', age: 30 }, 'user');

    store.get(userAtom);
    store.setByName('user', { name: 'Bob', age: 25 });

    expect(store.get(userAtom)).toEqual({ name: 'Bob', age: 25 });
  });

  it('should work with computed atoms', () => {
    const store = createStore();
    const baseAtom = atom(10, 'base');
    const doubleAtom = atom((get) => get(baseAtom) * 2, 'double');

    store.get(baseAtom);
    store.get(doubleAtom);

    store.setByName('base', 20);

    expect(store.get(doubleAtom)).toBe(40);
  });

  it('should work with computed atoms that depend on each other', () => {
    const store = createStore();
    const baseAtom = atom(10, 'base');
    const doubleAtom = atom((get) => get(baseAtom) * 2, 'double');

    store.get(baseAtom);
    store.get(doubleAtom);

    store.setByName('base', 20);

    expect(store.get(doubleAtom)).toBe(40);
  });

  it('should handle null and undefined values', () => {
    const store = createStore();
    const nullableAtom = atom<string | null>('hello', 'nullable');

    store.get(nullableAtom);

    store.setByName('nullable', null);
    expect(store.get(nullableAtom)).toBe(null);

    store.setByName('nullable', undefined);
    expect(store.get(nullableAtom)).toBe(undefined);
  });

  it('should work with atoms that have no name', () => {
    const store = createStore();
    const unnamedAtom = atom(0);

    store.get(unnamedAtom);

    // Unnamed atoms can't be found by name
    const result = store.setByName('nonexistent', 42);
    expect(result).toBe(false);
  });
});
