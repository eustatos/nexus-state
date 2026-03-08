import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DevToolsIntegration } from './DevToolsIntegration';
import { createMockStore, createMockAtom } from '../test-utils/index';

describe('DevToolsIntegration', () => {
  let devTools: DevToolsIntegration;

  beforeEach(() => {
    devTools = new DevToolsIntegration();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const dt = new DevToolsIntegration();
      expect(dt.getConfig()).toEqual({
        enabled: false,
        enableStackTrace: false,
        debounceDelay: 100,
      });
    });

    it('should create with custom config', () => {
      const dt = new DevToolsIntegration({
        enabled: true,
        enableStackTrace: true,
        debounceDelay: 200,
      });
      expect(dt.getConfig()).toEqual({
        enabled: true,
        enableStackTrace: true,
        debounceDelay: 200,
      });
    });

    it('should create with partial custom config', () => {
      const dt = new DevToolsIntegration({
        enabled: true,
      });
      expect(dt.getConfig()).toEqual({
        enabled: true,
        enableStackTrace: false,
        debounceDelay: 100,
      });
    });
  });

  describe('trackStateChange', () => {
    it('should not track when disabled', () => {
      const atom = createMockAtom('testAtom', 'initial');
      devTools.trackStateChange(atom, 'new value');
      
      expect(devTools.getPendingUpdates()).toHaveLength(0);
    });

    it('should track state changes when enabled', () => {
      devTools.enable();
      const atom = createMockAtom('testAtom', 'initial');
      
      devTools.trackStateChange(atom, 'new value');
      
      const updates = devTools.getPendingUpdates();
      expect(updates).toHaveLength(1);
      expect(updates[0].atomName).toBe('testAtom');
      expect(updates[0].value).toBe('new value');
      expect(updates[0].timestamp).toBeDefined();
    });

    it('should use atom toString when name is not available', () => {
      devTools.enable();
      const atom = { id: Symbol('test'), toString: () => 'CustomAtom' };
      
      devTools.trackStateChange(atom as any, 'value');
      
      const updates = devTools.getPendingUpdates();
      expect(updates[0].atomName).toBe('CustomAtom');
    });

    it('should schedule flush after tracking', () => {
      vi.useFakeTimers();
      devTools.enable();
      const atom = createMockAtom('testAtom', 'initial');
      
      devTools.trackStateChange(atom, 'value');
      
      // Advance timer to trigger debounce
      vi.advanceTimersByTime(150);
      
      // Updates should be flushed
      expect(devTools.getPendingUpdates()).toHaveLength(0);
      vi.useRealTimers();
    });
  });

  describe('trackAction', () => {
    it('should not track when disabled', () => {
      devTools.trackAction({ type: 'TEST', timestamp: Date.now() });
      expect(devTools.getActions()).toHaveLength(0);
    });

    it('should track actions when enabled', () => {
      devTools.enable();
      const action = { type: 'TEST_ACTION', timestamp: 12345 };
      
      devTools.trackAction(action);
      
      const actions = devTools.getActions();
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual(action);
    });

    it('should track multiple actions', () => {
      devTools.enable();
      
      devTools.trackAction({ type: 'ACTION_1', timestamp: 1 });
      devTools.trackAction({ type: 'ACTION_2', timestamp: 2 });
      devTools.trackAction({ type: 'ACTION_3', timestamp: 3 });
      
      const actions = devTools.getActions();
      expect(actions).toHaveLength(3);
    });
  });

  describe('setWithMetadata', () => {
    it('should set value without metadata', () => {
      const atom = createMockAtom('testAtom', 'initial');
      const setFn = vi.fn();
      
      devTools.setWithMetadata(atom, 'new value', undefined, setFn);
      
      expect(setFn).toHaveBeenCalledWith(atom, 'new value');
    });

    it('should set value with metadata', () => {
      devTools.enable();
      const atom = createMockAtom('testAtom', 'initial');
      const setFn = vi.fn();
      const metadata = { type: 'CUSTOM_ACTION' };
      
      devTools.setWithMetadata(atom, 'new value', metadata, setFn);
      
      expect(setFn).toHaveBeenCalledWith(atom, 'new value');
      expect(devTools.getActions()).toHaveLength(1);
      expect(devTools.getActions()[0].type).toBe('CUSTOM_ACTION');
    });

    it('should add stack trace when enabled', () => {
      devTools = new DevToolsIntegration({ enableStackTrace: true });
      devTools.enable();
      const atom = createMockAtom('testAtom', 'initial');
      const setFn = vi.fn();
      const metadata: any = { type: 'ACTION' };
      
      devTools.setWithMetadata(atom, 'new value', metadata, setFn);
      
      expect(metadata.stackTrace).toBeDefined();
      expect(typeof metadata.stackTrace).toBe('string');
    });

    it('should handle function updates', () => {
      const atom = createMockAtom('testAtom', 0);
      const setFn = vi.fn();
      const updateFn = (prev: number) => prev + 1;
      
      devTools.setWithMetadata(atom, updateFn, undefined, setFn);
      
      expect(setFn).toHaveBeenCalledWith(atom, updateFn);
    });
  });

  describe('serializeState', () => {
    it('should serialize store state', () => {
      const store = createMockStore();
      store.set(createMockAtom('atom1', 'value1'), 'value1');
      store.set(createMockAtom('atom2', 42), 42);
      
      const serialized = devTools.serializeState(store);
      
      expect(serialized).toBeDefined();
      expect(typeof serialized).toBe('object');
    });
  });

  describe('createInterceptedGetter', () => {
    it('should create getter wrapper', () => {
      const originalGet = vi.fn((atom) => atom.name);
      const interceptedGet = devTools.createInterceptedGetter(originalGet);
      const atom = createMockAtom('testAtom', 'value');
      
      const result = interceptedGet(atom);
      
      expect(result).toBe('testAtom');
      expect(originalGet).toHaveBeenCalledWith(atom);
    });
  });

  describe('createInterceptedSetter', () => {
    it('should create setter wrapper with metadata', () => {
      devTools.enable();
      const originalSet = vi.fn();
      const interceptedSet = devTools.createInterceptedSetter(originalSet);
      const atom = createMockAtom('testAtom', 'initial');
      
      interceptedSet(atom, 'new value');
      
      expect(originalSet).toHaveBeenCalledWith(atom, 'new value');
      expect(devTools.getActions()).toHaveLength(1);
      expect(devTools.getActions()[0].type).toBe('SET');
    });

    it('should handle function updates', () => {
      devTools.enable();
      const originalSet = vi.fn();
      const interceptedSet = devTools.createInterceptedSetter(originalSet);
      const atom = createMockAtom('testAtom', 0);
      const updateFn = (prev: number) => prev + 1;
      
      interceptedSet(atom, updateFn);
      
      expect(originalSet).toHaveBeenCalledWith(atom, updateFn);
    });
  });

  describe('enable/disable', () => {
    it('should enable devtools', () => {
      expect(devTools.getConfig().enabled).toBe(false);
      devTools.enable();
      expect(devTools.getConfig().enabled).toBe(true);
    });

    it('should disable devtools', () => {
      devTools.enable();
      expect(devTools.getConfig().enabled).toBe(true);
      devTools.disable();
      expect(devTools.getConfig().enabled).toBe(false);
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      devTools.configure({ enabled: true });
      expect(devTools.getConfig().enabled).toBe(true);
    });

    it('should update multiple config options', () => {
      devTools.configure({
        enabled: true,
        enableStackTrace: true,
        debounceDelay: 500,
      });
      expect(devTools.getConfig()).toEqual({
        enabled: true,
        enableStackTrace: true,
        debounceDelay: 500,
      });
    });

    it('should preserve existing config when partial update', () => {
      devTools.configure({ enabled: true });
      devTools.configure({ debounceDelay: 300 });
      
      expect(devTools.getConfig()).toEqual({
        enabled: true,
        enableStackTrace: false,
        debounceDelay: 300,
      });
    });
  });

  describe('clear', () => {
    it('should clear pending updates', () => {
      devTools.enable();
      const atom = createMockAtom('testAtom', 'initial');
      devTools.trackStateChange(atom, 'value');
      
      expect(devTools.getPendingUpdates()).toHaveLength(1);
      devTools.clear();
      expect(devTools.getPendingUpdates()).toHaveLength(0);
    });

    it('should clear tracked actions', () => {
      devTools.enable();
      devTools.trackAction({ type: 'TEST', timestamp: 1 });
      
      expect(devTools.getActions()).toHaveLength(1);
      devTools.clear();
      expect(devTools.getActions()).toHaveLength(0);
    });

    it('should clear debounce timer', () => {
      vi.useFakeTimers();
      devTools.enable();
      const atom = createMockAtom('testAtom', 'initial');
      devTools.trackStateChange(atom, 'value');
      
      const updatesBeforeClear = devTools.getPendingUpdates().length;
      devTools.clear();
      
      // Updates should be cleared
      expect(devTools.getPendingUpdates()).toHaveLength(0);
      
      // After clear, new tracking should work
      devTools.trackStateChange(atom, 'another value');
      vi.advanceTimersByTime(150);
      
      // Should be flushed after timer
      expect(devTools.getPendingUpdates()).toHaveLength(0);
      vi.useRealTimers();
    });
  });

  describe('getPendingUpdates', () => {
    it('should return copy of pending updates', () => {
      devTools.enable();
      const atom = createMockAtom('testAtom', 'initial');
      devTools.trackStateChange(atom, 'value');
      
      const updates1 = devTools.getPendingUpdates();
      const updates2 = devTools.getPendingUpdates();
      
      expect(updates1).toEqual(updates2);
      expect(updates1).not.toBe(updates2); // Should be a copy
    });
  });

  describe('getActions', () => {
    it('should return copy of tracked actions', () => {
      devTools.enable();
      devTools.trackAction({ type: 'TEST', timestamp: 1 });
      
      const actions1 = devTools.getActions();
      const actions2 = devTools.getActions();
      
      expect(actions1).toEqual(actions2);
      expect(actions1).not.toBe(actions2); // Should be a copy
    });
  });

  describe('integration', () => {
    it('should work with full workflow', () => {
      vi.useFakeTimers();
      devTools = new DevToolsIntegration({
        enabled: true,
        enableStackTrace: true,
        debounceDelay: 50,
      });

      const atom = createMockAtom('testAtom', 'initial');
      const setFn = vi.fn();

      // Set with metadata
      devTools.setWithMetadata(atom, 'new value', { type: 'SET_VALUE' }, setFn);
      expect(setFn).toHaveBeenCalledWith(atom, 'new value');

      // Track state change
      devTools.trackStateChange(atom, 'new value');

      // Check actions
      const actions = devTools.getActions();
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('SET_VALUE');

      // Flush updates
      vi.advanceTimersByTime(100);
      expect(devTools.getPendingUpdates()).toHaveLength(0);
      vi.useRealTimers();
    });

    it('should handle disable during pending operations', () => {
      devTools.enable();
      const atom = createMockAtom('testAtom', 'initial');
      
      devTools.trackStateChange(atom, 'value');
      devTools.disable();
      
      // Should not track anymore
      devTools.trackStateChange(atom, 'another value');
      
      // First update still pending, second not tracked
      expect(devTools.getPendingUpdates()).toHaveLength(1);
    });
  });
});
