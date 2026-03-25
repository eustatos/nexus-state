/**
 * Tests for lazy atom registration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { atom, createStore, atomRegistry } from '@nexus-state/core';

describe('Lazy Atom Registration', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  describe('Primitive atom', () => {
    it('should NOT register atom on creation', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(false);
    });

    it('should register atom on first get()', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(false);

      store.get(countAtom);

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);
      expect(atomRegistry.size()).toBe(1);
    });

    it('should register atom on first set()', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(false);

      store.set(countAtom, 5);

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);
      expect(atomRegistry.size()).toBe(1);
    });

    it('should NOT re-register on subsequent accesses', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');

      store.get(countAtom);
      const firstRegistrationTime = (countAtom as any)._lazyRegistration?.registeredAt;

      // Wait a bit
      setTimeout(() => {
        store.get(countAtom);
        const secondRegistrationTime = (countAtom as any)._lazyRegistration?.registeredAt;

        // Should be the same (no re-registration)
        expect(firstRegistrationTime).toBe(secondRegistrationTime);
      }, 10);
    });

    it('should track access count', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');

      store.get(countAtom);
      store.get(countAtom);
      store.set(countAtom, 5);
      store.get(countAtom);

      expect((countAtom as any)._lazyRegistration?.accessCount).toBe(4);
    });
  });

  describe('Computed atom', () => {
    it('should NOT register computed atom on creation', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');
      const doubleAtom = atom((get) => get(countAtom) * 2, 'double');

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(false);
      expect(atomRegistry.isRegistered(doubleAtom.id)).toBe(false);
      expect(atomRegistry.size()).toBe(0);
    });

    it('should register computed atom on first get()', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');
      const doubleAtom = atom((get) => get(countAtom) * 2, 'double');

      store.get(doubleAtom);

      expect(atomRegistry.isRegistered(doubleAtom.id)).toBe(true);
      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);
    });

    it('should register dependency when accessing computed atom', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');
      const doubleAtom = atom((get) => get(countAtom) * 2, 'double');

      store.get(doubleAtom);

      // Both atoms should be registered
      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);
      expect(atomRegistry.isRegistered(doubleAtom.id)).toBe(true);
    });
  });

  describe('Writable atom', () => {
    it('should NOT register writable atom on creation', () => {
      const store = createStore();
      const countAtom = atom(
        (get) => get({} as any),
        (get, set, val: number) => set({} as any, val),
        'counter'
      );

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(false);
    });

    it('should register writable atom on first get()', () => {
      const store = createStore();
      const baseAtom = atom(0, 'base');
      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, val: number) => set(baseAtom, val),
        'writable'
      );

      expect(atomRegistry.isRegistered(writableAtom.id)).toBe(false);
      expect(atomRegistry.isRegistered(baseAtom.id)).toBe(false);

      store.get(writableAtom);

      expect(atomRegistry.isRegistered(writableAtom.id)).toBe(true);
      expect(atomRegistry.isRegistered(baseAtom.id)).toBe(true);
    });

    it('should register writable atom on first set()', () => {
      const store = createStore();
      const baseAtom = atom(0, 'base');
      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, val: number) => set(baseAtom, val),
        'writable'
      );

      expect(atomRegistry.isRegistered(writableAtom.id)).toBe(false);
      expect(atomRegistry.isRegistered(baseAtom.id)).toBe(false);

      store.set(writableAtom, 5);

      expect(atomRegistry.isRegistered(writableAtom.id)).toBe(true);
      expect(atomRegistry.isRegistered(baseAtom.id)).toBe(true);
    });
  });

  describe('Subscribe', () => {
    it('should register atom on subscribe', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(false);

      const unsubscribe = store.subscribe(countAtom, () => {});

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);

      unsubscribe();
    });

    it('should track access count from subscriptions', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');

      store.subscribe(countAtom, () => {});
      store.subscribe(countAtom, () => {});

      expect((countAtom as any)._lazyRegistration?.accessCount).toBe(2);
    });
  });

  describe('Multiple stores', () => {
    it('should register atom in each store on first access', () => {
      const countAtom = atom(0, 'count');
      const store1 = createStore();
      const store2 = createStore();

      // Access in store1
      store1.get(countAtom);
      const registrationTime1 = (countAtom as any)._lazyRegistration?.registeredAt;

      // Access in store2 - should not re-register
      store2.get(countAtom);
      const registrationTime2 = (countAtom as any)._lazyRegistration?.registeredAt;

      expect(registrationTime1).toBe(registrationTime2);
      expect((countAtom as any)._lazyRegistration?.accessCount).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle atoms without name', () => {
      const store = createStore();
      const countAtom = atom(0);

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(false);

      store.get(countAtom);

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);
    });

    it('should handle atoms with special characters in name', () => {
      const store = createStore();
      const specialAtom = atom(0, 'atom@#$%');

      expect(atomRegistry.isRegistered(specialAtom.id)).toBe(false);

      store.get(specialAtom);

      expect(atomRegistry.isRegistered(specialAtom.id)).toBe(true);
    });

    it('should handle unicode names', () => {
      const store = createStore();
      const unicodeAtom = atom(0, 'unicode-测试🚀');

      expect(atomRegistry.isRegistered(unicodeAtom.id)).toBe(false);

      store.get(unicodeAtom);

      expect(atomRegistry.isRegistered(unicodeAtom.id)).toBe(true);
    });
  });
});
