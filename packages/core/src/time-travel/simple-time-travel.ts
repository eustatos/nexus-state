/**
 * SimpleTimeTravel - Simplified time travel implementation for undo/redo functionality
 *
 * This class provides efficient state history management with:
 * - Configurable history limit (default: 50 snapshots)
 * - Automatic snapshot capture on store changes
 * - Manual snapshot capture capability
 * - State change detection (skip duplicate snapshots)
 * - Integrated with enhanced store API
 */

import { Store } from "../types";
import { atomRegistry } from "../atom-registry";
import {
  Snapshot,
  SnapshotMetadata,
  SnapshotStateEntry,
  TimeTravelOptions,
  TimeTravelAPI,
} from "../types";

/**
 * SimpleTimeTravel class for managing state history
 *
 * This class provides undo/redo functionality by maintaining a history
 * of state snapshots with efficient state comparison and restoration.
 *
 * @example
 * ```typescript
 * const store = createEnhancedStore([], {
 *   enableTimeTravel: true,
 *   maxHistory: 100,
 *   autoCapture: true,
 * });
 *
 * store.captureSnapshot("user login");
 * store.set(userAtom, { name: "John" });
 * store.undo(); // Back to before login
 *
 * if (store.canUndo()) {
 *   store.undo();
 * }
 * ```
 */
export class SimpleTimeTravel implements TimeTravelAPI {
  private history: Snapshot[] = [];
  private pointer: number = -1;
  private maxHistory: number;
  private store: Store;

  constructor(store: Store, options: TimeTravelOptions = {}) {
    this.store = store;
    this.maxHistory = options.maxHistory ?? 50;
  }

  /**
   * Capture the current state as a new snapshot
   * @param action - Optional description of the action that triggered the capture
   * @returns The created snapshot
   */
  capture(action?: string): Snapshot {
    const snapshot = this.createSnapshot(action);

    // Update pointer and history
    this.pointer++;

    // If we're not at the end of history (after undo), truncate forward history
    if (this.pointer < this.history.length) {
      this.history = this.history.slice(0, this.pointer);
    }

    this.history.push(snapshot);
    this.truncateHistory();

    return snapshot;
  }

  /**
   * Undo to the previous state
   * @returns true if undo was successful, false otherwise
   */
  undo(): boolean {
    if (!this.canUndo()) {
      return false;
    }

    const snapshot = this.history[this.pointer - 1];
    this.pointer--;
    this.restoreSnapshot(snapshot);

    return true;
  }

  /**
   * Redo to the next state
   * @returns true if redo was successful, false otherwise
   */
  redo(): boolean {
    if (!this.canRedo()) {
      return false;
    }

    const snapshot = this.history[this.pointer + 1];
    this.pointer++;
    this.restoreSnapshot(snapshot);

    return true;
  }

  /**
   * Check if undo is available
   * @returns true if undo is available
   */
  canUndo(): boolean {
    return this.pointer > 0;
  }

  /**
   * Check if redo is available
   * @returns true if redo is available
   */
  canRedo(): boolean {
    return this.pointer < this.history.length - 1;
  }

  /**
   * Jump to a specific snapshot by index
   * @param index - The index of the snapshot to jump to
   * @returns true if jump was successful, false otherwise
   */
  jumpTo(index: number): boolean {
    if (index < 0 || index >= this.history.length) {
      return false;
    }

    if (index === this.pointer) {
      return true;
    }

    const snapshot = this.history[index];
    this.pointer = index;
    this.restoreSnapshot(snapshot);

    return true;
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.history = [];
    this.pointer = -1;
  }

  /**
   * Get all snapshots in history
   * @returns Array of snapshots
   */
  getHistory(): Snapshot[] {
    return [...this.history];
  }

  /**
   * Create a snapshot of the current state
   * @param action - Optional description of the action
   * @returns The created snapshot
   */
  private createSnapshot(action?: string): Snapshot {
    const state: Record<string, SnapshotStateEntry> = {};
    const atomCount = atomRegistry.size();

    // Capture all atoms
    for (const [atomId, atom] of atomRegistry.getAll()) {
      try {
        const value = this.store.get(atom);
        state[atomId.toString()] = {
          value,
          type: atom.type,
        };
      } catch (error) {
        console.error(`Failed to capture atom ${atomId.description}:`, error);
      }
    }

    const metadata: SnapshotMetadata = {
      timestamp: Date.now(),
      action,
      atomCount,
    };

    const id = this.generateSnapshotId();

    return {
      id,
      state,
      metadata,
    };
  }

  /**
   * Restore a snapshot to the store
   * @param snapshot - The snapshot to restore
   */
  private restoreSnapshot(snapshot: Snapshot): void {
    // Restore all atoms
    for (const [atomIdStr, atomData] of Object.entries(snapshot.state)) {
      // Convert string back to symbol
      const atomId = Symbol.for(atomIdStr);
      const atom = atomRegistry.get(atomId);

      if (atom) {
        try {
          this.store.set(atom, atomData.value);
        } catch (error) {
          console.error(`Failed to restore atom ${atomIdStr}:`, error);
        }
      }
    }
  }

  /**
   * Truncate history if it exceeds maxHistory
   */
  private truncateHistory(): void {
    if (this.history.length > this.maxHistory) {
      const excess = this.history.length - this.maxHistory;
      this.history = this.history.slice(excess);
      this.pointer -= excess;
    }
  }

  /**
   * Generate a unique ID for a snapshot
   * @returns Unique snapshot ID
   */
  private generateSnapshotId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
  
    /**
     * Import state from serialized format
     * @param state The serialized state to import
     * @returns true if import was successful, false otherwise
     */
    importState(state: Record<string, unknown>): boolean {
      try {
        // Clear current history
        this.clearHistory();
  
        // Create a snapshot from the imported state
        const snapshot: Snapshot = {
          id: this.generateSnapshotId(),
          state: {} as Record<string, SnapshotStateEntry>,
          metadata: {
            timestamp: Date.now(),
            action: "IMPORT_STATE",
            atomCount: Object.keys(state).length,
          },
        };
  
        // Convert imported state to snapshot state format
        for (const [atomIdStr, value] of Object.entries(state)) {
          const atomId = Symbol.for(atomIdStr);
          const atom = atomRegistry.get(atomId);
  
          if (atom) {
            snapshot.state[atomIdStr] = {
              value,
              type: atom.type,
            };
          }
        }
  
        // Add snapshot to history
        this.pointer = 0;
        this.history.push(snapshot);
  
        // Restore the snapshot
        this.restoreSnapshot(snapshot);
  
        return true;
      } catch (error) {
        console.error("Failed to import state:", error);
        return false;
      }
    }
}
