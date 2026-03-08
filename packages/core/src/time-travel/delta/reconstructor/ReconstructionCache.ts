/**
 * ReconstructionCache - Caches reconstructed snapshots
 */

import type { IReconstructionCache } from './types.interfaces';
import type { Snapshot } from '../types';

/**
 * Cache entry for reconstructed snapshots
 */
interface CacheEntry {
  snapshotId: string;
  snapshot: Snapshot;
  timestamp: number;
  accessCount: number;
}

/**
 * Default implementation of reconstruction cache
 */
export class ReconstructionCache implements IReconstructionCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Get snapshot from cache
   */
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

  /**
   * Set snapshot in cache
   */
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

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Evict oldest entry
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

  /**
   * Get all cached IDs
   */
  getCachedIds(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Remove specific entry from cache
   */
  remove(id: string): boolean {
    return this.cache.delete(id);
  }

  /**
   * Check if snapshot is in cache
   */
  has(id: string): boolean {
    return this.cache.has(id);
  }
}
