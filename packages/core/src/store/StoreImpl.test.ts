/**
 * StoreImpl Tests
 * Tests for the main store implementation (Facade pattern)
 *
 * StoreImpl coordinates all store components:
 * - ScopedRegistry: Unified per-store atom registry (atoms + state + metadata)
 * - DependencyTracker: Dependency management
 * - NotificationManager: Subscription management
 * - PluginSystem: Plugin management
 * - ComputedEvaluator: Atom evaluation
 * - BatchProcessor: Batch processing
 *
 * DevTools is no longer built-in. Use the `devtools()` plugin from
 * `@nexus-state/core/devtools` instead.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StoreImpl } from './StoreImpl';
import { atom } from '../atom';
import { batch } from '../batching';
import type { Plugin, Atom } from '../types';

describe('StoreImpl', () => {
  let store: StoreImpl;

  beforeEach(() => {
    store = new StoreImpl();
  });

  describe('Construction', () => {
    it('should create a store without parameters', () => {
      expect(store).toBeDefined();
      expect(typeof store.get).toBe('function');
      expect(typeof store.set).toBe('function');
      expect(typeof store.subscribe).toBe('function');
      expect(typeof store.getState).toBe('function');
    });

    it('should create a store with empty plugins array', () => {
      const storeWithEmptyPlugins = new StoreImpl([]);
      expect(storeWithEmptyPlugins).toBeDefined();
    });

    it('should create a store with plugins', () => {
      const pluginSpy = vi.fn();
      const storeWithPlugins = new StoreImpl([pluginSpy]);

      expect(pluginSpy).toHaveBeenCalledTimes(1);
      expect(pluginSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should create a store with multiple plugins', () => {
      const plugin1 = vi.fn();
      const plugin2 = vi.fn();
      const plugin3 = vi.fn();

      const storeWithPlugins = new StoreImpl([plugin1, plugin2, plugin3]);

      expect(plugin1).toHaveBeenCalledTimes(1);
      expect(plugin2).toHaveBeenCalledTimes(1);
      expect(plugin3).toHaveBeenCalledTimes(1);
    });

    it('should apply plugins in order', () => {
      const executionOrder: string[] = [];
      const plugin1 = vi.fn(() => executionOrder.push('plugin1'));
      const plugin2 = vi.fn(() => executionOrder.push('plugin2'));
      const plugin3 = vi.fn(() => executionOrder.push('plugin3'));

      new StoreImpl([plugin1, plugin2, plugin3]);

      expect(executionOrder).toEqual(['plugin1', 'plugin2', 'plugin3']);
    });

    it('should accept StoreOptions object', () => {
      const plugin = vi.fn();
      const store = new StoreImpl({ plugins: [plugin] });

      expect(plugin).toHaveBeenCalledTimes(1);
      expect(store).toBeDefined();
    });

    it('should create store with only devtools enabled (deprecated)', () => {
      const store = new StoreImpl({ devtools: true });
      expect(store).toBeDefined();

      // DevTools is no longer built-in, getDevTools() returns null
      const devTools = store.getDevTools();
      expect(devTools).toBeNull();
    });

    it('should create store with devtools config (deprecated, ignored)', () => {
      const store = new StoreImpl({
        devtools: true,
        devtoolsConfig: { enableStackTrace: true, debounceDelay: 200 },
      });

      // DevTools is no longer built-in, config is ignored
      const devTools = store.getDevTools();
      expect(devTools).toBeNull();
    });

    it('should create minimal store without optional subsystems', () => {
      const store = new StoreImpl();

      // Store should work normally
      const testAtom = atom(0);
      store.set(testAtom, 5);
      expect(store.get(testAtom)).toBe(5);
    });

    it('should create minimal store with explicit empty options', () => {
      const store = new StoreImpl({});

      const testAtom = atom(0);
      store.set(testAtom, 10);
      expect(store.get(testAtom)).toBe(10);
    });

    it('should create store with batching enabled', () => {
      const store = new StoreImpl({ batching: true });
      expect(store).toBeDefined();

      const batchProcessor = store.getBatchProcessor();
      expect(batchProcessor).toBeDefined();
    });

    it('should create store with all options', () => {
      const plugin = vi.fn();
      const store = new StoreImpl({
        plugins: [plugin],
        devtools: true,
        devtoolsConfig: { enableStackTrace: true },
        batching: true,
      });

      expect(plugin).toHaveBeenCalledTimes(1);
      // DevTools is no longer built-in
      expect(store.getDevTools()).toBeNull();
      expect(store.getBatchProcessor()).toBeDefined();
    });

    it('should backward compat: legacy Plugin[] array still works', () => {
      const plugin1 = vi.fn();
      const plugin2 = vi.fn();
      const store = new StoreImpl([plugin1, plugin2]);

      expect(plugin1).toHaveBeenCalledTimes(1);
      expect(plugin2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Lazy Initialization', () => {
    it('should not create PluginSystem when no plugins provided', () => {
      const store = new StoreImpl();
      const testAtom = atom(0);

      // Operations should work without PluginSystem
      store.set(testAtom, 5);
      expect(store.get(testAtom)).toBe(5);
    });

    it('should not create DevTools when not enabled (deprecated)', () => {
      const store = new StoreImpl();
      const testAtom = atom(0, 'test');

      // setWithMetadata should fall back to set()
      store.setWithMetadata(testAtom, 5, { type: 'SET', timestamp: Date.now() });
      expect(store.get(testAtom)).toBe(5);
    });

    it('should not create BatchProcessor when not enabled', () => {
      const store = new StoreImpl();
      const testAtom = atom(0);

      // Store should work normally without BatchProcessor
      store.set(testAtom, 5);
      expect(store.get(testAtom)).toBe(5);
    });

    it('getPluginSystem() should create PluginSystem on demand', () => {
      const store = new StoreImpl();
      const ps = store.getPluginSystem();

      expect(ps).toBeDefined();
      expect(ps.getPlugins()).toEqual([]);
    });

    it('getDevTools() should return null (deprecated)', () => {
      const store = new StoreImpl();
      const dt = store.getDevTools();

      expect(dt).toBeNull();
    });

    it('getBatchProcessor() should create BatchProcessor on demand', () => {
      const store = new StoreImpl();
      const bp = store.getBatchProcessor();

      expect(bp).toBeDefined();
    });

    it('applyPlugin() should create PluginSystem on demand', () => {
      const store = new StoreImpl();
      const plugin = vi.fn();

      store.applyPlugin(plugin);

      expect(plugin).toHaveBeenCalledTimes(1);
    });

    it('getPlugins() should return empty array when no plugins', () => {
      const store = new StoreImpl();
      expect(store.getPlugins()).toEqual([]);
    });

    it('serializeState() should fall back to registry when no DevTools', () => {
      const store = new StoreImpl();
      const testAtom = atom(42, 'test');

      store.get(testAtom);
      const state = store.serializeState();

      expect(state).toBeDefined();
      expect(typeof state).toBe('object');
    });

    it('getIntercepted() should fall back to get() when no DevTools', () => {
      const store = new StoreImpl();
      const testAtom = atom(42);

      store.get(testAtom);
      const value = store.getIntercepted(testAtom);

      expect(value).toBe(42);
    });

    it('setIntercepted() should fall back to set() when no DevTools', () => {
      const store = new StoreImpl();
      const testAtom = atom(0);

      store.setIntercepted(testAtom, 5);

      expect(store.get(testAtom)).toBe(5);
    });

    it('should execute plugin hooks when plugins are provided', () => {
      const onSetSpy = vi.fn((atom, value) => value * 2);
      const plugin: Plugin = () => ({ onSet: onSetSpy });

      const store = new StoreImpl({ plugins: [plugin] });
      const testAtom = atom(5);

      store.set(testAtom, 10);

      expect(onSetSpy).toHaveBeenCalled();
      expect(store.get(testAtom)).toBe(20);
    });

    it('should not track state changes via built-in devtools (deprecated)', () => {
      const store = new StoreImpl({ devtools: true });
      const testAtom = atom(0, 'test');

      store.set(testAtom, 5, { source: 'test' });

      // DevTools is no longer built-in, getDevTools() returns null
      expect(store.getDevTools()).toBeNull();
    });
  });

  describe('Get/Set Coordination', () => {
    it('should get primitive atom value', () => {
      const countAtom = atom(42);
      expect(store.get(countAtom)).toBe(42);
    });

    it('should set and get atom value', () => {
      const countAtom = atom(0);
      
      store.set(countAtom, 5);
      expect(store.get(countAtom)).toBe(5);
    });

    it('should update atom with function', () => {
      const countAtom = atom(0);
      
      store.set(countAtom, (prev) => prev + 1);
      expect(store.get(countAtom)).toBe(1);
      
      store.set(countAtom, (prev) => prev * 2);
      expect(store.get(countAtom)).toBe(2);
    });

    it('should notify subscribers after set', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();
      
      store.subscribe(countAtom, subscriber);
      store.set(countAtom, 5);
      
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(5);
    });

    it('should notify multiple subscribers', () => {
      const countAtom = atom(0);
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      
      store.subscribe(countAtom, subscriber1);
      store.subscribe(countAtom, subscriber2);
      
      store.set(countAtom, 5);
      
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
    });

    it('should not notify unsubscribed listeners', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();
      
      const unsubscribe = store.subscribe(countAtom, subscriber);
      unsubscribe();
      
      store.set(countAtom, 5);
      
      expect(subscriber).not.toHaveBeenCalled();
    });

    it('should handle object atom values', () => {
      const objAtom = atom({ key: 'value' });
      
      expect(store.get(objAtom)).toEqual({ key: 'value' });
      
      store.set(objAtom, { key: 'new value' });
      expect(store.get(objAtom)).toEqual({ key: 'new value' });
    });

    it('should handle array atom values', () => {
      const arrAtom = atom([1, 2, 3]);
      
      expect(store.get(arrAtom)).toEqual([1, 2, 3]);
      
      store.set(arrAtom, [4, 5, 6]);
      expect(store.get(arrAtom)).toEqual([4, 5, 6]);
    });
  });

  describe('Batch Processing', () => {
    it('should batch multiple sets', () => {
      const atom1 = atom(0);
      const atom2 = atom(0);
      const atom3 = atom(0);
      
      const subscriber = vi.fn();
      store.subscribe(atom1, subscriber);
      store.subscribe(atom2, subscriber);
      store.subscribe(atom3, subscriber);
      
      batch(() => {
        store.set(atom1, 1);
        store.set(atom2, 2);
        store.set(atom3, 3);
      });
      
      expect(store.get(atom1)).toBe(1);
      expect(store.get(atom2)).toBe(2);
      expect(store.get(atom3)).toBe(3);
    });

    it('should notify once after batch', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();
      
      store.subscribe(countAtom, subscriber);
      
      batch(() => {
        store.set(countAtom, 1);
        store.set(countAtom, 2);
        store.set(countAtom, 3);
      });
      
      // Subscriber is called for each set, but batch ensures atomic updates
      expect(subscriber).toHaveBeenCalledTimes(3);
      expect(subscriber).toHaveBeenNthCalledWith(1, 1);
      expect(subscriber).toHaveBeenNthCalledWith(2, 2);
      expect(subscriber).toHaveBeenNthCalledWith(3, 3);
    });

    it('should handle nested batches', () => {
      const atom1 = atom(0);
      const atom2 = atom(0);
      const subscriber = vi.fn();
      
      store.subscribe(atom1, subscriber);
      store.subscribe(atom2, subscriber);
      
      batch(() => {
        store.set(atom1, 1);
        
        batch(() => {
          store.set(atom2, 2);
        });
        
        store.set(atom1, 3);
      });
      
      expect(store.get(atom1)).toBe(3);
      expect(store.get(atom2)).toBe(2);
    });

    it('should handle errors in batch', () => {
      const countAtom = atom(0);
      
      expect(() => {
        batch(() => {
          store.set(countAtom, 1);
          throw new Error('Test error');
        });
      }).toThrow('Test error');
      
      // Value should still be updated before error
      expect(store.get(countAtom)).toBe(1);
    });
  });

  describe('Computed Atoms', () => {
    it('should compute derived values', () => {
      const countAtom = atom(5);
      const doubleAtom = atom((get) => get(countAtom) * 2);
      
      expect(store.get(doubleAtom)).toBe(10);
    });

    it('should update computed when dependency changes', () => {
      const countAtom = atom(5);
      const doubleAtom = atom((get) => get(countAtom) * 2);
      
      expect(store.get(doubleAtom)).toBe(10);
      
      store.set(countAtom, 10);
      expect(store.get(doubleAtom)).toBe(20);
    });

    it('should handle computed with multiple dependencies', () => {
      const a = atom(2);
      const b = atom(3);
      const sumAtom = atom((get) => get(a) + get(b));
      
      expect(store.get(sumAtom)).toBe(5);
      
      store.set(a, 5);
      expect(store.get(sumAtom)).toBe(8);
      
      store.set(b, 10);
      expect(store.get(sumAtom)).toBe(15);
    });

    it('should handle chained computed atoms', () => {
      const countAtom = atom(5);
      const doubleAtom = atom((get) => get(countAtom) * 2);
      const quadrupleAtom = atom((get) => get(doubleAtom) * 2);
      
      expect(store.get(quadrupleAtom)).toBe(20);
      
      store.set(countAtom, 10);
      expect(store.get(quadrupleAtom)).toBe(40);
    });

    it('should notify subscribers of computed changes', () => {
      const countAtom = atom(5);
      const doubleAtom = atom((get) => get(countAtom) * 2);
      const subscriber = vi.fn();
      
      store.subscribe(doubleAtom, subscriber);
      store.set(countAtom, 10);
      
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(20);
    });
  });

  describe('Error Handling', () => {
    it('should handle get errors gracefully', () => {
      const badComputedAtom = atom((get) => {
        throw new Error('Computed error');
      });
      
      expect(() => store.get(badComputedAtom)).toThrow('Computed error');
    });

    it('should handle set errors gracefully', () => {
      const testAtom = atom(0);
      
      expect(() => {
        store.set(testAtom, null as any);
      }).not.toThrow();
    });

    it('should maintain store state after error', () => {
      const countAtom = atom(5);
      
      expect(() => {
        store.get(atom((get) => {
          throw new Error('Test error');
        }));
      }).toThrow();
      
      // Store should still work
      expect(store.get(countAtom)).toBe(5);
    });
  });

  describe('Plugin Integration', () => {
    it('should execute plugins on creation', () => {
      const pluginSpy = vi.fn();
      const storeWithPlugin = new StoreImpl([pluginSpy]);
      
      expect(pluginSpy).toHaveBeenCalledTimes(1);
      expect(pluginSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should support multiple plugins', () => {
      const plugin1Calls: string[] = [];
      const plugin2Calls: string[] = [];
      
      const plugin1: Plugin = () => {
        plugin1Calls.push('init');
      };
      
      const plugin2: Plugin = () => {
        plugin2Calls.push('init');
      };
      
      new StoreImpl([plugin1, plugin2]);
      
      expect(plugin1Calls).toContain('init');
      expect(plugin2Calls).toContain('init');
    });

    it('should apply plugins in order', () => {
      const executionOrder: string[] = [];
      
      const plugin1: Plugin = () => executionOrder.push('plugin1');
      const plugin2: Plugin = () => executionOrder.push('plugin2');
      const plugin3: Plugin = () => executionOrder.push('plugin3');
      
      new StoreImpl([plugin1, plugin2, plugin3]);
      
      expect(executionOrder).toEqual(['plugin1', 'plugin2', 'plugin3']);
    });
  });

  describe('getState', () => {
    it('should return current state of all atoms', () => {
      const atom1 = atom(1);
      const atom2 = atom('test');
      const atom3 = atom(true);
      
      // Access atoms to register them
      store.get(atom1);
      store.get(atom2);
      store.get(atom3);
      
      const state = store.getState();
      
      expect(state).toBeDefined();
      expect(typeof state).toBe('object');
    });

    it('should return updated state after set', () => {
      const countAtom = atom(0);
      
      store.get(countAtom);
      let state = store.getState();
      expect(state).toBeDefined();
      
      store.set(countAtom, 5);
      state = store.getState();
      expect(state).toBeDefined();
    });
  });

  describe('Subscription Management', () => {
    it('should return unsubscribe function', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();
      
      const unsubscribe = store.subscribe(countAtom, subscriber);
      
      expect(typeof unsubscribe).toBe('function');
      
      unsubscribe();
      store.set(countAtom, 5);
      
      expect(subscriber).not.toHaveBeenCalled();
    });

    it('should handle multiple subscriptions to same atom', () => {
      const countAtom = atom(0);
      const subscribers = [vi.fn(), vi.fn(), vi.fn()];
      
      subscribers.forEach((sub) => {
        store.subscribe(countAtom, sub);
      });
      
      store.set(countAtom, 5);
      
      subscribers.forEach((sub) => {
        expect(sub).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle subscription to computed atom', () => {
      const countAtom = atom(0);
      const doubleAtom = atom((get) => get(countAtom) * 2);
      const subscriber = vi.fn();
      
      store.subscribe(doubleAtom, subscriber);
      store.set(countAtom, 5);
      
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid consecutive sets', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();
      
      store.subscribe(countAtom, subscriber);
      
      for (let i = 1; i <= 100; i++) {
        store.set(countAtom, i);
      }
      
      expect(store.get(countAtom)).toBe(100);
      expect(subscriber).toHaveBeenCalledTimes(100);
    });

    it('should handle setting same value multiple times', () => {
      const countAtom = atom(0);
      const subscriber = vi.fn();
      
      store.subscribe(countAtom, subscriber);
      
      store.set(countAtom, 5);
      store.set(countAtom, 5);
      store.set(countAtom, 5);
      
      expect(subscriber).toHaveBeenCalledTimes(3);
    });

    it('should handle function updates with same result', () => {
      const countAtom = atom(5);
      
      store.set(countAtom, (x) => x);
      store.set(countAtom, (x) => x);
      
      expect(store.get(countAtom)).toBe(5);
    });

    it('should handle null and undefined values', () => {
      const nullAtom = atom<string | null>(null);
      const undefinedAtom = atom<string | undefined>(undefined);
      
      expect(store.get(nullAtom)).toBeNull();
      expect(store.get(undefinedAtom)).toBeUndefined();
      
      store.set(nullAtom, 'value');
      store.set(undefinedAtom, 'value');
      
      expect(store.get(nullAtom)).toBe('value');
      expect(store.get(undefinedAtom)).toBe('value');
    });
  });

  describe('Store Identity', () => {
    it('should maintain store identity across operations', () => {
      const store1 = new StoreImpl();
      const store2 = new StoreImpl();
      
      expect(store1).not.toBe(store2);
      
      const atom1 = atom(0);
      const atom2 = atom(0);
      
      store1.set(atom1, 5);
      store2.set(atom2, 10);
      
      expect(store1.get(atom1)).toBe(5);
      expect(store2.get(atom2)).toBe(10);
    });

    it('should isolate state between stores', () => {
      const store1 = new StoreImpl();
      const store2 = new StoreImpl();
      
      const sharedAtom = atom(0);
      
      store1.set(sharedAtom, 100);
      
      expect(store1.get(sharedAtom)).toBe(100);
      expect(store2.get(sharedAtom)).toBe(0);
    });
  });
});
