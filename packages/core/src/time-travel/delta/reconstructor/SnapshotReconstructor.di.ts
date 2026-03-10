/**
 * SnapshotReconstructor - Reconstructs snapshots from delta chains
 */

import type {
  Snapshot,
  DeltaSnapshot,
  ReconstructionOptions,
  DeltaReconstructionResult,
  ReconstructionPath,
} from '../types';
import type {
  ISnapshotReconstructor,
  IReconstructionCache,
  IDeltaApplier,
} from './types.interfaces';
import { ReconstructionCache } from './ReconstructionCache';
import { DeltaApplier } from './DeltaApplier';

/**
 * Dependencies for SnapshotReconstructor
 */
export interface SnapshotReconstructorDeps {
  cache?: IReconstructionCache;
  deltaApplier?: IDeltaApplier;
  config?: Partial<ReconstructionOptions>;
}

/**
 * Default implementation of snapshot reconstructor
 */
export class SnapshotReconstructor implements ISnapshotReconstructor {
  private cache: IReconstructionCache | null;
  private deltaApplier: IDeltaApplier;
  private config: ReconstructionOptions;

  constructor(deps?: SnapshotReconstructorDeps) {
    this.config = {
      cache: true,
      maxCacheSize: 100,
      optimizePath: true,
      ...(deps?.config ?? {}),
    };

    this.deltaApplier = deps?.deltaApplier ?? new DeltaApplier();

    if (this.config.cache && !deps?.cache) {
      this.cache = new ReconstructionCache(this.config.maxCacheSize);
    } else {
      this.cache = deps?.cache ?? null;
    }
  }

  /**
   * Reconstruct snapshot from deltas
   */
  reconstruct(
    startSnapshot: Snapshot,
    deltas: DeltaSnapshot[],
    targetIndex?: number,
  ): DeltaReconstructionResult {
    const startTime = Date.now();

    // Validate inputs
    if (!startSnapshot) {
      return {
        success: false,
        error: 'Start snapshot is required',
        metadata: {
          reconstructionTime: Date.now() - startTime,
          deltasApplied: 0,
        },
      };
    }

    // Check cache for target snapshot
    const targetId = targetIndex !== undefined ? deltas[targetIndex]?.id : deltas[deltas.length - 1]?.id;
    if (targetId && this.cache) {
      const cached = this.cache.get(targetId);
      if (cached) {
        return {
          success: true,
          snapshot: cached,
          metadata: {
            reconstructionTime: Date.now() - startTime,
            deltasApplied: 0,
            cacheHit: true,
          },
        };
      }
    }

    // Apply deltas
    let currentSnapshot: Snapshot = startSnapshot;
    let deltasApplied = 0;

    const target = targetIndex !== undefined ? targetIndex : deltas.length;

    for (let i = 0; i < deltas.length; i++) {
      const delta = deltas[i];

      const result = this.deltaApplier.applyDelta(currentSnapshot, delta);

      if (!result) {
        return {
          success: false,
          error: `Failed to apply delta at index ${i}`,
          metadata: {
            reconstructionTime: Date.now() - startTime,
            deltasApplied: deltasApplied,
          },
        };
      }

      currentSnapshot = result;
      deltasApplied++;

      if (i === target - 1) {
        break;
      }
    }

    // Cache result
    if (this.cache && targetId) {
      this.cache.set(targetId, currentSnapshot);
    }

    const reconstructionTime = Date.now() - startTime;

    return {
      success: true,
      snapshot: currentSnapshot,
      metadata: {
        reconstructionTime,
        deltasApplied,
        cacheHit: false,
      },
    };
  }

  /**
   * Get reconstruction path between indices
   */
  getReconstructionPath(
    fromIndex: number,
    toIndex: number,
    _historyLength: number,
  ): ReconstructionPath {
    // Optimize path - go directly or through intermediate points
    const directDeltas = Math.abs(toIndex - fromIndex);

    return {
      startId: fromIndex < toIndex ? `snapshot-${fromIndex}` : `snapshot-${toIndex}`,
      endId: toIndex > fromIndex ? `snapshot-${toIndex}` : `snapshot-${fromIndex}`,
      deltaChain: [],
      deltaCount: directDeltas,
      estimatedTime: directDeltas * 0.1, // Assume 0.1ms per delta
    };
  }

  /**
   * Get snapshot from cache
   */
  getFromCache(snapshotId: string): Snapshot | null {
    if (!this.cache) {
      return null;
    }

    return this.cache.get(snapshotId);
  }

  /**
   * Set snapshot in cache
   */
  setInCache(snapshotId: string, snapshot: Snapshot): void {
    if (this.cache) {
      this.cache.set(snapshotId, snapshot);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    if (!this.cache) {
      return { size: 0, maxSize: 0 };
    }

    return this.cache.getStats();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    if (this.cache) {
      this.cache.clear();
    }
  }

  /**
   * Get cache instance
   */
  getCache(): IReconstructionCache | null {
    return this.cache;
  }

  /**
   * Get delta applier
   */
  getDeltaApplier(): IDeltaApplier {
    return this.deltaApplier;
  }

  /**
   * Get configuration
   */
  getConfig(): ReconstructionOptions {
    return { ...this.config };
  }
}
