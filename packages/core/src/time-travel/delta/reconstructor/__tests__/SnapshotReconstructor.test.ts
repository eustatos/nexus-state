/**
 * SnapshotReconstructor tests
 */

import { describe, it, expect, vi } from 'vitest';
import { SnapshotReconstructor } from '../SnapshotReconstructor.di';
import type { Snapshot, DeltaSnapshot } from '../../../types';
import type { IReconstructionCache, IDeltaApplier } from '../types.interfaces';

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

function createMockCache(): jest.Mocked<IReconstructionCache> {
  return {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    size: vi.fn().mockReturnValue(0),
    getStats: vi.fn().mockReturnValue({ size: 0, maxSize: 100 }),
  } as unknown as jest.Mocked<IReconstructionCache>;
}

function createMockDeltaApplier(): jest.Mocked<IDeltaApplier> {
  return {
    applyDelta: vi.fn(),
  } as unknown as jest.Mocked<IDeltaApplier>;
}

describe('SnapshotReconstructor', () => {
  describe('constructor', () => {
    it('should create with default dependencies', () => {
      const reconstructor = new SnapshotReconstructor();
      expect(reconstructor).toBeDefined();
    });

    it('should create with custom cache', () => {
      const mockCache = createMockCache();
      const reconstructor = new SnapshotReconstructor({ cache: mockCache });
      expect(reconstructor).toBeDefined();
    });

    it('should create without cache when disabled', () => {
      const reconstructor = new SnapshotReconstructor({ config: { cache: false } });
      expect(reconstructor).toBeDefined();
    });
  });

  describe('reconstruct', () => {
    it('should return error when start snapshot is null', () => {
      const reconstructor = new SnapshotReconstructor();
      const result = reconstructor.reconstruct(null as any, []);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Start snapshot is required');
    });

    it('should reconstruct with deltas using mock applier', () => {
      const mockApplier = createMockDeltaApplier();
      const startSnapshot = createMockSnapshot('snap1', 1);
      const delta = createMockDelta('delta1', 'snap1', 2);
      const resultSnapshot = createMockSnapshot('snap1', 2);

      mockApplier.applyDelta.mockReturnValue(resultSnapshot);

      const reconstructor = new SnapshotReconstructor({ deltaApplier: mockApplier });
      const result = reconstructor.reconstruct(startSnapshot, [delta]);

      expect(result.success).toBe(true);
      expect(mockApplier.applyDelta).toHaveBeenCalled();
    });

    it('should return error when delta apply fails', () => {
      const mockApplier = createMockDeltaApplier();
      const startSnapshot = createMockSnapshot('snap1', 1);
      const delta = createMockDelta('delta1', 'snap1', 2);

      mockApplier.applyDelta.mockReturnValue(null);

      const reconstructor = new SnapshotReconstructor({ deltaApplier: mockApplier });
      const result = reconstructor.reconstruct(startSnapshot, [delta]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to apply delta');
    });

    it('should use cache hit when available', () => {
      const mockCache = createMockCache();
      const cachedSnapshot = createMockSnapshot('cached', 2);
      mockCache.get.mockReturnValue(cachedSnapshot);

      const reconstructor = new SnapshotReconstructor({ cache: mockCache, config: { cache: true } });
      const result = reconstructor.reconstruct(createMockSnapshot('snap1', 1), [
        createMockDelta('delta1', 'snap1', 2),
      ]);

      expect(result.success).toBe(true);
      expect(result.metadata?.cacheHit).toBe(true);
    });
  });

  describe('getReconstructionPath', () => {
    it('should return reconstruction path', () => {
      const reconstructor = new SnapshotReconstructor();
      const path = reconstructor.getReconstructionPath(0, 5, 10);

      expect(path.deltaCount).toBe(5);
      expect(path.estimatedTime).toBe(0.5);
    });
  });

  describe('cache operations', () => {
    it('should get from cache', () => {
      const mockCache = createMockCache();
      const snapshot = createMockSnapshot('test');
      mockCache.get.mockReturnValue(snapshot);

      const reconstructor = new SnapshotReconstructor({ cache: mockCache });
      const result = reconstructor.getFromCache('test');

      expect(result).toBe(snapshot);
    });

    it('should set in cache', () => {
      const mockCache = createMockCache();
      const snapshot = createMockSnapshot('test');

      const reconstructor = new SnapshotReconstructor({ cache: mockCache });
      reconstructor.setInCache('test', snapshot);

      expect(mockCache.set).toHaveBeenCalledWith('test', snapshot);
    });

    it('should clear cache', () => {
      const mockCache = createMockCache();

      const reconstructor = new SnapshotReconstructor({ cache: mockCache });
      reconstructor.clearCache();

      expect(mockCache.clear).toHaveBeenCalled();
    });

    it('should get cache stats', () => {
      const mockCache = createMockCache();
      mockCache.getStats.mockReturnValue({ size: 5, maxSize: 100 });

      const reconstructor = new SnapshotReconstructor({ cache: mockCache });
      const stats = reconstructor.getCacheStats();

      expect(stats.size).toBe(5);
      expect(stats.maxSize).toBe(100);
    });
  });

  describe('getters', () => {
    it('should get cache instance', () => {
      const mockCache = createMockCache();
      const reconstructor = new SnapshotReconstructor({ cache: mockCache });

      expect(reconstructor.getCache()).toBe(mockCache);
    });

    it('should get delta applier', () => {
      const mockApplier = createMockDeltaApplier();
      const reconstructor = new SnapshotReconstructor({ deltaApplier: mockApplier });

      expect(reconstructor.getDeltaApplier()).toBe(mockApplier);
    });

    it('should get config', () => {
      const reconstructor = new SnapshotReconstructor({ config: { cache: false } });
      const config = reconstructor.getConfig();

      expect(config.cache).toBe(false);
    });
  });
});
