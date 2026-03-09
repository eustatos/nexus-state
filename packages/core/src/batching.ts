/**
 * Batching mechanism for efficient state updates
 * @packageDocumentation
 */

type BatchCallback = () => void;

/**
 * Batcher class that collects and flushes batched callbacks
 */
export class Batcher {
  private batch: Set<BatchCallback> = new Set();
  private batchDepth = 0;
  private isFlushing = false;

  /**
   * Start batching mode (can be nested)
   */
  startBatch(): void {
    this.batchDepth++;
  }

  /**
   * End batching mode and flush if at root level
   */
  endBatch(): void {
    if (this.batchDepth > 0) {
      this.batchDepth--;
    }

    // Only flush when we exit the outermost batch
    if (this.batchDepth === 0 && !this.isFlushing) {
      this.flush();
    }
  }

  /**
   * Schedule a callback for batched execution
   * @param callback - The callback to schedule
   */
  schedule(callback: BatchCallback): void {
    if (this.batchDepth > 0) {
      this.batch.add(callback);
    } else {
      callback();
    }
  }

  /**
   * Flush all batched callbacks
   */
  flush(): void {
    if (this.batch.size === 0) return;

    this.isFlushing = true;

    const callbacks = Array.from(this.batch);
    this.batch.clear();

    try {
      // Execute all batched callbacks
      callbacks.forEach((cb) => cb());
    } finally {
      this.isFlushing = false;

      // If new callbacks were added during flush, flush them too
      if (this.batch.size > 0 && this.batchDepth === 0) {
        this.flush();
      }
    }
  }

  /**
   * Check if currently batching
   */
  getIsBatching(): boolean {
    return this.batchDepth > 0;
  }

  /**
   * Get the number of pending callbacks
   */
  getPendingCount(): number {
    return this.batch.size;
  }

  /**
   * Get current batch depth
   */
  getDepth(): number {
    return this.batchDepth;
  }

  /**
   * Reset batcher state (for test cleanup)
   */
  reset(): void {
    this.batch.clear();
    this.batchDepth = 0;
    this.isFlushing = false;
  }
}

export const batcher = new Batcher();

/**
 * Execute multiple state updates in a single batch
 * @param fn - Function containing state updates
 * @returns The return value of the function
 * @example
 * ```typescript
 * batch(() => {
 *   store.set(atom1, 1);
 *   store.set(atom2, 2);
 *   store.set(atom3, 3);
 * });
 * ```
 */
export function batch<T>(fn: () => T): T {
  batcher.startBatch();
  try {
    return fn();
  } finally {
    batcher.endBatch();
  }
}

/**
 * Check if currently in a batch
 */
export function isBatching(): boolean {
  return batcher.getIsBatching();
}
