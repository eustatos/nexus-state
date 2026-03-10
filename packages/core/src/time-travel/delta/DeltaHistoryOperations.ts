/**
 * DeltaHistoryOperations - Operations for managing delta history
 *
 * Handles undo/redo, jumpTo, getSnapshot, and other history operations.
 */

import type { Snapshot, AnySnapshot, DeltaSnapshot } from "../types";
import { HistoryManager } from "../core/HistoryManager";
import type { HistoryEvent } from "../core/types";
import { DeltaCalculatorImpl } from "./calculator";
import { DeltaChainManager } from "./chain-manager";
import type { DeltaAwareHistoryManagerConfig } from "./types";

/**
 * Root state for reconstruction
 */
export interface RootState {
  id: string;
  state: any;
  metadata: any;
}

/**
 * DeltaHistoryOperations provides history management operations
 * for delta-aware history without external dependencies
 */
export class DeltaHistoryOperations {
  private historyManager: HistoryManager;
  private deltaCalculator: DeltaCalculatorImpl;
  private deltaChainManager: DeltaChainManager;
  private config: DeltaAwareHistoryManagerConfig;
  private fullSnapshotCounter: number;

  constructor(
    config: DeltaAwareHistoryManagerConfig,
    fullSnapshotCounter?: number
  ) {
    this.config = config;
    this.fullSnapshotCounter = fullSnapshotCounter ?? 0;

    this.historyManager = new HistoryManager(this.config.maxHistory || 50);
    this.deltaCalculator = new DeltaCalculatorImpl({
      deepEqual: this.config.incrementalSnapshot?.changeDetection === "deep",
      skipEmpty: true,
    });
    this.deltaChainManager = new DeltaChainManager({
      fullSnapshotInterval: this.config.incrementalSnapshot?.fullSnapshotInterval,
      maxDeltaChainLength: this.config.incrementalSnapshot?.maxDeltaChainLength,
      maxDeltaChainAge: this.config.incrementalSnapshot?.maxDeltaChainAge,
      maxDeltaChainSize: this.config.incrementalSnapshot?.maxDeltaChainSize,
    });
  }

  /**
   * Add snapshot to history
   * @param snapshot - Snapshot to add
   * @param canCreateDelta - Whether delta creation is allowed
   * @returns True if delta was created
   */
  add(snapshot: Snapshot, canCreateDelta: boolean): boolean {
    if (canCreateDelta) {
      const current = this.historyManager.getCurrent();

      if (current) {
        const baseSnapshot = this.getLastFullSnapshot(current);

        if (baseSnapshot) {
          const delta = this.deltaCalculator.computeDelta(baseSnapshot, snapshot);

          if (delta) {
            this.historyManager.add(delta as AnySnapshot);
            this.fullSnapshotCounter = 0;
            return true; // Delta created
          }
        } else {
          this.historyManager.add(snapshot);
          this.fullSnapshotCounter++;
          return false;
        }
      }
    }

    // Create full snapshot
    this.historyManager.add(snapshot);
    this.fullSnapshotCounter++;
    return false;
  }

  /**
   * Get snapshot by index
   * @param index - Snapshot index
   * @returns Snapshot or null
   */
  getSnapshot(index: number): Snapshot | null {
    const allSnapshots = this.historyManager.getAll();

    if (index < 0 || index >= allSnapshots.length) {
      return null;
    }

    const snapshot = allSnapshots[index];

    if (this.isDeltaSnapshot(snapshot)) {
      return this.reconstructFullSnapshot(snapshot);
    }

    return this.deepCopySnapshot(snapshot);
  }

  /**
   * Get all snapshots
   * @returns Array of all snapshots
   */
  getAll(): Snapshot[] {
    const all = this.historyManager.getAll();
    return all.map((snapshot) => {
      if (this.isDeltaSnapshot(snapshot)) {
        return this.reconstructFullSnapshot(snapshot) || snapshot;
      }
      return this.deepCopySnapshot(snapshot);
    });
  }

  /**
   * Get snapshot by ID
   * @param snapshotId - Snapshot ID
   * @returns Snapshot or null
   */
  getById(snapshotId: string): Snapshot | null {
    const all = this.historyManager.getAll();
    const snapshot = all.find((s) => s.id === snapshotId);

    if (snapshot && this.isDeltaSnapshot(snapshot)) {
      return this.reconstructFullSnapshot(snapshot) || snapshot;
    }

    return snapshot ? this.deepCopySnapshot(snapshot) : null;
  }

