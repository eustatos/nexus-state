/**
 * SimpleTimeTravel - Simplified wrapper for TimeTravelController
 *
 * Provides backward compatibility for existing code using the simple
 * time-travel API.
 *
 * @example
 * ```typescript
 * const timeTravel = new SimpleTimeTravel(store, {
 *   maxHistory: 100,
 *   autoCapture: false
 * });
 *
 * // Capture snapshot
 * const snapshot = timeTravel.capture('action-name');
 *
 * // Navigate
 * timeTravel.undo();
 * timeTravel.redo();
 * timeTravel.jumpTo(5);
 *
 * // Subscribe to events
 * timeTravel.subscribe('undo', () => console.log('Undone'));
 *
 * // Cleanup
 * timeTravel.dispose();
 * ```
 */

import type { Store, Snapshot } from '../types';
import type { TimeTravelOptions } from './types';
import type { TimeTravelEventType, TimeTravelEvent, TimeTravelEventListener } from './core/SubscriptionManager';
import { TimeTravelController, type TimeTravelControllerConfig } from './core/TimeTravelController';
import { ComparisonService } from './core/ComparisonService';
import type { SnapshotComparison, ComparisonOptions } from './comparison';

export interface SimpleTimeTravelOptions extends TimeTravelOptions {
  /** Maximum number of snapshots to keep in history */
  maxHistory?: number;
  /** Automatically capture snapshots on state changes */
  autoCapture?: boolean;
}

export class SimpleTimeTravel {
  private controller: TimeTravelController;
  private comparisonService: ComparisonService;

  constructor(store: Store, options?: SimpleTimeTravelOptions) {
    const config: TimeTravelControllerConfig = {
      maxHistory: options?.maxHistory ?? 50,
      autoCapture: options?.autoCapture ?? true,
      deltaSnapshots: options?.deltaSnapshots,
      atomTTL: options?.atomTTL,
      trackingConfig: options?.trackingConfig,
      cleanupStrategy: options?.cleanupStrategy ?? 'lru',
      gcInterval: options?.gcInterval ?? 60000,
    };

    this.controller = new TimeTravelController(store, config);
    this.comparisonService = new ComparisonService();
  }

  /**
   * Capture a snapshot of the current state
   * @param action - Optional action name
   * @returns The captured snapshot
   */
  capture(action?: string): Snapshot | undefined {
    return this.controller.capture(action);
  }

  /**
   * Undo to the previous snapshot
   * @returns True if undo was successful
   */
  undo(): boolean {
    return this.controller.undo();
  }

  /**
   * Redo to the next snapshot
   * @returns True if redo was successful
   */
  redo(): boolean {
    return this.controller.redo();
  }

  /**
   * Jump to a specific snapshot by index
   * @param index - Index of the snapshot in history
   * @returns True if jump was successful
   */
  jumpTo(index: number): boolean {
    return this.controller.jumpTo(index);
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.controller.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.controller.canRedo();
  }

  /**
   * Get the snapshot history
   */
  getHistory(): Snapshot[] {
    return this.controller.getHistory();
  }

  /**
   * Clear the history
   */
  clearHistory(): void {
    this.controller.clearHistory();
  }

  /**
   * Import state from external source
   */
  importState(state: Record<string, unknown>): boolean {
    return this.controller.importState(state);
  }

  /**
   * Get the current snapshot
   * @returns The current snapshot or undefined
   */
  getCurrentSnapshot(): Snapshot | undefined {
    return this.controller.getCurrentSnapshot();
  }

  /**
   * Get history statistics
   * @returns History statistics
   */
  getHistoryStats(): {
    length: number;
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
  } {
    return this.controller.getHistoryStats();
  }

  /**
   * Subscribe to time travel events
   * @param eventType - Type of event to subscribe to
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  subscribe(
    eventType: TimeTravelEventType,
    listener: (event: TimeTravelEvent) => void
  ): () => void {
    return this.controller.subscribe(eventType, listener);
  }

  /**
   * Subscribe to snapshot capture events
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  subscribeToSnapshots(listener: () => void): () => void {
    return this.controller.subscribe('snapshot-captured', () => listener());
  }

  /**
   * Compare two snapshots
   * @param snapshot1 - First snapshot
   * @param snapshot2 - Second snapshot
   * @param options - Comparison options
   * @returns Comparison result
   */
  compareSnapshots(
    snapshot1: Snapshot,
    snapshot2: Snapshot,
    options?: ComparisonOptions
  ): SnapshotComparison {
    return this.comparisonService.compare(snapshot1, snapshot2, options).comparison;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.controller.dispose();
  }
}
