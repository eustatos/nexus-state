/**
 * Tests for store creation functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createStore, createEnhancedStore } from './store';
import { atom } from './atom';
import { atomRegistry } from './atom-registry';
import type { Plugin } from './types';

describe('createStore', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  describe('Basic creation', () => {
    it('should create a store without parameters', () => {
      const store = createStore();

      expect(store).toBeDefined();
      expect(typeof store.get).toBe('function');
      expect(typeof store.set).toBe('function');
      expect(typeof store.subscribe).toBe('function');
      expect(typeof store.getState).toBe('function');
    });

    it('should create a store with empty plugins array', () => {
      const store = createStore([]);

      expect(store).toBeDefined();
    });

    it('should create a store with plugins', () => {
      const pluginSpy = vi.fn();
      const store = createStore([pluginSpy]);

      expect(pluginSpy).toHaveBeenCalledTimes(1);
      expect(pluginSpy).toHaveBeenCalledWith(store);
    });

    it('should create a store with multiple plugins', () => {
      const plugin1 = vi.fn();
      const plugin2 = vi.fn();
      const plugin3 = vi.fn();

      const store = createStore([plugin1, plugin2, plugin3]);

      expect(plugin1).toHaveBeenCalledTimes(1);
      expect(plugin2).toHaveBeenCalledTimes(1);
      expect(plugin3).toHaveBeenCalledTimes(1);
    });
  });

  describe('Store functionality', () => {
    it('should get and set primitive atom values', () => {
      const store = createStore();
      const countAtom = atom(0);

      expect(store.get(countAtom)).toBe(0);

      store.set(countAtom, 5);
      expect(store.get(countAtom)).toBe(5);
    });

    it('should set atom value with function update', () => {
      const store = createStore();
      const countAtom = atom(0);

      store.set(countAtom, (prev) => prev + 10);
      expect(store.get(countAtom)).toBe(10);

      store.set(countAtom, (prev) => prev * 2);
      expect(store.get(countAtom)).toBe(20);
    });

    it('should subscribe to atom changes', () => {
      const store = createStore();
      const countAtom = atom(0);
      const subscriber = vi.fn();

      store.subscribe(countAtom, subscriber);

      store.set(countAtom, 5);

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(5);
    });

    it('should unsubscribe from atom changes', () => {
      const store = createStore();
      const countAtom = atom(0);
      const subscriber = vi.fn();

      const unsubscribe = store.subscribe(countAtom, subscriber);

      store.set(countAtom, 5);
      expect(subscriber).toHaveBeenCalledTimes(1);

      unsubscribe();

      store.set(countAtom, 10);
      expect(subscriber).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should compute derived values', () => {
      const store = createStore();
      const countAtom = atom(5);
      const doubleAtom = atom((get) => get(countAtom) * 2);

      expect(store.get(doubleAtom)).toBe(10);

      store.set(countAtom, 10);
      expect(store.get(doubleAtom)).toBe(20);
    });

    it('should return state of all atoms', () => {
      const store = createStore();
      const atom1 = atom(1);
      const atom2 = atom(2);

      const state = store.getState();

      expect(state).toBeDefined();
      expect(typeof state).toBe('object');
    });
  });

  describe('Plugin integration', () => {
    it('should apply plugin that modifies store behavior', () => {
      const store = createStore();

      const loggingPlugin: Plugin = (store) => {
        const originalSet = store.set.bind(store);
        store.set = ((atom, update) => {
          originalSet(atom, update);
        }) as any;
      };

      store.applyPlugin?.(loggingPlugin);

      const countAtom = atom(0);
      store.set(countAtom, 5);

      expect(store.get(countAtom)).toBe(5);
    });

    it('should apply plugin with hooks', () => {
      const store = createStore();

      const hookPlugin: Plugin = () => ({
        onSet: (atom, value) => value * 2,
      });

      store.applyPlugin?.(hookPlugin);

      const countAtom = atom(0);
      store.set(countAtom, 5);

      expect(store.get(countAtom)).toBe(10);
    });

    it('should apply multiple plugins in order', () => {
      const store = createStore();
      const executionOrder: string[] = [];

      const plugin1: Plugin = () => ({
        onSet: (atom, value) => {
          executionOrder.push('plugin1');
          return value + 1;
        },
      });

      const plugin2: Plugin = () => ({
        onSet: (atom, value) => {
          executionOrder.push('plugin2');
          return value * 2;
        },
      });

      store.applyPlugin?.(plugin1);
      store.applyPlugin?.(plugin2);

      const countAtom = atom(0);
      store.set(countAtom, 5);

      expect(executionOrder).toEqual(['plugin1', 'plugin2']);
      expect(store.get(countAtom)).toBe(12); // (5 + 1) * 2
    });
  });

  describe('Edge cases', () => {
    it('should handle null values', () => {
      const store = createStore();
      const nullAtom = atom<number | null>(null);

      expect(store.get(nullAtom)).toBe(null);

      store.set(nullAtom, 42);
      expect(store.get(nullAtom)).toBe(42);

      store.set(nullAtom, null);
      expect(store.get(nullAtom)).toBe(null);
    });

    it('should handle undefined values', () => {
      const store = createStore();
      const undefinedAtom = atom<number | undefined>(undefined);

      expect(store.get(undefinedAtom)).toBe(undefined);

      store.set(undefinedAtom, 42);
      expect(store.get(undefinedAtom)).toBe(42);

      store.set(undefinedAtom, undefined);
      expect(store.get(undefinedAtom)).toBe(undefined);
    });

    it('should handle object values', () => {
      type State = { count: number; name: string };
      const store = createStore();
      const objectAtom = atom<State>({ count: 0, name: 'test' });

      expect(store.get(objectAtom)).toEqual({ count: 0, name: 'test' });

      store.set(objectAtom, { count: 5, name: 'updated' });
      expect(store.get(objectAtom)).toEqual({ count: 5, name: 'updated' });
    });

    it('should handle array values', () => {
      const store = createStore();
      const arrayAtom = atom<number[]>([1, 2, 3]);

      expect(store.get(arrayAtom)).toEqual([1, 2, 3]);

      store.set(arrayAtom, [4, 5, 6]);
      expect(store.get(arrayAtom)).toEqual([4, 5, 6]);
    });

    it('should handle function updates with object values', () => {
      type State = { count: number };
      const store = createStore();
      const objectAtom = atom<State>({ count: 0 });

      store.set(objectAtom, (prev) => ({ count: prev.count + 1 }));
      expect(store.get(objectAtom)).toEqual({ count: 1 });
    });
  });

  describe('Multiple stores', () => {
    it('should create independent stores', () => {
      const store1 = createStore();
      const store2 = createStore();

      const atom1 = atom(0);
      const atom2 = atom(0);

      store1.set(atom1, 10);
      store2.set(atom2, 20);

      expect(store1.get(atom1)).toBe(10);
      expect(store2.get(atom2)).toBe(20);
    });

    it('should have independent state for different store instances', () => {
      const store1 = createStore();
      const store2 = createStore();

      const atom1 = atom(0);
      const atom2 = atom(0);

      store1.set(atom1, 10);
      store2.set(atom2, 20);

      // Each store maintains its own state
      expect(store1.get(atom1)).toBe(10);
      expect(store2.get(atom2)).toBe(20);
      expect(store1.get(atom2)).toBe(0); // Default value in store1
    });
  });
});

describe('createEnhancedStore', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('should create enhanced store without parameters', () => {
    const store = createEnhancedStore();

    expect(store).toBeDefined();
    expect(typeof store.get).toBe('function');
    expect(typeof store.set).toBe('function');
  });

  it('should create enhanced store with options', () => {
    const store = createEnhancedStore({
      enableDevTools: false,
      enableStackTrace: true,
      debounceDelay: 100,
    });

    expect(store).toBeDefined();
  });

  it('should be compatible with createStore', () => {
    const basicStore = createStore();
    const enhancedStore = createEnhancedStore();

    const countAtom = atom(0);

    basicStore.set(countAtom, 5);
    enhancedStore.set(countAtom, 10);

    expect(basicStore.get(countAtom)).toBe(5);
    expect(enhancedStore.get(countAtom)).toBe(10);
  });
});

describe('Store setState method', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('should set multiple atoms by name', () => {
    const store = createStore();
    const userAtom = atom({ name: 'Anonymous' }, 'user');
    const countAtom = atom(0, 'count');

    // Initialize atoms by accessing them first
    store.get(userAtom);
    store.get(countAtom);

    // Use setState to update both
    store.setState({ user: { name: 'John' }, count: 42 });

    expect(store.get(userAtom)).toEqual({ name: 'John' });
    expect(store.get(countAtom)).toBe(42);
  });

  it('should return store for chaining', () => {
    const store = createStore();
    const userAtom = atom({ name: 'Anonymous' }, 'user');

    store.get(userAtom);
    const result = store.setState({ user: { name: 'Jane' } });

    expect(result).toBe(store);
  });
});

describe('Store reset method', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('should reset atom to default value', () => {
    const store = createStore();
    const countAtom = atom(42, 'count');

    // Change value
    store.set(countAtom, 100);
    expect(store.get(countAtom)).toBe(100);

    // Reset to default
    store.reset(countAtom);
    expect(store.get(countAtom)).toBe(42);
  });
});

describe('Store clear method', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('should clear all atoms to default values', () => {
    const store = createStore();
    const countAtom = atom(0, 'count');
    const userAtom = atom({ name: 'Anonymous' }, 'user');

    // Change values
    store.set(countAtom, 100);
    store.set(userAtom, { name: 'John' });

    // Clear all
    store.clear();

    expect(store.get(countAtom)).toBe(0);
    expect(store.get(userAtom)).toEqual({ name: 'Anonymous' });
  });
});
