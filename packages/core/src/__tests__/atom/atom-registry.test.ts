/**
 * Store Registry Tests
 * Tests for store's ScopedRegistry functionality (replaces global atomRegistry tests).
 */

import { describe, it, expect } from 'vitest';
import { atom, createStore } from '../../index';

describe('Store Registry', () => {
  describe('getRegistryAtoms()', () => {
    it('should return registered atom IDs', () => {
      const store = createStore();
      const testAtom = atom(123, 'registry-test');

      store.get(testAtom);

      const atoms = store.getRegistryAtoms();
      expect(atoms).toContain(testAtom.id);
    });

    it('should return empty array for fresh store', () => {
      const store = createStore();
      expect(store.getRegistryAtoms()).toEqual([]);
    });

    it('should return all registered atoms after multiple accesses', () => {
      const store = createStore();
      const atom1 = atom(1, 'first');
      const atom2 = atom(2, 'second');
      const atom3 = atom(3, 'third');

      store.get(atom1);
      store.get(atom2);
      store.get(atom3);

      const atoms = store.getRegistryAtoms();
      expect(atoms).toContain(atom1.id);
      expect(atoms).toContain(atom2.id);
      expect(atoms).toContain(atom3.id);
    });
  });

  describe('Atom Metadata via store registry', () => {
    it('should track atom name in store registry', () => {
      const store = createStore();
      const testAtom = atom(456, 'metadata-test');

      store.get(testAtom);

      // Can look up by name via setByName
      const result = store.setByName('metadata-test', 999);
      expect(result).toBe(true);
      expect(store.get(testAtom)).toBe(999);
    });

    it('should handle computed atoms', () => {
      const store = createStore();
      const baseAtom = atom(10);
      const computedAtom = atom((get: any) => get(baseAtom) * 2, 'computed');

      store.get(computedAtom);

      expect(store.get(computedAtom)).toBe(20);
    });
  });

  describe('Set by Name', () => {
    it('should find and set atom by name', () => {
      const store = createStore();
      const nameAtom = atom('initial', 'my-name');

      store.get(nameAtom);

      const result = store.setByName('my-name', 'changed');
      expect(result).toBe(true);
      expect(store.get(nameAtom)).toBe('changed');
    });

    it('should return false for unknown name', () => {
      const store = createStore();
      const result = store.setByName('unknown', 42);
      expect(result).toBe(false);
    });

    it('should set different atom types by name', () => {
      const store = createStore();
      const primitiveAtom = atom(0, 'prim');
      const computedAtom = atom((g: any) => g(primitiveAtom) * 2, 'computed');

      store.get(primitiveAtom);
      store.get(computedAtom);

      expect(store.setByName('prim', 5)).toBe(true);
      expect(store.setByName('computed', 10)).toBe(true);
    });
  });

  describe('Registry Size', () => {
    it('should grow with each registered atom', () => {
      const store = createStore();
      const testAtom = atom(0, 'size-test');

      expect(store.getRegistryAtoms().length).toBe(0);

      store.get(testAtom);

      expect(store.getRegistryAtoms().length).toBe(1);
    });

    it('should increase with each new atom', () => {
      const store = createStore();
      const sizes: number[] = [];

      for (let i = 0; i < 5; i++) {
        const a = atom(i, `atom-${i}`);
        store.get(a);
        sizes.push(store.getRegistryAtoms().length);
      }

      expect(sizes).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('Registry Isolation', () => {
    it('should maintain separate registries for different stores', () => {
      const store1 = createStore();
      const store2 = createStore();

      const atom1 = atom(0, 'atom-1');
      const atom2 = atom(0, 'atom-2');

      store1.get(atom1);
      store2.get(atom2);

      expect(store1.getRegistryAtoms()).toContain(atom1.id);
      expect(store2.getRegistryAtoms()).toContain(atom2.id);

      expect(store1.getRegistryAtoms()).not.toContain(atom2.id);
      expect(store2.getRegistryAtoms()).not.toContain(atom1.id);
    });

    it('should not mix up atoms with same value', () => {
      const store1 = createStore();
      const store2 = createStore();

      const atom1 = atom(42, 'first-42');
      const atom2 = atom(42, 'second-42');

      store1.get(atom1);
      store2.get(atom2);

      // setByName finds the right atom in each store
      store1.setByName('first-42', 100);
      store2.setByName('second-42', 200);

      expect(store1.get(atom1)).toBe(100);
      expect(store2.get(atom2)).toBe(200);
    });
  });

  describe('clear()', () => {
    it('should allow new registrations after clear', () => {
      const store = createStore();
      const testAtom = atom(0, 'clear-test');

      store.get(testAtom);
      expect(store.getRegistryAtoms().length).toBe(1);

      store.clear();
      // After clear, atoms still registered but values reset
      expect(store.getRegistryAtoms().length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getRegistry()', () => {
    it('should return store registry with correct store reference', () => {
      const store = createStore();
      const registry = store.getRegistry();

      expect(registry).toBeDefined();
      expect(registry.store).toBe(store);
      expect(registry.atoms).toBeInstanceOf(Set);
    });
  });
});
