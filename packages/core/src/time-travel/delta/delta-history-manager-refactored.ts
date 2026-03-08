/**
 * Delta-Aware History Manager - Enhanced history manager with delta support
 *
 * This is a refactored version that uses composed components:
 * - DeltaHistoryOperations: History operations (undo/redo/jumpTo)
 * - DeltaCalculatorOperations: Delta computation and application
 * - DeltaChainManagement: Delta chain management and statistics
 */

import type { Snapshot, AnySnapshot, DeltaSnapshot } from "../types";
import type { HistoryEvent } from "../core/types";
import type { DeltaAwareHistoryManagerConfig, DeltaHistoryStats } from "./types";
import { DEFAULT_INCREMENTAL_SNAPSHOT_CONFIG } from "./types";
import { DeltaHistoryOperations } from "./DeltaHistoryOperations";
import { DeltaCalculatorOperations } from "./DeltaCalculatorOperations";
import { DeltaChainManagement } from "./DeltaChainManagement";

/**
 * Default delta history manager configuration
 */
export const DEFAULT_DELTA_HISTORY_CONFIG: DeltaAwareHistoryManagerConfig = {
  incrementalSnapshot: DEFAULT_INCREMENTAL_SNAPSHOT_CONFIG,
};

/**
 * Delta-aware History Manager - Refactored version
 * Coordinates delta history operations using composed components
 */
export class DeltaAwareHistoryManager {
  private historyOperations: DeltaHistoryOperations;
  private calculatorOperations: DeltaCalculatorOperations;
  private chainManagement: DeltaChainManagement;
  private config: DeltaAwareHistoryManagerConfig;

  constructor(config: DeltaAwareHistoryManagerConfig = {}) {
    this.config = {
      incrementalSnapshot: {
        ...DEFAULT_INCREMENTAL_SNAPSHOT_CONFIG,
        ...config.incrementalSnapshot,
      },
      maxHistory: config.maxHistory || 50,
      compressionEnabled: config.compressionEnabled ?? true,
    };

    // Initialize composed components
    this.historyOperations = new DeltaHistoryOperations(
      this.config,
      0 // initial fullSnapshotCounter
    );

    this.calculatorOperations = new DeltaCalculatorOperations({
      deepEqual: this.config.incrementalSnapshot?.changeDetection === "deep",
      skipEmpty: true,
    });

    this.chainManagement = new DeltaChainManagement(
      this.historyOperations.getDeltaChainManager()
    );
  }

  /**
   * Add snapshot to history
   */
  add(snapshot: Snapshot): void {
    const incrementalConfig = this.config.incrementalSnapshot!;

    // Check if we should create delta
    if (incrementalConfig.enabled && this.canCreateDelta()) {
      const current = this.historyOperations.getCurrent();

      if (current) {
        // Get the last full snapshot as base
        const baseSnapshot = this.getLastFullSnapshot(current);

        if (baseSnapshot) {
          // Compute delta using calculator operations
          const deltaResult = this.calculatorOperations.computeDelta(
            baseSnapshot,
            snapshot
          );

          if (deltaResult.delta && !deltaResult.isEmpty) {
            const delta = deltaResult.delta;

            // Store delta using chain management
            this.chainManagement.addDelta(delta);
            this.historyOperations.add(delta as AnySnapshot, false);
            this.historyOperations.setFullSnapshotCounter(0);
            return;
          }
        } else {
          // No full snapshot found, create a full snapshot instead
          this.historyOperations.add(snapshot, false);
          this.historyOperations.setFullSnapshotCounter(
            this.historyOperations.getFullSnapshotCounter() + 1
          );
          return;
        }
      }
    }

    // Create full snapshot
    this.historyOperations.add(snapshot, false);
    this.historyOperations.setFullSnapshotCounter(
      this.historyOperations.getFullSnapshotCounter() + 1
    );
  }

