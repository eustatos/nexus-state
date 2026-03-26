/**
 * Tests for lazy atom registration
 * Note: Named atoms are now registered immediately on creation.
 * These tests use anonymous atoms (no name) to test lazy registration behavior.
 * Additional tests verify that named atoms are registered immediately.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { atom, createStore, atomRegistry } from '@nexus-state/core';

describe('Lazy Atom Registration', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  describe('Anonymous primitive atom (lazy registration)', () => {
    it('should NOT register anonymous atom on creation', () => {
      const store = createStore();
      const countAtom = atom(0); // No name = lazy registration

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(false);
    });

    it('should register anonymous atom on first get()', () => {
      const store = createStore();
      const countAtom = atom(0); // No name = lazy registration

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(false);

      store.get(countAtom);

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);
      expect(atomRegistry.size()).toBe(1);
    });

    it('should register anonymous atom on first set()', () => {
      const store = createStore();
      const countAtom = atom(0); // No name = lazy registration

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(false);

      store.set(countAtom, 5);

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);
      expect(atomRegistry.size()).toBe(1);
    });

    it('should NOT re-register on subsequent accesses', () => {
      const store = createStore();
      const countAtom = atom(0); // No name = lazy registration

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
      const countAtom = atom(0); // No name = lazy registration

      store.get(countAtom);
      store.get(countAtom);
      store.set(countAtom, 5);
      store.get(countAtom);

      expect((countAtom as any)._lazyRegistration?.accessCount).toBe(4);
    });
  });

  describe('Anonymous computed atom (lazy registration)', () => {
    it('should NOT register anonymous computed atom on creation', () => {
      const store = createStore();
      const countAtom = atom(0); // Anonymous
      const doubleAtom = atom((get) => get(countAtom) * 2); // Anonymous

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(false);
      expect(atomRegistry.isRegistered(doubleAtom.id)).toBe(false);
      expect(atomRegistry.size()).toBe(0);
    });

    it('should register anonymous computed atom on first get()', () => {
      const store = createStore();
      const countAtom = atom(0); // Anonymous
      const doubleAtom = atom((get) => get(countAtom) * 2); // Anonymous

      store.get(doubleAtom);

      expect(atomRegistry.isRegistered(doubleAtom.id)).toBe(true);
      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);
    });

    it('should register dependency when accessing computed atom', () => {
      const store = createStore();
      const countAtom = atom(0); // Anonymous
      const doubleAtom = atom((get) => get(countAtom) * 2); // Anonymous

      store.get(doubleAtom);

      // Both atoms should be registered
      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);
      expect(atomRegistry.isRegistered(doubleAtom.id)).toBe(true);
    });
  });

  describe('Anonymous writable atom (lazy registration)', () => {
    it('should NOT register anonymous writable atom on creation', () => {
      const store = createStore();
      const baseAtom = atom(0); // Anonymous
      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, val: number) => set(baseAtom, val)
      ); // Anonymous

      expect(atomRegistry.isRegistered(writableAtom.id)).toBe(false);
      expect(atomRegistry.isRegistered(baseAtom.id)).toBe(false);
    });

    it('should register anonymous writable atom on first get()', () => {
      const store = createStore();
      const baseAtom = atom(0); // Anonymous
      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, val: number) => set(baseAtom, val)
      ); // Anonymous

      expect(atomRegistry.isRegistered(writableAtom.id)).toBe(false);
      expect(atomRegistry.isRegistered(baseAtom.id)).toBe(false);

      store.get(writableAtom);

      expect(atomRegistry.isRegistered(writableAtom.id)).toBe(true);
      expect(atomRegistry.isRegistered(baseAtom.id)).toBe(true);
    });

    it('should register anonymous writable atom on first set()', () => {
      const store = createStore();
      const baseAtom = atom(0); // Anonymous
      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, val: number) => set(baseAtom, val)
      ); // Anonymous

      expect(atomRegistry.isRegistered(writableAtom.id)).toBe(false);
      expect(atomRegistry.isRegistered(baseAtom.id)).toBe(false);

      store.set(writableAtom, 42);

      expect(atomRegistry.isRegistered(writableAtom.id)).toBe(true);
      expect(atomRegistry.isRegistered(baseAtom.id)).toBe(true);
    });
  });

  describe('Named atom (immediate registration)', () => {
    it('should register named atom immediately on creation', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);
      expect(atomRegistry.size()).toBe(1);
    });

    it('should register named computed atom immediately on creation', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');
      const doubleAtom = atom((get) => get(countAtom) * 2, 'double');

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);
      expect(atomRegistry.isRegistered(doubleAtom.id)).toBe(true);
      expect(atomRegistry.size()).toBe(2);
    });

    it('should register named writable atom immediately on creation', () => {
      const store = createStore();
      const baseAtom = atom(0, 'base');
      const writableAtom = atom(
        (get) => get(baseAtom),
        (get, set, val: number) => set(baseAtom, val),
        'writable'
      );

      expect(atomRegistry.isRegistered(writableAtom.id)).toBe(true);
      expect(atomRegistry.isRegistered(baseAtom.id)).toBe(true);
    });

    it('should handle unicode names', () => {
      const store = createStore();
      const unicodeAtom = atom(0, 'unicode-测试🚀');

      // Named atoms are registered immediately
      expect(atomRegistry.isRegistered(unicodeAtom.id)).toBe(true);

      store.get(unicodeAtom);

      expect(atomRegistry.isRegistered(unicodeAtom.id)).toBe(true);
    });

    it('should handle atoms with special characters in name', () => {
      const store = createStore();
      const specialAtom = atom(0, 'atom@#$%');

      // Named atoms are registered immediately
      expect(atomRegistry.isRegistered(specialAtom.id)).toBe(true);

      store.get(specialAtom);

      expect(atomRegistry.isRegistered(specialAtom.id)).toBe(true);
    });
  });

  describe('Subscribe behavior', () => {
    it('should register anonymous atom on subscribe', () => {
      const store = createStore();
      const countAtom = atom(0); // Anonymous

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(false);

      store.subscribe(countAtom, () => {});

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);
    });

    it('should register named atom immediately (before subscribe)', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');

      // Already registered on creation
      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);

      store.subscribe(countAtom, () => {});

      expect(atomRegistry.isRegistered(countAtom.id)).toBe(true);
    });
  });
});
