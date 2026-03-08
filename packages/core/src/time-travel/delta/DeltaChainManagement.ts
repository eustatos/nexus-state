/**
 * DeltaChainManagement - Management of delta chains and statistics
 *
 * Handles delta storage, chain management, and statistics collection.
 */

import type { DeltaSnapshot } from "../types";
import { DeltaChainManager } from "./chain-manager";
import type { DeltaHistoryStats } from "./types";

/**
 * Delta storage statistics
 */
export interface DeltaStorageStats {
  /** Number of stored deltas */
  count: number;
  /** Delta IDs */
  ids: string[];
  /** Total size estimate in bytes */
  estimatedSize: number;
}

/**
 * Chain statistics
 */
export interface ChainStats {
  /** Total deltas in chains */
  totalDeltasInChains: number;
  /** Average delta size */
  averageDeltaSize: number;
  /** Number of chains */
  chainCount: number;
  /** Longest chain length */
  longestChain: number;
}

/**
 * DeltaChainManagement provides delta chain management
 * and statistics without external dependencies
 */
export class DeltaChainManagement {
  private deltaChainManager: DeltaChainManager;
  private deltaStorage: Map<string, DeltaSnapshot>;

  constructor(deltaChainManager?: DeltaChainManager) {
    this.deltaChainManager = deltaChainManager || new DeltaChainManager();
    this.deltaStorage = new Map();
  }

