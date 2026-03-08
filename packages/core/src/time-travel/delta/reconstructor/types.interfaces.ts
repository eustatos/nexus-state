/**
 * SnapshotReconstructor module interfaces
 * Enables dependency injection and testability
 */

import type {
  Snapshot,
  DeltaSnapshot,
  ReconstructionOptions,
  DeltaReconstructionResult,
  ReconstructionPath,
} from '../types';

/**
 * Reconstruction cache interface
 */
export interface IReconstructionCache {
  /**
   * Get snapshot from cache
   */
  get(id: string): Snapshot | null;

  /**
   * Set snapshot in cache
   */
  set(id: string, snapshot: Snapshot): void;

  /**
   * Clear cache
   */
  clear(): void;

  /**
   * Get cache size
   */
  size(): number;

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number };
}

/**
 * Delta applier interface
 */
export interface IDeltaApplier {
  /**
   * Apply delta to snapshot
   */
  applyDelta(snapshot: Snapshot, delta: DeltaSnapshot): Snapshot | null;
}

/**
 * Snapshot reconstructor interface
 */
export interface ISnapshotReconstructor {
  /**
   * Reconstruct snapshot from deltas
   */
  reconstruct(
    startSnapshot: Snapshot,
    deltas: DeltaSnapshot[],
    targetIndex?: number,
  ): DeltaReconstructionResult;

  /**
   * Get reconstruction path
   */
  getReconstructionPath(
    fromIndex: number,
    toIndex: number,
    historyLength: number,
  ): ReconstructionPath;

  /**
   * Get from cache
   */
  getFromCache(snapshotId: string): Snapshot | null;

  /**
   * Set in cache
   */
  setInCache(snapshotId: string, snapshot: Snapshot): void;

  /**
   * Clear cache
   */
  clearCache(): void;

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; maxSize: number };
}

/**
 * Reconstruction strategy interface
 */
export interface IReconstructionStrategy {
  /**
   * Strategy name
   */
  name: string;

  /**
   * Reconstruct snapshot
   */
  reconstruct(
    startSnapshot: Snapshot,
    deltas: DeltaSnapshot[],
    deltaApplier: IDeltaApplier,
  ): Snapshot;
}

/**
 * Optimized reconstructor interface
 */
export interface IOptimizedSnapshotReconstructor extends ISnapshotReconstructor {
  /**
   * Reconstruct with strategy
   */
  reconstructWithStrategy(
    strategy: string,
    startSnapshot: Snapshot,
    deltas: DeltaSnapshot[],
  ): DeltaReconstructionResult;

  /**
   * Register strategy
   */
  registerStrategy(name: string, strategy: IReconstructionStrategy): void;
}
