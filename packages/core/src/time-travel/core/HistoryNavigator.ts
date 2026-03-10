import { SnapshotRestorer } from "../snapshot";
import type { Snapshot } from "../types";
import { storeLogger as logger } from "../../debug";
import { batcher } from "../../batching";

// Interface that both HistoryManager and DeltaAwareHistoryManager implement
interface HistoryProvider {
  canUndo(): boolean;
  canRedo(): boolean;
  undo(): Snapshot | null;
  redo(): Snapshot | null;
  jumpTo(index: number): Snapshot | null;
  getAll(): Snapshot[];
  getLength(): number;
  getById(id: string): Snapshot | null;
}

export class HistoryNavigator {
  private currentIndex: number = -1;

  constructor(
    private historyManager: HistoryProvider,
    private snapshotRestorer: SnapshotRestorer,
  ) {
    // Initialize current index to last snapshot
    const all = this.historyManager.getAll();
    this.currentIndex = all.length > 0 ? all.length - 1 : -1;
  }

  /**
   * Get current snapshot
   */
  getCurrent(): Snapshot | undefined {
    if (this.currentIndex < 0 || this.currentIndex >= this.historyManager.getLength()) {
      return undefined;
    }
    const all = this.historyManager.getAll();
    return all[this.currentIndex];
  }

  /**
   * Get current index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Set current index
   */
  setCurrentIndex(index: number): void {
    this.currentIndex = index;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.historyManager.getLength() - 1;
  }

  /**
   * Jump to specific index
   */
  jumpToIndex(index: number): boolean {
    if (index < 0 || index >= this.historyManager.getLength()) {
      return false;
    }
    this.currentIndex = index;
    return this.jumpTo(index);
  }

  undo(): boolean {
    logger.log(`[NAVIGATOR.undo] canUndo: ${this.historyManager.canUndo()}`);
    if (!this.historyManager.canUndo()) return false;

    const snapshot = this.historyManager.undo();
    logger.log(`[NAVIGATOR.undo] snapshot: ${snapshot ? 'found' : 'null'}`);
    if (snapshot) {
      logger.log(`[NAVIGATOR.undo] Calling restore`);
      const result = this.snapshotRestorer.restore(snapshot);
      logger.log(`[NAVIGATOR.undo] restore result: ${result}`);
      // FIX for Problem 3: Flush to ensure notifications are delivered
      batcher.flush();
      this.currentIndex = Math.max(0, this.currentIndex - 1);
      return result;
    }
    return false;
  }

  redo(): boolean {
    if (!this.historyManager.canRedo()) return false;

    const snapshot = this.historyManager.redo();
    if (snapshot) {
      const result = this.snapshotRestorer.restore(snapshot);
      // FIX for Problem 3: Flush to ensure notifications are delivered
      batcher.flush();
      this.currentIndex = Math.min(this.historyManager.getLength() - 1, this.currentIndex + 1);
      return result;
    }
    return false;
  }

  jumpTo(index: number): boolean {
    logger.log(`[NAVIGATOR.jumpTo] called with index=${index}`);
    const snapshot = this.historyManager.jumpTo(index);
    logger.log(`[NAVIGATOR.jumpTo] snapshot from historyManager: ${snapshot ? 'found' : 'null'}`);
    if (snapshot) {
      // Always restore the snapshot, even if we're already at this position
      // This ensures the state is properly restored in the store
      logger.log(`[NAVIGATOR.jumpTo] snapshot state: ${JSON.stringify(snapshot.state)}`);
      logger.log(`[NAVIGATOR.jumpTo] snapshot content value: ${snapshot.state['content']?.value || snapshot.state['editor.content']?.value}`);
      const result = this.snapshotRestorer.restore(snapshot);
      logger.log(`[NAVIGATOR.jumpTo] index=${index}, restore result=${result}`);
      // FIX for Problem 3: Flush to ensure notifications are delivered
      batcher.flush();
      this.currentIndex = index;
      return result;
    }
    return false;
  }
}
