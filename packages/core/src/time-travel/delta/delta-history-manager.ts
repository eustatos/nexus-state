/**
 * Delta-Aware History Manager - Enhanced history manager with delta support
 * Manages both full and delta snapshots in the history
 */

import type { Snapshot, AnySnapshot, DeltaSnapshot } from "../types";
import { HistoryManager } from "../core/HistoryManager";
import type { HistoryEvent } from "../core/types";

import { DeltaCalculatorImpl } from "./calculator";
import { DeltaChainManager } from "./chain-manager";
import { DEFAULT_INCREMENTAL_SNAPSHOT_CONFIG, type DeltaAwareHistoryManagerConfig, type DeltaHistoryStats } from "./types";

/**
 * Default delta history manager configuration
 */
export const DEFAULT_DELTA_HISTORY_CONFIG: DeltaAwareHistoryManagerConfig = {
  incrementalSnapshot: DEFAULT_INCREMENTAL_SNAPSHOT_CONFIG,
};

/**
 * Delta-aware History Manager
 */
export class DeltaAwareHistoryManager {
  private historyManager: HistoryManager;
  private deltaCalculator: DeltaCalculatorImpl;
  private deltaChainManager: DeltaChainManager;
  private config: DeltaAwareHistoryManagerConfig;
  private deltaSnapshots: Map<string, DeltaSnapshot> = new Map();
  private fullSnapshotCounter: number = 0;

  constructor(config: DeltaAwareHistoryManagerConfig = {}) {
    this.config = {
      incrementalSnapshot: {
        ...DEFAULT_INCREMENTAL_SNAPSHOT_CONFIG,
        ...config.incrementalSnapshot,
      },
      maxHistory: config.maxHistory || 50,
      compressionEnabled: config.compressionEnabled ?? true,
    };

    this.historyManager = new HistoryManager(this.config.maxHistory);
    this.deltaCalculator = new DeltaCalculatorImpl({
      deepEqual: this.config.incrementalSnapshot!.changeDetection === "deep",
      skipEmpty: true,
    });
    this.deltaChainManager = new DeltaChainManager({
      fullSnapshotInterval: this.config.incrementalSnapshot!.fullSnapshotInterval,
      maxDeltaChainLength: this.config.incrementalSnapshot!.maxDeltaChainLength,
      maxDeltaChainAge: this.config.incrementalSnapshot!.maxDeltaChainAge,
      maxDeltaChainSize: this.config.incrementalSnapshot!.maxDeltaChainSize,
    });
  }

  /**
   * Add snapshot to history
   */
  add(snapshot: Snapshot): void {
    const incrementalConfig = this.config.incrementalSnapshot!;

    // Check if we should create delta
    if (incrementalConfig.enabled && this.canCreateDelta()) {
      const current = this.historyManager.getCurrent();

      if (current) {
        const delta = this.deltaCalculator.computeDelta(current, snapshot);

        if (delta) {
          // Store delta
          this.deltaSnapshots.set(delta.id, delta);
          this.deltaChainManager.addDelta(delta);
          this.historyManager.add(delta as AnySnapshot);
          this.fullSnapshotCounter = 0;
          return;
        }
      }
    }

    // Create full snapshot
    this.historyManager.add(snapshot);
    this.fullSnapshotCounter++;
  }

  /**
   * Get snapshot by index
   */
  getSnapshot(index: number): Snapshot | null {
    const allSnapshots = this.historyManager.getAll();
    
    if (index < 0 || index >= allSnapshots.length) {
      return null;
    }

    const snapshot = allSnapshots[index];

    // If it's a delta, reconstruct full snapshot
    if (this.isDeltaSnapshot(snapshot)) {
      return this.reconstructFullSnapshot(snapshot);
    }

    return snapshot;
  }

  /**
   * Get all snapshots
   */
  getAll(): Snapshot[] {
    const all = this.historyManager.getAll();
    return all.map((snapshot, _index) => {
      if (this.isDeltaSnapshot(snapshot)) {
        return this.reconstructFullSnapshot(snapshot) || snapshot;
      }
      return snapshot;
    });
  }

