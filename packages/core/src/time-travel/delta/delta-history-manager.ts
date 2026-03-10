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
        // IMPORTANT: Always compute delta from the last FULL snapshot, not from a delta
        // This ensures delta chains are flat (all deltas reference the same full snapshot)
        const baseSnapshot = this.getLastFullSnapshot(current);
        
        if (baseSnapshot) {
          const delta = this.deltaCalculator.computeDelta(baseSnapshot, snapshot);

          if (delta) {
            // Store delta
            this.deltaSnapshots.set(delta.id, delta);
            this.deltaChainManager.addDelta(delta);
            this.historyManager.add(delta as AnySnapshot);
            this.fullSnapshotCounter = 0;
            return;
          }
        } else {
          // No full snapshot found, create a full snapshot instead
          this.historyManager.add(snapshot);
          this.fullSnapshotCounter++;
          return;
        }
      }
    }

    // Create full snapshot
    this.historyManager.add(snapshot);
    this.fullSnapshotCounter++;
  }

  /**
   * Get the last full (non-delta) snapshot from history
   * Walks backwards from current to find the first non-delta snapshot
   */
  private getLastFullSnapshot(current: Snapshot): Snapshot | null {
    // If current is not a delta, return it
    if (!this.isDeltaSnapshot(current)) {
      return current;
    }

    // Walk backwards through history to find the last full snapshot
    const allSnapshots = this.historyManager.getAll();
    for (let i = allSnapshots.length - 1; i >= 0; i--) {
      const s = allSnapshots[i];
      if (!this.isDeltaSnapshot(s)) {
        return s;
      }
    }

    return null;
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
    // Pre-fetch root state and history before history changes
    const allSnapshotsBeforeUndo = this.historyManager.getAll();
    const currentSnapshot = this.historyManager.getCurrent();

    let rootState: { id: string, state: any, metadata: any } | null = null;
    if (currentSnapshot && !this.isDeltaSnapshot(currentSnapshot)) {
      rootState = {
        id: currentSnapshot.id,
        state: JSON.parse(JSON.stringify(currentSnapshot.state)),
        metadata: { ...currentSnapshot.metadata },
      };
    } else if (currentSnapshot) {
      const rootSnapshot = this.findRootSnapshotInHistory(currentSnapshot, allSnapshotsBeforeUndo);
      if (rootSnapshot) {
        rootState = {
          id: rootSnapshot.id,
          state: JSON.parse(JSON.stringify(rootSnapshot.state)),
          metadata: { ...rootSnapshot.metadata },
        };
      }
    }

    const result = this.historyManager.undo();

    if (result && this.isDeltaSnapshot(result)) {
      const reconstructed = this.reconstructFullSnapshotFromRootStateWithHistory(result, rootState, allSnapshotsBeforeUndo);
      if (reconstructed) {
        reconstructed.id = result.id;
        reconstructed.metadata = {
          ...reconstructed.metadata,
          timestamp: result.metadata.timestamp,
          action: result.metadata.action,
        };
        return reconstructed;
      }
    }

    return result;
  }

  /**
   * Redo to next snapshot
   */
  redo(): Snapshot | null {
    // Pre-fetch all snapshots before history changes
    const allSnapshotsBeforeRedo = this.historyManager.getAll();

    const result = this.historyManager.redo();

    if (result && this.isDeltaSnapshot(result)) {
      const rootSnapshot = this.findRootSnapshotInHistory(result, allSnapshotsBeforeRedo);
      const rootState = rootSnapshot ? {
        id: rootSnapshot.id,
        state: JSON.parse(JSON.stringify(rootSnapshot.state)),
        metadata: { ...rootSnapshot.metadata },
      } : null;

      const reconstructed = this.reconstructFullSnapshotFromRootStateWithHistory(result, rootState, allSnapshotsBeforeRedo);
      if (reconstructed) {
        reconstructed.id = result.id;
        reconstructed.metadata = {
          ...reconstructed.metadata,
          timestamp: result.metadata.timestamp,
          action: result.metadata.action,
        };
        return reconstructed;
      }
    }

    return result;
  }

  /**
   * Jump to specific index
   */
  jumpTo(index: number): Snapshot | null {
    // CRITICAL: Get ALL snapshots BEFORE changing internal state
    const allSnapshotsBeforeJump = this.historyManager.getAll();

    if (index < 0 || index >= allSnapshotsBeforeJump.length) {
      return null;
    }

    const targetSnapshot = allSnapshotsBeforeJump[index];

    // CRITICAL: Pre-fetch and DEEP COPY the root snapshot BEFORE jumpTo changes history
    let rootState: { id: string, state: any, metadata: any } | null = null;
    if (targetSnapshot && !this.isDeltaSnapshot(targetSnapshot)) {
      rootState = {
        id: targetSnapshot.id,
        state: JSON.parse(JSON.stringify(targetSnapshot.state)),
        metadata: { ...targetSnapshot.metadata },
      };
    } else if (targetSnapshot) {
      const rootSnapshot = this.findRootSnapshotInHistory(targetSnapshot, allSnapshotsBeforeJump);
      if (rootSnapshot) {
        rootState = {
          id: rootSnapshot.id,
          state: JSON.parse(JSON.stringify(rootSnapshot.state)),
          metadata: { ...rootSnapshot.metadata },
        };
      }
    }

    // Now update the history manager's internal state
    const result = this.historyManager.jumpTo(index);

    // If it's a delta, reconstruct using the pre-fetched root state and history
    if (result && this.isDeltaSnapshot(result)) {
      const reconstructed = this.reconstructFullSnapshotFromRootStateWithHistory(result, rootState, allSnapshotsBeforeJump);
      if (reconstructed) {
        reconstructed.id = result.id;
        reconstructed.metadata = {
          ...reconstructed.metadata,
          timestamp: result.metadata.timestamp,
          action: result.metadata.action,
        };
        return reconstructed;
      }
    }

    // For full snapshots, return a deep copy to avoid mutation
    if (result && !this.isDeltaSnapshot(result)) {
      // Create a proper deep copy of the snapshot
      const snapshotCopy: Snapshot = {
        id: result.id,
        state: {},
        metadata: { ...result.metadata },
      };
      
      // Deep copy each state entry
      for (const [key, entry] of Object.entries(result.state)) {
        snapshotCopy.state[key] = {
          value: JSON.parse(JSON.stringify(entry.value)),
          type: entry.type,
          name: entry.name,
          atomId: entry.atomId,
        };
      }
      
      return snapshotCopy;
    }

    return result;
  }

  /**
   * Reconstruct full snapshot using pre-fetched root STATE and HISTORY
   */
  private reconstructFullSnapshotFromRootStateWithHistory(delta: DeltaSnapshot, rootState: { id: string, state: any, metadata: any } | null, history: Snapshot[]): Snapshot | null {
    if (!rootState) {
      return null;
    }

    // Build delta chain using the pre-fetched history
    const deltaChain: DeltaSnapshot[] = [];
    const visited = new Set<string>();
    let currentDelta: DeltaSnapshot | null = delta;

    while (currentDelta) {
      if (visited.has(currentDelta.id)) {
        return null;
      }
      visited.add(currentDelta.id);
      deltaChain.unshift(currentDelta);

      const baseId: string | null | undefined = currentDelta.baseSnapshotId;
      if (!baseId) {
        return null;
      }

      if (baseId === rootState.id) {
        break;
      }

      // Find the base snapshot in the pre-fetched history
      const baseSnapshot: Snapshot | undefined = history.find((s) => s.id === baseId);

      if (baseSnapshot && this.isDeltaSnapshot(baseSnapshot)) {
        currentDelta = baseSnapshot;
      } else {
        currentDelta = null;
      }
    }

    // Create result from root STATE
    let result: Snapshot = {
      id: rootState.id,
      state: JSON.parse(JSON.stringify(rootState.state)),
      metadata: { ...rootState.metadata },
    };

    // Apply deltas
    for (const d of deltaChain) {
      const applied = this.deltaCalculator.applyDelta(result, d);
      if (!applied) {
        return null;
      }
      result = applied;
    }

    return result;
  }

  /**
   * Reconstruct full snapshot using pre-fetched root STATE (not reference)
   */
  private reconstructFullSnapshotFromRootState(delta: DeltaSnapshot, rootState: { id: string, state: any, metadata: any } | null): Snapshot | null {
    if (!rootState) {
      return null;
    }

    // Build delta chain
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

      if (baseId === rootState.id) {
        break;
      }

      currentDelta = null;
    }

    // Create result from root STATE (not reference)
    let result: Snapshot = {
      id: rootState.id,
      state: JSON.parse(JSON.stringify(rootState.state)),
      metadata: { ...rootState.metadata },
    };

    // Apply deltas
    for (const d of deltaChain) {
      const applied = this.deltaCalculator.applyDelta(result, d);
      if (!applied) {
        return null;
      }
      result = applied;
    }

    return result;
  }

  /**
   * Find root snapshot in a specific history array (not current history)
   */
  private findRootSnapshotInHistory(deltaSnapshot: Snapshot, history: Snapshot[]): Snapshot | null {
    const visited = new Set<string>();
    let current: Snapshot | null = deltaSnapshot;

    while (current && this.isDeltaSnapshot(current)) {
      if (visited.has(current.id)) {
        return null;
      }
      visited.add(current.id);

      const baseId: string | null | undefined = (current as any).baseSnapshotId;
      if (!baseId) {
        return null;
      }

      // Search in the provided history array, not current history
      const baseSnapshot: Snapshot | undefined = history.find((s) => s.id === baseId);

      if (!baseSnapshot) {
        return null;
      }

      if (!this.isDeltaSnapshot(baseSnapshot)) {
        return baseSnapshot;
      }

      current = baseSnapshot;
    }

    return current;
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
   * Reconstruct full snapshot from delta (used by getAll, getSnapshot, etc.)
   */
  private reconstructFullSnapshot(delta: DeltaSnapshot): Snapshot | null {
    // Build the chain of deltas from base to target
    const deltaChain: DeltaSnapshot[] = [];
    const visited = new Set<string>();
    let currentDelta: DeltaSnapshot | null = delta;

    // Walk backwards to build the chain
    while (currentDelta) {
      if (visited.has(currentDelta.id)) {
        return null;
      }
      visited.add(currentDelta.id);
      deltaChain.unshift(currentDelta);

      const baseId: string | null | undefined = currentDelta.baseSnapshotId;
      if (!baseId) {
        return null;
      }

      const internalHistory = this.historyManager.getAll();
      const baseSnapshot: Snapshot | undefined = internalHistory.find((s) => s.id === baseId);

      if (baseSnapshot && this.isDeltaSnapshot(baseSnapshot)) {
        currentDelta = baseSnapshot;
      } else {
        currentDelta = null;
      }
    }

    const rootId = deltaChain[0]?.baseSnapshotId;
    if (!rootId) {
      return null;
    }

    // Find root in internal history
    const internalHistory = this.historyManager.getAll();
    const rootSnapshot = internalHistory.find((s) => s.id === rootId);

    if (!rootSnapshot) {
      return null;
    }

    // Deep copy to avoid mutating
    let result = {
      id: rootSnapshot.id,
      state: JSON.parse(JSON.stringify(rootSnapshot.state)),
      metadata: { ...rootSnapshot.metadata },
    };

    // Apply each delta in order
    for (const d of deltaChain) {
      const applied = this.deltaCalculator.applyDelta(result, d);
      if (!applied) {
        return null;
      }
      result = applied;
    }

    // Set the delta's ID and metadata
    result.id = delta.id;
    result.metadata = {
      ...result.metadata,
      timestamp: delta.metadata.timestamp,
      action: delta.metadata.action,
    };

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
    // Don't call getStats() here to avoid infinite recursion!
    // Get delta stats directly from deltaChainManager
    const deltaStats = this.deltaChainManager.getStats()

    if (deltaStats.totalDeltasInChains === 0) {
      return 1 // No deltas, 100% efficiency
    }

    // Calculate how much memory we saved
    // This is a simplified estimation
    const totalDeltas = deltaStats.totalDeltasInChains
    const avgDeltaSize = deltaStats.averageDeltaSize
    const avgSnapshotSize = 10000 // Assume 10KB average snapshot

    const deltaMemory = totalDeltas * avgDeltaSize
    const fullSnapshotMemory = totalDeltas * avgSnapshotSize

    return deltaMemory / fullSnapshotMemory
  }
}
