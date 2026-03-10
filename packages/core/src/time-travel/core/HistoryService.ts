/**
 * HistoryService - Manages time travel history
 *
 * Handles adding snapshots to history, undo, redo, and jump operations.
 */

import type { Snapshot } from '../types';
import type { Store } from '../../types';
import { HistoryManager } from './HistoryManager';
import { HistoryNavigator } from './HistoryNavigator';
import { SnapshotRestorer } from '../snapshot/SnapshotRestorer';
import type { HistoryManagerConfig } from './types';

export interface HistoryServiceConfig extends HistoryManagerConfig {
  /** Enable delta snapshots */
  useDeltaSnapshots?: boolean;
}

export interface HistoryResult {
  /** Whether operation was successful */
  success: boolean;
  /** Snapshot ID (if applicable) */
  snapshotId?: string;
  /** Error message (if failed) */
  error?: string;
}

export interface JumpResult extends HistoryResult {
  /** Previous snapshot */
  previous?: Snapshot;
  /** New snapshot */
  current?: Snapshot;
}

/**
 * HistoryService provides history management
 * for time travel operations
 */
export class HistoryService {
  private historyManager: HistoryManager;
  private navigator: HistoryNavigator;
  private config: HistoryServiceConfig;
  private restorer: SnapshotRestorer;

  constructor(store: Store, config?: Partial<HistoryServiceConfig>) {
    this.config = {
      maxHistory: config?.maxHistory ?? 50,
      useDeltaSnapshots: config?.useDeltaSnapshots ?? false,
    };

    this.historyManager = new HistoryManager(this.config.maxHistory ?? 50);
    this.restorer = new SnapshotRestorer(store);
    this.navigator = new HistoryNavigator(this.historyManager, this.restorer);
  }

  /**
   * Add snapshot to history
   * @param snapshot Snapshot to add
   * @returns History result
   */
  add(snapshot: Snapshot): HistoryResult {
    try {
      this.historyManager.add(snapshot);
      // Update navigator's current index to point to the new snapshot
      const all = this.historyManager.getAll();
      this.navigator.setCurrentIndex(all.length - 1);
      return {
        success: true,
        snapshotId: snapshot.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Undo last action
   * @returns History result
   */
  undo(): HistoryResult {
    try {
      this.navigator.undo();
      return {
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Redo previously undone action
   * @returns History result
   */
  redo(): HistoryResult {
    try {
      this.navigator.redo();
      return {
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Jump to specific snapshot
   * @param snapshotId Snapshot ID to jump to
   * @returns Jump result
   */
  jumpTo(snapshotId: string): JumpResult {
    try {
      const previous = this.navigator.getCurrent();
      // Find index by snapshot ID
      const history = this.historyManager.getAll();
      const index = history.findIndex((s) => s.id === snapshotId);

      if (index === -1) {
        return {
          success: false,
          error: `Snapshot with ID ${snapshotId} not found`,
        };
      }

      const jumped = this.navigator.jumpTo(index);
      const current = this.navigator.getCurrent();

      if (!jumped || !current) {
        return {
          success: false,
          error: 'Failed to jump to snapshot',
        };
      }

      return {
        success: true,
        snapshotId,
        previous,
        current,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Jump to specific index in history
   * @param index Index to jump to
   * @returns Jump result
   */
  jumpToIndex(index: number): JumpResult {
    try {
      if (index < 0 || index >= this.historyManager.getLength()) {
        return {
          success: false,
          error: `Invalid index: ${index}`,
        };
      }

      const previous = this.navigator.getCurrent();
      const jumped = this.navigator.jumpToIndex(index);
      const current = this.navigator.getCurrent();

      if (!jumped || !current) {
        return {
          success: false,
          error: 'Failed to jump to index',
        };
      }

      return {
        success: true,
        snapshotId: current.id,
        previous,
        current,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if undo is available
   * @returns True if undo is available
   */
  canUndo(): boolean {
    return this.navigator.canUndo();
  }

  /**
   * Check if redo is available
   * @returns True if redo is available
   */
  canRedo(): boolean {
    return this.navigator.canRedo();
  }

  /**
   * Get current snapshot
   * @returns Current snapshot or undefined
   */
  getCurrent(): Snapshot | undefined {
    return this.navigator.getCurrent();
  }

  /**
   * Get current index in history
   * @returns Current index
   */
  getCurrentIndex(): number {
    return this.navigator.getCurrentIndex();
  }

  /**
   * Get history length
   * @returns History length
   */
  getLength(): number {
    return this.historyManager.getLength();
  }

  /**
   * Get all history
   * @returns Array of snapshots
   */
  getAll(): Snapshot[] {
    return this.historyManager.getAll();
  }

  /**
   * Get snapshot by ID
   * @param snapshotId Snapshot ID
   * @returns Snapshot or undefined
   */
  getById(snapshotId: string): Snapshot | undefined {
    const result = this.historyManager.getById(snapshotId);
    return result ?? undefined;
  }

  /**
   * Get snapshot by index
   * @param index Snapshot index
   * @returns Snapshot or undefined
   */
  getByIndex(index: number): Snapshot | undefined {
    const history = this.historyManager.getAll();
    return history[index] ?? undefined;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.historyManager.clear();
    // Reset navigator to initial state
    this.navigator.setCurrentIndex(0);
  }

  /**
   * Get history statistics
   * @returns History statistics
   */
  getStats(): {
    length: number;
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    oldestSnapshot?: Snapshot;
    newestSnapshot?: Snapshot;
  } {
    const history = this.getAll();
    return {
      length: this.getLength(),
      currentIndex: this.getCurrentIndex(),
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      oldestSnapshot: history.length > 0 ? history[0] : undefined,
      newestSnapshot: history.length > 0 ? history[history.length - 1] : undefined,
    };
  }

  /**
   * Get the history manager
   */
  getHistoryManager(): HistoryManager {
    return this.historyManager;
  }

  /**
   * Get the navigator
   */
  getNavigator(): HistoryNavigator {
    return this.navigator;
  }

  /**
   * Get configuration
   */
  getConfig(): HistoryServiceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<HistoryServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
