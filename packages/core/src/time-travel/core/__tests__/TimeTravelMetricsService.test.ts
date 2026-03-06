/**
 * Tests for TimeTravelMetricsService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeTravelMetricsService } from '../TimeTravelMetricsService';
import {
  createMockHistoryService,
  createMockSnapshot,
  createMockDeltaService,
  createMockCleanupService,
} from './fixtures/test-helpers';

describe('TimeTravelMetricsService', () => {
  let historyService: ReturnType<typeof createMockHistoryService>;
  let deltaService: ReturnType<typeof createMockDeltaService>;
  let cleanupService: ReturnType<typeof createMockCleanupService>;
  let metricsService: TimeTravelMetricsService;

  beforeEach(() => {
    historyService = createMockHistoryService();
    deltaService = createMockDeltaService();
    cleanupService = createMockCleanupService();

    metricsService = new TimeTravelMetricsService(
      deltaService as any,
      cleanupService as any,
      historyService as any
    );
  });

  describe('getDeltaStats()', () => {
    it('should return delta statistics', () => {
      const mockStats = {
        totalDeltas: 10,
        fullSnapshots: 2,
        deltaSnapshots: 8,
        compressionRatio: 0.75,
      };

      deltaService.getStats = vi.fn(() => mockStats);

      const result = metricsService.getDeltaStats();

      expect(result).toBe(mockStats);
      expect(deltaService.getStats).toHaveBeenCalled();
    });

    it('should pass snapshots to delta service', () => {
      const snapshots = [
        createMockSnapshot('test-1'),
        createMockSnapshot('test-2'),
      ];

      historyService.getAll = vi.fn(() => snapshots);

      metricsService.getDeltaStats();

      expect(deltaService.getStats).toHaveBeenCalledWith(snapshots);
    });
  });

  describe('getCleanupStats()', () => {
    it('should return cleanup statistics', () => {
      const mockStats = {
        cleanedAtoms: 50,
        expiredAtoms: 10,
        lastCleanupTime: Date.now(),
      };

      cleanupService.getStats = vi.fn(() => mockStats);

      const result = metricsService.getCleanupStats();

      expect(result).toBe(mockStats);
      expect(cleanupService.getStats).toHaveBeenCalled();
    });
  });

  describe('getHistoryStats()', () => {
    it('should return history statistics', () => {
      const mockStats = {
        length: 10,
        currentIndex: 5,
        canUndo: true,
        canRedo: true,
      };

      historyService.getStats = vi.fn(() => mockStats);
      historyService.getAll = vi.fn(() => Array.from({ length: 10 }, (_, i) =>
        createMockSnapshot(`snap-${i}`)
      ));

      const result = metricsService.getHistoryStats();

      expect(result.length).toBe(10);
      expect(result.currentIndex).toBe(5);
      expect(result.canUndo).toBe(true);
      expect(result.canRedo).toBe(true);
      expect(result.pastCount).toBeDefined();
      expect(result.futureCount).toBeDefined();
    });

    it('should calculate pastCount correctly', () => {
      const snapshots = Array.from({ length: 10 }, (_, i) =>
        createMockSnapshot(`snap-${i}`)
      );

      historyService.getStats = vi.fn(() => ({
        length: 10,
        currentIndex: 5,
        canUndo: true,
        canRedo: true,
      }));
      historyService.getAll = vi.fn(() => snapshots);

      const result = metricsService.getHistoryStats();

      expect(result.pastCount).toBe(5); // indices 0-4
    });

    it('should calculate futureCount correctly', () => {
      const snapshots = Array.from({ length: 10 }, (_, i) =>
        createMockSnapshot(`snap-${i}`)
      );

      historyService.getStats = vi.fn(() => ({
        length: 10,
        currentIndex: 5,
        canUndo: true,
        canRedo: true,
      }));
      historyService.getAll = vi.fn(() => snapshots);

      const result = metricsService.getHistoryStats();

      expect(result.futureCount).toBe(4); // indices 6-9
    });
  });

  describe('getAllStats()', () => {
    it('should return comprehensive statistics', () => {
      historyService.getStats = vi.fn(() => ({
        length: 10,
        currentIndex: 5,
        canUndo: true,
        canRedo: true,
      }));
      historyService.getAll = vi.fn(() => []);

      deltaService.getStats = vi.fn(() => ({
        totalDeltas: 5,
      }));

      cleanupService.getStats = vi.fn(() => ({
        cleanedAtoms: 20,
      }));

      const result = metricsService.getAllStats();

      expect(result).toHaveProperty('history');
      expect(result).toHaveProperty('delta');
      expect(result).toHaveProperty('cleanup');
    });

    it('should include all stats in result', () => {
      const historyStats = {
        length: 10,
        currentIndex: 5,
        canUndo: true,
        canRedo: true,
        pastCount: 5,
        futureCount: 4,
      };

      historyService.getStats = vi.fn(() => ({
        length: 10,
        currentIndex: 5,
        canUndo: true,
        canRedo: true,
      }));
      historyService.getAll = vi.fn(() => Array.from({ length: 10 }, (_, i) =>
        createMockSnapshot(`snap-${i}`)
      ));

      const deltaStats = { totalDeltas: 5 };
      deltaService.getStats = vi.fn(() => deltaStats);

      const cleanupStats = { cleanedAtoms: 20 };
      cleanupService.getStats = vi.fn(() => cleanupStats);

      const result = metricsService.getAllStats();

      expect(result.history).toEqual(expect.objectContaining({
        length: 10,
        currentIndex: 5,
      }));
      expect(result.delta).toEqual(deltaStats);
      expect(result.cleanup).toEqual(cleanupStats);
    });
  });

  describe('getMemoryUsage()', () => {
    it('should estimate memory usage', () => {
      const snapshots = Array.from({ length: 10 }, (_, i) =>
        createMockSnapshot(`snap-${i}`)
      );

      historyService.getAll = vi.fn(() => snapshots);

      const result = metricsService.getMemoryUsage();

      expect(result.historySize).toBe(10);
      expect(result.estimatedMemoryBytes).toBe(10 * 1024); // 10 snapshots * 1KB
    });

    it('should return 0 for empty history', () => {
      historyService.getAll = vi.fn(() => []);

      const result = metricsService.getMemoryUsage();

      expect(result.historySize).toBe(0);
      expect(result.estimatedMemoryBytes).toBe(0);
    });

    it('should calculate memory for large history', () => {
      const snapshots = Array.from({ length: 100 }, (_, i) =>
        createMockSnapshot(`snap-${i}`)
      );

      historyService.getAll = vi.fn(() => snapshots);

      const result = metricsService.getMemoryUsage();

      expect(result.historySize).toBe(100);
      expect(result.estimatedMemoryBytes).toBe(100 * 1024); // ~100KB
    });
  });

  describe('Integration', () => {
    it('should work with real service methods', () => {
      // Setup realistic data
      const snapshots = [
        createMockSnapshot('snap-1', 'action-1'),
        createMockSnapshot('snap-2', 'action-2'),
        createMockSnapshot('snap-3', 'action-3'),
      ];

      historyService.getStats = vi.fn(() => ({
        length: 3,
        currentIndex: 1,
        canUndo: false,
        canRedo: true,
      }));
      historyService.getAll = vi.fn(() => snapshots);

      deltaService.getStats = vi.fn(() => ({
        totalDeltas: 2,
        fullSnapshots: 1,
        deltaSnapshots: 1,
        compressionRatio: 0.5,
      }));

      cleanupService.getStats = vi.fn(() => ({
        cleanedAtoms: 5,
        expiredAtoms: 2,
        lastCleanupTime: Date.now() - 60000,
      }));

      // Get all stats
      const allStats = metricsService.getAllStats();

      expect(allStats.history.length).toBe(3);
      expect(allStats.delta.totalDeltas).toBe(2);
      expect(allStats.cleanup.cleanedAtoms).toBe(5);

      // Get memory usage
      const memory = metricsService.getMemoryUsage();
      expect(memory.historySize).toBe(3);
    });
  });
});
