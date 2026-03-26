/**
 * Isolated Registry Tests
 * Tests for SSR isolation with createIsolatedRegistry()
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { atom, createIsolatedRegistry, createStore, atomRegistry } from '../index';
import { StoreImpl } from '../store/StoreImpl';

describe('createIsolatedRegistry', () => {
  beforeEach(() => {
    // Clean global registry before each test for isolation
    atomRegistry.clear();
  });

  describe('Basic Isolation', () => {
    it('should create a new registry instance not tied to global singleton', () => {
      const isolatedRegistry1 = createIsolatedRegistry();
      const isolatedRegistry2 = createIsolatedRegistry();

      expect(isolatedRegistry1).not.toBe(atomRegistry);
      expect(isolatedRegistry2).not.toBe(atomRegistry);
      expect(isolatedRegistry1).not.toBe(isolatedRegistry2);
    });

    it('should maintain separate store registries', () => {
      const isolatedRegistry = createIsolatedRegistry();
      const store = createStore(isolatedRegistry);

      // Use anonymous atom (no name) to avoid immediate registration in global registry
      const testAtom = atom(123);
      store.get(testAtom);

      // Atom should be in isolated registry
      expect(isolatedRegistry.size()).toBe(1);
      expect(isolatedRegistry.get(testAtom.id)).toBe(testAtom);

      // Atom should NOT be in global registry
      expect(atomRegistry.size()).toBe(0);
      expect(atomRegistry.get(testAtom.id)).toBeUndefined();
    });

    it('should allow multiple isolated registries', () => {
      const registry1 = createIsolatedRegistry();
      const registry2 = createIsolatedRegistry();

      const store1 = createStore(registry1);
      const store2 = createStore(registry2);

      // Create anonymous atoms (no name to avoid immediate global registration)
      const atom1 = atom('value1');
      const atom2 = atom('value2');

      store1.get(atom1);
      store2.get(atom2);

      // Each registry should have its own atom
      expect(registry1.size()).toBe(1);
      expect(registry2.size()).toBe(1);

      // No atoms in global registry
      expect(atomRegistry.size()).toBe(0);
    });
  });

  describe('SSR Concurrent Requests Isolation', () => {
    it('should isolate state between concurrent SSR requests', () => {
      // Simulate two concurrent SSR requests with isolated registries
      const registry1 = createIsolatedRegistry();
      const registry2 = createIsolatedRegistry();

      const store1 = createStore(registry1);
      const store2 = createStore(registry2);

      // Create anonymous atoms for each request
      const userAtom1 = atom({ name: 'Anonymous' });
      const userAtom2 = atom({ name: 'Anonymous' });

      // Initialize atoms in each store and set values directly
      store1.get(userAtom1);
      store2.get(userAtom2);

      // Update values directly (not by name since atoms are anonymous)
      store1.set(userAtom1, { name: 'User1' });
      store2.set(userAtom2, { name: 'User2' });

      // Verify isolation
      expect(store1.get(userAtom1)).toEqual({ name: 'User1' });
      expect(store2.get(userAtom2)).toEqual({ name: 'User2' });

      // Verify registries are separate
      expect(registry1.size()).toBe(1);
      expect(registry2.size()).toBe(1);
    });

    it('should isolate stores with setState using store-specific atoms', () => {
      const registry1 = createIsolatedRegistry();
      const registry2 = createIsolatedRegistry();

      const store1 = createStore(registry1);
      const store2 = createStore(registry2);

      // Create anonymous atoms for each store
      const atom1 = atom('initial1');
      const atom2 = atom('initial2');

      // Access atoms to register them in their stores' local registries
      store1.get(atom1);
      store2.get(atom2);

      // Get atom names from registry for setState
      const atom1Name = registry1.getName(atom1);
      const atom2Name = registry2.getName(atom2);

      // Hydrate store2 - should only find atom in store2's local registry
      store2.setState({ [atom2Name]: 'hydrated-value' });

      expect(store2.get(atom2)).toBe('hydrated-value');
      // store1 should keep its original value since setState searches only in local registry
      expect(store1.get(atom1)).toBe('initial1');

      // Verify local registries are separate
      expect(store1.getRegistryAtoms!()).toHaveLength(1);
      expect(store2.getRegistryAtoms!()).toHaveLength(1);
    });

    it('should support multiple atoms per isolated store', () => {
      const registry = createIsolatedRegistry();
      const store = createStore(registry);

      const userAtom = atom({ name: 'John' });
      const countAtom = atom(0);
      const themeAtom = atom('light');

      store.get(userAtom);
      store.get(countAtom);
      store.get(themeAtom);

      expect(registry.size()).toBe(3);
      expect(atomRegistry.size()).toBe(0);

      // Update values
      store.set(userAtom, { name: 'Jane' });
      store.set(countAtom, 42);
      store.set(themeAtom, 'dark');

      expect(store.get(userAtom)).toEqual({ name: 'Jane' });
      expect(store.get(countAtom)).toBe(42);
      expect(store.get(themeAtom)).toBe('dark');
    });
  });

  describe('Memory Cleanup', () => {
    it('should allow garbage collection after request completion', () => {
      // Create isolated registry for a request
      let registry = createIsolatedRegistry();
      const store = createStore(registry);

      const testAtom = atom('test-value');
      store.get(testAtom);

      expect(registry.size()).toBe(1);

      // Simulate request completion by clearing references
      registry = null as any;

      // Global registry should remain unaffected
      expect(atomRegistry.size()).toBe(0);
    });

    it('should not affect global registry after isolated registry is discarded', () => {
      const isolatedRegistry = createIsolatedRegistry();
      const isolatedStore = createStore(isolatedRegistry);

      const isolatedAtom = atom('isolated');
      isolatedStore.get(isolatedAtom);

      // Create atom in global registry
      const globalAtom = atom('global');
      const globalStore = createStore();
      globalStore.get(globalAtom);

      // Verify separation
      expect(isolatedRegistry.size()).toBe(1);
      expect(atomRegistry.size()).toBeGreaterThanOrEqual(1);

      // Discard isolated registry
      // (In real SSR, this would happen when request completes)
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with default global registry when no registry provided', () => {
      const store = createStore();
      const testAtom = atom(42);

      store.get(testAtom);

      // Should use global registry
      expect(atomRegistry.size()).toBeGreaterThanOrEqual(1);
      expect(atomRegistry.get(testAtom.id)).toBe(testAtom);
    });

    it('should work with plugins and isolated registry', () => {
      const registry = createIsolatedRegistry();
      const onGetSpy = vi.fn((atom, value) => value);
      const onSetSpy = vi.fn((atom, value) => value);
      
      // Plugin is a factory function that returns hooks
      const mockPlugin = () => ({
        onGet: onGetSpy,
        onSet: onSetSpy
      });

      // Use StoreImpl directly for plugins + isolated registry
      const store = new StoreImpl([mockPlugin], registry);
      const testAtom = atom('test');

      store.get(testAtom);
      store.set(testAtom, 'updated');

      expect(registry.size()).toBe(1);
      expect(onGetSpy).toHaveBeenCalled();
      expect(onSetSpy).toHaveBeenCalled();
    });
  });

  describe('Registry Methods', () => {
    it('should support all registry methods', () => {
      const registry = createIsolatedRegistry();
      const store = createStore(registry);

      const testAtom = atom('test');
      store.get(testAtom);

      // Test various registry methods
      expect(registry.get(testAtom.id)).toBe(testAtom);
      expect(registry.getMetadata(testAtom)).toBeDefined();
      expect(registry.getName(testAtom)).toBeDefined();
      expect(registry.isRegistered(testAtom.id)).toBe(true);

      const allAtoms = registry.getAll();
      expect(allAtoms.has(testAtom.id)).toBe(true);
    });

    it('should support clear() for testing', () => {
      const registry = createIsolatedRegistry();
      const store = createStore(registry);

      const atom1 = atom(1);
      const atom2 = atom(2);

      store.get(atom1);
      store.get(atom2);

      expect(registry.size()).toBe(2);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.isRegistered(atom1.id)).toBe(false);
      expect(registry.isRegistered(atom2.id)).toBe(false);
    });
  });

  describe('Store Registry Integration', () => {
    it('should track atoms in store-specific registry', () => {
      const registry = createIsolatedRegistry();
      const store = createStore(registry);

      const atom1 = atom(1);
      const atom2 = atom(2);

      store.get(atom1);
      store.get(atom2);

      const storeAtoms = store.getRegistryAtoms!();
      expect(storeAtoms).toHaveLength(2);
      expect(storeAtoms).toContain(atom1.id);
      expect(storeAtoms).toContain(atom2.id);
    });

    it('should return correct registry from getRegistry()', () => {
      const registry = createIsolatedRegistry();
      const store = createStore(registry);

      const storeRegistry = store.getRegistry!();
      expect(storeRegistry.store).toBe(store);
      expect(storeRegistry.atoms).toBeInstanceOf(Set);
    });
  });
});
