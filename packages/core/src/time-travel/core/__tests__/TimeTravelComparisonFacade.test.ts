/**
 * Tests for TimeTravelComparisonFacade
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeTravelComparisonFacade } from '../TimeTravelComparisonFacade';
import { createMockSnapshot, createMockHistoryService, createMockComparisonService } from './fixtures/test-helpers';

describe('TimeTravelComparisonFacade', () => {
  let historyService: ReturnType<typeof createMockHistoryService>;
  let comparisonService: ReturnType<typeof createMockComparisonService>;
  let comparisonFacade: TimeTravelComparisonFacade;

  beforeEach(() => {
    historyService = createMockHistoryService();
    comparisonService = createMockComparisonService();
    comparisonFacade = new TimeTravelComparisonFacade(
      historyService as any,
      comparisonService as any
    );
  });

  describe('compareSnapshots()', () => {
    it('should compare two snapshots', () => {
      const snapshot1 = createMockSnapshot('test-1', 'action-1');
      const snapshot2 = createMockSnapshot('test-2', 'action-2');

      const result = comparisonFacade.compareSnapshots(snapshot1, snapshot2);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-comparison');
      expect(comparisonService.compare).toHaveBeenCalledWith(snapshot1, snapshot2, undefined);
    });

    it('should resolve snapshot IDs to snapshots', () => {
      const snapshot1 = createMockSnapshot('test-1', 'action-1');
      const snapshot2 = createMockSnapshot('test-2', 'action-2');

      historyService.getById = vi.fn((id: string) => {
        if (id === 'test-1') return snapshot1;
        if (id === 'test-2') return snapshot2;
        return undefined;
      });

      const result = comparisonFacade.compareSnapshots('test-1', 'test-2');

      expect(result).toBeDefined();
      expect(historyService.getById).toHaveBeenCalledTimes(2);
    });

    it('should return empty comparison when snapshot not found', () => {
      historyService.getById = vi.fn(() => undefined);

      const result = comparisonFacade.compareSnapshots('nonexistent-1', 'nonexistent-2');

      expect(result).toBeDefined();
      expect(result.id).toBe('comparison-error');
      expect(result.summary.hasChanges).toBe(false);
    });

    it('should return empty comparison when one snapshot not found', () => {
      const snapshot1 = createMockSnapshot('test-1');
      historyService.getById = vi.fn((id: string) => {
        if (id === 'test-1') return snapshot1;
        return undefined;
      });

      const result = comparisonFacade.compareSnapshots('test-1', 'nonexistent');

      expect(result.id).toBe('comparison-error');
    });

    it('should pass options to comparison service', () => {
      const snapshot1 = createMockSnapshot('test-1');
      const snapshot2 = createMockSnapshot('test-2');
      const options = { deep: true, includeMetadata: true };

      comparisonFacade.compareSnapshots(snapshot1, snapshot2, options);

      expect(comparisonService.compare).toHaveBeenCalledWith(snapshot1, snapshot2, options);
    });
  });

  describe('compareWithCurrent()', () => {
    it('should compare snapshot with current state', () => {
      const currentSnapshot = createMockSnapshot('current', 'current-action');
      const targetSnapshot = createMockSnapshot('target', 'target-action');

      historyService.getCurrent = vi.fn(() => currentSnapshot);

      comparisonFacade.compareWithCurrent(targetSnapshot);

      expect(comparisonService.compare).toHaveBeenCalledWith(currentSnapshot, targetSnapshot, undefined);
    });

    it('should resolve snapshot ID', () => {
      const currentSnapshot = createMockSnapshot('current');
      const targetSnapshot = createMockSnapshot('target');

      historyService.getCurrent = vi.fn(() => currentSnapshot);
      historyService.getById = vi.fn(() => targetSnapshot);

      comparisonFacade.compareWithCurrent('target-id');

      expect(historyService.getById).toHaveBeenCalledWith('target-id');
    });

    it('should return null when no current snapshot', () => {
      historyService.getCurrent = vi.fn(() => undefined);

      const result = comparisonFacade.compareWithCurrent(createMockSnapshot('target'));

      expect(result).toBeNull();
    });
  });

  describe('getDiffSince()', () => {
    it('should return null when no action provided', () => {
      const result = comparisonFacade.getDiffSince();
      expect(result).toBeNull();
    });

    it('should find snapshot by action and compare with current', () => {
      const snapshots = [
        createMockSnapshot('snap-1', 'action-1'),
        createMockSnapshot('snap-2', 'action-2'),
        createMockSnapshot('snap-3', 'target-action'),
      ];
      const currentSnapshot = createMockSnapshot('current', 'current-action');

      historyService.getAll = vi.fn(() => snapshots);
      historyService.getCurrent = vi.fn(() => currentSnapshot);

      comparisonFacade.getDiffSince('target-action');

      expect(comparisonService.compare).toHaveBeenCalledWith(
        snapshots[2],
        currentSnapshot,
        undefined
      );
    });

    it('should return null when action not found', () => {
      historyService.getAll = vi.fn(() => [
        createMockSnapshot('snap-1', 'action-1'),
      ]);

      const result = comparisonFacade.getDiffSince('nonexistent-action');

      expect(result).toBeNull();
    });

    it('should return null when no current snapshot', () => {
      historyService.getAll = vi.fn(() => [
        createMockSnapshot('snap-1', 'action-1'),
      ]);
      historyService.getCurrent = vi.fn(() => undefined);

      const result = comparisonFacade.getDiffSince('action-1');

      expect(result).toBeNull();
    });
  });

  describe('visualizeChanges()', () => {
    it('should visualize comparison result', () => {
      const comparison = {
        id: 'test-comparison',
        timestamp: Date.now(),
        summary: {
          totalAtoms: 1,
          changedAtoms: 0,
          addedAtoms: 0,
          removedAtoms: 0,
          unchangedAtoms: 1,
          hasChanges: false,
          changePercentage: 0,
        },
        atoms: [],
        statistics: {
          duration: 1,
          memoryUsed: 0,
          depth: 0,
          totalComparisons: 1,
          cacheHits: 0,
          cacheMisses: 1,
        },
        metadata: {
          snapshotA: { id: 'a', timestamp: 1 },
          snapshotB: { id: 'b', timestamp: 2 },
          timeDifference: 1,
          options: {},
        },
      };

      const result = comparisonFacade.visualizeChanges(comparison, 'tree');

      expect(result).toBe('visualization');
      expect(comparisonService.visualize).toHaveBeenCalledWith(comparison, 'tree');
    });

    it('should use default format', () => {
      const comparison = createMockComparisonService().compare(
        createMockSnapshot('a'),
        createMockSnapshot('b')
      ).comparison;

      comparisonFacade.visualizeChanges(comparison);

      expect(comparisonService.visualize).toHaveBeenCalledWith(comparison, undefined);
    });
  });

  describe('exportComparison()', () => {
    it('should export comparison to JSON', () => {
      const comparison = {
        id: 'test-comparison',
        timestamp: Date.now(),
        summary: {
          totalAtoms: 1,
          changedAtoms: 0,
          addedAtoms: 0,
          removedAtoms: 0,
          unchangedAtoms: 1,
          hasChanges: false,
          changePercentage: 0,
        },
        atoms: [],
        statistics: {
          duration: 1,
          memoryUsed: 0,
          depth: 0,
          totalComparisons: 1,
          cacheHits: 0,
          cacheMisses: 1,
        },
        metadata: {
          snapshotA: { id: 'a', timestamp: 1 },
          snapshotB: { id: 'b', timestamp: 2 },
          timeDifference: 1,
          options: {},
        },
      };

      const result = comparisonFacade.exportComparison(comparison, 'json');

      expect(result).toBe('exported-json');
      expect(comparisonService.export).toHaveBeenCalledWith(comparison, 'json');
    });

    it('should export comparison to HTML', () => {
      const comparison = createMockComparisonService().compare(
        createMockSnapshot('a'),
        createMockSnapshot('b')
      ).comparison;

      comparisonFacade.exportComparison(comparison, 'html');

      expect(comparisonService.export).toHaveBeenCalledWith(comparison, 'html');
    });

    it('should export comparison to markdown', () => {
      const comparison = createMockComparisonService().compare(
        createMockSnapshot('a'),
        createMockSnapshot('b')
      ).comparison;

      comparisonFacade.exportComparison(comparison, 'md');

      expect(comparisonService.export).toHaveBeenCalledWith(comparison, 'md');
    });
  });
});