  /**
   * Add delta to storage and chain manager
   * @param delta - Delta to add
   * @returns True if added successfully
   */
  addDelta(delta: DeltaSnapshot): boolean {
    try {
      this.deltaStorage.set(delta.id, delta);
      this.deltaChainManager.addDelta(delta);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get delta by ID
   * @param deltaId - Delta ID
   * @returns Delta or null
   */
  getDelta(deltaId: string): DeltaSnapshot | null {
    return this.deltaStorage.get(deltaId) || null;
  }

  /**
   * Get all stored deltas
   * @returns Array of deltas
   */
  getAllDeltas(): DeltaSnapshot[] {
    return Array.from(this.deltaStorage.values());
  }

  /**
   * Remove delta by ID
   * @param deltaId - Delta ID
   * @returns True if removed
   */
  removeDelta(deltaId: string): boolean {
    return this.deltaStorage.delete(deltaId);
  }

  /**
   * Clear all stored deltas
   */
  clear(): void {
    this.deltaStorage.clear();
    this.deltaChainManager.clear();
  }

  /**
   * Get delta by base snapshot ID
   * @param baseSnapshotId - Base snapshot ID
   * @returns Array of deltas
   */
  getDeltasByBaseId(baseSnapshotId: string): DeltaSnapshot[] {
    return Array.from(this.deltaStorage.values()).filter(
      (delta) => delta.baseSnapshotId === baseSnapshotId
    );
  }

  /**
   * Get delta chain for a target delta
   * @param targetDelta - Target delta
   * @returns Array of deltas in chain or null if circular
   */
  getDeltaChain(targetDelta: DeltaSnapshot): DeltaSnapshot[] | null {
    const chain: DeltaSnapshot[] = [];
    const visited = new Set<string>();
    let current: DeltaSnapshot | null = targetDelta;

    while (current) {
      if (visited.has(current.id)) {
        return null; // Circular reference
      }
      visited.add(current.id);
      chain.unshift(current);

      const baseId = current.baseSnapshotId;
      if (!baseId) {
        break;
      }

      // Find base delta in storage
      const baseDelta = this.deltaStorage.get(baseId);
      if (baseDelta && this.isDelta(baseDelta)) {
        current = baseDelta;
      } else {
        current = null;
      }
    }

    return chain;
  }

  /**
   * Check if delta exists
   * @param deltaId - Delta ID
   * @returns True if exists
   */
  hasDelta(deltaId: string): boolean {
    return this.deltaStorage.has(deltaId);
  }

  /**
   * Get storage statistics
   * @returns Storage stats
   */
  getStorageStats(): DeltaStorageStats {
    const ids = Array.from(this.deltaStorage.keys());
    const estimatedSize = this.calculateEstimatedSize();

    return {
      count: this.deltaStorage.size,
      ids,
      estimatedSize,
    };
  }

  /**
   * Get chain statistics
   * @returns Chain stats
   */
  getChainStats(): ChainStats {
    const stats = this.deltaChainManager.getStats();

    return {
      totalDeltasInChains: stats.totalDeltasInChains || 0,
      averageDeltaSize: stats.averageDeltaSize || 0,
      chainCount: this.countChains(),
      longestChain: this.getLongestChainLength(),
    };
  }

  /**
   * Get combined delta history stats
   * @returns Delta history stats
   */
  getDeltaHistoryStats(): {
    storage: DeltaStorageStats;
    chains: ChainStats;
  } {
    return {
      storage: this.getStorageStats(),
      chains: this.getChainStats(),
    };
  }

  /**
   * Calculate memory efficiency
   * @returns Efficiency ratio (0-1)
   */
  calculateMemoryEfficiency(): number {
    const chainStats = this.getChainStats();

    if (chainStats.totalDeltasInChains === 0) {
      return 1; // No deltas, 100% efficiency
    }

    const totalDeltas = chainStats.totalDeltasInChains;
    const avgDeltaSize = chainStats.averageDeltaSize;
    const avgSnapshotSize = 10000; // Assume 10KB average snapshot

    const deltaMemory = totalDeltas * avgDeltaSize;
    const fullSnapshotMemory = totalDeltas * avgSnapshotSize;

    return deltaMemory / fullSnapshotMemory;
  }

  /**
   * Get the delta chain manager
   * @returns Delta chain manager instance
   */
  getDeltaChainManager(): DeltaChainManager {
    return this.deltaChainManager;
  }

  /**
   * Get count of stored deltas
   * @returns Count
   */
  getCount(): number {
    return this.deltaStorage.size;
  }

  /**
   * Check if storage is empty
   * @returns True if empty
   */
  isEmpty(): boolean {
    return this.deltaStorage.size === 0;
  }

  /**
   * Validate delta chain for circular references
   * @param targetDelta - Target delta
   * @returns True if valid (no circular references)
   */
  validateChain(targetDelta: DeltaSnapshot): boolean {
    const visited = new Set<string>();
    let current: DeltaSnapshot | null = targetDelta;

    while (current) {
      if (visited.has(current.id)) {
        return false; // Circular reference detected
      }
      visited.add(current.id);

      const baseId = current.baseSnapshotId;
      if (!baseId) {
        break;
      }

      const baseDelta = this.deltaStorage.get(baseId);
      if (baseDelta && this.isDelta(baseDelta)) {
        current = baseDelta;
      } else {
        current = null;
      }
    }

    return true;
  }

  /**
   * Count number of delta chains
   * @returns Number of chains
   */
  private countChains(): number {
    const rootDeltas = new Set<string>();

    for (const delta of this.deltaStorage.values()) {
      const baseId = delta.baseSnapshotId;
      if (baseId && !this.deltaStorage.has(baseId)) {
        rootDeltas.add(baseId);
      }
    }

    return rootDeltas.size;
  }

  /**
   * Get length of longest chain
   * @returns Longest chain length
   */
  private getLongestChainLength(): number {
    let maxLength = 0;

    for (const delta of this.deltaStorage.values()) {
      const chain = this.getDeltaChain(delta);
      if (chain && chain.length > maxLength) {
        maxLength = chain.length;
      }
    }

    return maxLength;
  }

  /**
   * Calculate estimated size of all deltas
   * @returns Estimated size in bytes
   */
  private calculateEstimatedSize(): number {
    let totalSize = 0;

    for (const delta of this.deltaStorage.values()) {
      // Estimate size based on ID, changes, and metadata
      const deltaSize =
        delta.id.length * 2 + // ID bytes
        (delta.baseSnapshotId?.length || 0) * 2 + // Base ID bytes
        delta.changes.size * 100 + // Approximate per-change overhead
        JSON.stringify(delta.metadata).length; // Metadata bytes

      totalSize += deltaSize;
    }

    return totalSize;
  }

  /**
   * Check if snapshot is a delta
   * @param snapshot - Snapshot to check
   * @returns True if delta
   */
  private isDelta(snapshot: any): snapshot is DeltaSnapshot {
    return snapshot && snapshot.type === "delta";
  }
}
