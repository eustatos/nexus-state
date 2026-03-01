/**
 * Batch update system for DevTools: queues state-update notifications and flushes
 * with configurable latency, frame-rate throttling, and memory-bounded queue.
 *
 * @example
 * ```ts
 * const updater = createBatchUpdater({
 *   batchLatencyMs: 50,
 *   maxQueueSize: 100,
 *   throttleByFrame: true,
 * }, (store, action) => connection.send(action, store.getState()));
 * updater.schedule(store, "SET counter");
 * // After batchLatencyMs or next frame, onFlush is called once.
 * ```
 */

import type { BatchUpdateConfig } from "./types";

const DEFAULT_BATCH_LATENCY_MS = 100;
const DEFAULT_MAX_QUEUE_SIZE = 100;

export interface BatchUpdaterConfig extends BatchUpdateConfig {
  /** Callback when the batch is flushed (send to DevTools once). */
  onFlush: (store: unknown, action: string, count: number) => void;
}

interface QueuedUpdate {
  action: string;
}

/**
 * BatchUpdater queues DevTools update requests and flushes at most once per
 * batch window or per animation frame (when throttleByFrame is true), with
 * a memory cap on queue size.
 */
export class BatchUpdater {
  private config: Required<
    Omit<BatchUpdateConfig, "maxUpdatesPerSecond">
  > & {
    maxUpdatesPerSecond: number;
    onFlush: (store: unknown, action: string, count: number) => void;
  };
  private queue: QueuedUpdate[] = [];
  private lastStore: unknown = null;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private rafId: number | null = null;
  private lastFlushTime = 0;
  private minIntervalMs = 0;

  constructor(config: BatchUpdaterConfig) {
    const batchLatencyMs =
      config.batchLatencyMs ?? DEFAULT_BATCH_LATENCY_MS;
    const maxQueueSize = config.maxQueueSize ?? DEFAULT_MAX_QUEUE_SIZE;
    const throttleByFrame = config.throttleByFrame ?? true;
    const maxUpdatesPerSecond = config.maxUpdatesPerSecond ?? 0;

    this.config = {
      batchLatencyMs,
      maxQueueSize,
      throttleByFrame,
      maxUpdatesPerSecond,
      onFlush: config.onFlush,
    };

    if (maxUpdatesPerSecond > 0) {
      this.minIntervalMs = 1000 / maxUpdatesPerSecond;
    }
  }

  /**
   * Schedule a state update to be sent to DevTools. Updates are batched and
   * flushed according to batchLatencyMs and throttle settings.
   */
  schedule(store: unknown, action: string): void {
    this.lastStore = store;

    // Memory cap: drop oldest entries when over limit
    if (this.queue.length >= this.config.maxQueueSize) {
      this.queue.shift();
    }
    this.queue.push({ action });

    this.scheduleFlush();
  }

  /**
   * Flush any pending updates immediately (one DevTools message).
   */
  flush(): void {
    this.cancelScheduledFlush();
    this.doFlush();
  }

  /**
   * Discard pending updates without sending.
   */
  clear(): void {
    this.cancelScheduledFlush();
    this.queue.length = 0;
    this.lastStore = null;
  }

  /**
   * Number of pending updates in the queue.
   */
  get pendingCount(): number {
    return this.queue.length;
  }

  private scheduleFlush(): void {
    if (this.queue.length === 0) return;

    const { batchLatencyMs, throttleByFrame } = this.config;

    if (throttleByFrame && typeof requestAnimationFrame !== "undefined") {
      if (this.rafId === null) {
        this.rafId = requestAnimationFrame(() => {
          this.rafId = null;
          this.flushAfterThrottle();
        });
      }
      // Also ensure we flush after batch latency if rAF hasn't fired yet
      if (this.flushTimer === null) {
        this.flushTimer = setTimeout(() => {
          this.flushTimer = null;
          if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
          }
          this.doFlush();
        }, batchLatencyMs);
      }
      return;
    }

    // No frame throttle: flush after batch latency (and respect maxUpdatesPerSecond in doFlush)
    if (this.flushTimer === null) {
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null;
        this.doFlush();
      }, batchLatencyMs);
    }
  }

  private flushAfterThrottle(): void {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.doFlush();
  }

  private doFlush(): void {
    if (this.queue.length === 0) return;

    const now = Date.now();
    if (this.minIntervalMs > 0 && now - this.lastFlushTime < this.minIntervalMs) {
      // Reschedule for later to respect maxUpdatesPerSecond
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null;
        this.doFlush();
      }, this.minIntervalMs - (now - this.lastFlushTime));
      return;
    }

    const updates = this.queue;
    this.queue = [];
    const count = updates.length;
    const action =
      count > 1
        ? `Batch (${count} updates)`
        : updates[0]!.action;
    const store = this.lastStore;
    this.lastStore = null;
    this.lastFlushTime = now;

    this.config.onFlush(store, action, count);
  }

  private cancelScheduledFlush(): void {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.rafId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

/**
 * Create a BatchUpdater with the given config.
 */
export function createBatchUpdater(
  config: BatchUpdaterConfig,
): BatchUpdater {
  return new BatchUpdater(config);
}
