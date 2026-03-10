/**
 * TimeTravelMetricsService - Provides time travel metrics and statistics
 *
 * Responsibilities:
 * - Get delta statistics
 * - Get cleanup statistics
 * - Get history statistics
 */

import type { DeltaService } from './DeltaService';
import type { CleanupService } from './CleanupService';
import type { HistoryService } from './HistoryService';
import type { Snapshot } from '../../types';
import { storeLogger as logger } from '../../debug';

export class TimeTravelMetricsService {
  private deltaService: DeltaService;
  private cleanupService: CleanupService;
  private historyService: HistoryService;

  constructor(
    deltaService: DeltaService,
    cleanupService: CleanupService,
    historyService: HistoryService
  ) {
    this.deltaService = deltaService;
    this.cleanupService = cleanupService;
    this.historyService = historyService;
  }

  /**
   * Get delta statistics
   */
  getDeltaStats(): any {
    const snapshots = this.historyService.getAll();
    const stats = this.deltaService.getStats(snapshots as any);
    logger.log('[TimeTravelMetricsService] Retrieved delta stats');
    return stats;
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStats(): any {
    const stats = this.cleanupService.getStats();
    logger.log('[TimeTravelMetricsService] Retrieved cleanup stats');
    return stats;
  }

  /**
   * Get history statistics
   */
  getHistoryStats(): {
    length: number;
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    pastCount: number;
    futureCount: number;
  } {
    const stats = this.historyService.getStats();
    const all = this.historyService.getAll();

    return {
      length: stats.length,
      currentIndex: stats.currentIndex,
      canUndo: stats.canUndo,
      canRedo: stats.canRedo,
      pastCount: all.filter((_, i) => i < stats.currentIndex).length,
      futureCount: all.filter((_, i) => i > stats.currentIndex).length,
    };
  }

  /**
   * Get comprehensive statistics
   */
  getAllStats(): {
    history: any;
    delta: any;
    cleanup: any;
  } {
    return {
      history: this.getHistoryStats(),
      delta: this.getDeltaStats(),
      cleanup: this.getCleanupStats(),
    };
  }

  /**
   * Get memory usage estimate
   */
  getMemoryUsage(): {
    historySize: number;
    estimatedMemoryBytes: number;
  } {
    const snapshots = this.historyService.getAll();
    const historySize = snapshots.length;

    // Rough estimate: each snapshot ~1KB average
    const estimatedMemoryBytes = historySize * 1024;

    return {
      historySize,
      estimatedMemoryBytes,
    };
  }
}
