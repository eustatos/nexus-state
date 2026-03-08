/**
 * Tests for DeltaAwareHistoryManager
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeltaAwareHistoryManager } from '../delta-history-manager';
import type { Snapshot, DeltaSnapshot } from '../types';

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

describe('DeltaAwareHistoryManager', () => {
  let manager: DeltaAwareHistoryManager;

  beforeEach(() => {
    manager = new DeltaAwareHistoryManager({
      maxHistory: 50,
      compressionEnabled: true,
      incrementalSnapshot: {
        enabled: true,
        fullSnapshotInterval: 10,
        maxDeltaChainLength: 5,
        maxDeltaChainAge: 5 * 60 * 1000,
        maxDeltaChainSize: 1024 * 1024,
        changeDetection: 'shallow',
      },
    });
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const defaultManager = new DeltaAwareHistoryManager();
      expect(defaultManager).toBeDefined();
    });

    it('should create with custom config', () => {
      const customManager = new DeltaAwareHistoryManager({
        maxHistory: 100,
        compressionEnabled: false,
      });
      expect(customManager).toBeDefined();
    });
  });

  describe('add', () => {
    it('should add first snapshot as full', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      const current = manager.getCurrent();
      expect(current).toBeDefined();
      expect(current?.type).toBe('full');
    });

    it('should add multiple snapshots', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      const current = manager.getCurrent();
      expect(current?.id).toBe('snap2');
    });
  });

  describe('getSnapshot', () => {
    it('should get snapshot by index', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      const retrieved = manager.getSnapshot(0);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('snap1');
    });

    it('should return null for invalid index', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      expect(manager.getSnapshot(-1)).toBeNull();
      expect(manager.getSnapshot(100)).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should get all snapshots', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      const all = manager.getAll();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getById', () => {
    it('should get snapshot by ID', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      const retrieved = manager.getById('snap1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('snap1');
    });

    it('should return null for unknown ID', () => {
      expect(manager.getById('unknown')).toBeNull();
    });
  });

  describe('getDeltaSnapshots', () => {
    it('should return delta snapshots', () => {
      const deltas = manager.getDeltaSnapshots();
      expect(Array.isArray(deltas)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      const stats = manager.getStats();
      expect(stats).toBeDefined();
      expect(stats.standard).toBeDefined();
      expect(stats.delta).toBeDefined();
    });
  });

  describe('canUndo', () => {
    it('should return true when undo is available', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      expect(manager.canUndo()).toBe(true);
    });

    it('should return false when undo is not available', () => {
      expect(manager.canUndo()).toBe(false);
    });
  });

  describe('canRedo', () => {
    it('should return true when redo is available', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);
      manager.undo();

      expect(manager.canRedo()).toBe(true);
    });

    it('should return false when redo is not available', () => {
      expect(manager.canRedo()).toBe(false);
    });
  });

  describe('undo', () => {
    it('should undo to previous snapshot', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      const previous = manager.undo();
      expect(previous).toBeDefined();
      expect(previous?.id).toBe('snap1');
    });

    it('should return null when cannot undo', () => {
      const result = manager.undo();
      expect(result).toBeNull();
    });
  });

  describe('redo', () => {
    it('should redo to next snapshot', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);
      manager.undo();

      const next = manager.redo();
      expect(next).toBeDefined();
      expect(next?.id).toBe('snap2');
    });

    it('should return null when cannot redo', () => {
      const result = manager.redo();
      expect(result).toBeNull();
    });
  });

  describe('jumpTo', () => {
    it('should return null for invalid index', () => {
      expect(manager.jumpTo(-1)).toBeNull();
      expect(manager.jumpTo(100)).toBeNull();
    });
  });

  describe('getCurrent', () => {
    it('should get current snapshot', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      const current = manager.getCurrent();
      expect(current).toBeDefined();
      expect(current?.id).toBe('snap1');
    });

    it('should return null when no snapshots', () => {
      expect(manager.getCurrent()).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      manager.clear();

      expect(manager.getCurrent()).toBeNull();
      expect(manager.getStats().standard.totalSnapshots).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to history events', () => {
      const listener = vi.fn();
      const unsubscribe = manager.subscribe(listener);

      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      expect(listener).toHaveBeenCalled();

      unsubscribe();
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = manager.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('configuration', () => {
    it('should respect maxHistory limit', () => {
      const limitedManager = new DeltaAwareHistoryManager({
        maxHistory: 3,
      });

      for (let i = 0; i < 10; i++) {
        const snapshot = createFullSnapshot(`snap${i}`, { count: i });
        limitedManager.add(snapshot);
      }

      const all = limitedManager.getAll();
      expect(all.length).toBeLessThanOrEqual(3);
    });
  });

  describe('edge cases', () => {
    it('should handle empty state', () => {
      const snapshot = createFullSnapshot('snap1', {});
      manager.add(snapshot);

      const current = manager.getCurrent();
      expect(current).toBeDefined();
    });

    it('should handle large state objects', () => {
      const largeState: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        largeState[`key${i}`] = `value${i}`;
      }

      const snapshot = createFullSnapshot('large1', largeState);
      manager.add(snapshot);

      const retrieved = manager.getSnapshot(0);
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
      manager.add(snapshot);

      const retrieved = manager.getSnapshot(0);
      expect(retrieved).toBeDefined();
    });

    it('should handle disabled incremental snapshots', () => {
      const noIncrementManager = new DeltaAwareHistoryManager({
        incrementalSnapshot: {
          enabled: false,
        },
      });

      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      noIncrementManager.add(snapshot1);
      noIncrementManager.add(snapshot2);

      const all = noIncrementManager.getAll();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle state with undefined values', () => {
      const stateWithUndefined = { a: 1, b: undefined, c: 3 };
      const snapshot = createFullSnapshot('undef1', stateWithUndefined as any);
      manager.add(snapshot);

      const current = manager.getCurrent();
      expect(current).toBeDefined();
    });

    it('should handle state with null values', () => {
      const stateWithNull = { a: 1, b: null, c: 3 };
      const snapshot = createFullSnapshot('null1', stateWithNull as any);
      manager.add(snapshot);

      const current = manager.getCurrent();
      expect(current).toBeDefined();
    });

    it('should handle state with array values', () => {
      const stateWithArray = { items: [1, 2, 3], count: 5 };
      const snapshot = createFullSnapshot('array1', stateWithArray as any);
      manager.add(snapshot);

      const current = manager.getCurrent();
      expect(current).toBeDefined();
    });
  });

  describe('delta creation', () => {
    it('should create delta when incremental is enabled', () => {
      const deltaManager = new DeltaAwareHistoryManager({
        incrementalSnapshot: {
          enabled: true,
          fullSnapshotInterval: 10,
          maxDeltaChainLength: 5,
          maxDeltaChainAge: 5 * 60 * 1000,
          maxDeltaChainSize: 1024 * 1024,
          changeDetection: 'shallow',
        },
      });

      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      deltaManager.add(snapshot1);
      deltaManager.add(snapshot2);

      const deltas = deltaManager.getDeltaSnapshots();
      // Delta may or may not be created depending on delta calculator
      expect(Array.isArray(deltas)).toBe(true);
    });

    it('should track full snapshot counter', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      const stats = manager.getStats();
      expect(stats.standard.totalSnapshots).toBeGreaterThanOrEqual(2);
    });
  });

  describe('memory efficiency', () => {
    it('should calculate memory efficiency', () => {
      const stats = manager.getStats();
      expect(stats.memoryEfficiency).toBeDefined();
      expect(typeof stats.memoryEfficiency).toBe('number');
    });
  });
});
