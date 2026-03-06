/**
 * DeltaService tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeltaService } from '../DeltaService';
import type { Snapshot, Atom } from '../../../types';

describe('DeltaService', () => {
  let deltaService: DeltaService;

  const createSnapshot = (state: Record<string, { value: unknown }>): Snapshot => ({
    id: 'test-id',
    state,
    metadata: {
      timestamp: Date.now(),
      action: 'test-action',
    },
  });

  beforeEach(() => {
    deltaService = new DeltaService();
  });

  describe('constructor', () => {
    it('should create DeltaService with default config', () => {
      const service = new DeltaService();
      const config = service.getConfig();

      expect(config.enabled).toBe(false);
      expect(config.compression).toEqual({ strategy: 'none' });
      expect(config.incremental?.enabled).toBe(false);
    });

    it('should create DeltaService with custom config', () => {
      const service = new DeltaService({
        enabled: true,
        compression: { strategy: 'lz-string' },
      });

      expect(service.isEnabled()).toBe(true);
    });
  });

  describe('isEnabled', () => {
    it('should return false by default', () => {
      expect(deltaService.isEnabled()).toBe(false);
    });

    it('should return true when enabled', () => {
      const service = new DeltaService({ enabled: true });
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      deltaService.configure({ enabled: true });
      expect(deltaService.isEnabled()).toBe(true);
    });
  });

  describe('getCalculator', () => {
    it('should return delta calculator', () => {
      const calculator = deltaService.getCalculator();
      expect(calculator).toBeDefined();
    });
  });

  describe('getReconstructor', () => {
    it('should return snapshot reconstructor', () => {
      const reconstructor = deltaService.getReconstructor();
      expect(reconstructor).toBeDefined();
    });
  });

  describe('forceFullSnapshot', () => {
    it('should return snapshot as-is', () => {
      const snapshot = createSnapshot({ foo: { value: 'bar' } });
      const result = deltaService.forceFullSnapshot(snapshot);

      expect(result).toBe(snapshot);
    });
  });

  describe('getStats', () => {
    it('should return stats for empty snapshots array', () => {
      const stats = deltaService.getStats([]);

      expect(stats.totalDeltas).toBe(0);
      expect(stats.fullSnapshotsCount).toBe(0);
      expect(stats.deltaSnapshotsCount).toBe(0);
      expect(stats.averageDeltaSize).toBeUndefined();
      expect(stats.compressionRatio).toBeUndefined();
    });

    it('should return stats with only full snapshots', () => {
      const snapshots = [
        createSnapshot({ foo: { value: 'bar' } }),
        createSnapshot({ foo: { value: 'baz' } }),
      ];

      const stats = deltaService.getStats(snapshots);

      expect(stats.fullSnapshotsCount).toBe(2);
      expect(stats.deltaSnapshotsCount).toBe(0);
      expect(stats.totalDeltas).toBe(0);
    });

    it('should return stats with delta snapshots', () => {
      const fullSnapshot = createSnapshot({ foo: { value: 'bar' } });
      const deltaSnapshot = {
        type: 'delta',
        baseSnapshotId: fullSnapshot.id,
        changes: { foo: { value: 'baz' } },
        metadata: { timestamp: Date.now() },
      };

      const stats = deltaService.getStats([fullSnapshot, deltaSnapshot]);

      expect(stats.fullSnapshotsCount).toBe(1);
      expect(stats.deltaSnapshotsCount).toBe(1);
      expect(stats.totalDeltas).toBe(1);
    });
  });

  describe('createDelta', () => {
    it('should create delta between two snapshots', () => {
      const fromSnapshot = createSnapshot({ foo: { value: 'bar' } });
      const toSnapshot = createSnapshot({ foo: { value: 'baz' } });

      const result = deltaService.createDelta(fromSnapshot, toSnapshot);

      expect(result.success).toBe(true);
      expect(result.delta).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should handle error during delta creation', () => {
      const fromSnapshot = { invalid: 'snapshot' } as unknown as Snapshot;
      const toSnapshot = { invalid: 'snapshot' } as unknown as Snapshot;

      const result = deltaService.createDelta(fromSnapshot, toSnapshot);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('reconstruct', () => {
    it('should handle error during reconstruction', () => {
      const baseSnapshot = createSnapshot({ foo: { value: 'bar' } });
      const delta = {
        type: 'delta' as const,
        baseSnapshotId: 'non-existent',
        changes: { foo: { value: 'baz' } },
        metadata: { timestamp: Date.now() },
      };

      const result = deltaService.reconstruct(baseSnapshot, delta);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('reconstructAt', () => {
    it('should return error for invalid snapshots array', () => {
      const result = deltaService.reconstructAt([], 0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid snapshots or targetIndex');
    });

    it('should return error for targetIndex out of bounds', () => {
      const snapshot = createSnapshot({ foo: { value: 'bar' } });

      const result = deltaService.reconstructAt([snapshot], 5);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid snapshots or targetIndex');
    });

    it('should handle error during reconstruction', () => {
      const baseSnapshot = createSnapshot({ foo: { value: 'bar' } });
      const invalidDelta = {
        type: 'delta' as const,
        baseSnapshotId: 'non-existent',
        changes: { foo: { value: 'baz' } },
        metadata: { timestamp: Date.now() },
      };

      const result = deltaService.reconstructAt([baseSnapshot, invalidDelta], 1);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
