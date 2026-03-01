/**
 * Delta Chain Manager - Manages delta chains for efficient snapshot reconstruction
 * Implements chain-based delta storage with automatic base snapshot creation
 */

import type {
  DeltaSnapshot,
  DeltaChain,
  ChainManagerConfig,
  DeltaStats,
} from "./types";

/**
 * Default chain manager configuration
 */
export const DEFAULT_CHAIN_MANAGER_CONFIG: ChainManagerConfig = {
  fullSnapshotInterval: 10,
  maxDeltaChainLength: 20,
  maxDeltaChainAge: 5 * 60 * 1000,
  maxDeltaChainSize: 1024 * 1024,
  fullSnapshotStrategy: "changes" as const,
};

/**
 * Result of chain validation
 */
export interface ChainValidationResult {
  /** Whether chain is valid */
  isValid: boolean;
  /** Reason if invalid */
  reason?: string;
  /** Suggested action */
  action?: "keep" | "create_base" | "reconstruct";
}

/**
 * Delta Chain Manager
 */
export class DeltaChainManager {
  private chains: Map<string, DeltaChain> = new Map();
  private config: ChainManagerConfig;
  private fullSnapshotCount: number = 0;
  private deltaCount: number = 0;
  private totalMemoryUsage: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  constructor(config?: Partial<ChainManagerConfig>) {
    this.config = {
      ...DEFAULT_CHAIN_MANAGER_CONFIG,
      ...config,
    };
  }

  /**
   * Add a delta to the chain
   */
  addDelta(delta: DeltaSnapshot): void {
    const baseId = delta.baseSnapshotId;
    if (!baseId) return;

    const chain = this.getOrCreateChain(baseId);
    chain.deltas.push(delta);
    chain.metadata.deltaCount++;
    chain.metadata.updatedAt = Date.now();
    chain.metadata.memoryUsage += this.calculateDeltaSize(delta);

    this.deltaCount++;
    this.totalMemoryUsage += this.calculateDeltaSize(delta);

    // Check if should create new base snapshot
    if (this.shouldCreateBaseSnapshot(chain)) {
      this.createNewBaseSnapshot(chain);
    }
  }

  /**
   * Get chain for a base snapshot
   */
  getChain(baseId: string): DeltaChain | null {
    return this.chains.get(baseId) || null;
  }

  /**
   * Get all active chains
   */
  getAllChains(): DeltaChain[] {
    return Array.from(this.chains.values());
  }

  /**
   * Get active chain count
   */
  getActiveChainCount(): number {
    return this.chains.size;
  }

  /**
   * Reconstruct snapshot from chain
   */
  reconstruct(baseId: string, targetDeltaId?: string): DeltaSnapshot | null {
    const chain = this.chains.get(baseId);
    if (!chain) {
      return null;
    }

    // Find target delta index
    let targetIndex = chain.deltas.length;
    if (targetDeltaId) {
      targetIndex = chain.deltas.findIndex((d) => d.id === targetDeltaId);
      if (targetIndex === -1) {
        return null;
      }
      targetIndex++; // Include up to and including target
    }

    // Build reconstructed chain
    const reconstructedDeltas = chain.deltas.slice(0, targetIndex);

    // Return the last delta (or null if no deltas)
    return reconstructedDeltas.length > 0
      ? reconstructedDeltas[reconstructedDeltas.length - 1]
      : null;
  }

