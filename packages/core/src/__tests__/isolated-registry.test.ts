/**
 * Isolated Registry Tests
 * Tests that every store is isolated by default (ScopedRegistry).
 * SSR isolation is now the default — no special registry needed.
 */

import { describe, it, expect } from 'vitest';
import { atom, createStore } from '../index';
import { StoreImpl } from '../store/StoreImpl';

describe('Store Isolation (default)', () => {
  describe('Basic Isolation', () => {
    it('should create independent stores by default', () => {
      const store1 = createStore();
      const store2 = createStore();

      const atom1 = atom(0);
      const atom2 = atom(0);

      store1.set(atom1, 100);
      store2.set(atom2, 200);

      // Each store has its own state
      expect(store1.get(atom1)).toBe(100);
      expect(store2.get(atom2)).toBe(200);
    });

    it('should maintain separate registries', () => {
      const store1 = createStore();
      const store2 = createStore();

      const testAtom = atom(123, 'test');
      store1.get(testAtom);

      // Atom is only in store1's registry
      expect(store1.getRegistryAtoms()).toContain(testAtom.id);
      expect(store2.getRegistryAtoms()).not.toContain(testAtom.id);
    });

    it('should allow multiple independent stores', () => {
      const store1 = createStore();
      const store2 = createStore();

      const atom1 = atom('value1', 'a1');
      const atom2 = atom('value2', 'a2');

      store1.get(atom1);
      store2.get(atom2);

      // Each registry should have its own atom
      expect(store1.getRegistryAtoms()).toContain(atom1.id);
      expect(store2.getRegistryAtoms()).toContain(atom2.id);

      // No cross-contamination
      expect(store1.getRegistryAtoms()).not.toContain(atom2.id);
      expect(store2.getRegistryAtoms()).not.toContain(atom1.id);
    });
  });

  describe('SSR Concurrent Requests Isolation', () => {
    it('should isolate state between concurrent SSR requests', async () => {
      async function handleRequest(initialValue: number) {
        const store = createStore();
        const countAtom = atom(initialValue, 'count');
        store.get(countAtom);
        store.set(countAtom, initialValue + 1);
        return store.get(countAtom);
      }

      const [result1, result2, result3] = await Promise.all([
        handleRequest(10),
        handleRequest(20),
        handleRequest(30),
      ]);

      expect(result1).toBe(11);
      expect(result2).toBe(21);
      expect(result3).toBe(31);
    });

    it('should isolate stores with setState using store-specific atoms', () => {
      const store1 = createStore();
      const store2 = createStore();

      const atom1 = atom(0, 'shared');
      const atom2 = atom(0, 'shared');

      // Register in each store
      store1.get(atom1);
      store2.get(atom2);

      // Set state by name in each store
      store1.setState({ shared: 100 });
      store2.setState({ shared: 200 });

      // Each store has its own value
      expect(store1.get(atom1)).toBe(100);
      expect(store2.get(atom2)).toBe(200);
    });

    it('should support multiple atoms per isolated store', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');
      const nameAtom = atom('', 'name');

      store.get(countAtom);
      store.get(nameAtom);

      store.set(countAtom, 42);
      store.set(nameAtom, 'test');

      expect(store.get(countAtom)).toBe(42);
      expect(store.get(nameAtom)).toBe('test');
      expect(store.getRegistryAtoms().length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Memory Cleanup', () => {
    it('should allow garbage collection after request completion', () => {
      function handleRequest() {
        const store = createStore();
        const dataAtom = atom({ items: [] as string[] }, 'data');
        store.get(dataAtom);
        store.set(dataAtom, { items: ['item1', 'item2'] });
        return store.get(dataAtom);
      }

      const result = handleRequest();
      expect(result).toEqual({ items: ['item1', 'item2'] });
    });

    it('should not affect other stores after one store is discarded', () => {
      const store1 = createStore();
      const store2 = createStore();

      const atom1 = atom('a', 'shared-name');
      const atom2 = atom('b', 'shared-name');

      store1.get(atom1);
      store2.get(atom2);

      store1.set(atom1, 'modified-a');

      // store2 is unaffected
      expect(store2.get(atom2)).toBe('b');
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with plugins', () => {
      const log: string[] = [];
      const plugin = () => ({
        onSet: <T>(_atom: any, value: T) => {
          log.push(String(value));
          return value;
        },
      });

      const store = createStore([plugin]);
      const countAtom = atom(0, 'count');
      store.set(countAtom, 42);

      expect(log).toContain('42');
      expect(store.get(countAtom)).toBe(42);
    });
  });

  describe('Store Registry Integration', () => {
    it('should track atoms in store-specific registry', () => {
      const store = createStore();
      const atom1 = atom(1, 'a1');
      const atom2 = atom(2, 'a2');
      const atom3 = atom(3, 'a3');

      store.get(atom1);
      store.get(atom2);
      store.get(atom3);

      const registeredAtoms = store.getRegistryAtoms();
      expect(registeredAtoms).toContain(atom1.id);
      expect(registeredAtoms).toContain(atom2.id);
      expect(registeredAtoms).toContain(atom3.id);
    });

    it('should return registry from getRegistry()', () => {
      const store = createStore();
      const registry = store.getRegistry();

      expect(registry).toBeDefined();
      expect(registry.store).toBe(store);
      expect(registry.atoms).toBeDefined();
    });
  });

  describe('clear()', () => {
    it('should reset all atoms in store', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');
      const nameAtom = atom('initial', 'name');

      store.get(countAtom);
      store.get(nameAtom);

      store.set(countAtom, 42);
      store.set(nameAtom, 'changed');

      store.clear();

      // Values should be reset to defaults
      expect(store.get(countAtom)).toBe(0);
      expect(store.get(nameAtom)).toBe('initial');
    });
  });

  describe('setByName()', () => {
    it('should set atom by name for hydration', () => {
      const store = createStore();
      const countAtom = atom(0, 'count');
      const nameAtom = atom('', 'name');

      store.get(countAtom);
      store.get(nameAtom);

      // Simulate SSR hydration
      store.setByName('count', 100);
      store.setByName('name', 'hydrated');

      expect(store.get(countAtom)).toBe(100);
      expect(store.get(nameAtom)).toBe('hydrated');
    });

    it('should return false for unknown name', () => {
      const store = createStore();
      const result = store.setByName('nonexistent', 42);
      expect(result).toBe(false);
    });
  });
});
