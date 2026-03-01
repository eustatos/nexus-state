// Tests for @nexus-state/family
import { beforeEach, describe, expect, it } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { atomFamily, atomWithFamily } from '../index';

describe('atomFamily', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should create a family of atoms with parameters', () => {
    const userAtomFamily = atomFamily((_id: number) =>
      atom(`User ${_id}`)
    );

    const user1 = userAtomFamily(1);
    const user2 = userAtomFamily(2);

    expect(store.get(user1)).toBe('User 1');
    expect(store.get(user2)).toBe('User 2');
  });

  it('should cache atoms for the same parameter', () => {
    const counterAtomFamily = atomFamily((id: string) =>
      atom(id)
    );

    const counter1 = counterAtomFamily('a');
    const counter1Again = counterAtomFamily('a');

    // Same parameter should return cached atom
    expect(counter1).toBe(counter1Again);

    // Different parameter should return new atom
    const counter2 = counterAtomFamily('b');
    expect(counter1).not.toBe(counter2);

    // Update one atom
    store.set(counter1, 5);
    expect(store.get(counter1)).toBe(5);
    expect(store.get(counter1Again)).toBe(5); // Same atom, so updated
    expect(store.get(counter2)).toBe(0); // Different atom, unchanged
  });

  it('should handle complex parameters', () => {
    const todoAtomFamily = atomFamily((_userId: number, _todoId: number) =>
      atom({ userId: _userId, todoId: _todoId, title: 'Todo' })
    );

    const todo1 = todoAtomFamily(1, 1);
    const todo2 = todoAtomFamily(1, 2);
    const todo3 = todoAtomFamily(2, 1);

    expect(store.get(todo1)).toEqual({ userId: 1, todoId: 1, title: 'Todo' });
    expect(store.get(todo2)).toEqual({ userId: 1, todoId: 2, title: 'Todo' });
    expect(store.get(todo3)).toEqual({ userId: 2, todoId: 1, title: 'Todo' });

    // Verify caching with complex params
    expect(todoAtomFamily(1, 1)).toBe(todo1);
  });

  it('should allow updating atoms in family', () => {
    const itemAtomFamily = atomFamily((_id: number) =>
      atom({ id: _id, value: 0 })
    );

    const item1 = itemAtomFamily(1);
    
    store.set(item1, { id: 1, value: 10 });
    expect(store.get(item1)).toEqual({ id: 1, value: 10 });

    store.set(item1, (prev) => ({ ...prev, value: prev.value + 5 }));
    expect(store.get(item1)).toEqual({ id: 1, value: 15 });
  });

  it('should work with computed atoms', () => {
    const baseAtom = atom(5);
    
    const derivedAtomFamily = atomFamily((multiplier: number) =>
      atom((get) => get(baseAtom) * multiplier)
    );

    const doubleAtom = derivedAtomFamily(2);
    const tripleAtom = derivedAtomFamily(3);

    expect(store.get(doubleAtom)).toBe(10);
    expect(store.get(tripleAtom)).toBe(15);

    // Update base atom
    store.set(baseAtom, 10);
    expect(store.get(doubleAtom)).toBe(20);
    expect(store.get(tripleAtom)).toBe(30);
  });
});

describe('atomWithFamily', () => {
  it('should provide family method on atom', () => {
    const store = createStore();
    const userAtomFamily = atomWithFamily.family((_id: number) =>
      atom(`User ${_id}`)
    );

    const user = userAtomFamily(123);
    expect(store.get(user)).toBe('User 123');
  });
});

describe('integration with core', () => {
  it('should work with store isolation', () => {
    const counterFamily = atomFamily((id: string) =>
      atom(id)
    );

    const store1 = createStore();
    const store2 = createStore();

    const counterA = counterFamily('a');

    store1.set(counterA, 5);
    store2.set(counterA, 10);

    expect(store1.get(counterA)).toBe(5);
    expect(store2.get(counterA)).toBe(10);
  });

  it('should handle many atoms in family', () => {
    const store = createStore();
    const itemFamily = atomFamily((index: number) =>
      atom(index)
    );

    const atoms = Array.from({ length: 100 }, (_, i) => itemFamily(i));

    atoms.forEach((atom, i) => {
      store.set(atom, i * 10);
    });

    atoms.forEach((atom, i) => {
      expect(store.get(atom)).toBe(i * 10);
    });
  });
});
