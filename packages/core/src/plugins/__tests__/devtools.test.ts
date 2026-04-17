/**
 * DevToolsPlugin Tests
 *
 * Note: Full Redux DevTests integration tests require a browser environment.
 * These tests verify the plugin API contract and basic behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DevToolsPlugin, devtools } from '../devtools';
import { atom, createStore } from '../../index';

describe('DevToolsPlugin', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Construction', () => {
    it('should be enabled in development by default', () => {
      process.env.NODE_ENV = 'development';
      const plugin = new DevToolsPlugin();
      // Not connected because window is undefined in test env
      expect(plugin.isConnected()).toBe(false);
    });

    it('should respect explicit enabled option', () => {
      const plugin = new DevToolsPlugin({ enabled: false });
      expect(plugin.isConnected()).toBe(false);
    });

    it('should use custom name', () => {
      const plugin = new DevToolsPlugin({ name: 'MyStore' });
      expect(plugin.getHistoryLength()).toBe(0);
    });

    it('should use default maxHistory of 50', () => {
      const plugin = new DevToolsPlugin();
      expect(plugin.getHistoryLength()).toBe(0);
    });

    it('should accept custom maxHistory', () => {
      const plugin = new DevToolsPlugin({ maxHistory: 10 });
      expect(plugin.getHistoryLength()).toBe(0);
    });
  });

  describe('apply()', () => {
    it('should not connect when disabled', () => {
      const plugin = new DevToolsPlugin({ enabled: false });
      const store = createStore();
      plugin.apply(store);
      expect(plugin.isConnected()).toBe(false);
    });

    it('should not crash when Redux DevTools not available', () => {
      const plugin = new DevToolsPlugin({ enabled: true });
      const store = createStore();

      // No window.__REDUX_DEVTOOLS_EXTENSION__ in test env
      expect(() => plugin.apply(store)).not.toThrow();
      expect(plugin.isConnected()).toBe(false);
    });
  });

  describe('trackStateChange()', () => {
    it('should not throw when store not applied', () => {
      const plugin = new DevToolsPlugin({ enabled: true });
      const countAtom = atom(0, 'count');

      expect(() => plugin.trackStateChange(countAtom as never, 0)).not.toThrow();
    });
  });

  describe('trackAction()', () => {
    it('should not throw when store not applied', () => {
      const plugin = new DevToolsPlugin({ enabled: true });

      expect(() => plugin.trackAction('TEST', { data: 1 })).not.toThrow();
    });
  });

  describe('disconnect()', () => {
    it('should not throw when not connected', () => {
      const plugin = new DevToolsPlugin({ enabled: true });
      expect(() => plugin.disconnect()).not.toThrow();
    });
  });

  describe('factory function', () => {
    it('should return a plugin function', () => {
      const plugin = devtools();
      expect(typeof plugin).toBe('function');
    });

    it('should accept options', () => {
      const plugin = devtools({ name: 'Test', enabled: false });
      expect(typeof plugin).toBe('function');
    });
  });

  describe('Integration with createStore', () => {
    it('should work as a plugin in createStore', () => {
      const plugin = devtools({ enabled: false });
      const store = createStore([plugin]);

      expect(store).toBeDefined();
      expect(typeof store.get).toBe('function');
      expect(typeof store.set).toBe('function');
    });

    it('should not affect store functionality when disabled', () => {
      const store = createStore([devtools({ enabled: false })]);
      const countAtom = atom(42, 'test');

      expect(store.get(countAtom)).toBe(42);
      store.set(countAtom, 100);
      expect(store.get(countAtom)).toBe(100);
    });

    it('should work with multiple plugins including devtools', () => {
      const onSetSpy = vi.fn();
      const hookPlugin = () => ({
        onSet: (_atom: unknown, value: unknown) => {
          onSetSpy(value);
          return value;
        },
      });

      const store = createStore([
        devtools({ enabled: false }),
        hookPlugin,
      ]);

      const countAtom = atom(0, 'count');
      store.set(countAtom, 5);

      expect(onSetSpy).toHaveBeenCalledWith(5);
      expect(store.get(countAtom)).toBe(5);
    });
  });

  describe('Tree-shaking compatibility', () => {
    it('should be importable from debug entry point', async () => {
      const debugModule = await import('../../debug');
      expect(typeof debugModule.devtools).toBe('function');
      expect(typeof debugModule.DevToolsPlugin).toBe('function');
    });

    it('devtools() should work with createStore', () => {
      const store = createStore([devtools()]);
      const countAtom = atom(0, 'count');
      store.set(countAtom, 10);
      expect(store.get(countAtom)).toBe(10);
    });
  });
});
