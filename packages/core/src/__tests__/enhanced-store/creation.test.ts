/**
 * Tests for createEnhancedStore: creation and basic functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createEnhancedStore } from '../../enhanced-store';
import { atom } from '../../atom';
import { AtomRegistry } from '../../atom-registry';

describe('createEnhancedStore', () => {
  let registry: AtomRegistry;

  beforeEach(() => {
    registry = AtomRegistry.getInstance();
    registry.clear();
  });

  describe('Store creation', () => {
    it('should create store without parameters', () => {
      const store = createEnhancedStore();

      expect(store).toBeDefined();
      expect(typeof store.get).toBe('function');
      expect(typeof store.set).toBe('function');
      expect(typeof store.subscribe).toBe('function');
      expect(typeof store.getState).toBe('function');
    });

    it('should create store with empty plugins array', () => {
      const store = createEnhancedStore([]);

      expect(store).toBeDefined();
      expect(store.getPlugins?.()).toEqual([]);
    });

    it('should create store with plugins', () => {
      const plugin = vi.fn();
      const store = createEnhancedStore([plugin]);

      expect(plugin).toHaveBeenCalled();
    });

    it('should return a working store', () => {
      const store = createEnhancedStore();
      const countAtom = atom(0);

      expect(store.get(countAtom)).toBe(0);
      store.set(countAtom, 5);
      expect(store.get(countAtom)).toBe(5);
    });
  });

  describe('enableDevTools option', () => {
    it('should add connectDevTools when enableDevTools: true', () => {
      const store = createEnhancedStore([], { enableDevTools: true });

      expect(store.connectDevTools).toBeDefined();
      expect(typeof store.connectDevTools).toBe('function');
    });

    it('should add connectDevTools by default', () => {
      const store = createEnhancedStore();

      expect(store.connectDevTools).toBeDefined();
    });

    it('should not add connectDevTools when enableDevTools: false', () => {
      const store = createEnhancedStore([], { enableDevTools: false });

      expect(store.connectDevTools).toBeUndefined();
    });

    it('should call console.log on connectDevTools', () => {
      const store = createEnhancedStore([], { enableDevTools: true, devToolsName: 'TestStore' });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      store.connectDevTools?.();

      expect(logSpy).toHaveBeenCalledWith('DevTools connected for store:', 'TestStore');

      logSpy.mockRestore();
    });
  });

  describe('devToolsName option', () => {
    it('should use custom name in connectDevTools', () => {
      const store = createEnhancedStore([], {
        enableDevTools: true,
        devToolsName: 'MyCustomStore',
      });

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      store.connectDevTools?.();

      expect(logSpy).toHaveBeenCalledWith('DevTools connected for store:', 'MyCustomStore');

      logSpy.mockRestore();
    });

    it('should use default name', () => {
      const store = createEnhancedStore([], { enableDevTools: true });

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      store.connectDevTools?.();

      expect(logSpy).toHaveBeenCalledWith('DevTools connected for store:', 'EnhancedStore');

      logSpy.mockRestore();
    });
  });

  describe('registryMode option', () => {
    it('should attach store to registry in global mode', () => {
      const store = createEnhancedStore([], { registryMode: 'global' });

      const storesMap = registry.getStoresMap();
      expect(storesMap.has(store)).toBe(true);
    });

    it('should attach store to registry in isolated mode', () => {
      const store = createEnhancedStore([], { registryMode: 'isolated' });

      const storesMap = registry.getStoresMap();
      expect(storesMap.has(store)).toBe(true);
    });

    it('should attach store by default (global)', () => {
      const store = createEnhancedStore();

      const storesMap = registry.getStoresMap();
      expect(storesMap.has(store)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should work with undefined options', () => {
      const store = createEnhancedStore([], undefined as any);

      expect(store).toBeDefined();
      expect(typeof store.get).toBe('function');
    });

    it('should work with empty options', () => {
      const store = createEnhancedStore([], {});

      expect(store).toBeDefined();
    });

    it('should create independent stores', () => {
      const store1 = createEnhancedStore();
      const store2 = createEnhancedStore();

      const atom1 = atom(1);
      const atom2 = atom(2);

      store1.set(atom1, 10);
      store2.set(atom2, 20);

      expect(store1.get(atom1)).toBe(10);
      expect(store2.get(atom2)).toBe(20);
      expect(store1.get(atom2)).toBe(2); // Default value
    });
  });
});
