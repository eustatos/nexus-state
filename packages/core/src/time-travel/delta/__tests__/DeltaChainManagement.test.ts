/**
 * Tests for DeltaChainManagement
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeltaChainManagement } from '../DeltaChainManagement';
import { DeltaChainManager } from '../chain-manager';
import type { DeltaSnapshot } from '../types';

/**
 * Create a mock delta snapshot
 */
function createDeltaSnapshot(
  id: string,
  baseSnapshotId: string,
  delta?: Record<string, unknown>
): DeltaSnapshot {
  return {
    id,
    type: 'delta',
    baseSnapshotId,
    delta: delta || {},
    changes: new Map(),
    timestamp: Date.now(),
    action: 'test',
    metadata: {
      action: 'test',
      timestamp: Date.now(),
    },
  };
}

describe('DeltaChainManagement', () => {
  let manager: DeltaChainManagement;

  beforeEach(() => {
    manager = new DeltaChainManagement();
  });

  describe('constructor', () => {
    it('should create with default chain manager', () => {
      expect(manager).toBeDefined();
    });

    it('should create with custom chain manager', () => {
      const customManager = new DeltaChainManagement(new DeltaChainManager());
      expect(customManager).toBeDefined();
    });
  });

  describe('addDelta', () => {
    it('should add delta successfully', () => {
      const delta = createDeltaSnapshot('delta1', 'base1');
      const result = manager.addDelta(delta);

      expect(result).toBe(true);
      expect(manager.getCount()).toBe(1);
    });

    it('should add multiple deltas', () => {
      const delta1 = createDeltaSnapshot('delta1', 'base1');
      const delta2 = createDeltaSnapshot('delta2', 'base1');

      manager.addDelta(delta1);
      manager.addDelta(delta2);

      expect(manager.getCount()).toBe(2);
    });
  });

  describe('getDelta', () => {
    it('should get delta by ID', () => {
      const delta = createDeltaSnapshot('delta1', 'base1');
      manager.addDelta(delta);

      const retrieved = manager.getDelta('delta1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('delta1');
    });

    it('should return null for unknown ID', () => {
      const retrieved = manager.getDelta('unknown');
      expect(retrieved).toBeNull();
    });
  });

  describe('getAllDeltas', () => {
    it('should get all deltas', () => {
      const delta1 = createDeltaSnapshot('delta1', 'base1');
      const delta2 = createDeltaSnapshot('delta2', 'base1');

      manager.addDelta(delta1);
      manager.addDelta(delta2);

      const all = manager.getAllDeltas();
      expect(all.length).toBe(2);
    });

    it('should return empty array when no deltas', () => {
      const all = manager.getAllDeltas();
      expect(all).toEqual([]);
    });
  });

  describe('removeDelta', () => {
    it('should remove delta by ID', () => {
      const delta = createDeltaSnapshot('delta1', 'base1');
      manager.addDelta(delta);

      const result = manager.removeDelta('delta1');
      expect(result).toBe(true);
      expect(manager.getCount()).toBe(0);
    });

    it('should return false for unknown ID', () => {
      const result = manager.removeDelta('unknown');
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all deltas', () => {
      const delta1 = createDeltaSnapshot('delta1', 'base1');
      const delta2 = createDeltaSnapshot('delta2', 'base1');

      manager.addDelta(delta1);
      manager.addDelta(delta2);

      manager.clear();

      expect(manager.getCount()).toBe(0);
      expect(manager.isEmpty()).toBe(true);
    });
  });

  describe('getDeltasByBaseId', () => {
    it('should get deltas by base ID', () => {
      const delta1 = createDeltaSnapshot('delta1', 'base1');
      const delta2 = createDeltaSnapshot('delta2', 'base1');
      const delta3 = createDeltaSnapshot('delta3', 'base2');

      manager.addDelta(delta1);
      manager.addDelta(delta2);
      manager.addDelta(delta3);

      const deltas = manager.getDeltasByBaseId('base1');
      expect(deltas.length).toBe(2);
    });

    it('should return empty array for unknown base ID', () => {
      const deltas = manager.getDeltasByBaseId('unknown');
      expect(deltas).toEqual([]);
    });
  });

  describe('getDeltaChain', () => {
    it('should get delta chain', () => {
      const base = createDeltaSnapshot('base', 'root');
      const delta1 = createDeltaSnapshot('delta1', 'base');
      const delta2 = createDeltaSnapshot('delta2', 'delta1');

      manager.addDelta(base);
      manager.addDelta(delta1);
      manager.addDelta(delta2);

      const chain = manager.getDeltaChain(delta2);
      expect(chain).toBeDefined();
      expect(chain?.length).toBeGreaterThan(0);
    });

    it('should return null for circular reference', () => {
      const delta1 = createDeltaSnapshot('delta1', 'delta2');
      const delta2 = createDeltaSnapshot('delta2', 'delta1');

      manager.addDelta(delta1);
      manager.addDelta(delta2);

      const chain = manager.getDeltaChain(delta2);
      expect(chain).toBeNull();
    });

    it('should handle delta without base', () => {
      const delta = createDeltaSnapshot('delta1', '');

      manager.addDelta(delta);

      const chain = manager.getDeltaChain(delta);
      expect(chain).toBeDefined();
      expect(chain?.length).toBe(1);
    });
  });

  describe('hasDelta', () => {
    it('should return true for existing delta', () => {
      const delta = createDeltaSnapshot('delta1', 'base1');
      manager.addDelta(delta);

      expect(manager.hasDelta('delta1')).toBe(true);
    });

    it('should return false for unknown delta', () => {
      expect(manager.hasDelta('unknown')).toBe(false);
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', () => {
      const delta = createDeltaSnapshot('delta1', 'base1');
      manager.addDelta(delta);

      const stats = manager.getStorageStats();

      expect(stats.count).toBe(1);
      expect(stats.ids).toContain('delta1');
      expect(typeof stats.estimatedSize).toBe('number');
    });

    it('should return empty stats when no deltas', () => {
      const stats = manager.getStorageStats();

      expect(stats.count).toBe(0);
      expect(stats.ids).toEqual([]);
    });
  });

  describe('getChainStats', () => {
    it('should return chain statistics', () => {
      const delta1 = createDeltaSnapshot('delta1', 'base1');
      const delta2 = createDeltaSnapshot('delta2', 'delta1');

      manager.addDelta(delta1);
      manager.addDelta(delta2);

      const stats = manager.getChainStats();

      expect(typeof stats.totalDeltasInChains).toBe('number');
      expect(typeof stats.averageDeltaSize).toBe('number');
      expect(typeof stats.chainCount).toBe('number');
      expect(typeof stats.longestChain).toBe('number');
    });
  });

  describe('getDeltaHistoryStats', () => {
    it('should return combined stats', () => {
      const delta = createDeltaSnapshot('delta1', 'base1');
      manager.addDelta(delta);

      const stats = manager.getDeltaHistoryStats();

      expect(stats.storage).toBeDefined();
      expect(stats.chains).toBeDefined();
    });
  });

  describe('calculateMemoryEfficiency', () => {
    it('should return 1 for empty storage', () => {
      const efficiency = manager.calculateMemoryEfficiency();
      expect(efficiency).toBe(1);
    });

    it('should return efficiency ratio', () => {
      const delta = createDeltaSnapshot('delta1', 'base1');
      manager.addDelta(delta);

      const efficiency = manager.calculateMemoryEfficiency();
      expect(typeof efficiency).toBe('number');
      expect(efficiency).toBeGreaterThanOrEqual(0);
      expect(efficiency).toBeLessThanOrEqual(1);
    });
  });

  describe('getDeltaChainManager', () => {
    it('should return chain manager instance', () => {
      const chainManager = manager.getDeltaChainManager();
      expect(chainManager).toBeDefined();
    });
  });

  describe('getCount', () => {
    it('should return count of deltas', () => {
      expect(manager.getCount()).toBe(0);

      manager.addDelta(createDeltaSnapshot('delta1', 'base1'));
      expect(manager.getCount()).toBe(1);

      manager.addDelta(createDeltaSnapshot('delta2', 'base1'));
      expect(manager.getCount()).toBe(2);
    });
  });

  describe('isEmpty', () => {
    it('should return true when empty', () => {
      expect(manager.isEmpty()).toBe(true);
    });

    it('should return false when not empty', () => {
      manager.addDelta(createDeltaSnapshot('delta1', 'base1'));
      expect(manager.isEmpty()).toBe(false);
    });
  });

  describe('validateChain', () => {
    it('should return true for valid chain', () => {
      const delta1 = createDeltaSnapshot('delta1', 'base1');
      const delta2 = createDeltaSnapshot('delta2', 'delta1');

      manager.addDelta(delta1);
      manager.addDelta(delta2);

      const isValid = manager.validateChain(delta2);
      expect(isValid).toBe(true);
    });

    it('should return false for circular chain', () => {
      const delta1 = createDeltaSnapshot('delta1', 'delta2');
      const delta2 = createDeltaSnapshot('delta2', 'delta1');

      manager.addDelta(delta1);
      manager.addDelta(delta2);

      const isValid = manager.validateChain(delta2);
      expect(isValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle delta with empty baseSnapshotId', () => {
      const delta = createDeltaSnapshot('delta1', '');
      const result = manager.addDelta(delta);

      expect(result).toBe(true);
    });

    it('should handle delta with large metadata', () => {
      const largeMetadata = {
        data: new Array(100).fill('x').join(''),
      };

      const delta: DeltaSnapshot = {
        id: 'large',
        type: 'delta',
        baseSnapshotId: 'base1',
        delta: {},
        changes: new Map(),
        timestamp: Date.now(),
        action: 'test',
        metadata: {
          action: 'test',
          timestamp: Date.now(),
          ...largeMetadata,
        },
      };

      const result = manager.addDelta(delta);
      expect(result).toBe(true);
    });

    it('should handle many deltas', () => {
      for (let i = 0; i < 100; i++) {
        manager.addDelta(createDeltaSnapshot(`delta${i}`, 'base1'));
      }

      expect(manager.getCount()).toBe(100);
    });
  });
});
