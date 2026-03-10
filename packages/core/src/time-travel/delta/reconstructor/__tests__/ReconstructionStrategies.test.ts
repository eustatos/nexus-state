/**
 * ReconstructionStrategies tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  SequentialReconstructionStrategy,
  SkipDeltasReconstructionStrategy,
  CacheAwareReconstructionStrategy,
  StrategyRegistry,
} from '../ReconstructionStrategies';
import type { Snapshot, DeltaSnapshot } from '../../../types';
import type { IDeltaApplier } from '../types.interfaces';

function createMockSnapshot(id: string, value: number = 1): Snapshot {
  return {
    id,
    state: {
      atom1: { value, type: 'primitive', name: 'atom1', atomId: '1' },
    },
    metadata: {
      timestamp: Date.now(),
      action: 'test',
      atomCount: 1,
    },
  };
}

function createMockDelta(id: string, baseId: string, value: number): DeltaSnapshot {
  return {
    id,
    type: 'delta',
    baseSnapshotId: baseId,
    state: {},
    changes: new Map([
      [
        'atom1',
        {
          atomId: '1',
          atomName: 'atom1',
          oldValue: 1,
          newValue: value,
          changeType: 'modified',
        },
      ],
    ]),
    metadata: {
      timestamp: Date.now(),
      action: 'test',
      atomCount: 1,
      baseTimestamp: Date.now() - 1000,
      changeCount: 1,
      compressedSize: 0,
      originalSize: 0,
    },
  };
}

function createMockDeltaApplier(): jest.Mocked<IDeltaApplier> {
  return {
    applyDelta: vi.fn(),
  } as unknown as jest.Mocked<IDeltaApplier>;
}

describe('ReconstructionStrategies', () => {
  describe('SequentialReconstructionStrategy', () => {
    it('should have correct name', () => {
      const strategy = new SequentialReconstructionStrategy();
      expect(strategy.name).toBe('sequential');
    });

    it('should reconstruct sequentially', () => {
      const strategy = new SequentialReconstructionStrategy();
      const mockApplier = createMockDeltaApplier();
      const startSnapshot = createMockSnapshot('snap1', 1);
      const resultSnapshot = createMockSnapshot('snap1', 2);

      mockApplier.applyDelta.mockReturnValue(resultSnapshot);

      const delta = createMockDelta('delta1', 'snap1', 2);
      const result = strategy.reconstruct(startSnapshot, [delta], mockApplier);

      expect(result).toBe(resultSnapshot);
      expect(mockApplier.applyDelta).toHaveBeenCalled();
    });

    it('should throw on apply failure', () => {
      const strategy = new SequentialReconstructionStrategy();
      const mockApplier = createMockDeltaApplier();
      const startSnapshot = createMockSnapshot('snap1', 1);

      mockApplier.applyDelta.mockReturnValue(null);

      const delta = createMockDelta('delta1', 'snap1', 2);

      expect(() => {
        strategy.reconstruct(startSnapshot, [delta], mockApplier);
      }).toThrow('Failed to apply delta');
    });
  });

  describe('SkipDeltasReconstructionStrategy', () => {
    it('should have correct name', () => {
      const strategy = new SkipDeltasReconstructionStrategy();
      expect(strategy.name).toBe('skip-deltas');
    });

    it('should use sequential reconstruction', () => {
      const strategy = new SkipDeltasReconstructionStrategy();
      const mockApplier = createMockDeltaApplier();
      const startSnapshot = createMockSnapshot('snap1', 1);
      const resultSnapshot = createMockSnapshot('snap1', 2);

      mockApplier.applyDelta.mockReturnValue(resultSnapshot);

      const delta = createMockDelta('delta1', 'snap1', 2);
      const result = strategy.reconstruct(startSnapshot, [delta], mockApplier);

      expect(result).toBe(resultSnapshot);
    });
  });

  describe('CacheAwareReconstructionStrategy', () => {
    it('should have correct name', () => {
      const strategy = new CacheAwareReconstructionStrategy();
      expect(strategy.name).toBe('cache-aware');
    });

    it('should use sequential for short chains', () => {
      const strategy = new CacheAwareReconstructionStrategy();
      const mockApplier = createMockDeltaApplier();
      const startSnapshot = createMockSnapshot('snap1', 1);
      const resultSnapshot = createMockSnapshot('snap1', 2);

      mockApplier.applyDelta.mockReturnValue(resultSnapshot);

      const deltas = Array(5)
        .fill(null)
        .map((_, i) => createMockDelta(`d${i}`, 'snap1', i + 1));

      const result = strategy.reconstruct(startSnapshot, deltas, mockApplier);

      expect(result).toBe(resultSnapshot);
    });
  });

  describe('StrategyRegistry', () => {
    describe('constructor', () => {
      it('should register default strategies', () => {
        const registry = new StrategyRegistry();

        expect(registry.has('sequential')).toBe(true);
        expect(registry.has('skip-deltas')).toBe(true);
        expect(registry.has('cache-aware')).toBe(true);
      });
    });

    describe('register', () => {
      it('should register a strategy', () => {
        const registry = new StrategyRegistry();
        const strategy = new SequentialReconstructionStrategy();

        registry.register(strategy);

        expect(registry.has('sequential')).toBe(true);
      });
    });

    describe('get', () => {
      it('should return strategy by name', () => {
        const registry = new StrategyRegistry();
        const strategy = registry.get('sequential');

        expect(strategy).toBeDefined();
        expect(strategy?.name).toBe('sequential');
      });

      it('should return undefined for unknown strategy', () => {
        const registry = new StrategyRegistry();
        const strategy = registry.get('unknown');

        expect(strategy).toBeUndefined();
      });
    });

    describe('getStrategyNames', () => {
      it('should return all strategy names', () => {
        const registry = new StrategyRegistry();
        const names = registry.getStrategyNames();

        expect(names).toContain('sequential');
        expect(names).toContain('skip-deltas');
        expect(names).toContain('cache-aware');
      });
    });

    describe('has', () => {
      it('should return true for registered strategy', () => {
        const registry = new StrategyRegistry();
        expect(registry.has('sequential')).toBe(true);
      });

      it('should return false for unknown strategy', () => {
        const registry = new StrategyRegistry();
        expect(registry.has('unknown')).toBe(false);
      });
    });

    describe('remove', () => {
      it('should remove strategy', () => {
        const registry = new StrategyRegistry();
        const removed = registry.remove('sequential');

        expect(removed).toBe(true);
        expect(registry.has('sequential')).toBe(false);
      });

      it('should return false for unknown strategy', () => {
        const registry = new StrategyRegistry();
        const removed = registry.remove('unknown');

        expect(removed).toBe(false);
      });
    });

    describe('clear', () => {
      it('should clear all strategies', () => {
        const registry = new StrategyRegistry();
        registry.clear();

        expect(registry.getStrategyNames()).toEqual([]);
      });
    });
  });
});
