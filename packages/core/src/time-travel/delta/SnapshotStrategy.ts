/**
 * SnapshotStrategy - Strategy pattern for snapshot creation decisions
 *
 * Determines whether to create a delta snapshot or a full snapshot
 * based on configurable rules and current state.
 */

import type { DeltaSnapshot, Snapshot } from '../types';
import type { IncrementalSnapshotConfig } from './types';

export interface SnapshotStrategyConfig {
  /** Enable delta snapshots */
  enabled: boolean;
  /** Full snapshot interval (create full snapshot every N changes) */
  fullSnapshotInterval: number;
  /** Maximum delta chain length */
  maxDeltaChainLength: number;
  /** Maximum delta chain age in milliseconds */
  maxDeltaChainAge: number;
  /** Maximum delta chain size in bytes */
  maxDeltaChainSize: number;
}

export interface SnapshotDecision {
  /** Whether to create delta */
  shouldCreateDelta: boolean;
  /** Reason for decision */
  reason: string;
  /** Base snapshot ID for delta (if applicable) */
  baseSnapshotId?: string;
}

export interface DeltaChainInfo {
  /** Current chain length */
  length: number;
  /** Chain age in milliseconds */
  age: number;
  /** Chain size in bytes */
  size: number;
  /** Root snapshot ID */
  rootId: string;
}

/**
 * SnapshotStrategy provides decision-making logic
 * for snapshot creation
 */
export class SnapshotStrategy {
  private config: SnapshotStrategyConfig;

  constructor(config: Partial<SnapshotStrategyConfig>) {
    this.config = {
      enabled: config.enabled ?? true,
      fullSnapshotInterval: config.fullSnapshotInterval ?? 10,
      maxDeltaChainLength: config.maxDeltaChainLength ?? 5,
      maxDeltaChainAge: config.maxDeltaChainAge ?? 5 * 60 * 1000, // 5 minutes
      maxDeltaChainSize: config.maxDeltaChainSize ?? 1024 * 1024, // 1MB
    };
  }

  /**
   * Decide whether to create delta or full snapshot
   * @param currentSnapshot Current snapshot
   * @param fullSnapshotCounter Counter of full snapshots since last delta
   * @param chainInfo Current delta chain info
   * @returns Snapshot decision
   */
  decide(
    currentSnapshot: Snapshot | null,
    fullSnapshotCounter: number,
    chainInfo?: DeltaChainInfo
  ): SnapshotDecision {
    // Check if delta snapshots are enabled
    if (!this.config.enabled) {
      return {
        shouldCreateDelta: false,
        reason: 'Delta snapshots disabled',
      };
    }

    // Check if we have a current snapshot to compare with
    if (!currentSnapshot) {
      return {
        shouldCreateDelta: false,
        reason: 'No current snapshot available',
      };
    }

    // Check full snapshot interval
    if (fullSnapshotCounter >= this.config.fullSnapshotInterval) {
      return {
        shouldCreateDelta: false,
        reason: `Full snapshot interval reached (${this.config.fullSnapshotInterval})`,
      };
    }

    // Check delta chain constraints
    if (chainInfo) {
      // Check chain length
      if (chainInfo.length >= this.config.maxDeltaChainLength) {
        return {
          shouldCreateDelta: false,
          reason: `Max delta chain length reached (${this.config.maxDeltaChainLength})`,
        };
      }

      // Check chain age
      if (chainInfo.age >= this.config.maxDeltaChainAge) {
        return {
          shouldCreateDelta: false,
          reason: `Max delta chain age reached (${this.config.maxDeltaChainAge}ms)`,
        };
      }

      // Check chain size
      if (chainInfo.size >= this.config.maxDeltaChainSize) {
        return {
          shouldCreateDelta: false,
          reason: `Max delta chain size reached (${this.config.maxDeltaChainSize} bytes)`,
        };
      }

      // Use chain root as base
      return {
        shouldCreateDelta: true,
        reason: 'All checks passed',
        baseSnapshotId: chainInfo.rootId,
      };
    }

    // No chain info, check if current is full snapshot
    if (!this.isDeltaSnapshot(currentSnapshot)) {
      return {
        shouldCreateDelta: true,
        reason: 'Current snapshot is full snapshot',
        baseSnapshotId: currentSnapshot.id,
      };
    }

    // Current is delta, need to find root
    return {
      shouldCreateDelta: true,
      reason: 'Current snapshot is delta',
      baseSnapshotId: (currentSnapshot as DeltaSnapshot).baseSnapshotId,
    };
  }

  /**
   * Check if snapshot is a delta
   * @param snapshot Snapshot to check
   * @returns True if delta
   */
  private isDeltaSnapshot(snapshot: Snapshot): snapshot is DeltaSnapshot {
    return (snapshot as DeltaSnapshot).type === 'delta';
  }

  /**
   * Get configuration
   */
  getConfig(): SnapshotStrategyConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<SnapshotStrategyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if delta snapshots are enabled
   * @returns True if enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get full snapshot interval
   * @returns Interval
   */
  getFullSnapshotInterval(): number {
    return this.config.fullSnapshotInterval;
  }
}
