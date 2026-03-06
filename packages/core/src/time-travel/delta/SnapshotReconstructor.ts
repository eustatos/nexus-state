/**
 * SnapshotReconstructor - Reconstructs full snapshots from deltas
 *
 * Provides optimized snapshot reconstruction with caching.
 */

import type { Snapshot, DeltaSnapshot } from '../types';
import { DeltaProcessor } from './DeltaProcessor';
import { DeepCloneService } from './DeepCloneService';

export interface ReconstructorConfig {
  /** Enable reconstruction cache */
  enableCache: boolean;
  /** Max cached snapshots */
  maxCacheSize: number;
  /** Cache TTL in milliseconds */
  cacheTTL: number;
}

interface CacheEntry {
  /** Reconstructed snapshot */
  snapshot: Snapshot;
  /** Cache timestamp */
  timestamp: number;
  /** Access count */
  accessCount: number;
}

/**
 * SnapshotReconstructor provides snapshot reconstruction
 * from delta chains with caching support
 */
export class SnapshotReconstructor {
  private deltaProcessor: DeltaProcessor;
  private cloneService: DeepCloneService;
  private config: ReconstructorConfig;
  private cache: Map<string, CacheEntry> = new Map();

  constructor(
    deltaProcessor?: DeltaProcessor,
    config?: Partial<ReconstructorConfig>
  ) {
    this.deltaProcessor = deltaProcessor || new DeltaProcessor();
    this.cloneService = new DeepCloneService();
    this.config = {
      enableCache: config?.enableCache ?? true,
      maxCacheSize: config?.maxCacheSize ?? 50,
      cacheTTL: config?.cacheTTL ?? 60000, // 1 minute
    };
  }

  /**
   * Reconstruct full snapshot from delta
   * @param delta Delta snapshot
   * @param rootSnapshot Root (base) snapshot
   * @returns Reconstructed full snapshot
   */
  reconstruct(delta: DeltaSnapshot, rootSnapshot: Snapshot): Snapshot | null {
    // Check cache
    const cachedKey = `${rootSnapshot.id}-${delta.id}`;
    if (this.config.enableCache) {
      const cached = this.getFromCache(cachedKey);
      if (cached) {
        return cached;
      }
    }

    // Build delta chain
    const deltaChain = this.buildDeltaChain(delta, rootSnapshot.id);
    if (!deltaChain) {
      return null;
    }

    // Clone root snapshot
    let result = this.cloneService.cloneSnapshot(rootSnapshot);

    // Apply deltas
    result = this.deltaProcessor.applyDeltas(result, deltaChain);
    if (!result) {
      return null;
    }

    // Update metadata
    result.id = delta.id;
    result.metadata = {
      ...result.metadata,
      timestamp: delta.metadata.timestamp,
      action: delta.metadata.action,
    };

    // Cache result
    if (this.config.enableCache) {
      this.addToCache(cachedKey, result);
    }

    return result;
  }

  /**
   * Reconstruct snapshot from delta chain with pre-fetched history
   * @param delta Target delta
   * @param rootState Root state object
   * @param history Pre-fetched history array
   * @returns Reconstructed snapshot
   */
  reconstructWithHistory(
    delta: DeltaSnapshot,
    rootState: { id: string; state: any; metadata: any } | null,
    history: Snapshot[]
  ): Snapshot | null {
    if (!rootState) {
      return null;
    }

    // Check cache
    const cachedKey = `${rootState.id}-${delta.id}`;
    if (this.config.enableCache) {
      const cached = this.getFromCache(cachedKey);
      if (cached) {
        return cached;
      }
    }

    // Build delta chain from history
    const deltaChain = this.buildDeltaChainFromHistory(
      delta,
      rootState.id,
      history
    );
    if (!deltaChain) {
      return null;
    }

    // Create result from root state
    let result: Snapshot = {
      id: rootState.id,
      state: this.cloneService.clone(rootState.state),
      metadata: this.cloneService.clone(rootState.metadata),
    };

    // Apply deltas
    result = this.deltaProcessor.applyDeltas(result, deltaChain);
    if (!result) {
      return null;
    }

    // Update metadata
    result.id = delta.id;
    result.metadata = {
      ...result.metadata,
      timestamp: delta.metadata.timestamp,
      action: delta.metadata.action,
    };

    // Cache result
    if (this.config.enableCache) {
      this.addToCache(`${rootState.id}-${delta.id}`, result);
    }

    return result;
  }

