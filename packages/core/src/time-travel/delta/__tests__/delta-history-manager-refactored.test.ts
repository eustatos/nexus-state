/**
 * Integration tests for refactored DeltaAwareHistoryManager
 *
 * Tests the interaction between all components.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeltaAwareHistoryManager } from '../delta-history-manager-refactored';
import type { Snapshot } from '../types';

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

describe('DeltaAwareHistoryManager (Refactored) - Integration', () => {
  let manager: DeltaAwareHistoryManager;

  beforeEach(() => {
    manager = new DeltaAwareHistoryManager({
      maxHistory: 50,
      compressionEnabled: true,
      incrementalSnapshot: {
        enabled: false, // Disable for simpler tests
      },
    });
  });

  describe('component access', () => {
    it('should provide access to history operations', () => {
      const historyOps = manager.getHistoryOperations();
      expect(historyOps).toBeDefined();
    });

    it('should provide access to calculator operations', () => {
      const calculator = manager.getCalculatorOperations();
      expect(calculator).toBeDefined();
    });

    it('should provide access to chain management', () => {
      const chainMgmt = manager.getChainManagement();
      expect(chainMgmt).toBeDefined();
    });

    it('should provide access to config', () => {
      const config = manager.getConfig();
      expect(config).toBeDefined();
      expect(config.maxHistory).toBe(50);
    });
  });

  describe('basic operations', () => {
    it('should add and retrieve snapshots', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      const current = manager.getCurrent();
      expect(current?.id).toBe('snap2');

      const all = manager.getAll();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });

    it('should get snapshot by index', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      const retrieved = manager.getSnapshot(0);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('snap1');
    });

    it('should get snapshot by ID', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      const retrieved = manager.getById('snap1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('snap1');
    });
  });

  describe('navigation', () => {
    it('should undo and redo', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      expect(manager.canUndo()).toBe(true);

      const previous = manager.undo();
      expect(previous?.id).toBe('snap1');

      expect(manager.canRedo()).toBe(true);

      const next = manager.redo();
      expect(next?.id).toBe('snap2');
    });

    it('should jump to index', () => {
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
  });

  describe('statistics', () => {
    it('should return stats', () => {
      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      const stats = manager.getStats();

      expect(stats).toBeDefined();
      expect(stats.standard).toBeDefined();
      expect(stats.delta).toBeDefined();
      expect(typeof stats.memoryEfficiency).toBe('number');
    });

    it('should return delta stats', () => {
      const deltaStats = manager.getDeltaStats();
      expect(deltaStats).toBeDefined();
    });
  });

  describe('clear and force', () => {
    it('should clear history', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      manager.clear();

      expect(manager.getCurrent()).toBeNull();
      expect(manager.getStats().standard.totalSnapshots).toBe(0);
    });

    it('should force full snapshot', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      manager.forceFullSnapshot();

      const all = manager.getAll();
      expect(all.length).toBeGreaterThan(0);
    });
  });

  describe('subscription', () => {
    it('should subscribe to events', () => {
      const listener = vi.fn();
      const unsubscribe = manager.subscribe(listener);

      const snapshot = createFullSnapshot('snap1', { count: 1 });
      manager.add(snapshot);

      expect(listener).toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe('delta operations', () => {
    it('should handle delta snapshots', () => {
      const deltas = manager.getDeltaSnapshots();
      expect(Array.isArray(deltas)).toBe(true);
      expect(deltas.length).toBe(0); // No deltas yet
    });

    it('should calculate memory efficiency', () => {
      const stats = manager.getStats();
      expect(typeof stats.memoryEfficiency).toBe('number');
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

    it('should handle state with array values', () => {
      const stateWithArray = { items: [1, 2, 3], count: 5 };
      const snapshot = createFullSnapshot('array1', stateWithArray as any);
      manager.add(snapshot);

      const current = manager.getCurrent();
      expect(current).toBeDefined();
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

  describe('component integration', () => {
    it('should coordinate between components', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      // Add snapshots through manager
      manager.add(snapshot1);
      manager.add(snapshot2);

      // Verify all components are in sync
      const historyOps = manager.getHistoryOperations();
      const chainMgmt = manager.getChainManagement();

      expect(historyOps.getCurrent()).toBeDefined();
      expect(chainMgmt.isEmpty()).toBe(true); // No deltas
    });

    it('should maintain state through undo/redo', () => {
      const snapshot1 = createFullSnapshot('snap1', { count: 1 });
      const snapshot2 = createFullSnapshot('snap2', { count: 2 });

      manager.add(snapshot1);
      manager.add(snapshot2);

      // Undo
      manager.undo();
      expect(manager.getCurrent()?.id).toBe('snap1');

      // Redo
      manager.redo();
      expect(manager.getCurrent()?.id).toBe('snap2');

      // Verify stats are consistent
      const stats = manager.getStats();
      expect(stats.standard.totalSnapshots).toBeGreaterThanOrEqual(2);
    });
  });
});