  /**
   * Get snapshot by index
   */
  getSnapshot(index: number): Snapshot | null {
    return this.historyOperations.getSnapshot(index);
  }

  /**
   * Get all snapshots
   */
  getAll(): Snapshot[] {
    return this.historyOperations.getAll();
  }

  /**
   * Get snapshot by ID
   */
  getById(snapshotId: string): Snapshot | null {
    return this.historyOperations.getById(snapshotId);
  }

  /**
   * Get delta snapshots only
   */
  getDeltaSnapshots(): DeltaSnapshot[] {
    return this.chainManagement.getAllDeltas();
  }

  /**
   * Get history statistics
   */
  getStats(): DeltaHistoryStats {
    const historyManager = this.historyOperations.getHistoryManager();
    const chainStats = this.chainManagement.getChainStats();

    return {
      standard: historyManager.getStats(),
      delta: {
        totalDeltasInChains: chainStats.totalDeltasInChains,
        averageDeltaSize: chainStats.averageDeltaSize,
        deltaCount: 0,
        fullSnapshotCount: 0,
        activeChains: 0,
        memoryUsage: 0,
      } as any,
      memoryEfficiency: this.chainManagement.calculateMemoryEfficiency(),
    };
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.historyOperations.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.historyOperations.canRedo();
  }

  /**
   * Undo to previous snapshot
   */
  undo(): Snapshot | null {
    return this.historyOperations.undo();
  }

  /**
   * Redo to next snapshot
   */
  redo(): Snapshot | null {
    return this.historyOperations.redo();
  }

  /**
   * Jump to specific index
   */
  jumpTo(index: number): Snapshot | null {
    return this.historyOperations.jumpTo(index);
  }

  /**
   * Get current snapshot
   */
  getCurrent(): Snapshot | null {
    return this.historyOperations.getCurrent();
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.historyOperations.clear();
    this.chainManagement.clear();
  }

  /**
   * Subscribe to history events
   */
  subscribe(listener: (event: HistoryEvent) => void): () => void {
    return this.historyOperations.subscribe(listener);
  }

  /**
   * Force creation of full snapshot
   */
  forceFullSnapshot(): void {
    const current = this.historyOperations.getCurrent();
    if (current) {
      this.chainManagement.clear();
      this.historyOperations.setFullSnapshotCounter(0);

      // Convert any deltas to full snapshots
      const all = this.historyOperations.getAll();
      this.historyOperations.clear();

      for (const snapshot of all) {
        this.historyOperations.add(snapshot, false);
      }
    }
  }

  /**
   * Get delta statistics
   */
  getDeltaStats(): any {
    return this.chainManagement.getChainStats();
  }

  /**
   * Check if we can create a delta
   */
  private canCreateDelta(): boolean {
    const interval = this.config.incrementalSnapshot?.fullSnapshotInterval ?? 10;
    return this.historyOperations.getFullSnapshotCounter() < interval;
  }

  /**
   * Get the last full (non-delta) snapshot from history
   */
  private getLastFullSnapshot(current: Snapshot): Snapshot | null {
    if ((current as any).type !== "delta") {
      return current;
    }

    const allSnapshots = this.historyOperations.getAll();
    for (let i = allSnapshots.length - 1; i >= 0; i--) {
      const s = allSnapshots[i];
      if ((s as any).type !== "delta") {
        return s;
      }
    }

    return null;
  }

  /**
   * Get the history operations component
   */
  getHistoryOperations(): DeltaHistoryOperations {
    return this.historyOperations;
  }

  /**
   * Get the calculator operations component
   */
  getCalculatorOperations(): DeltaCalculatorOperations {
    return this.calculatorOperations;
  }

  /**
   * Get the chain management component
   */
  getChainManagement(): DeltaChainManagement {
    return this.chainManagement;
  }

  /**
   * Get configuration
   */
  getConfig(): DeltaAwareHistoryManagerConfig {
    return { ...this.config };
  }
}
