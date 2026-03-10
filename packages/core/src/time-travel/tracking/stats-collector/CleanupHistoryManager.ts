/**
 * CleanupHistoryManager - Manages cleanup history
 */

import type { ICleanupHistoryManager, CleanupStats } from './types.interfaces';
import type { CleanupResult } from '../types';

/**
 * Default implementation of cleanup history manager
 */
export class CleanupHistoryManager implements ICleanupHistoryManager {
  private history: CleanupResult[] = [];
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Record cleanup result
   */
  record(result: CleanupResult): void {
    this.history.push(result);

    // Trim history if needed
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Get cleanup history
   */
  getHistory(): CleanupResult[] {
    return [...this.history];
  }

  /**
   * Get cleanup statistics
   */
  getStats(): CleanupStats {
    const totalCleanups = this.history.length;
    const totalAtomsCleaned = this.history.reduce(
      (sum, r) => sum + r.cleanedCount,
      0
    );
    const totalAtomsFailed = this.history.reduce(
      (sum, r) => sum + r.failedCount,
      0
    );
    const lastCleanup =
      this.history.length > 0 ? this.history[this.history.length - 1] : undefined;

    return {
      totalCleanups,
      totalAtomsCleaned,
      totalAtomsFailed,
      lastCleanup,
      averageCleanedPerCleanup:
        totalCleanups > 0 ? totalAtomsCleaned / totalCleanups : 0,
    };
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
  }

  /**
   * Get history length
   */
  getLength(): number {
    return this.history.length;
  }
}
