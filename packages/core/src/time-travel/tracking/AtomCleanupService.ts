/**
 * AtomCleanupService - Service for atom cleanup operations
 *
 * Handles cleanup scheduling, execution, and wait operations.
 */

import type { CleanupResult } from './CleanupEngine';
import type { CleanupScheduler } from './CleanupScheduler';
import type { CleanupEngine } from './CleanupEngine';
import type { TrackingEventManager } from './TrackingEventManager';

export interface CleanupStats {
  /** Total cleanups performed */
  totalCleanups: number;
  /** Total atoms cleaned */
  totalAtomsCleaned: number;
  /** Total atoms failed */
  totalAtomsFailed: number;
  /** Last cleanup result */
  lastCleanup?: CleanupResult;
}

/**
 * AtomCleanupService provides cleanup operations
 */
export class AtomCleanupService {
  private scheduler: CleanupScheduler;
  private cleanupEngine: CleanupEngine;
  private eventManager: TrackingEventManager;
  private cleanupCount: number = 0;
  private totalAtomsCleaned: number = 0;
  private totalAtomsFailed: number = 0;
  private lastCleanupResult?: CleanupResult;

  constructor(
    scheduler: CleanupScheduler,
    cleanupEngine: CleanupEngine,
    eventManager: TrackingEventManager
  ) {
    this.scheduler = scheduler;
    this.cleanupEngine = cleanupEngine;
    this.eventManager = eventManager;
  }

  /**
   * Perform cleanup
   * @returns Cleanup result
   */
  async performCleanup(): Promise<CleanupResult> {
    this.eventManager.emitCleanupStarted();

    const result = this.cleanupEngine.performCleanup();

    // Update stats
    this.cleanupCount++;
    this.totalAtomsCleaned += result.cleanedCount;
    this.totalAtomsFailed += result.failedCount;
    this.lastCleanupResult = result;

    // Emit cleanup completed
    this.eventManager.emitCleanupCompleted(result.cleanedCount, result.failedCount);

    return result;
  }

  /**
   * Trigger immediate cleanup
   * @returns Cleanup result
   */
  async triggerCleanup(): Promise<CleanupResult> {
    return this.scheduler.triggerCleanup();
  }

  /**
   * Wait for next cleanup cycle
   * @param timeout Timeout in milliseconds
   * @returns Promise that resolves after cleanup
   */
  async waitForCleanup(timeout: number = 5000): Promise<{ removed: number }> {
    let cleanupResult: { removed: number } = { removed: 0 };

    return new Promise((resolve) => {
      const unsubscribe = this.eventManager.subscribe('cleanup-completed', (event) => {
        unsubscribe();
        if (event.data) {
          cleanupResult = { removed: event.data.cleanedCount || 0 };
        }
        resolve(cleanupResult);
      });

      setTimeout(() => {
        unsubscribe();
        resolve(cleanupResult);
      }, timeout);
    });
  }

  /**
   * Start auto cleanup
   */
  startAutoCleanup(): void {
    this.scheduler.start();
  }

  /**
   * Stop auto cleanup
   */
  stopAutoCleanup(): void {
    this.scheduler.stop();
  }

  /**
   * Get cleanup stats
   * @returns Cleanup statistics
   */
  getCleanupStats(): CleanupStats {
    return {
      totalCleanups: this.cleanupCount,
      totalAtomsCleaned: this.totalAtomsCleaned,
      totalAtomsFailed: this.totalAtomsFailed,
      lastCleanup: this.lastCleanupResult,
    };
  }

  /**
   * Get scheduler
   */
  getScheduler(): CleanupScheduler {
    return this.scheduler;
  }

  /**
   * Get cleanup engine
   */
  getCleanupEngine(): CleanupEngine {
    return this.cleanupEngine;
  }

  /**
   * Reset stats
   */
  resetStats(): void {
    this.cleanupCount = 0;
    this.totalAtomsCleaned = 0;
    this.totalAtomsFailed = 0;
    this.lastCleanupResult = undefined;
  }
}
