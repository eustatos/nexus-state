/**
 * TimeTravelApiService - Handles core time travel API operations
 *
 * Responsibilities:
 * - capture: Create snapshots
 * - undo/redo: Navigate history
 * - jump: Jump to specific snapshot
 * - History access methods
 */

import type { Snapshot } from '../../types';
import type { TimeTravelStats, CaptureResult, JumpResult } from './types';
import type { HistoryService } from './HistoryService';
import type { SnapshotService } from './SnapshotService';
import type { TimeTravelEventService } from './types';
import { storeLogger as logger } from '../../debug';

export interface TimeTravelApiServiceConfig {
  /** Auto-capture mode */
  autoCapture?: boolean;
}

export class TimeTravelApiService {
  private historyService: HistoryService;
  private snapshotService: SnapshotService;
  private eventService: TimeTravelEventService;
  private config: TimeTravelApiServiceConfig;

  constructor(
    historyService: HistoryService,
    snapshotService: SnapshotService,
    eventService: TimeTravelEventService,
    config?: TimeTravelApiServiceConfig
  ) {
    this.historyService = historyService;
    this.snapshotService = snapshotService;
    this.eventService = eventService;
    this.config = config || {};
  }

  /**
   * Capture a snapshot of current state
   */
  capture(action?: string): Snapshot | undefined {
    const result: CaptureResult = this.snapshotService.capture(action);

    if (result.success && result.snapshot) {
      this.historyService.add(result.snapshot);

      this.eventService.emit({
        type: 'snapshot-captured',
        timestamp: Date.now(),
        snapshotId: result.snapshot.id,
        data: { action },
      });

      logger.log(`[TimeTravelApiService] Captured snapshot: ${result.snapshot.id}`);
      return result.snapshot;
    }

    logger.error('[TimeTravelApiService] Failed to capture snapshot');
    return undefined;
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    if (!this.historyService.canUndo()) {
      logger.warn('[TimeTravelApiService] Cannot undo - no history');
      return false;
    }

    const result = this.historyService.undo();
    const currentSnapshot = this.historyService.getCurrent();

    if (result.success && currentSnapshot) {
      this.snapshotService.restore(currentSnapshot);

      this.eventService.emit({
        type: 'undo',
        timestamp: Date.now(),
        snapshotId: currentSnapshot.id,
      });

      logger.log(`[TimeTravelApiService] Undone to snapshot: ${currentSnapshot.id}`);
      return true;
    }

    return false;
  }

  /**
   * Redo previously undone action
   */
  redo(): boolean {
    if (!this.historyService.canRedo()) {
      logger.warn('[TimeTravelApiService] Cannot redo - no future history');
      return false;
    }

    const result = this.historyService.redo();
    const currentSnapshot = this.historyService.getCurrent();

    if (result.success && currentSnapshot) {
      this.snapshotService.restore(currentSnapshot);

      this.eventService.emit({
        type: 'redo',
        timestamp: Date.now(),
        snapshotId: currentSnapshot.id,
      });

      logger.log(`[TimeTravelApiService] Redone to snapshot: ${currentSnapshot.id}`);
      return true;
    }

    return false;
  }

  /**
   * Jump to specific snapshot by ID
   */
  jumpTo(snapshotId: string): boolean {
    const result = this.historyService.jumpTo(snapshotId);

    if (result.success && result.current) {
      this.snapshotService.restore(result.current);

      this.eventService.emit({
        type: 'jump',
        timestamp: Date.now(),
        snapshotId: result.current.id,
      });

      logger.log(`[TimeTravelApiService] Jumped to snapshot: ${snapshotId}`);
      return true;
    }

    logger.warn(`[TimeTravelApiService] Failed to jump to snapshot: ${snapshotId}`);
    return false;
  }

  /**
   * Jump to specific index in history
   */
  jumpToIndex(index: number): boolean {
    const result = this.historyService.jumpToIndex(index);

    if (result.success && result.current) {
      this.snapshotService.restore(result.current);

      this.eventService.emit({
        type: 'jump',
        timestamp: Date.now(),
        snapshotId: result.current.id,
      });

      logger.log(`[TimeTravelApiService] Jumped to index: ${index}`);
      return true;
    }

    return false;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.historyService.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.historyService.canRedo();
  }

  /**
   * Get current snapshot
   */
  getCurrentSnapshot(): Snapshot | undefined {
    return this.historyService.getCurrent();
  }

  /**
   * Get history length
   */
  getHistoryLength(): number {
    return this.historyService.getLength();
  }

  /**
   * Get all history snapshots
   */
  getAllHistory(): Snapshot[] {
    return this.historyService.getAll();
  }

  /**
   * Get history statistics
   */
  getHistoryStats(): TimeTravelStats {
    return this.historyService.getStats();
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.historyService.clear();
    logger.log('[TimeTravelApiService] History cleared');
  }

  /**
   * Get history (alias for getAllHistory)
   */
  getHistory(): Snapshot[] {
    return this.getAllHistory();
  }

  /**
   * Update configuration
   */
  configure(config: Partial<TimeTravelApiServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): TimeTravelApiServiceConfig {
    return { ...this.config };
  }
}
