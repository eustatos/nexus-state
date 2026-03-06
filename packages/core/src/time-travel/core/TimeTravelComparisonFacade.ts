/**
 * TimeTravelComparisonFacade - Facade for snapshot comparison operations
 *
 * Responsibilities:
 * - Compare two snapshots
 * - Compare snapshot with current state
 * - Get diff since action
 * - Visualize changes
 * - Export comparison
 */

import type { Snapshot } from '../../types';
import type { ComparisonResult } from './types';
import type { HistoryService } from './HistoryService';
import type { ComparisonService } from './ComparisonService';
import { storeLogger as logger } from '../../debug';

export class TimeTravelComparisonFacade {
  private historyService: HistoryService;
  private comparisonService: ComparisonService;

  constructor(
    historyService: HistoryService,
    comparisonService: ComparisonService
  ) {
    this.historyService = historyService;
    this.comparisonService = comparisonService;
  }

  /**
   * Compare two snapshots
   */
  compareSnapshots(
    a: Snapshot | string,
    b: Snapshot | string,
    options?: any
  ): ComparisonResult {
    const snapshot1 = this.resolveSnapshot(a);
    const snapshot2 = this.resolveSnapshot(b);

    if (!snapshot1 || !snapshot2) {
      return this.createEmptyComparison();
    }

    const result = this.comparisonService.compare(snapshot1, snapshot2, options);
    return result.comparison;
  }

  /**
   * Compare snapshot with current state
   */
  compareWithCurrent(
    snapshot: Snapshot | string,
    options?: any
  ): ComparisonResult | null {
    const currentSnapshot = this.historyService.getCurrent();
    if (!currentSnapshot) {
      return null;
    }

    return this.compareSnapshots(currentSnapshot, snapshot, options);
  }

  /**
   * Get diff since specific action
   */
  getDiffSince(action?: string, options?: any): ComparisonResult | null {
    if (!action) {
      return null;
    }

    const snapshots = this.historyService.getAll();
    const targetSnapshot = snapshots.find((s) => s.metadata.action === action);

    if (!targetSnapshot) {
      logger.warn(`[TimeTravelComparisonFacade] No snapshot found with action: ${action}`);
      return null;
    }

    const currentSnapshot = this.historyService.getCurrent();
    if (!currentSnapshot) {
      return null;
    }

    return this.compareSnapshots(targetSnapshot, currentSnapshot, options);
  }

  /**
   * Visualize changes between snapshots
   */
  visualizeChanges(comparison: ComparisonResult, format?: string): string {
    return this.comparisonService.visualize(comparison, format as any);
  }

  /**
   * Export comparison result
   */
  exportComparison(comparison: ComparisonResult, format: string): string {
    return this.comparisonService.export(comparison, format as any);
  }

  /**
   * Resolve snapshot from ID or snapshot object
   */
  private resolveSnapshot(input: Snapshot | string): Snapshot | undefined {
    if (typeof input === 'string') {
      return this.historyService.getById(input);
    }
    return input;
  }

  /**
   * Create empty comparison result for error cases
   */
  private createEmptyComparison(): ComparisonResult {
    return {
      id: 'comparison-error',
      timestamp: Date.now(),
      summary: {
        totalAtoms: 0,
        changedAtoms: 0,
        addedAtoms: 0,
        removedAtoms: 0,
        unchangedAtoms: 0,
        hasChanges: false,
        changePercentage: 0,
      },
      atoms: [],
      statistics: {
        duration: 0,
        memoryUsed: 0,
        depth: 0,
        totalComparisons: 0,
        cacheHits: 0,
        cacheMisses: 0,
      },
      metadata: {
        snapshotA: { id: 'unknown', timestamp: 0 },
        snapshotB: { id: 'unknown', timestamp: 0 },
        timeDifference: 0,
        options: {},
      },
    };
  }
}