  /**
   * Get snapshot by ID
   */
  getById(snapshotId: string): Snapshot | null {
    const all = this.historyManager.getAll();
    const snapshot = all.find((s) => s.id === snapshotId);
    
    if (snapshot && this.isDeltaSnapshot(snapshot)) {
      return this.reconstructFullSnapshot(snapshot) || snapshot;
    }
    
    return snapshot || null;
  }

  /**
   * Get delta snapshots only
   */
  getDeltaSnapshots(): DeltaSnapshot[] {
    return Array.from(this.deltaSnapshots.values());
  }

  /**
   * Get history statistics
   */
  getStats(): DeltaHistoryStats {
    return {
      standard: this.historyManager.getStats(),
      delta: this.deltaChainManager.getStats(),
      memoryEfficiency: this.calculateMemoryEfficiency(),
    };
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.historyManager.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.historyManager.canRedo();
  }

  /**
   * Undo to previous snapshot
   */
  undo(): Snapshot | null {
    return this.historyManager.undo();
  }

  /**
   * Redo to next snapshot
   */
  redo(): Snapshot | null {
    return this.historyManager.redo();
  }

  /**
   * Jump to specific index
   */
  jumpTo(index: number): Snapshot | null {
    return this.historyManager.jumpTo(index);
  }

  /**
   * Get current snapshot
   */
  getCurrent(): Snapshot | null {
    return this.historyManager.getCurrent();
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.historyManager.clear();
    this.deltaSnapshots.clear();
    this.deltaChainManager.clear();
    this.fullSnapshotCounter = 0;
  }

  /**
   * Subscribe to history events
   */
  subscribe(listener: (event: HistoryEvent) => void): () => void {
    return this.historyManager.subscribe(listener);
  }

  /**
   * Get delta statistics
   */
  getDeltaStats(): any {
    return this.deltaChainManager.getStats();
  }

  /**
   * Force creation of full snapshot
   */
  forceFullSnapshot(): void {
    const current = this.historyManager.getCurrent();
    if (current) {
      this.deltaSnapshots.clear();
      this.deltaChainManager.clear();
      this.fullSnapshotCounter = 0;
      
      // Convert any deltas to full snapshots
      const all = this.historyManager.getAll();
      this.historyManager.clear();
      
      for (const snapshot of all) {
        if (this.isDeltaSnapshot(snapshot)) {
          const reconstructed = this.reconstructFullSnapshot(snapshot);
          if (reconstructed) {
            this.historyManager.add(reconstructed);
          }
        } else {
          this.historyManager.add(snapshot);
        }
      }
    }
  }

  /**
   * Check if snapshot is a delta
   */
  private isDeltaSnapshot(snapshot: Snapshot): snapshot is DeltaSnapshot {
    return (snapshot as DeltaSnapshot).type === "delta";
  }

  /**
   * Reconstruct full snapshot from delta
   */
  private reconstructFullSnapshot(delta: DeltaSnapshot): Snapshot | null {
    const baseId = delta.baseSnapshotId;

    if (!baseId) {
      return null;
    }

    // Find base snapshot in history
    const allSnapshots = this.historyManager.getAll();
    const baseSnapshot = allSnapshots.find((s) => s.id === baseId);

    if (!baseSnapshot) {
      return null;
    }

    // Apply delta to base
    const result = this.deltaCalculator.applyDelta(baseSnapshot, delta);

    return result;
  }

  /**
   * Check if we can create a delta
   */
  private canCreateDelta(): boolean {
    // Only create delta if interval not reached
    const interval = this.config.incrementalSnapshot!.fullSnapshotInterval ?? 10;
    return this.fullSnapshotCounter < interval;
  }

  /**
   * Calculate memory efficiency
   */
  private calculateMemoryEfficiency(): number {
    const stats = this.getStats();
    
    if (stats.delta.totalDeltasInChains === 0) {
      return 1; // No deltas, 100% efficiency
    }

    // Calculate how much memory we saved
    // This is a simplified estimation
    const totalDeltas = stats.delta.totalDeltasInChains;
    const avgDeltaSize = stats.delta.averageDeltaSize;
    const avgSnapshotSize = 10000; // Assume 10KB average snapshot

    const deltaMemory = totalDeltas * avgDeltaSize;
    const fullSnapshotMemory = totalDeltas * avgSnapshotSize;

    return deltaMemory / fullSnapshotMemory;
  }
}
