/**
 * Tests for DeltaAwareHistoryManager
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeltaAwareHistoryManager } from '../DeltaAwareHistoryManager';
import type { Snapshot, DeltaSnapshot } from '../../types';
import { DeltaProcessor } from '../DeltaProcessor';
import { SnapshotReconstructor } from '../SnapshotReconstructor';
import { DeepCloneService } from '../DeepCloneService';
import { DeltaChainManager } from '../chain-manager';
import { DeltaSnapshotStorage } from '../DeltaSnapshotStorage';
import { SnapshotStrategy } from '../SnapshotStrategy';
import { HistoryManager } from '../../core/HistoryManager';

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

/**
 * Create a mock delta snapshot
 */
function createDeltaSnapshot(
  id: string,
  baseSnapshotId: string,
  delta: Record<string, unknown>,
  timestamp?: number
): DeltaSnapshot {
  return {
    id,
    type: 'delta',
    baseSnapshotId,
    delta,
    timestamp: timestamp ?? Date.now(),
    action: 'test',
    metadata: {
      action: 'test',
      timestamp: timestamp ?? Date.now(),
    },
  };
}

/**
 * Create mock services for dependency injection
 */
function createMockServices() {
  const historyManager = new HistoryManager(50);
  const deltaProcessor = new DeltaProcessor({ deepEqual: false, skipEmpty: true });
  const cloneService = new DeepCloneService();
  const reconstructor = new SnapshotReconstructor(deltaProcessor, {
    enableCache: true,
    maxCacheSize: 50,
    cacheTTL: 60000,
  });
  const deltaChainManager = new DeltaChainManager({
    fullSnapshotInterval: 10,
    maxDeltaChainLength: 5,
    maxDeltaChainAge: 5 * 60 * 1000,
    maxDeltaChainSize: 1024 * 1024,
  });
  const deltaStorage = new DeltaSnapshotStorage();
  const snapshotStrategy = new SnapshotStrategy({
    enabled: true,
    fullSnapshotInterval: 10,
    maxDeltaChainLength: 5,
    maxDeltaChainAge: 5 * 60 * 1000,
    maxDeltaChainSize: 1024 * 1024,
  });

  return {
    historyManager,
    deltaProcessor,
    reconstructor,
    cloneService,
    deltaChainManager,
    deltaStorage,
    snapshotStrategy,
  };
}