  /**
   * Build delta chain from target to root
   * @param delta Target delta
   * @param rootId Root snapshot ID
   * @returns Array of deltas from root to target
   */
  private buildDeltaChain(
    delta: DeltaSnapshot,
    rootId: string
  ): DeltaSnapshot[] | null {
    const deltaChain: DeltaSnapshot[] = [];
    const visited = new Set<string>();
    let currentDelta: DeltaSnapshot | null = delta;

    while (currentDelta) {
      if (visited.has(currentDelta.id)) {
        // Circular reference detected
        return null;
      }
      visited.add(currentDelta.id);
      deltaChain.unshift(currentDelta);

      const baseId = currentDelta.baseSnapshotId;
      if (!baseId) {
        return null;
      }

      if (baseId === rootId) {
        break;
      }

      // This would need access to history to find base delta
      // For now, return what we have
      currentDelta = null;
    }

    return deltaChain;
  }

  /**
   * Build delta chain from history
   * @param delta Target delta
   * @param rootId Root snapshot ID
   * @param history History array to search
   * @returns Array of deltas from root to target
   */
  private buildDeltaChainFromHistory(
    delta: DeltaSnapshot,
    rootId: string,
    history: Snapshot[]
  ): DeltaSnapshot[] | null {
    const deltaChain: DeltaSnapshot[] = [];
    const visited = new Set<string>();
    let currentDelta: DeltaSnapshot | null = delta;

    while (currentDelta) {
      if (visited.has(currentDelta.id)) {
        return null;
      }
      visited.add(currentDelta.id);
      deltaChain.unshift(currentDelta);

      const baseId = currentDelta.baseSnapshotId;
      if (!baseId) {
        return null;
      }

      if (baseId === rootId) {
        break;
      }

      // Find base in history
      const baseSnapshot = history.find((s) => s.id === baseId);
      if (baseSnapshot && this.isDelta(baseSnapshot)) {
        currentDelta = baseSnapshot;
      } else {
        currentDelta = null;
      }
    }

    return deltaChain;
  }

  /**
   * Check if snapshot is delta
   */
  private isDelta(snapshot: Snapshot): snapshot is DeltaSnapshot {
    return (snapshot as DeltaSnapshot).type === 'delta';
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): Snapshot | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    // Update access count
    entry.accessCount++;
    entry.timestamp = Date.now();

    return this.cloneService.cloneSnapshot(entry.snapshot);
  }

  /**
   * Add to cache
   */
  private addToCache(key: string, snapshot: Snapshot): void {
    // Check max size
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictCache();
    }

    this.cache.set(key, {
      snapshot,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  /**
   * Evict least used entries from cache
   */
  private evictCache(): void {
    // Remove oldest and least accessed entries
    const entries = Array.from(this.cache.entries());
    entries.sort(
      (a, b) =>
        a[1].accessCount - b[1].accessCount ||
        a[1].timestamp - b[1].timestamp
    );

    // Remove half of cache
    const removeCount = Math.ceil(this.cache.size / 2);
    for (let i = 0; i < removeCount; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    entries: Array<{ key: string; accessCount: number; age: number }>;
  } {
    const now = Date.now();
    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        age: now - entry.timestamp,
      })),
    };
  }

  /**
   * Get configuration
   */
  getConfig(): ReconstructorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<ReconstructorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
