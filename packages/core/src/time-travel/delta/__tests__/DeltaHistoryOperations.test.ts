/**
 * Tests for DeltaHistoryOperations
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeltaHistoryOperations } from '../DeltaHistoryOperations';
import type { Snapshot } from '../types';
import type { DeltaAwareHistoryManagerConfig } from '../types';

/**
 * Create default config
 */
function createDefaultConfig(): DeltaAwareHistoryManagerConfig {
  return {
    maxHistory: 50,
    compressionEnabled: true,
    incrementalSnapshot: {
      enabled: false, // Disable for simpler tests
      fullSnapshotInterval: 10,
      maxDeltaChainLength: 5,
      maxDeltaChainAge: 5 * 60 * 1000,
      maxDeltaChainSize: 1024 * 1024,
      changeDetection: 'shallow',
    },
  };
}

/**
 * Create a mock full snapshot
 */
function createFullSnapshot(
  id: string,
  state: Record<string, unknown>,
  timestamp?: number
): Snapshot {
  return {
    id,
    type: 'full',
    state,
    timestamp: timestamp ?? Date.now(),
    action: 'test',
    metadata: {
      action: 'test',
      timestamp: timestamp ?? Date.now(),
    },
  };
}

describe('DeltaHistoryOperations', () => {
  let operations: DeltaHistoryOperations;
  let config: DeltaAwareHistoryManagerConfig;

  beforeEach(() => {
    config = createDefaultConfig();
    operations = new DeltaHistoryOperations(config);
  });

  describe('constructor', () => {
    it('should create with config', () => {
      expect(operations).toBeDefined();
    });

    it('should initialize with zero counter', () => {
      expect(operations.getFullSnapshotCounter()).toBe(0);
    });
  });

  describe('add', () => {
    it('should add snapshot when delta disabled', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      const result = operations.add(snapshot, false);

      expect(result).toBe(false);
      expect(operations.getCurrent()).toBeDefined();
    });

    it('should increment counter on full snapshot', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      operations.add(snapshot1, false);

      expect(operations.getFullSnapshotCounter()).toBe(1);
    });

    it('should add multiple snapshots', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      operations.add(snapshot1, false);
      operations.add(snapshot2, false);

      expect(operations.getFullSnapshotCounter()).toBe(2);
    });
  });

  describe('getSnapshot', () => {
    it('should get snapshot by index', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      operations.add(snapshot1, false);
      operations.add(snapshot2, false);

      const retrieved = operations.getSnapshot(0);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('snap1');
    });

    it('should return null for invalid index', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      operations.add(snapshot, false);

      expect(operations.getSnapshot(-1)).toBeNull();
      expect(operations.getSnapshot(100)).toBeNull();
    });

    it('should return deep copy', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      operations.add(snapshot, false);

      const retrieved = operations.getSnapshot(0);
      expect(retrieved).not.toBe(snapshot);
    });
  });

  describe('getAll', () => {
    it('should get all snapshots', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      operations.add(snapshot1, false);
      operations.add(snapshot2, false);

      const all = operations.getAll();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });

    it('should return deep copies', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      operations.add(snapshot, false);

      const all = operations.getAll();
      expect(all[0]).not.toBe(snapshot);
    });
  });

  describe('getById', () => {
    it('should get snapshot by ID', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      operations.add(snapshot, false);

      const retrieved = operations.getById('snap1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('snap1');
    });

    it('should return null for unknown ID', () => {
      expect(operations.getById('unknown')).toBeNull();
    });
  });

  describe('canUndo', () => {
    it('should return true when undo available', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      operations.add(snapshot1, false);
      operations.add(snapshot2, false);

      expect(operations.canUndo()).toBe(true);
    });

    it('should return false when undo not available', () => {
      expect(operations.canUndo()).toBe(false);
    });
  });

  describe('canRedo', () => {
    it('should return true when redo available', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      operations.add(snapshot1, false);
      operations.add(snapshot2, false);
      operations.undo();

      expect(operations.canRedo()).toBe(true);
    });

    it('should return false when redo not available', () => {
      expect(operations.canRedo()).toBe(false);
    });
  });

  describe('undo', () => {
    it('should undo to previous snapshot', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      operations.add(snapshot1, false);
      operations.add(snapshot2, false);

      const previous = operations.undo();
      expect(previous).toBeDefined();
      expect(previous?.id).toBe('snap1');
    });

    it('should return null when cannot undo', () => {
      const result = operations.undo();
      expect(result).toBeNull();
    });
  });

  describe('redo', () => {
    it('should redo to next snapshot', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      operations.add(snapshot1, false);
      operations.add(snapshot2, false);
      operations.undo();

      const next = operations.redo();
      expect(next).toBeDefined();
      expect(next?.id).toBe('snap2');
    });

    it('should return null when cannot redo', () => {
      const result = operations.redo();
      expect(result).toBeNull();
    });
  });

  describe('jumpTo', () => {
    it('should jump to specific index', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      operations.add(snapshot1, false);
      operations.add(snapshot2, false);

      const jumped = operations.jumpTo(0);
      expect(jumped).toBeDefined();
      expect(jumped?.id).toBe('snap1');
    });

    it('should return null for invalid index', () => {
      expect(operations.jumpTo(-1)).toBeNull();
      expect(operations.jumpTo(100)).toBeNull();
    });
  });

  describe('getCurrent', () => {
    it('should get current snapshot', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      operations.add(snapshot, false);

      const current = operations.getCurrent();
      expect(current).toBeDefined();
      expect(current?.id).toBe('snap1');
    });

    it('should return null when no snapshots', () => {
      expect(operations.getCurrent()).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      operations.add(snapshot1, false);
      operations.add(snapshot2, false);

      operations.clear();

      expect(operations.getCurrent()).toBeNull();
      expect(operations.getFullSnapshotCounter()).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to history events', () => {
      const listener = vi.fn();
      const unsubscribe = operations.subscribe(listener);

      const snapshot = createFullSnapshot('snap1', { count: 1 });
      operations.add(snapshot, false);

      expect(listener).toHaveBeenCalled();

      unsubscribe();
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = operations.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('getDeltaChainManager', () => {
    it('should return delta chain manager', () => {
      const manager = operations.getDeltaChainManager();
      expect(manager).toBeDefined();
    });
  });

  describe('getHistoryManager', () => {
    it('should return history manager', () => {
      const manager = operations.getHistoryManager();
      expect(manager).toBeDefined();
    });
  });

  describe('setFullSnapshotCounter', () => {
    it('should set counter value', () => {
      operations.setFullSnapshotCounter(5);
      expect(operations.getFullSnapshotCounter()).toBe(5);
    });
  });

  describe('edge cases', () => {
    it('should handle empty state', () => {
      const snapshot = createFullSnapshot('snap1', {});
      operations.add(snapshot, false);

      const current = operations.getCurrent();
      expect(current).toBeDefined();
    });

    it('should handle large state objects', () => {
      const largeState: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        largeState[`key${i}`] = `value${i}`;
      }

      const snapshot = createFullSnapshot('large1', largeState);
      operations.add(snapshot, false);

      const retrieved = operations.getSnapshot(0);
      expect(retrieved).toBeDefined();
    });

    it('should handle deeply nested state', () => {
      const nestedState = {
        level1: {
          level2: {
            value: 'deep',
          },
        },
      };

      const snapshot = createFullSnapshot('nested1', nestedState as any);
      operations.add(snapshot, false);

      const retrieved = operations.getSnapshot(0);
      expect(retrieved).toBeDefined();
    });

    it('should handle state with undefined values', () => {
      const stateWithUndefined = { a: 1, b: undefined, c: 3 };
      const snapshot = createFullSnapshot('undef1', stateWithUndefined as any);
      operations.add(snapshot, false);

      const current = operations.getCurrent();
      expect(current).toBeDefined();
    });

    it('should handle state with null values', () => {
      const stateWithNull = { a: 1, b: null, c: 3 };
      const snapshot = createFullSnapshot('null1', stateWithNull as any);
      operations.add(snapshot, false);

      const current = operations.getCurrent();
      expect(current).toBeDefined();
    });

    it('should handle state with array values', () => {
      const stateWithArray = { items: [1, 2, 3], count: 5 };
      const snapshot = createFullSnapshot('array1', stateWithArray as any);
      operations.add(snapshot, false);

      const current = operations.getCurrent();
      expect(current).toBeDefined();
    });
  });

  describe('counter management', () => {
    it('should track counter through multiple operations', () => {
      expect(operations.getFullSnapshotCounter()).toBe(0);

      operations.add(createFullSnapshot('snap1', { count: 1 }), false);
      expect(operations.getFullSnapshotCounter()).toBe(1);

      operations.add(createFullSnapshot('snap2', { count: 2 }), false);
      expect(operations.getFullSnapshotCounter()).toBe(2);

      operations.clear();
      expect(operations.getFullSnapshotCounter()).toBe(0);
    });
  });
});
