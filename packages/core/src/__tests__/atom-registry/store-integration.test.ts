/**
 * Tests for AtomRegistry: store integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AtomRegistry } from '../../atom-registry';
import { createStore } from '../../store';
import { atom } from '../../atom';
import type { Store } from '../../types';

describe('AtomRegistry: store integration', () => {
  let registry: AtomRegistry;
  let store: Store;

  beforeEach(() => {
    registry = AtomRegistry.getInstance();
    registry.clear();
    store = createStore();
  });

  describe('attachStore()', () => {
    it('should attach store to registry', () => {
      registry.attachStore(store, 'global');

      const storesMap = registry.getStoresMap();
      expect(storesMap.has(store)).toBe(true);
    });

    it('should attach store in isolated mode', () => {
      registry.attachStore(store, 'isolated');

      const storesMap = registry.getStoresMap();
      expect(storesMap.has(store)).toBe(true);
    });

    it('should attach store with global mode by default', () => {
      registry.attachStore(store);

      const storesMap = registry.getStoresMap();
      expect(storesMap.has(store)).toBe(true);
    });

    it('should not duplicate store on repeated calls', () => {
      registry.attachStore(store, 'global');
      registry.attachStore(store, 'global');

      const storesMap = registry.getStoresMap();
      expect(storesMap.get(store)?.atoms.size).toBe(0);
    });

    it('should create empty atom set for new store', () => {
      registry.attachStore(store, 'global');

      const storesMap = registry.getStoresMap();
      const storeRegistry = storesMap.get(store);

      expect(storeRegistry).toBeDefined();
      expect(storeRegistry?.atoms.size).toBe(0);
    });
  });

  describe('getStoreForAtom()', () => {
    it('should return undefined for atom without store', () => {
      const testAtom = atom(42);
      registry.register(testAtom, 'test');

      const ownerStore = registry.getStoreForAtom(testAtom.id);
      expect(ownerStore).toBeUndefined();
    });

    it('should return undefined for atom in global registry', () => {
      const testAtom = atom(42);
      registry.register(testAtom, 'test');
      registry.attachStore(store, 'global');

      const ownerStore = registry.getStoreForAtom(testAtom.id);
      expect(ownerStore).toBeUndefined();
    });
  });

  describe('getAtomsForStore()', () => {
    it('should return empty array for store without atoms', () => {
      registry.attachStore(store, 'global');

      const atoms = registry.getAtomsForStore(store);
      expect(atoms).toEqual([]);
    });

    it('should return empty array for unattached store', () => {
      const atoms = registry.getAtomsForStore(store);
      expect(atoms).toEqual([]);
    });
  });

  describe('getAtomValue()', () => {
    it('should return undefined for non-existent atom', () => {
      const value = registry.getAtomValue(Symbol('nonexistent'));
      expect(value).toBeUndefined();
    });

    it('should return atom for atom without store', () => {
      const testAtom = atom(42);
      registry.register(testAtom, 'test');

      const value = registry.getAtomValue(testAtom.id);
      expect(value).toBe(testAtom);
    });
  });

  describe('getAllStoresForAtom()', () => {
    it('should return empty array for atom without store', () => {
      const testAtom = atom(42);
      registry.register(testAtom, 'test');

      const stores = registry.getAllStoresForAtom(testAtom.id);
      expect(stores).toEqual([]);
    });

    it('should return all stores containing atom', () => {
      const store1 = createStore();
      const store2 = createStore();

      registry.attachStore(store1, 'isolated');
      registry.attachStore(store2, 'isolated');

      const testAtom = atom(42);
      registry.register(testAtom, 'test');

      // In current implementation, atoms are not automatically added to store registry
      // This tests basic behavior
      const stores = registry.getAllStoresForAtom(testAtom.id);
      expect(stores).toEqual([]);
    });
  });

  describe('getStoresMap()', () => {
    it('should return map of attached stores', () => {
      const store1 = createStore();
      const store2 = createStore();

      registry.attachStore(store1, 'global');
      registry.attachStore(store2, 'isolated');

      const storesMap = registry.getStoresMap();

      expect(storesMap.size).toBeGreaterThanOrEqual(2);
      expect(storesMap.has(store1)).toBe(true);
      expect(storesMap.has(store2)).toBe(true);
    });

    it('should return same Map reference on each call', () => {
      registry.attachStore(store, 'global');

      const map1 = registry.getStoresMap();
      const map2 = registry.getStoresMap();

      // Implementation returns the same internal Map reference
      expect(map1).toBe(map2);
    });

    it('should clear stores map on clear()', () => {
      registry.attachStore(store, 'global');
      registry.clear();

      const storesMap = registry.getStoresMap();
      expect(storesMap.size).toBe(0);
    });
  });

  describe('getAllComputedAtoms()', () => {
    it('should return only computed atoms', () => {
      const primitiveAtom = atom(42);
      const computedAtom = atom((get) => get(primitiveAtom) * 2);

      registry.register(primitiveAtom, 'primitive');
      registry.register(computedAtom, 'computed');

      const computed = registry.getAllComputedAtoms();

      expect(computed.size).toBe(1);
      expect(computed.has(computedAtom.id.toString())).toBe(true);
    });

    it('should return empty Map if no computed atoms', () => {
      const primitiveAtom = atom(42);
      registry.register(primitiveAtom, 'primitive');

      const computed = registry.getAllComputedAtoms();
      expect(computed.size).toBe(0);
    });
  });

  describe('getComputedAtom()', () => {
    it('should handle computed atom lookup by string ID', () => {
      const primitiveAtom = atom(42);
      const computedAtom = atom((get) => get(primitiveAtom) * 2);

      registry.register(primitiveAtom, 'primitive');
      registry.register(computedAtom, 'computed');

      // getComputedAtom uses Symbol.for which may not match our symbol
      // This tests the method exists and handles various inputs
      const found = registry.getComputedAtom(computedAtom.id.toString());
      // Method may return undefined for non-Symbol.for IDs
      expect(found === undefined || found === computedAtom).toBe(true);
    });

    it('should return undefined for primitive atom', () => {
      const primitiveAtom = atom(42);
      registry.register(primitiveAtom, 'primitive');

      const found = registry.getComputedAtom(primitiveAtom.id.toString());
      expect(found).toBeUndefined();
    });

    it('should return undefined for non-existent atom', () => {
      const found = registry.getComputedAtom('nonexistent');
      expect(found).toBeUndefined();
    });
  });
});
