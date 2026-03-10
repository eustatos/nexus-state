/**
 * DeltaSnapshotStorage - Manages storage of delta snapshots
 *
 * Handles physical storage of DeltaSnapshot objects,
 * including adding, retrieving, and cleaning up deltas.
 */

import type { DeltaSnapshot, Snapshot } from '../types';

export interface DeltaSnapshotStorageConfig {
  /** Maximum number of deltas to store */
  maxDeltas?: number;
  /** Enable TTL for deltas */
  enableTTL?: boolean;
  /** Default TTL in milliseconds */
  defaultTTL?: number;
}

export interface DeltaStorageStats {
  /** Total deltas stored */
  totalDeltas: number;
  /** Memory used by deltas (estimated) */
  estimatedMemoryUsage: number;
  /** Oldest delta timestamp */
  oldestDeltaTimestamp?: number;
  /** Newest delta timestamp */
  newestDeltaTimestamp?: number;
}

/**
 * DeltaSnapshotStorage provides storage management
 * for delta snapshots
 */
export class DeltaSnapshotStorage {
  private deltas: Map<string, DeltaSnapshot> = new Map();
  private config: DeltaSnapshotStorageConfig;

  constructor(config?: Partial<DeltaSnapshotStorageConfig>) {
    this.config = {
      maxDeltas: config?.maxDeltas ?? 1000,
      enableTTL: config?.enableTTL ?? false,
      defaultTTL: config?.defaultTTL ?? 300000, // 5 minutes
    };
  }

  /**
   * Add delta to storage
   * @param delta Delta snapshot to add
   * @returns True if added successfully
   */
  add(delta: DeltaSnapshot): boolean {
    // Check max deltas limit
    if (this.deltas.size >= this.config.maxDeltas!) {
      // Remove oldest delta
      this.removeOldest();
    }

    this.deltas.set(delta.id, delta);
    return true;
  }

  /**
   * Get delta by ID
   * @param deltaId Delta ID
   * @returns Delta snapshot or null
   */
  get(deltaId: string): DeltaSnapshot | null {
    return this.deltas.get(deltaId) || null;
  }

  /**
   * Check if delta exists
   * @param deltaId Delta ID
   * @returns True if exists
   */
  has(deltaId: string): boolean {
    return this.deltas.has(deltaId);
  }

  /**
   * Remove delta by ID
   * @param deltaId Delta ID
   * @returns True if removed
   */
  remove(deltaId: string): boolean {
    return this.deltas.delete(deltaId);
  }

  /**
   * Remove oldest delta
   * @returns True if removed
   */
  private removeOldest(): boolean {
    const firstKey = this.deltas.keys().next().value;
    if (firstKey) {
      return this.deltas.delete(firstKey);
    }
    return false;
  }

  /**
   * Get all deltas
   * @returns Array of deltas
   */
  getAll(): DeltaSnapshot[] {
    return Array.from(this.deltas.values());
  }

  /**
   * Get delta count
   * @returns Number of deltas
   */
  getCount(): number {
    return this.deltas.size;
  }

  /**
   * Clear all deltas
   */
  clear(): void {
    this.deltas.clear();
  }

  /**
   * Get storage statistics
   * @returns Storage statistics
   */
  getStats(): DeltaStorageStats {
    const deltas = this.getAll();
    let totalSize = 0;
    let oldestTimestamp: number | undefined;
    let newestTimestamp: number | undefined;

    for (const delta of deltas) {
      totalSize += JSON.stringify(delta.changes).length;

      const timestamp = delta.metadata.timestamp;
      if (oldestTimestamp === undefined || timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp;
      }
      if (newestTimestamp === undefined || timestamp > newestTimestamp) {
        newestTimestamp = timestamp;
      }
    }

    return {
      totalDeltas: deltas.length,
      estimatedMemoryUsage: totalSize,
      oldestDeltaTimestamp: oldestTimestamp,
      newestDeltaTimestamp: newestTimestamp,
    };
  }

  /**
   * Get deltas by base snapshot ID
   * @param baseId Base snapshot ID
   * @returns Array of deltas
   */
  getByBaseId(baseId: string): DeltaSnapshot[] {
    return this.getAll().filter((d) => d.baseSnapshotId === baseId);
  }

  /**
   * Cleanup old deltas by TTL
   * @param ttl TTL in milliseconds
   * @returns Number of cleaned deltas
   */
  cleanupByTTL(ttl?: number): number {
    if (!this.config.enableTTL) {
      return 0;
    }

    const ttlMs = ttl ?? this.config.defaultTTL!;
    const now = Date.now();
    let cleaned = 0;

    const idsToRemove: string[] = [];
    for (const [id, delta] of this.deltas.entries()) {
      const age = now - delta.metadata.timestamp;
      if (age > ttlMs) {
        idsToRemove.push(id);
      }
    }

    for (const id of idsToRemove) {
      this.deltas.delete(id);
      cleaned++;
    }

    return cleaned;
  }

  /**
   * Get configuration
   */
  getConfig(): DeltaSnapshotStorageConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<DeltaSnapshotStorageConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