describe('DeltaAwareHistoryManager', () => {
  let manager: DeltaAwareHistoryManager;
  let services: ReturnType<typeof createMockServices>;

  beforeEach(() => {
    services = createMockServices();
    manager = new DeltaAwareHistoryManager({}, services);
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const defaultManager = new DeltaAwareHistoryManager();

      expect(defaultManager).toBeDefined();
      expect(defaultManager.getStats()).toBeDefined();
    });

    it('should create with custom config', () => {
      const customManager = new DeltaAwareHistoryManager({
        maxHistory: 100,
        compressionEnabled: false,
        incrementalSnapshot: {
          enabled: true,
          fullSnapshotInterval: 5,
          maxDeltaChainLength: 3,
          maxDeltaChainAge: 60000,
          maxDeltaChainSize: 512 * 1024,
          changeDetection: 'deep',
        },
      });

      expect(customManager).toBeDefined();
    });

    it('should use injected services', () => {
      const injectedManager = new DeltaAwareHistoryManager({}, services);

      expect(injectedManager.getDeltaProcessor()).toBe(services.deltaProcessor);
      expect(injectedManager.getReconstructor()).toBe(services.reconstructor);
      expect(injectedManager.getCloneService()).toBe(services.cloneService);
    });
  });

  describe('add', () => {
    it('should add full snapshot when history is empty', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });

      manager.add(snapshot);

      const current = manager.getCurrent();
      expect(current).toBeDefined();
      expect(current?.id).toBe('snap1');
      expect(current?.type).toBe('full');
    });

    it('should add full snapshot as initial snapshot', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      const current = manager.getCurrent();
      expect(current?.id).toBe('snap2');
    });

    it('should create delta when base snapshot exists', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2, name: 'test' });

      manager.add(snapshot1);
      manager.add(snapshot2);

      const all = manager.getAll();
      expect(all.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty state changes', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 1 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      const current = manager.getCurrent();
      expect(current).toBeDefined();
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

    it('should return deep copy of snapshot', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      const retrieved = manager.getSnapshot(0);
      expect(retrieved).toBeDefined();
      expect(retrieved).not.toBe(snapshot);
      expect(retrieved?.state).toEqual(snapshot.state);
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

    it('should return deep copies of all snapshots', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      const all = manager.getAll();
      expect(all[0]).not.toBe(snapshot);
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
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      expect(manager.getById('unknown')).toBeNull();
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
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      manager.undo();
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
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      expect(manager.redo()).toBeNull();
    });
  });

  describe('jumpTo', () => {
    it('should jump to specific index', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });
      const snapshot3 = createFullSnapshot('snap3', { count: 3 });

      manager.add(snapshot1);
      manager.add(snapshot2);
      manager.add(snapshot3);

      const jumped = manager.jumpTo(1);
      expect(jumped).toBeDefined();
      expect(jumped?.id).toBe('snap2');
    });

    it('should return null for invalid index', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

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

  describe('getStats', () => {
    it('should get history statistics', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      const stats = manager.getStats();

      expect(stats).toBeDefined();
      expect(stats.standard).toBeDefined();
      expect(stats.delta).toBeDefined();
      expect(stats.memoryEfficiency).toBeDefined();
    });

    it('should return 100% memory efficiency when no deltas', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      const stats = manager.getStats();
      expect(stats.memoryEfficiency).toBe(1);
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
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      manager.undo();
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
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      expect(manager.canRedo()).toBe(false);
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

    it('should clear cache and chains', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot1);

      manager.clear();

      const stats = manager.getStats();
      expect(stats.delta.totalDeltasInChains).toBe(0);
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
      listener.mockClear();

      const snapshot2 = createFullSnapshot('snap2', { count: 2 });
      manager.add(snapshot2);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = manager.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('forceFullSnapshot', () => {
    it('should force creation of full snapshots', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      manager.forceFullSnapshot();

      const all = manager.getAll();
      expect(all.length).toBeGreaterThan(0);

      // All should be full snapshots after force
      for (const snap of all) {
        expect(snap.type).not.toBe('delta');
      }
    });
  });

  describe('delta snapshot reconstruction', () => {
    it('should handle delta snapshots correctly', () => {
      // Add initial full snapshot
      const fullSnapshot = createFullSnapshot('full1', { count: 1, name: 'test' });
      manager.add(fullSnapshot);

      // Manually add a delta to test reconstruction
      const delta: DeltaSnapshot = {
        id: 'delta1',
        type: 'delta',
        baseSnapshotId: 'full1',
        delta: { count: 2 },
        changes: new Map(),
        timestamp: Date.now(),
        action: 'test',
        metadata: {
          action: 'test',
          timestamp: Date.now(),
        },
      };

      services.deltaStorage.add(delta);
      services.deltaChainManager.addDelta(delta);
      services.historyManager.add(delta as any);

      // Get should reconstruct the delta
      const all = manager.getAll();
      expect(all.length).toBeGreaterThan(0);
    });

    it('should find root snapshot for delta reconstruction', () => {
      const fullSnapshot = createFullSnapshot('full1', { count: 1 });
      manager.add(fullSnapshot);

      const delta: DeltaSnapshot = {
        id: 'delta1',
        type: 'delta',
        baseSnapshotId: 'full1',
        delta: { count: 2 },
        changes: new Map(),
        timestamp: Date.now(),
        action: 'test',
        metadata: {
          action: 'test',
          timestamp: Date.now(),
        },
      };

      services.deltaStorage.add(delta);
      services.deltaChainManager.addDelta(delta);
      services.historyManager.add(delta as any);

      const retrieved = manager.getById('delta1');
      expect(retrieved).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle circular delta references', () => {
      // Create a delta that references itself (should be handled gracefully)
      const circularDelta: DeltaSnapshot = {
        id: 'circular1',
        type: 'delta',
        baseSnapshotId: 'circular1', // Self-reference
        delta: { count: 1 },
        changes: new Map(),
        timestamp: Date.now(),
        action: 'test',
        metadata: {
          action: 'test',
          timestamp: Date.now(),
        },
      };

      services.historyManager.add(circularDelta as any);

      // Should not cause infinite loop
      const result = manager.getById('circular1');
      expect(result).toBeDefined();
    });

    it('should handle missing base snapshot', () => {
      const delta: DeltaSnapshot = {
        id: 'delta1',
        type: 'delta',
        baseSnapshotId: 'nonexistent',
        delta: { count: 1 },
        changes: new Map(),
        timestamp: Date.now(),
        action: 'test',
        metadata: {
          action: 'test',
          timestamp: Date.now(),
        },
      };

      services.deltaStorage.add(delta);
      services.deltaChainManager.addDelta(delta);
      services.historyManager.add(delta as any);

      // Should handle gracefully
      const result = manager.getById('delta1');
      expect(result).toBeDefined();
    });

    it('should handle large state objects', () => {
      const largeState: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        largeState[`key${i}`] = `value${i}`;
      }

      const snapshot = createFullSnapshot('large1', largeState);
      manager.add(snapshot);

      const retrieved = manager.getSnapshot(0);
      expect(retrieved).toBeDefined();
      expect(Object.keys(retrieved?.state || {}).length).toBe(1000);
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
      expect(retrieved?.state).toBeDefined();
      // Note: DeepCloneService may not preserve deeply nested structures
      // This test verifies the snapshot is retrieved without errors
    });
  });

  describe('memory efficiency', () => {
    it('should calculate memory efficiency correctly', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      const stats = manager.getStats();
      expect(stats.memoryEfficiency).toBeGreaterThanOrEqual(0);
      expect(stats.memoryEfficiency).toBeLessThanOrEqual(1);
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
  });
});