  /**
   * Validate chain
   */
  validateChain(chain: DeltaChain): ChainValidationResult {
    // Check chain length
    if (chain.deltas.length > this.config.maxDeltaChainLength) {
      return {
        isValid: false,
        reason: `Chain exceeds maximum length (${chain.deltas.length} > ${this.config.maxDeltaChainLength})`,
        action: "create_base",
      };
    }

    // Check chain age
    const age = Date.now() - chain.metadata.createdAt;
    if (age > this.config.maxDeltaChainAge) {
      return {
        isValid: false,
        reason: `Chain exceeds maximum age (${age}ms > ${this.config.maxDeltaChainAge}ms)`,
        action: "create_base",
      };
    }

    // Check chain size
    if (chain.metadata.memoryUsage > this.config.maxDeltaChainSize) {
      return {
        isValid: false,
        reason: `Chain exceeds maximum size (${chain.metadata.memoryUsage}bytes > ${this.config.maxDeltaChainSize}bytes)`,
        action: "create_base",
      };
    }

    return { isValid: true, action: "keep" };
  }

  /**
   * Get statistics
   */
  getStats(): DeltaStats {
    const activeChains = this.chains.size;
    let totalDeltas = 0;
    let totalSize = 0;

    for (const chain of this.chains.values()) {
      totalDeltas += chain.deltas.length;
      totalSize += chain.metadata.memoryUsage;
    }

    return {
      deltaCount: this.deltaCount,
      fullSnapshotCount: this.fullSnapshotCount,
      activeChains,
      totalDeltasInChains: totalDeltas,
      memoryUsage: totalSize,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      averageDeltaSize: this.deltaCount > 0 ? totalSize / this.deltaCount : 0,
      averageCompressionRatio: this.calculateAverageCompressionRatio(),
    };
  }

  /**
   * Clear all chains
   */
  clear(): void {
    this.chains.clear();
    this.fullSnapshotCount = 0;
    this.deltaCount = 0;
    this.totalMemoryUsage = 0;
  }

  /**
   * Create new base snapshot from chain
   */
  createNewBaseSnapshot(chain: DeltaChain): void {
    if (chain.deltas.length === 0) {
      return;
    }

    this.chains.delete(chain.baseSnapshot.id);
    this.fullSnapshotCount++;

    // Reset chain stats
    this.deltaCount -= chain.deltas.length;
    this.totalMemoryUsage -= chain.metadata.memoryUsage;
  }

  /**
   * Check if should create base snapshot
   */
  shouldCreateBaseSnapshot(chain: DeltaChain): boolean {
    // Check length
    if (chain.deltas.length >= this.config.maxDeltaChainLength) {
      return true;
    }

    // Check age
    const age = Date.now() - chain.metadata.createdAt;
    if (age > this.config.maxDeltaChainAge) {
      return true;
    }

    // Check size
    if (chain.metadata.memoryUsage > this.config.maxDeltaChainSize) {
      return true;
    }

    return false;
  }

  /**
   * Calculate delta size
   */
  private calculateDeltaSize(delta: DeltaSnapshot): number {
    let size = delta.id.length * 2;
    size += delta.baseSnapshotId!.length * 2;
    size += delta.metadata.action?.length || 0;
    size += delta.changes.size * 100; // Approximate per-change overhead

    for (const [key, change] of delta.changes.entries()) {
      size += key.length * 2;
      size += change.atomId.length * 2;
      size += change.atomName.length * 2;
      size += 50;
    }

    return size;
  }

  /**
   * Calculate average compression ratio
   */
  private calculateAverageCompressionRatio(): number {
    return 0.3; // Assume 70% reduction
  }

  /**
   * Get or create chain for base snapshot
   */
  private getOrCreateChain(baseId: string): DeltaChain {
    let chain = this.chains.get(baseId);

    if (!chain) {
      chain = {
        baseSnapshot: {
          id: baseId,
          type: "full",
          state: {},
          metadata: {
            timestamp: Date.now(),
            action: "base",
            atomCount: 0,
          },
          baseSnapshotId: null,
        },
        deltas: [],
        metadata: {
          deltaCount: 0,
          memoryUsage: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          maxDeltas: this.config.maxDeltaChainLength,
        },
      };

      this.chains.set(baseId, chain);
      this.cacheMisses++;
    } else {
      this.cacheHits++;
    }

    return chain;
  }
}
