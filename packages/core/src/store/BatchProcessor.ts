/**
 * BatchProcessor - Manages batched operations
 *
 * Provides batch processing for notifications and updates.
 */

import { batcher } from '../batching';
import { storeLogger as logger } from '../debug';

export type BatchTask = () => void;

export interface BatchStats {
  /** Total batches processed */
  totalBatches: number;
  /** Total tasks processed */
  totalTasks: number;
  /** Current batch size */
  currentBatchSize: number;
}

/**
 * BatchProcessor provides batch operation management
 */
export class BatchProcessor {
  private batchCount: number = 0;
  private taskCount: number = 0;

  /**
   * Schedule a task for batched execution
   * @param task Task to schedule
   */
  schedule(task: BatchTask): void {
    batcher.schedule(() => {
      this.taskCount++;
      task();
    });
  }

  /**
   * Flush pending batches immediately
   */
  flush(): void {
    logger.log('[BatchProcessor] Flushing batches');
    batcher.flush();
    this.batchCount++;
  }

  /**
   * Execute a function in batch mode
   * @param fn Function to execute
   */
  batch<T>(fn: () => T): T {
    logger.log('[BatchProcessor] Starting batch');
    
    try {
      batcher.startBatch();
      const result = fn();
      return result;
    } finally {
      batcher.endBatch();
      this.batchCount++;
      logger.log('[BatchProcessor] Ended batch');
    }
  }

  /**
   * Check if currently batching
   * @returns True if batching
   */
  isBatching(): boolean {
    return batcher.getIsBatching();
  }

  /**
   * Get batch statistics
   */
  getStats(): BatchStats {
    return {
      totalBatches: this.batchCount,
      totalTasks: this.taskCount,
      currentBatchSize: 0, // Batcher doesn't expose this
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.batchCount = 0;
    this.taskCount = 0;
  }
}
