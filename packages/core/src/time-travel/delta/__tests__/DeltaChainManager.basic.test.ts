/**
 * DeltaChainManager basic tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeltaChainManager } from '../chain-manager';
import type { DeltaSnapshot } from '../types';

function createMockDelta(id: string, baseId: string): DeltaSnapshot {
  return {
    id,
    type: 'delta',
    baseSnapshotId: baseId,
    state: {},
    changes: new Map(),
    metadata: {
      timestamp: Date.now(),
      action: 'test',
      atomCount: 1,
      baseTimestamp: Date.now() - 1000,
      changeCount: 1,
      compressedSize: 100,
      originalSize: 200,
    },
  };
}

describe('DeltaChainManager', () => {
  let manager: DeltaChainManager;

  beforeEach(() => {
    manager = new DeltaChainManager();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(manager).toBeDefined();
      expect(manager.getActiveChainCount()).toBe(0);
    });

    it('should create with custom config', () => {
      const mgr = new DeltaChainManager({
        fullSnapshotInterval: 5,
        maxDeltaChainLength: 10,
      });
      expect(mgr).toBeDefined();
    });
  });

  describe('addDelta', () => {
    it('should add delta to chain', () => {
      const delta = createMockDelta('delta1', 'base1');
      manager.addDelta(delta);

      expect(manager.getActiveChainCount()).toBe(1);
    });

    it('should skip delta without baseSnapshotId', () => {
      const delta = {
        ...createMockDelta('delta1', ''),
        baseSnapshotId: undefined,
      } as unknown as DeltaSnapshot;
      
      manager.addDelta(delta);
      expect(manager.getActiveChainCount()).toBe(0);
    });

    it('should track multiple deltas', () => {
      manager.addDelta(createMockDelta('d1', 'base1'));
      manager.addDelta(createMockDelta('d2', 'base1'));
      manager.addDelta(createMockDelta('d3', 'base2'));

      expect(manager.getActiveChainCount()).toBe(2);
    });
  });

  describe('getChain', () => {
    it('should return null for unknown chain', () => {
      const chain = manager.getChain('unknown');
      expect(chain).toBeNull();
    });

    it('should return chain after adding delta', () => {
      manager.addDelta(createMockDelta('d1', 'base1'));
      const chain = manager.getChain('base1');

      expect(chain).not.toBeNull();
      expect(chain?.deltas.length).toBe(1);
    });
  });

  describe('getAllChains', () => {
    it('should return empty array initially', () => {
      const chains = manager.getAllChains();
      expect(chains).toEqual([]);
    });

    it('should return all chains', () => {
      manager.addDelta(createMockDelta('d1', 'base1'));
      manager.addDelta(createMockDelta('d2', 'base2'));

      const chains = manager.getAllChains();
      expect(chains.length).toBe(2);
    });
  });

  describe('getActiveChainCount', () => {
    it('should return 0 initially', () => {
      expect(manager.getActiveChainCount()).toBe(0);
    });

    it('should return count of active chains', () => {
      manager.addDelta(createMockDelta('d1', 'base1'));
      manager.addDelta(createMockDelta('d2', 'base2'));
      manager.addDelta(createMockDelta('d3', 'base1'));

      expect(manager.getActiveChainCount()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all chains', () => {
      manager.addDelta(createMockDelta('d1', 'base1'));
      manager.addDelta(createMockDelta('d2', 'base2'));

      manager.clear();

      expect(manager.getActiveChainCount()).toBe(0);
      expect(manager.getAllChains()).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return stats', () => {
      const stats = manager.getStats();

      expect(stats).toHaveProperty('deltaCount');
      expect(stats).toHaveProperty('fullSnapshotCount');
      expect(stats).toHaveProperty('activeChains');
      expect(stats).toHaveProperty('memoryUsage');
    });

    it('should track delta count', () => {
      manager.addDelta(createMockDelta('d1', 'base1'));
      manager.addDelta(createMockDelta('d2', 'base1'));

      const stats = manager.getStats();
      expect(stats.deltaCount).toBe(2);
    });
  });
});
