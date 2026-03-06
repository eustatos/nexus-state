/**
 * DeltaProcessor - Computes and applies deltas between snapshots
 *
 * Provides optimized delta computation and application logic.
 */

import type { Snapshot, DeltaSnapshot } from '../types';
import { DeltaCalculatorImpl } from './calculator';
import { DeepCloneService } from './DeepCloneService';

export interface DeltaProcessorConfig {
  /** Use deep equality comparison */
  deepEqual: boolean;
  /** Skip empty deltas */
  skipEmpty: boolean;
  /** Compute delta hash for deduplication */
  computeHash: boolean;
}

export interface DeltaResult {
  /** Delta snapshot */
  delta: DeltaSnapshot | null;
  /** Whether delta is empty (no changes) */
  isEmpty: boolean;
  /** Number of changes */
  changeCount: number;
}

/**
 * DeltaProcessor provides delta computation and application
 */
export class DeltaProcessor {
  private calculator: DeltaCalculatorImpl;
  private cloneService: DeepCloneService;
  private config: DeltaProcessorConfig;

  constructor(config?: Partial<DeltaProcessorConfig>) {
    this.config = {
      deepEqual: config?.deepEqual ?? true,
      skipEmpty: config?.skipEmpty ?? true,
      computeHash: config?.computeHash ?? false,
    };

    this.calculator = new DeltaCalculatorImpl({
      deepEqual: this.config.deepEqual,
      skipEmpty: this.config.skipEmpty,
    });
    this.cloneService = new DeepCloneService();
  }

  /**
   * Compute delta between two snapshots
   * @param base Base snapshot
   * @param target Target snapshot
   * @returns Delta result
   */
  computeDelta(base: Snapshot, target: Snapshot): DeltaResult {
    const delta = this.calculator.computeDelta(base, target);

    if (!delta) {
      return {
        delta: null,
        isEmpty: true,
        changeCount: 0,
      };
    }

    // Count changes
    const changeCount = this.countChanges(delta);

    return {
      delta,
      isEmpty: changeCount === 0,
      changeCount,
    };
  }

  /**
   * Apply delta to snapshot
   * @param snapshot Base snapshot
   * @param delta Delta to apply
   * @returns New snapshot with delta applied
   */
  applyDelta(snapshot: Snapshot, delta: DeltaSnapshot): Snapshot | null {
    return this.calculator.applyDelta(snapshot, delta);
  }

  /**
   * Apply multiple deltas in sequence
   * @param snapshot Base snapshot
   * @param deltas Deltas to apply
   * @returns New snapshot with all deltas applied
   */
  applyDeltas(snapshot: Snapshot, deltas: DeltaSnapshot[]): Snapshot | null {
    let result = this.cloneService.cloneSnapshot(snapshot);

    for (const delta of deltas) {
      const applied = this.applyDelta(result, delta);
      if (!applied) {
        return null;
      }
      result = applied;
    }

    return result;
  }

  /**
   * Check if delta is applicable to snapshot
   * @param snapshot Snapshot to check
   * @param delta Delta to check
   * @returns True if delta is applicable
   */
  isDeltaApplicable(snapshot: Snapshot, delta: DeltaSnapshot): boolean {
    return delta.baseSnapshotId === snapshot.id;
  }

  /**
   * Merge multiple deltas into single delta
   * @param deltas Deltas to merge
   * @returns Merged delta or null
   */
  mergeDeltas(deltas: DeltaSnapshot[]): DeltaSnapshot | null {
    if (deltas.length === 0) {
      return null;
    }

    if (deltas.length === 1) {
      return deltas[0];
    }

    // Compute merged delta from first base to last target
    const firstDelta = deltas[0];
    const lastDelta = deltas[deltas.length - 1];

    // Create a synthetic delta from first base to last state
    return {
      id: `merged-${Date.now()}`,
      type: 'delta',
      baseSnapshotId: firstDelta.baseSnapshotId,
      previousSnapshotId: lastDelta.previousSnapshotId,
      delta: lastDelta.delta,
      metadata: {
        timestamp: Date.now(),
        atomCount: lastDelta.metadata.atomCount,
        action: 'merged',
      },
    };
  }

  /**
   * Count changes in delta
   * @param delta Delta to analyze
   * @returns Number of changes
   */
  private countChanges(delta: DeltaSnapshot): number {
    let count = 0;

    if (delta.delta) {
      // Count added atoms
      if (delta.delta.added) {
        count += Object.keys(delta.delta.added).length;
      }

      // Count modified atoms
      if (delta.delta.modified) {
        count += Object.keys(delta.delta.modified).length;
      }

      // Count removed atoms
      if (delta.delta.removed) {
        count += Object.keys(delta.delta.removed).length;
      }
    }

    return count;
  }

  /**
   * Get delta size estimate in bytes
   * @param delta Delta to measure
   * @returns Size estimate
   */
  getDeltaSize(delta: DeltaSnapshot): number {
    return JSON.stringify(delta).length;
  }

  /**
   * Get configuration
   */
  getConfig(): DeltaProcessorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<DeltaProcessorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
