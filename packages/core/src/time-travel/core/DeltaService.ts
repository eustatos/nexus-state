/**
 * DeltaService - Manages delta snapshots and reconstruction
 *
 * Handles delta snapshot creation, reconstruction, and
 * incremental history management.
 */

import type { Snapshot } from '../types';
import { DeltaCalculatorImpl } from '../delta/calculator';
import { SnapshotReconstructor } from '../delta/reconstructor';
import type {
  DeltaSnapshot,
  IncrementalSnapshotConfig,
  DeltaCompressionFactoryConfig,
} from '../delta/types';

export interface DeltaServiceConfig {
  /** Enable delta snapshots */
  enabled: boolean;
  /** Delta compression config */
  compression?: DeltaCompressionFactoryConfig;
  /** Incremental snapshot config */
  incremental?: IncrementalSnapshotConfig;
}

export interface DeltaResult {
  /** Whether operation was successful */
  success: boolean;
  /** Delta snapshot (if created) */
  delta?: DeltaSnapshot;
  /** Reconstructed snapshot (if reconstructed) */
  reconstructed?: Snapshot;
  /** Error message (if failed) */
  error?: string;
}

export interface DeltaStats {
  /** Total delta snapshots */
  totalDeltas: number;
  /** Full snapshots count */
  fullSnapshotsCount: number;
  /** Delta snapshots count */
  deltaSnapshotsCount: number;
  /** Average delta size */
  averageDeltaSize?: number;
  /** Compression ratio */
  compressionRatio?: number;
}

/**
 * DeltaService provides delta snapshot management
 * for efficient time travel operations
 */
export class DeltaService {
  private calculator: DeltaCalculatorImpl;
  private reconstructor: SnapshotReconstructor;
  private config: DeltaServiceConfig;

  constructor(config?: Partial<DeltaServiceConfig>) {
    this.config = {
      enabled: config?.enabled ?? false,
      compression: config?.compression ?? { strategy: 'none' },
      incremental: config?.incremental ?? {
        enabled: false,
        fullSnapshotInterval: 10,
        maxDeltaChainLength: 5,
        maxDeltaChainAge: 5 * 60 * 1000,
        maxDeltaChainSize: 1024 * 1024,
        changeDetection: 'shallow' as const,
        reconstructOnDemand: true,
        cacheReconstructed: true,
        maxCacheSize: 100,
        compressionLevel: 'none' as const,
      },
    };

    this.calculator = new DeltaCalculatorImpl();
    this.reconstructor = new SnapshotReconstructor();
  }

  /**
   * Create delta snapshot between two snapshots
   * @param fromSnapshot Source snapshot
   * @param toSnapshot Target snapshot
   * @returns Delta result
   */
  createDelta(
    fromSnapshot: Snapshot,
    toSnapshot: Snapshot
  ): DeltaResult {
    try {
      const delta = this.calculator.computeDelta(fromSnapshot, toSnapshot);

      return {
        success: true,
        delta: delta ?? undefined,
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
   * Reconstruct snapshot from base and delta
   * @param baseSnapshot Base snapshot
   * @param delta Delta to apply
   * @returns Delta result
   */
  reconstruct(
    baseSnapshot: Snapshot,
    delta: DeltaSnapshot
  ): DeltaResult {
    try {
      const result = this.reconstructor.reconstruct(
        baseSnapshot,
        [delta]
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        reconstructed: result.snapshot ?? undefined,
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
   * Reconstruct snapshot at specific index from delta chain
   * @param snapshots Array of snapshots (full and delta)
   * @param targetIndex Index to reconstruct
   * @returns Delta result
   */
  reconstructAt(
    snapshots: Array<Snapshot | DeltaSnapshot>,
    targetIndex: number
  ): DeltaResult {
    try {
      if (snapshots.length === 0 || targetIndex >= snapshots.length) {
        return {
          success: false,
          error: 'Invalid snapshots or targetIndex',
        };
      }

      const baseSnapshot = snapshots[0] as Snapshot;
      const deltas = snapshots.slice(1, targetIndex + 1) as DeltaSnapshot[];

      const result = this.reconstructor.reconstruct(baseSnapshot, deltas);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        reconstructed: result.snapshot ?? undefined,
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
   * Get delta statistics
   * @param snapshots Array of snapshots
   * @returns Delta statistics
   */
  getStats(
    snapshots: Array<Snapshot | DeltaSnapshot>
  ): DeltaStats {
    const fullSnapshots = snapshots.filter(
      (s): s is Snapshot => (s as any).type !== 'delta'
    );
    const deltaSnapshots = snapshots.filter(
      (s): s is DeltaSnapshot => (s as any).type === 'delta'
    );

    let totalDeltaSize = 0;
    for (const delta of deltaSnapshots) {
      totalDeltaSize += JSON.stringify(delta.changes).length;
    }

    return {
      totalDeltas: deltaSnapshots.length,
      fullSnapshotsCount: fullSnapshots.length,
      deltaSnapshotsCount: deltaSnapshots.length,
      averageDeltaSize: deltaSnapshots.length > 0
        ? totalDeltaSize / deltaSnapshots.length
        : undefined,
      compressionRatio:
        fullSnapshots.length > 0 && deltaSnapshots.length > 0
          ? totalDeltaSize /
            (fullSnapshots.reduce(
              (sum, s) => sum + JSON.stringify(s).length,
              0
            ) / fullSnapshots.length)
          : undefined,
    };
  }

  /**
   * Force creation of full snapshot instead of delta
   * @param snapshot Current snapshot
   * @returns Snapshot
   */
  forceFullSnapshot(snapshot: Snapshot): Snapshot {
    // Return as-is, forcing full snapshot
    return snapshot;
  }

  /**
   * Check if delta snapshots are enabled
   * @returns True if enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get the delta calculator
   */
  getCalculator(): DeltaCalculatorImpl {
    return this.calculator;
  }

  /**
   * Get the reconstructor
   */
  getReconstructor(): SnapshotReconstructor {
    return this.reconstructor;
  }

  /**
   * Get configuration
   */
  getConfig(): DeltaServiceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<DeltaServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
