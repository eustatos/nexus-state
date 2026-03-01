// Tests for store enhancements
// Implements requirements from TASK-002-ENHANCE-STORE-DEVTOOLS-INTEGRATION

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom } from '../../packages/core/atom';
import { createEnhancedStore } from '../../packages/core/enhanced-store';
import { serializeState } from '../../packages/core/utils/serialization';
import { globalActionTracker } from '../../packages/core/utils/action-tracker';

describe('Enhanced Store', () => {
  beforeEach(() => {
    // Clear action history before each test
    globalActionTracker.clearHistory();
  });

  describe('Plugin System', () => {
    it('should apply plugins during store creation', () => {
      const initMock = vi.fn();
      const disposeMock = vi.fn();
      
      const plugin = {
        init: initMock,
        dispose: disposeMock,
      };
      
      const store = createEnhancedStore([plugin]);
      
      expect(initMock).toHaveBeenCalledWith(store);
      expect(store.getPlugins()).toHaveLength(1);
    });
    
    it('should apply plugins using applyPlugin method', () => {
      const plugin = {
        init: vi.fn(),
      };
      
      const store = createEnhancedStore();
      store.applyPlugin(plugin);
      
      expect(plugin.init).toHaveBeenCalledWith(store);
      expect(store.getPlugins()).toHaveLength(1);
    });
  });

  describe('State Serialization', () => {
    it('should serialize primitive values correctly', () => {
      const countAtom = atom(42);
      const textAtom = atom('hello');
      const flagAtom = atom(true);
      const nullAtom = atom(null);
      const undefinedAtom = atom(undefined);
      
      const store = createEnhancedStore();
      
      // Set values
      store.set(countAtom, 42);
      store.set(textAtom, 'hello');
      store.set(flagAtom, true);
      store.set(nullAtom, null);
      store.set(undefinedAtom, undefined);
      
      const serialized = store.serializeState();
      
      expect(serialized[countAtom.toString()]).toBe(42);
      expect(serialized[textAtom.toString()]).toBe('hello');
      expect(serialized[flagAtom.toString()]).toBe(true);
      expect(serialized[nullAtom.toString()]).toBe(null);
      expect(serialized[undefinedAtom.toString()]).toBe(undefined);
    });
    
    it('should handle circular references safely', () => {
      const obj: Record<string, unknown> = { a: 1, self: null as unknown };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj as any).self = obj; // Circular reference

      const circularAtom = atom(obj);
      const store = createEnhancedStore();
      store.set(circularAtom, obj);

      const serialized = store.serializeState();
      expect(serialized[circularAtom.toString()]).toContain('[Circular Reference:');
    });
    
    it('should serialize arrays correctly', () => {
      const arrayAtom = atom([1, 2, 3]);
      const store = createEnhancedStore();
      store.set(arrayAtom, [1, 2, 3]);
      
      const serialized = store.serializeState();
      expect(serialized[arrayAtom.toString()]).toEqual([1, 2, 3]);
    });
    
    it('should handle complex objects', () => {
      const complexAtom = atom({
        nested: {
          value: 'test',
          array: [1, 2, { deep: true }],
        },
        date: new Date('2023-01-01'),
      });
      
      const store = createEnhancedStore();
      store.set(complexAtom, {
        nested: {
          value: 'test',
          array: [1, 2, { deep: true }],
        },
        date: new Date('2023-01-01'),
      });
      
      const serialized = store.serializeState();
      const result = serialized[complexAtom.toString()];
      
      expect(result.nested.value).toBe('test');
      expect(result.nested.array).toEqual([1, 2, { deep: true }]);
      expect(result.date).toContain('[Date:');
    });
  });

  describe('Action Metadata Tracking', () => {
    it('should track actions with metadata', () => {
      const countAtom = atom(0);
      const store = createEnhancedStore();
      
      // Track an action
      const metadata = {
        type: 'INCREMENT',
        source: 'CounterComponent',
        timestamp: Date.now(),
      };
      
      store.setWithMetadata(countAtom, prev => prev + 1, metadata);
      
      expect(store.get(countAtom)).toBe(1);
    });
    
    it('should capture stack traces when enabled', () => {
      const countAtom = atom(0);
      const store = createEnhancedStore([], {
        enableStackTrace: true,
      });
      
      store.setWithMetadata(countAtom, 5, {
        type: 'SET',
        timestamp: Date.now(),
      });
      
      expect(store.get(countAtom)).toBe(5);
    });
  });

  describe('Store Method Interception', () => {
    it('should intercept get calls', () => {
      const countAtom = atom(42);
      const store = createEnhancedStore();
      store.set(countAtom, 42);
      
      const value = store.getIntercepted(countAtom);
      expect(value).toBe(42);
    });
    
    it('should intercept set calls', () => {
      const countAtom = atom(0);
      const store = createEnhancedStore();
      
      store.setIntercepted(countAtom, 10);
      expect(store.get(countAtom)).toBe(10);
    });
  });

  describe('Performance Optimizations', () => {
    it('should maintain backward compatibility', () => {
      const countAtom = atom(0);
      const store = createEnhancedStore();
      
      // Test standard store methods still work
      store.set(countAtom, 5);
      expect(store.get(countAtom)).toBe(5);
      
      const unsubscribe = store.subscribe(countAtom, () => {});
      expect(unsubscribe).toBeTypeOf('function');
      
      const state = store.getState();
      expect(state[countAtom.toString()]).toBe(5);
    });
    
    it('should support production mode detection', () => {
      const store = createEnhancedStore([], {
        enableDevTools: false,
      });
      
      // In production mode, DevTools features should be disabled
      // but core functionality should still work
      const countAtom = atom(0);
      store.set(countAtom, 5);
      expect(store.get(countAtom)).toBe(5);
    });
  });
});