  /**
   * Check if undo is available
   * @returns True if undo is available
   */
  canUndo(): boolean {
    return this.historyManager.canUndo();
  }

  /**
   * Check if redo is available
   * @returns True if redo is available
   */
  canRedo(): boolean {
    return this.historyManager.canRedo();
  }

  /**
   * Undo to previous snapshot
   * @returns Previous snapshot or null
   */
  undo(): Snapshot | null {
    const allSnapshotsBeforeUndo = this.historyManager.getAll();
    const currentSnapshot = this.historyManager.getCurrent();

    const rootState = this.extractRootState(currentSnapshot, allSnapshotsBeforeUndo);

    const result = this.historyManager.undo();

    if (result && this.isDeltaSnapshot(result)) {
      const reconstructed = this.reconstructFromRootState(result, rootState, allSnapshotsBeforeUndo);
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

    return result ? this.deepCopySnapshot(result) : null;
  }

  /**
   * Redo to next snapshot
   * @returns Next snapshot or null
   */
  redo(): Snapshot | null {
    const allSnapshotsBeforeRedo = this.historyManager.getAll();
    const result = this.historyManager.redo();

    if (result && this.isDeltaSnapshot(result)) {
      const rootState = this.extractRootStateFromHistory(result, allSnapshotsBeforeRedo);
      const reconstructed = this.reconstructFromRootState(result, rootState, allSnapshotsBeforeRedo);
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

    return result ? this.deepCopySnapshot(result) : null;
  }

  /**
   * Jump to specific index
   * @param index - Target index
   * @returns Snapshot at index or null
   */
  jumpTo(index: number): Snapshot | null {
    const allSnapshotsBeforeJump = this.historyManager.getAll();

    if (index < 0 || index >= allSnapshotsBeforeJump.length) {
      return null;
    }

    const targetSnapshot = allSnapshotsBeforeJump[index];
    const rootState = this.extractRootState(targetSnapshot, allSnapshotsBeforeJump);

    const result = this.historyManager.jumpTo(index);

    if (result && this.isDeltaSnapshot(result)) {
      const reconstructed = this.reconstructFromRootState(result, rootState, allSnapshotsBeforeJump);
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

    return result ? this.deepCopySnapshot(result) : null;
  }

  /**
   * Get current snapshot
   * @returns Current snapshot or null
   */
  getCurrent(): Snapshot | null {
    return this.historyManager.getCurrent();
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.historyManager.clear();
    this.deltaChainManager.clear();
    this.fullSnapshotCounter = 0;
  }

  /**
   * Subscribe to history events
   * @param listener - Event listener
   * @returns Unsubscribe function
   */
  subscribe(listener: (event: HistoryEvent) => void): () => void {
    return this.historyManager.subscribe(listener);
  }

  /**
   * Get delta chain manager
   * @returns Delta chain manager
   */
  getDeltaChainManager(): DeltaChainManager {
    return this.deltaChainManager;
  }

  /**
   * Get full snapshot counter
   * @returns Counter value
   */
  getFullSnapshotCounter(): number {
    return this.fullSnapshotCounter;
  }

  /**
   * Set full snapshot counter
   * @param value - Counter value
   */
  setFullSnapshotCounter(value: number): void {
    this.fullSnapshotCounter = value;
  }

  /**
   * Get history manager
   * @returns History manager
   */
  getHistoryManager(): HistoryManager {
    return this.historyManager;
  }

  /**
   * Get last full (non-delta) snapshot from history
   * @param current - Current snapshot
   * @returns Last full snapshot or null
   */
  private getLastFullSnapshot(current: Snapshot): Snapshot | null {
    if (!this.isDeltaSnapshot(current)) {
      return current;
    }

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
   * Reconstruct full snapshot from delta
   * @param delta - Delta snapshot
   * @returns Reconstructed snapshot or null
   */
  private reconstructFullSnapshot(delta: DeltaSnapshot): Snapshot | null {
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

    const internalHistory = this.historyManager.getAll();
    const rootSnapshot = internalHistory.find((s) => s.id === rootId);

    if (!rootSnapshot) {
      return null;
    }

    let result: Snapshot = {
      id: rootSnapshot.id,
      state: JSON.parse(JSON.stringify(rootSnapshot.state)),
      metadata: { ...rootSnapshot.metadata },
    };

    for (const d of deltaChain) {
      const applied = this.deltaCalculator.applyDelta(result, d);
      if (!applied) {
        return null;
      }
      result = applied;
    }

    result.id = delta.id;
    result.metadata = {
      ...result.metadata,
      timestamp: delta.metadata.timestamp,
      action: delta.metadata.action,
    };

    return result;
  }

  /**
   * Reconstruct from root state
   * @param delta - Delta snapshot
   * @param rootState - Root state
   * @param history - History array
   * @returns Reconstructed snapshot or null
   */
  private reconstructFromRootState(
    delta: DeltaSnapshot,
    rootState: RootState | null,
    history: Snapshot[]
  ): Snapshot | null {
    if (!rootState) {
      return null;
    }

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

      const baseSnapshot: Snapshot | undefined = history.find((s) => s.id === baseId);

      if (baseSnapshot && this.isDeltaSnapshot(baseSnapshot)) {
        currentDelta = baseSnapshot;
      } else {
        currentDelta = null;
      }
    }

    let result: Snapshot = {
      id: rootState.id,
      state: JSON.parse(JSON.stringify(rootState.state)),
      metadata: { ...rootState.metadata },
    };

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
   * Extract root state from snapshot
   * @param snapshot - Snapshot
   * @param history - History array
   * @returns Root state or null
   */
  private extractRootState(
    snapshot: Snapshot | null,
    history: Snapshot[]
  ): RootState | null {
    if (!snapshot) {
      return null;
    }

    if (!this.isDeltaSnapshot(snapshot)) {
      return {
        id: snapshot.id,
        state: JSON.parse(JSON.stringify(snapshot.state)),
        metadata: { ...snapshot.metadata },
      };
    }

    return this.extractRootStateFromHistory(snapshot, history);
  }

  /**
   * Extract root state from history
   * @param deltaSnapshot - Delta snapshot
   * @param history - History array
   * @returns Root state or null
   */
  private extractRootStateFromHistory(
    deltaSnapshot: Snapshot,
    history: Snapshot[]
  ): RootState | null {
    const rootSnapshot = this.findRootSnapshotInHistory(deltaSnapshot, history);

    if (!rootSnapshot) {
      return null;
    }

    return {
      id: rootSnapshot.id,
      state: JSON.parse(JSON.stringify(rootSnapshot.state)),
      metadata: { ...rootSnapshot.metadata },
    };
  }

  /**
   * Find root snapshot in history
   * @param deltaSnapshot - Delta snapshot
   * @param history - History array
   * @returns Root snapshot or null
   */
  private findRootSnapshotInHistory(
    deltaSnapshot: Snapshot,
    history: Snapshot[]
  ): Snapshot | null {
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
   * Check if snapshot is a delta
   * @param snapshot - Snapshot to check
   * @returns True if delta
   */
  private isDeltaSnapshot(snapshot: Snapshot): snapshot is DeltaSnapshot {
    return (snapshot as DeltaSnapshot).type === "delta";
  }

  /**
   * Deep copy snapshot to avoid mutation
   * @param snapshot - Snapshot to copy
   * @returns Deep copied snapshot
   */
  private deepCopySnapshot(snapshot: Snapshot): Snapshot {
    const snapshotCopy: Snapshot = {
      id: snapshot.id,
      state: {},
      metadata: { ...snapshot.metadata },
    };

    for (const [key, entry] of Object.entries(snapshot.state)) {
      try {
        snapshotCopy.state[key] = {
          value: entry.value !== undefined ? JSON.parse(JSON.stringify(entry.value)) : undefined,
          type: entry.type,
          name: entry.name,
          atomId: entry.atomId,
        };
      } catch {
        // Fallback for non-serializable values
        snapshotCopy.state[key] = {
          value: entry.value,
          type: entry.type,
          name: entry.name,
          atomId: entry.atomId,
        };
      }
    }

    return snapshotCopy;
  }
}
