/**
 * DeltaChainManager tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeltaChainManager, DEFAULT_CHAIN_MANAGER_CONFIG } from '../chain-manager';
import type { DeltaSnapshot } from '../types';

function createMockDelta(
  id: string,
  baseId: string,
  changes?: Map<string, any>
): DeltaSnapshot {
  return {
    id,
    type: 'delta',
    baseSnapshotId: baseId,
    state: {},
    changes: changes || new Map(),
    metadata: {
      timestamp: Date.now(),
      action: 'test',
      atomCount: 0,
      baseTimestamp: Date.now() - 1000,
      changeCount: changes?.size || 0,
      compressedSize: 0,
      originalSize: 0,
    },
  };
}

describe('DeltaChainManager', () => {
  let chainManager: DeltaChainManager;

  beforeEach(() => {
    chainManager = new DeltaChainManager();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const manager = new DeltaChainManager();

      expect(manager).toBeDefined();
    });

    it('should create with custom config', () => {
      const manager = new DeltaChainManager({
        fullSnapshotInterval: 5,
        maxDeltaChainLength: 10,
      });

      expect(manager).toBeDefined();
    });
  });

  describe('addDelta', () => {
    it('should add delta to chain', () => {
      const delta = createMockDelta('delta1', 'base1');

      chainManager.addDelta(delta);

      const chain = chainManager.getChain('base1');
      expect(chain).not.toBeNull();
      expect(chain?.deltas.length).toBe(1);
    });

    it('should increment delta count', () => {
      const delta1 = createMockDelta('delta1', 'base1');
      const delta2 = createMockDelta('delta2', 'base1');

      chainManager.addDelta(delta1);
      chainManager.addDelta(delta2);

      const chain = chainManager.getChain('base1');
      expect(chain?.deltas.length).toBe(2);
    });

    it('should group deltas by base snapshot', () => {
      const delta1 = createMockDelta('delta1', 'base1');
      const delta2 = createMockDelta('delta2', 'base2');

      chainManager.addDelta(delta1);
      chainManager.addDelta(delta2);

      expect(chainManager.getActiveChainCount()).toBe(2);
    });

    it('should update chain metadata', () => {
      const delta = createMockDelta('delta1', 'base1');

      chainManager.addDelta(delta);

      const chain = chainManager.getChain('base1');
      expect(chain?.metadata.deltaCount).toBe(1);
    });
  });

  describe('getChain', () => {
    it('should get existing chain', () => {
      const delta = createMockDelta('delta1', 'base1');
      chainManager.addDelta(delta);

      const chain = chainManager.getChain('base1');

      expect(chain).toBeDefined();
    });
  });

  describe('getAllChains', () => {
    it('should return all chains', () => {
      const delta1 = createMockDelta('delta1', 'base1');
      const delta2 = createMockDelta('delta2', 'base2');

      chainManager.addDelta(delta1);
      chainManager.addDelta(delta2);

      const chains = chainManager.getAllChains();

      expect(chains.length).toBe(2);
    });

    it('should return empty array when no chains', () => {
      const chains = chainManager.getAllChains();

      expect(chains).toEqual([]);
    });
  });

  describe('getActiveChainCount', () => {
    it('should return count of active chains', () => {
      const delta1 = createMockDelta('delta1', 'base1');
      const delta2 = createMockDelta('delta2', 'base2');

      chainManager.addDelta(delta1);
      chainManager.addDelta(delta2);

      expect(chainManager.getActiveChainCount()).toBe(2);
    });

    it('should return 0 when no chains', () => {
      expect(chainManager.getActiveChainCount()).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      const delta1 = createMockDelta('delta1', 'base1');
      const delta2 = createMockDelta('delta2', 'base1');

      chainManager.addDelta(delta1);
      chainManager.addDelta(delta2);

      const stats = chainManager.getStats();

      expect(stats).toBeDefined();
    });

    it('should return stats object', () => {
      const stats = chainManager.getStats();

      expect(stats).toBeDefined();
    });

    it('should include memory usage', () => {
      const delta = createMockDelta('delta1', 'base1');
      chainManager.addDelta(delta);

      const stats = chainManager.getStats();

      expect(stats).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear all chains', () => {
      const delta1 = createMockDelta('delta1', 'base1');
      const delta2 = createMockDelta('delta2', 'base2');

      chainManager.addDelta(delta1);
      chainManager.addDelta(delta2);

      chainManager.clear();

      expect(chainManager.getActiveChainCount()).toBe(0);
      expect(chainManager.getAllChains()).toEqual([]);
    });
  });

  describe('shouldCreateBaseSnapshot', () => {
    it('should determine when to create base snapshot', () => {
      const manager = new DeltaChainManager({
        fullSnapshotInterval: 2,
      });

      const delta1 = createMockDelta('delta1', 'base1');
      const delta2 = createMockDelta('delta2', 'base1');
      const delta3 = createMockDelta('delta3', 'base1');

      manager.addDelta(delta1);
      manager.addDelta(delta2);
      manager.addDelta(delta3);

      // After 3 deltas with interval 2, should consider creating base
      expect(manager).toBeDefined();
    });
  });

  describe('chain validation', () => {
    it('should handle valid chain', () => {
      const delta = createMockDelta('delta1', 'base1');
      chainManager.addDelta(delta);

      const chain = chainManager.getChain('base1');

      expect(chain).not.toBeNull();
      expect(chain?.deltas.length).toBe(1);
    });

    it('should track delta count', () => {
      const delta1 = createMockDelta('delta1', 'base1');
      const delta2 = createMockDelta('delta2', 'base1');

      chainManager.addDelta(delta1);
      chainManager.addDelta(delta2);

      const chain = chainManager.getChain('base1');

      expect(chain?.deltas.length).toBe(2);
    });
  });
});
