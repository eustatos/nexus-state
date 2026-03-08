/**
 * ChangeBatcher - Batches change events
 */

import type { ChangeEvent, ChangeBatch } from '../types';
import type { IChangeBatcher } from './types.interfaces';

/**
 * Default implementation of change batcher
 */
export class ChangeBatcher implements IChangeBatcher {
  private batchMode: boolean = false;
  private batchQueue: ChangeEvent[] = [];

  /**
   * Start batching mode
   */
  startBatch(): void {
    this.batchMode = true;
  }

  /**
   * End batching mode
   */
  endBatch(): ChangeBatch {
    this.batchMode = false;
    const batch: ChangeBatch = {
      changes: [...this.batchQueue],
      startTime: this.batchQueue[0]?.timestamp || Date.now(),
      endTime: Date.now(),
      count: this.batchQueue.length,
    };

    this.batchQueue = [];
    return batch;
  }

  /**
   * Check if in batch mode
   */
  isBatching(): boolean {
    return this.batchMode;
  }

  /**
   * Add change to batch
   */
  addChange(event: ChangeEvent): void {
    if (this.batchMode) {
      this.batchQueue.push(event);
    }
  }

  /**
   * Execute function in batch mode
   */
  batch<T>(fn: () => T): ChangeBatch {
    this.startBatch();
    try {
      fn();
      return this.endBatch();
    } catch (error) {
      this.batchMode = false;
      this.batchQueue = [];
      throw error;
    }
  }

  /**
   * Get pending changes
   */
  getPendingChanges(): ChangeEvent[] {
    return [...this.batchQueue];
  }

  /**
   * Clear pending changes
   */
  clearPending(): void {
    this.batchQueue = [];
  }
}
