/**
 * CleanupScheduler - Schedules automatic cleanup operations
 *
 * Manages automatic cleanup execution based on configured intervals.
 */

import type { CleanupResult } from './types';

export interface CleanupSchedulerConfig {
  /** Enable automatic cleanup */
  enabled: boolean;
  /** Cleanup interval in milliseconds */
  cleanupInterval: number;
  /** Delay before first cleanup in milliseconds */
  initialDelay: number;
}

export interface SchedulerStats {
  /** Is scheduler running */
  isRunning: boolean;
  /** Number of cleanups performed */
  cleanupsPerformed: number;
  /** Last cleanup timestamp */
  lastCleanupTimestamp?: number;
  /** Next cleanup timestamp */
  nextCleanupTimestamp?: number;
}

export type CleanupTask = () => Promise<CleanupResult>;

/**
 * CleanupScheduler provides automatic cleanup scheduling
 * for the tracking system
 */
export class CleanupScheduler {
  private config: CleanupSchedulerConfig;
  private cleanupTask: CleanupTask;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;
  private cleanupsPerformed: number = 0;
  private lastCleanupTimestamp?: number;
  private nextCleanupTimestamp?: number;

  constructor(cleanupTask: CleanupTask, config?: Partial<CleanupSchedulerConfig>) {
    this.cleanupTask = cleanupTask;
    this.config = {
      enabled: config?.enabled ?? true,
      cleanupInterval: config?.cleanupInterval ?? 60000, // 1 minute
      initialDelay: config?.initialDelay ?? 5000, // 5 seconds
    };
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (!this.config.enabled || this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Schedule first cleanup after initial delay
    const initialTimeout = setTimeout(() => {
      this.performScheduledCleanup();
      
      // Then schedule regular cleanups
      this.intervalId = setInterval(() => {
        this.performScheduledCleanup();
      }, this.config.cleanupInterval);
    }, this.config.initialDelay);

    // Track initial timeout
    this.nextCleanupTimestamp = Date.now() + this.config.initialDelay;

    // Store interval ID for cleanup
    initialTimeout.unref?.();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.isRunning = false;
    this.nextCleanupTimestamp = undefined;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Perform scheduled cleanup
   */
  private async performScheduledCleanup(): Promise<void> {
    try {
      this.lastCleanupTimestamp = Date.now();
      this.nextCleanupTimestamp = Date.now() + this.config.cleanupInterval;
      
      const result = await this.cleanupTask();
      this.cleanupsPerformed++;

      if (result.cleanedCount > 0 || result.failedCount > 0) {
        console.log(
          `[CleanupScheduler] Cleanup completed: ${result.cleanedCount} cleaned, ${result.failedCount} failed`
        );
      }
    } catch (error) {
      console.error('[CleanupScheduler] Cleanup failed:', error);
    }
  }

  /**
   * Trigger immediate cleanup
   * @returns Cleanup result
   */
  async triggerCleanup(): Promise<CleanupResult> {
    try {
      const result = await this.cleanupTask();
      this.cleanupsPerformed++;
      this.lastCleanupTimestamp = Date.now();
      return result;
    } catch (error) {
      console.error('[CleanupScheduler] Manual cleanup failed:', error);
      return { cleanedCount: 0, failedCount: 0, cleanedAtoms: [], errors: [], strategy: 'default' };
    }
  }

  /**
   * Check if scheduler is running
   * @returns True if running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get scheduler statistics
   * @returns Scheduler stats
   */
  getStats(): SchedulerStats {
    return {
      isRunning: this.isRunning,
      cleanupsPerformed: this.cleanupsPerformed,
      lastCleanupTimestamp: this.lastCleanupTimestamp,
      nextCleanupTimestamp: this.nextCleanupTimestamp,
    };
  }

  /**
   * Get configuration
   */
  getConfig(): CleanupSchedulerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<CleanupSchedulerConfig>): void {
    const wasRunning = this.isRunning;
    
    this.config = { ...this.config, ...config };

    // Restart if running and interval changed
    if (wasRunning && config.cleanupInterval) {
      this.stop();
      this.start();
    }
  }

  /**
   * Dispose scheduler
   */
  dispose(): void {
    this.stop();
  }
}
