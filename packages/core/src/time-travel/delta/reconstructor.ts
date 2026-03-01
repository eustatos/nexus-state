/**
 * Snapshot Reconstructor - Reconstructs snapshots from delta chains
 * Implements optimized reconstruction with caching
 */

import type {
  Snapshot,
  DeltaSnapshot,
  ReconstructionOptions,
  DeltaReconstructionResult,
  ReconstructionPath,
} from "./types";

import { DeltaCalculatorImpl } from "./calculator";

/**
 * Cache entry for reconstructed snapshots
 */
export interface CacheEntryInternal {
  /** Snapshot ID */
  snapshotId: string;
  /** Reconstructed snapshot */
  snapshot: Snapshot;
  /** Timestamp of reconstruction */
  timestamp: number;
  /** Access count */
  accessCount: number;
}

/**
 * Reconstruction cache
 */
export interface ReconstructionCache {
  /** Get snapshot from cache */
  get(id: string): Snapshot | null;
  /** Set snapshot in cache */
  set(id: string, snapshot: Snapshot): void;
  /** Clear cache */
  clear(): void;
  /** Get cache size */
  size(): number;
}

/**
 * Default cache implementation using Map
 */
export class SimpleReconstructionCache implements ReconstructionCache {
  private cache: Map<string, CacheEntryInternal> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(id: string): Snapshot | null {
    const entry = this.cache.get(id);
    if (!entry) {
      return null;
    }

    // Update access count and timestamp
    entry.accessCount++;
    entry.timestamp = Date.now();

    return entry.snapshot;
  }

  set(id: string, snapshot: Snapshot): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(id, {
      snapshotId: id,
      snapshot,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  /**
   * Evict oldest entries
   */
  private evictOldest(): void {
    let oldestTime = Infinity;
    let oldestId: string | null = null;

    for (const [id, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.cache.delete(oldestId);
    }
  }
}

/**
 * Snapshot reconstructor
 */
export class SnapshotReconstructor {
  protected calculator: DeltaCalculatorImpl;
  private cache: ReconstructionCache | null = null;
  private config: ReconstructionOptions;

  constructor(config: ReconstructionOptions = {}) {
    this.config = {
      cache: true,
      maxCacheSize: 100,
      optimizePath: true,
      ...config,
    };

    this.calculator = new DeltaCalculatorImpl({
      deepEqual: true,
      skipEmpty: true,
    });

    if (this.config.cache) {
      this.cache = new SimpleReconstructionCache(this.config.maxCacheSize);
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
        error: "Start snapshot is required",
        metadata: {
          reconstructionTime: Date.now() - startTime,
          deltasApplied: 0,
        },
      };
    }

    // Apply deltas
    let currentSnapshot: Snapshot = startSnapshot;
    let deltasApplied = 0;

    const target = targetIndex !== undefined ? targetIndex : deltas.length;

    for (let i = 0; i < deltas.length; i++) {
      const delta = deltas[i];

      const result = this.calculator.applyDelta(currentSnapshot, delta);

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
    if (this.cache) {
      this.cache.set(currentSnapshot.id, currentSnapshot);
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

    return {
      size: this.cache.size(),
      maxSize: this.config.maxCacheSize ?? 0,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    if (this.cache) {
      this.cache.clear();
    }
  }
}

/**
 * Optimized reconstructor with multiple reconstruction strategies
 */
export class OptimizedSnapshotReconstructor extends SnapshotReconstructor {
  private strategies: Map<string, (snapshot: Snapshot, deltas: DeltaSnapshot[]) => Snapshot> = new Map();

  constructor(config: ReconstructionOptions = {}) {
    super(config);

    // Register strategies
    this.strategies.set("sequential", this.sequentialReconstruction.bind(this));
    this.strategies.set("skip-deltas", this.skipDeltasReconstruction.bind(this));
    this.strategies.set("cache-aware", this.cacheAwareReconstruction.bind(this));
  }

  /**
   * Reconstruct with strategy selection
   */
  reconstructWithStrategy(
    strategy: string,
    startSnapshot: Snapshot,
    deltas: DeltaSnapshot[],
  ): DeltaReconstructionResult {
    const reconstruct = this.strategies.get(strategy) || this.sequentialReconstruction;

    const startTime = Date.now();

    try {
      const result = reconstruct(startSnapshot, deltas);

      return {
        success: true,
        snapshot: result,
        metadata: {
          reconstructionTime: Date.now() - startTime,
          deltasApplied: deltas.length,
          cacheHit: false,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          reconstructionTime: Date.now() - startTime,
          deltasApplied: 0,
        },
      };
    }
  }

  /**
   * Sequential reconstruction
   */
  private sequentialReconstruction(
    startSnapshot: Snapshot,
    deltas: DeltaSnapshot[],
  ): Snapshot {
    let current = startSnapshot;

    for (const delta of deltas) {
      const result = this.calculator.applyDelta(current, delta);
      if (!result) {
        throw new Error("Failed to apply delta");
      }
      current = result;
    }

    return current;
  }

  /**
   * Skip deltas reconstruction - only apply if needed
   */
  private skipDeltasReconstruction(
    startSnapshot: Snapshot,
    deltas: DeltaSnapshot[],
  ): Snapshot {
    // For now, just use sequential
    return this.sequentialReconstruction(startSnapshot, deltas);
  }

  /**
   * Cache-aware reconstruction
   */
  private cacheAwareReconstruction(
    startSnapshot: Snapshot,
    deltas: DeltaSnapshot[],
  ): Snapshot {
    // Check cache for intermediate results
    if (deltas.length > 10) {
      // Only apply last delta if cache hit
      const lastDelta = deltas[deltas.length - 1];
      const cached = this.getFromCache(lastDelta.id);

      if (cached) {
        return cached;
      }
    }

    return this.sequentialReconstruction(startSnapshot, deltas);
  }
}