describe('Serialization Utilities', () => {
  it('should serialize store state correctly', () => {
    const store = createEnhancedStore();
    const countAtom = atom(42);
    const textAtom = atom('hello');
    
    store.set(countAtom, 42);
    store.set(textAtom, 'hello');
    
    const serialized = serializeState(store);
    
    expect(serialized[countAtom.toString()]).toBe(42);
    expect(serialized[textAtom.toString()]).toBe('hello');
  });
  
  it('should handle custom serializers', () => {
    const map = new Map([['key', 'value']]);
    const mapAtom = atom(map);
    
    const store = createEnhancedStore();
    store.set(mapAtom, map);
    
    const serialized = serializeState(store);
    expect(serialized[mapAtom.toString()]).toBeDefined();
  });
});

describe('Action Tracker', () => {
  beforeEach(() => {
    globalActionTracker.clearHistory();
  });
  
  it('should track actions', () => {
    const action = {
      id: '1',
      type: 'TEST',
      timestamp: Date.now(),
    };
    
    globalActionTracker.trackAction(action);
    expect(globalActionTracker.getActionCount()).toBe(1);
  });
  
  it('should get recent actions', () => {
    for (let i = 0; i < 5; i++) {
      globalActionTracker.trackAction({
        id: `${i}`,
        type: 'TEST',
        timestamp: Date.now() + i,
      });
    }
    
    const recent = globalActionTracker.getRecentActions(3);
    expect(recent).toHaveLength(3);
    expect(recent[0].id).toBe('2');
  });
  
  it('should filter actions by type', () => {
    globalActionTracker.trackAction({
      id: '1',
      type: 'SET',
      timestamp: Date.now(),
    });
    
    globalActionTracker.trackAction({
      id: '2',
      type: 'COMPUTED_UPDATE',
      timestamp: Date.now(),
    });
    
    const setActions = globalActionTracker.getActionsByType('SET');
    expect(setActions).toHaveLength(1);
    expect(setActions[0].type).toBe('SET');
  });
});