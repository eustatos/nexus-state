/**
 * Tests for lazy atom registration
 * Atoms are registered in the store's ScopedRegistry on first access.
 * This file tests registration behavior using store methods instead of global registry.
 */

import { describe, it, expect } from 'vitest';
import { atom, createStore } from '@nexus-state/core';

/** Check if atom is registered in store */
function isRegistered(store: ReturnType<typeof createStore>, atomId: symbol): boolean {
  return store.getRegistryAtoms().includes(atomId);
}

/** Count of registered atoms in store */
function countRegistered(store: ReturnType<typeof createStore>): number {
  return store.getRegistryAtoms().length;
}

describe('Lazy Atom Registration', () => {
  describe('Anonymous primitive atom (lazy registration)', () => {
    it('should NOT register anonymous atom on creation', () => {
      const store = createStore();
      const countAtom = atom(0); // No name = lazy registration

      expect(isRegistered(store, countAtom.id)).toBe(false);
    });

    it('should register anonymous atom on first get()', () => {
      const store = createStore();
      const countAtom = atom(0);

      expect(isRegistered(store, countAtom.id)).toBe(false);

      store.get(countAtom);

      expect(isRegistered(store, countAtom.id)).toBe(true);
      expect(countRegistered(store)).toBe(1);
    });

    it('should register anonymous atom on first set()', () => {
      const store = createStore();
      const countAtom = atom(0);

      expect(isRegistered(store, countAtom.id)).toBe(false);

      store.set(countAtom, 5);

      expect(isRegistered(store, countAtom.id)).toBe(true);
      expect(countRegistered(store)).toBe(1);
    });

    it('should NOT re-register on subsequent accesses', () => {
      const store = createStore();
      const countAtom = atom(0);

      store.get(countAtom);
      const firstCount = countRegistered(store);

      store.get(countAtom);
      store.get(countAtom);

      // Count should not increase
      expect(countRegistered(store)).toBe(firstCount);
    });

    it('should track access count', () => {
      const store = createStore();
      const countAtom = atom(0);

      store.get(countAtom);
      store.get(countAtom);
      store.set(countAtom, 5);
      store.get(countAtom);

      expect((countAtom as any)._lazyRegistration?.accessCount).toBe(4);
    });
  });

  describe('Anonymous computed atom (lazy registration)', () => {
    it('should NOT register anonymous atoms on creation', () => {
      const store = createStore();
      const countAtom = atom(0);
      const doubleAtom = atom((get) => get(countAtom) * 2);

      expect(isRegistered(store, countAtom.id)).toBe(false);
      expect(isRegistered(store, doubleAtom.id)).toBe(false);
      expect(countRegistered(store)).toBe(0);
    });

    it('should register anonymous computed atom on first get()', () => {
      const store = createStore();
      const countAtom = atom(0);
      const doubleAtom = atom((get) => get(countAtom) * 2);

      store.get(doubleAtom);

      expect(isRegistered(store, doubleAtom.id)).toBe(true);
      expect(isRegistered(store, countAtom.id)).toBe(true);
    });

    it('should register dependency when accessing computed atom', () => {
      const store = createStore();
      const countAtom = atom(0);
      const doubleAtom = atom((get) => get(countAtom) * 2);

      store.get(doubleAtom);

      expect(isRegistered(store, countAtom.id)).toBe(true);
      expect(isRegistered(store, doubleAtom.id)).toBe(true);
    });
  });

  describe('Anonymous writable atom (lazy registration)', () => {
    it('should NOT register anonymous writable atom on creation', () => {
      const store = createStore();
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, val: number) => set(baseAtom, val)
      );

      expect(isRegistered(store, writableAtom.id)).toBe(false);
      expect(isRegistered(store, baseAtom.id)).toBe(false);
    });

    it('should register anonymous writable atom on first get()', () => {
      const store = createStore();
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, val: number) => set(baseAtom, val)
      );

      store.get(writableAtom);

      expect(isRegistered(store, writableAtom.id)).toBe(true);
      expect(isRegistered(store, baseAtom.id)).toBe(true);
    });

    it('should register anonymous writable atom on first set()', () => {
      const store = createStore();
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, val: number) => set(baseAtom, val)
      );

      store.set(writableAtom, 42);

      expect(isRegistered(store, writableAtom.id)).toBe(true);
      expect(isRegistered(store, baseAtom.id)).toBe(true);
    });
  });

  describe('Named atom (deferred registration)', () => {
    it('should register named atom on first store access (not on creation)', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');

      expect(isRegistered(store, countAtom.id)).toBe(false);
      expect(countRegistered(store)).toBe(0);

      store.get(countAtom);

      expect(isRegistered(store, countAtom.id)).toBe(true);
      expect(countRegistered(store)).toBe(1);
    });

    it('should register named computed atom on first access', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');
      const doubleAtom = atom((get) => get(countAtom) * 2, 'double');

      expect(isRegistered(store, countAtom.id)).toBe(false);
      expect(isRegistered(store, doubleAtom.id)).toBe(false);

      store.get(doubleAtom);

      expect(isRegistered(store, countAtom.id)).toBe(true);
      expect(isRegistered(store, doubleAtom.id)).toBe(true);
    });

    it('should register named writable atom on first access', () => {
      const store = createStore();
      const baseAtom = atom(0, 'base');
      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, val: number) => set(baseAtom, val),
        'writable'
      );

      expect(isRegistered(store, writableAtom.id)).toBe(false);
      expect(isRegistered(store, baseAtom.id)).toBe(false);

      store.get(writableAtom);

      expect(isRegistered(store, writableAtom.id)).toBe(true);
      expect(isRegistered(store, baseAtom.id)).toBe(true);
    });

    it('should handle unicode names', () => {
      const store = createStore();
      const unicodeAtom = atom(0, 'unicode-测试🚀');

      expect(isRegistered(store, unicodeAtom.id)).toBe(false);

      store.get(unicodeAtom);

      expect(isRegistered(store, unicodeAtom.id)).toBe(true);
    });

    it('should handle atoms with special characters in name', () => {
      const store = createStore();
      const specialAtom = atom(0, 'atom@#$%');

      expect(isRegistered(store, specialAtom.id)).toBe(false);

      store.get(specialAtom);

      expect(isRegistered(store, specialAtom.id)).toBe(true);
    });
  });

  describe('Subscribe behavior', () => {
    it('should register anonymous atom on subscribe', () => {
      const store = createStore();
      const countAtom = atom(0);

      expect(isRegistered(store, countAtom.id)).toBe(false);

      store.subscribe(countAtom, () => {});

      expect(isRegistered(store, countAtom.id)).toBe(true);
    });

    it('should register named atom on subscribe (deferred registration)', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');

      expect(isRegistered(store, countAtom.id)).toBe(false);

      store.subscribe(countAtom, () => {});

      expect(isRegistered(store, countAtom.id)).toBe(true);
    });
  });
});
