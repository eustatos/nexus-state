/**
 * SnapshotService - Manages snapshot creation and restoration
 *
 * Handles creating snapshots from store state and restoring
 * state from snapshots.
 */

import type { Snapshot, Store, Atom } from '../../types';
import { SnapshotCreator } from '../snapshot/SnapshotCreator';
import { SnapshotRestorer } from '../snapshot/SnapshotRestorer';
import type {
  SnapshotCreatorConfig,
  SnapshotRestorerConfig,
  TransactionalRestorerConfig,
  RestorationConfig,
  RestorationResult,
  TransactionalRestorationResult,
  RestorationOptions,
} from '../snapshot/types';

export interface SnapshotServiceConfig {
  /** Snapshot creator config */
  creator?: Partial<SnapshotCreatorConfig>;
  /** Snapshot restorer config */
  restorer?: Partial<SnapshotRestorerConfig>;
  /** Transactional restorer config */
  transactional?: Partial<TransactionalRestorerConfig>;
  /** Restoration config */
  restoration?: Partial<RestorationConfig>;
}

export interface CaptureResult {
  /** Whether capture was successful */
  success: boolean;
  /** Created snapshot (if successful) */
  snapshot?: Snapshot;
  /** Error message (if failed) */
  error?: string;
  /** Duration in milliseconds */
  duration?: number;
}

/**
 * SnapshotService provides snapshot creation and restoration
 * for time travel operations
 */
export class SnapshotService {
  private store: Store;
  private creator: SnapshotCreator;
  private restorer: SnapshotRestorer;
  private config: SnapshotServiceConfig;

  constructor(store: Store, config?: SnapshotServiceConfig) {
    this.store = store;
    this.config = config || {};

    // Merge configs, handling onAtomNotFound type differences
    const restorerConfig: Partial<SnapshotRestorerConfig> = {
      ...config?.restorer,
      validateBeforeRestore: config?.restoration?.validateBeforeRestore ?? config?.restorer?.validateBeforeRestore,
      batchRestore: config?.restoration?.batchRestore ?? config?.restorer?.batchRestore,
      // Cast to handle type difference
      onAtomNotFound: config?.restorer?.onAtomNotFound as "skip" | "warn" | "throw" | undefined,
    };

    this.creator = new SnapshotCreator(store, restorerConfig);
    this.restorer = new SnapshotRestorer(store, {
      ...restorerConfig,
      ...config?.restoration,
    });
  }

  /**
   * Create a snapshot of current state
   * @param action Optional action name
   * @returns Capture result
   */
  capture(action?: string): CaptureResult {
    try {
      const startTime = Date.now();
      const snapshot = this.creator.create(action);

      if (!snapshot) {
        return {
          success: false,
          error: 'Failed to create snapshot',
          duration: Date.now() - startTime,
        };
      }

      return {
        success: true,
        snapshot,
        duration: Date.now() - startTime,
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
   * Restore state from snapshot
   * @param snapshot Snapshot to restore
   * @returns Restoration result
   */
  restore(snapshot: Snapshot): boolean {
    return this.restorer.restore(snapshot);
  }

  /**
   * Restore state from snapshot with detailed result
   * @param snapshot Snapshot to restore
   * @returns Restoration result
   */
  restoreWithResult(snapshot: Snapshot): RestorationResult {
    return this.restorer.restoreWithResult(snapshot);
  }

  /**
   * Restore state from snapshot with transaction support
   * @param snapshot Snapshot to restore
   * @param options Restoration options
   * @returns Transactional restoration result
   */
  restoreWithTransaction(
    snapshot: Snapshot,
    options?: RestorationOptions
  ): Promise<TransactionalRestorationResult> {
    return this.restorer.restoreWithTransaction(snapshot, options);
  }

  /**
   * Get the snapshot creator
   */
  getCreator(): SnapshotCreator {
    return this.creator;
  }

  /**
   * Get the snapshot restorer
   */
  getRestorer(): SnapshotRestorer {
    return this.restorer;
  }

  /**
   * Get configuration
   */
  getConfig(): SnapshotServiceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<SnapshotServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
