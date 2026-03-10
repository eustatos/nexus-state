/**
 * CheckpointManager - Manages restoration checkpoints
 *
 * Handles creation, storage, retrieval, and cleanup of checkpoints
 * for transactional restoration.
 */

import type { Snapshot } from '../types';
import type { Atom } from '../../types';
import type {
  RestorationCheckpoint,
  CheckpointResult,
} from './types';
import { storeLogger as logger } from '../../debug';

export interface CheckpointMetadata {
  /** Snapshot ID being restored */
  snapshotId: string;
  /** Previous values captured at checkpoint creation */
  previousValues: Map<symbol, unknown>;
  /** Atoms being restored */
  atoms: Array<{
    key: string;
    entry: any;
    atom: Atom<unknown>;
  }>;
}

export interface CheckpointConfig {
  /** Maximum number of checkpoints to keep */
  maxCheckpoints: number;
  /** Checkpoint timeout in milliseconds */
  checkpointTimeout: number;
}

/**
 * CheckpointManager provides checkpoint lifecycle management
 * for transactional restoration operations
 */
export class CheckpointManager {
  private checkpoints: Map<string, RestorationCheckpoint> = new Map();
  private activeCheckpointId: string | null = null;
  private config: CheckpointConfig;

  constructor(config?: Partial<CheckpointConfig>) {
    this.config = {
      maxCheckpoints: config?.maxCheckpoints ?? 10,
      checkpointTimeout: config?.checkpointTimeout ?? 300000, // 5 minutes
    };
  }

  /**
   * Create a new checkpoint
   * @param snapshotId The snapshot ID being restored
   * @returns Checkpoint result
   */
  create(snapshotId: string): CheckpointResult {
    const checkpointId = this.generateCheckpointId();
    const timestamp = Date.now();

    const checkpoint: RestorationCheckpoint = {
      id: checkpointId,
      timestamp,
      snapshotId,
      previousValues: new Map<symbol, unknown>(),
      metadata: {
        atomCount: 0,
        duration: 0,
        inProgress: true,
        committed: false,
      },
    };

    this.checkpoints.set(checkpointId, checkpoint);
    this.activeCheckpointId = checkpointId;

    // Clean up old checkpoints
    this.cleanupOldCheckpoints();

    logger.log(`[CheckpointManager] Created checkpoint: ${checkpointId} for snapshot: ${snapshotId}`);

    return {
      checkpointId,
      success: true,
      atomCount: 0,
      timestamp,
    };
  }

  /**
   * Capture previous values for atoms at checkpoint
   * @param checkpointId Checkpoint ID
   * @param atomsToRestore Atoms being restored
   * @param getCurrentValue Function to get current atom value
   */
  capturePreviousValues(
    checkpointId: string,
    atomsToRestore: Array<{
      key: string;
      entry: any;
      atom: Atom<unknown>;
    }>,
    getCurrentValue: (atom: Atom<unknown>) => unknown
  ): Map<symbol, unknown> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      logger.warn(`[CheckpointManager] Checkpoint not found: ${checkpointId}`);
      return new Map();
    }

    const previousValues = new Map<symbol, unknown>();

    for (const { atom } of atomsToRestore) {
      try {
        const currentValue = getCurrentValue(atom);
        previousValues.set(atom.id, currentValue);
      } catch (error) {
        logger.error(
          `[CheckpointManager] Failed to capture previous value for atom ${atom.name}:`,
          error
        );
      }
    }

    // Update checkpoint with previous values
    checkpoint.previousValues = previousValues;
    checkpoint.metadata.atomCount = atomsToRestore.length;

    logger.log(
      `[CheckpointManager] Captured ${previousValues.size} previous values for checkpoint: ${checkpointId}`
    );

    return previousValues;
  }

  /**
   * Get checkpoint by ID
   * @param checkpointId Checkpoint ID
   * @returns Checkpoint or undefined
   */
  get(checkpointId: string): RestorationCheckpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }

  /**
   * Get all checkpoints
   * @returns Array of checkpoints
   */
  getAll(): RestorationCheckpoint[] {
    return Array.from(this.checkpoints.values());
  }

  /**
   * Get last (most recent) checkpoint
   * @returns Last checkpoint or null
   */
  getLast(): RestorationCheckpoint | null {
    if (this.checkpoints.size === 0) {
      return null;
    }
    let lastCheckpoint: RestorationCheckpoint | null = null;
    for (const checkpoint of this.checkpoints.values()) {
      if (!lastCheckpoint || checkpoint.timestamp > lastCheckpoint.timestamp) {
        lastCheckpoint = checkpoint;
      }
    }
    return lastCheckpoint;
  }

  /**
   * Get active checkpoint ID
   * @returns Active checkpoint ID or null
   */
  getActiveCheckpointId(): string | null {
    return this.activeCheckpointId;
  }

  /**
   * Mark checkpoint as committed
   * @param checkpointId Checkpoint ID
   */
  commit(checkpointId: string): void {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (checkpoint) {
      checkpoint.metadata.committed = true;
      checkpoint.metadata.inProgress = false;
      logger.log(`[CheckpointManager] Committed checkpoint: ${checkpointId}`);
    }
  }

  /**
   * Delete checkpoint
   * @param checkpointId Checkpoint ID
   * @returns True if deleted, false if not found
   */
  delete(checkpointId: string): boolean {
    const deleted = this.checkpoints.delete(checkpointId);
    if (deleted) {
      logger.log(`[CheckpointManager] Deleted checkpoint: ${checkpointId}`);
      if (this.activeCheckpointId === checkpointId) {
        this.activeCheckpointId = null;
      }
    }
    return deleted;
  }

  /**
   * Clear all checkpoints
   */
  clear(): void {
    this.checkpoints.clear();
    this.activeCheckpointId = null;
    logger.log('[CheckpointManager] Cleared all checkpoints');
  }

  /**
   * Get number of checkpoints
   * @returns Number of checkpoints
   */
  getCount(): number {
    return this.checkpoints.size;
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<CheckpointConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): CheckpointConfig {
    return { ...this.config };
  }

  /**
   * Cleanup old checkpoints based on maxCheckpoints and timeout
   */
  private cleanupOldCheckpoints(): void {
    const now = Date.now();
    const checkpoints = Array.from(this.checkpoints.entries());

    // Sort by timestamp (newest first)
    checkpoints.sort((a, b) => b[1].timestamp - a[1].timestamp);

    // Remove expired checkpoints
    for (
      let i = this.config.maxCheckpoints;
      i < checkpoints.length;
      i++
    ) {
      const [id, checkpoint] = checkpoints[i];
      if (now - checkpoint.timestamp > this.config.checkpointTimeout) {
        this.checkpoints.delete(id);
        logger.log(
          `[CheckpointManager] Removed expired checkpoint: ${id}`
        );
      }
    }

    // Remove checkpoints beyond max
    while (this.checkpoints.size > this.config.maxCheckpoints) {
      const oldestId = checkpoints[checkpoints.length - 1][0];
      this.checkpoints.delete(oldestId);
      logger.log(
        `[CheckpointManager] Removed oldest checkpoint (max limit): ${oldestId}`
      );
    }
  }

  /**
   * Generate unique checkpoint ID
   */
  private generateCheckpointId(): string {
    return `checkpoint-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
