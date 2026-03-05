/**
 * Interfaces for different aspects of the Time Travel API.
 * 
 * These interfaces separate concerns within the system and can be used
 * for testing and API documentation.
 */

import type { Snapshot } from '../types';
import type { SnapshotComparison, ComparisonOptions } from '../comparison/types';
import type { HistoryStats } from '../core/types';
import type { VisualizationFormat, ExportFormat } from '../comparison/types';

/**
 * Manages state snapshot creation.
 */
export interface ICaptureManager {
  /**
   * Capture current state as a snapshot.
   * @param action - Optional action name for the snapshot.
   * @returns The created snapshot or undefined if capture failed.
   */
  capture(action?: string): Snapshot | undefined;
  
  /**
   * Capture current state with result metadata.
   * @param action - Optional action name.
   * @returns Creation result with metadata.
   */
  captureWithResult(action?: string): Snapshot | undefined;
  
  /**
   * Get current state as a snapshot (without storing in history).
   */
  getCurrentSnapshot(): Snapshot | null;
}

/**
 * Navigation through snapshot history.
 */
export interface IHistoryNavigation {
  /**
   * Undo to the previous snapshot.
   * @returns True if undo was successful.
   */
  undo(): boolean;
  
  /**
   * Redo to the next snapshot.
   * @returns True if redo was successful.
   */
  redo(): boolean;
  
  /**
   * Jump to a specific snapshot by index.
   * @param index - Index in the history array (0-based).
   * @returns True if jump was successful.
   */
  jumpTo(index: number): boolean;
  
  /**
   * Check if undo is available.
   */
  canUndo(): boolean;
  
  /**
   * Check if redo is available.
   */
  canRedo(): boolean;
}

/**
 * Queries against snapshot history.
 */
export interface IHistoryQuery {
  /**
   * Get complete history as an array of snapshots.
   */
  getHistory(): Snapshot[];
  
  /**
   * Get history statistics.
   */
  getHistoryStats(): HistoryStats;
  
  /**
   * Get snapshot by ID.
   * @param id - Snapshot ID.
   * @returns Snapshot or null if not found.
   */
  getSnapshotById(id: string): Snapshot | null;
  
  /**
   * Get diff since a specific action or time.
   * @param action - Action name to compare since (optional).
   * @param options - Comparison options.
   * @returns Comparison result or null if not enough snapshots.
   */
  getDiffSince(action?: string, options?: Partial<ComparisonOptions>): SnapshotComparison | null;
}

/**
 * Time travel process control.
 */
export interface ITimeTravelControl {
  /**
   * Pause automatic snapshot creation.
   */
  pauseAutoCapture(): void;
  
  /**
   * Resume automatic snapshot creation.
   */
  resumeAutoCapture(): void;
  
  /**
   * Check if a time travel operation is currently in progress.
   */
  isTraveling(): boolean;
  
  /**
   * Clear all history.
   */
  clearHistory(): void;
}

/**
 * Snapshot comparison operations.
 */
export interface ISnapshotComparison {
  /**
   * Compare two snapshots.
   * @param a - First snapshot or ID.
   * @param b - Second snapshot or ID.
   * @param options - Comparison options.
   * @returns Comparison result.
   */
  compareSnapshots(
    a: Snapshot | string, 
    b: Snapshot | string, 
    options?: Partial<ComparisonOptions>
  ): SnapshotComparison;
  
  /**
   * Compare a snapshot with current state.
   * @param snapshot - Snapshot or ID to compare with current state.
   * @param options - Comparison options.
   * @returns Comparison result.
   */
  compareWithCurrent(
    snapshot: Snapshot | string, 
    options?: Partial<ComparisonOptions>
  ): SnapshotComparison;
  
  /**
   * Visualize changes between snapshots.
   * @param comparison - Comparison result to visualize.
   * @param format - Visualization format (tree or list).
   * @returns Formatted visualization string.
   */
  visualizeChanges(
    comparison: SnapshotComparison, 
    format?: VisualizationFormat
  ): string;
  
  /**
   * Export comparison result.
   * @param comparison - Comparison result to export.
   * @param format - Export format (json, html, md).
   * @returns Exported string.
   */
  exportComparison(
    comparison: SnapshotComparison, 
    format: ExportFormat
  ): string;
}

/**
 * Combined API for backward compatibility.
 * Includes all Time Travel interfaces.
 */
export interface TimeTravelFullAPI 
  extends ICaptureManager, 
          IHistoryNavigation, 
          IHistoryQuery, 
          ITimeTravelControl,
          ISnapshotComparison {
  /**
   * Subscribe to history events.
   */
  subscribe(listener: (event: any) => void): () => void;
  
  /**
   * Subscribe to snapshot creation events.
   */
  subscribeToSnapshots(listener: (snapshot: Snapshot) => void): () => void;
  
  /**
   * Subscribe to atom tracking events.
   */
  subscribeToTracking(listener: (event: any) => void): () => void;
  
  /**
   * Clean up resources.
   */
  dispose(): Promise<void>;
  
  /**
   * Get API version.
   */
  getVersion(): string;
}
