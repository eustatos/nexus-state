import { SnapshotRestorer } from "../snapshot";
import type { Snapshot } from "../types";

// Interface that both HistoryManager and DeltaAwareHistoryManager implement
interface HistoryProvider {
  canUndo(): boolean;
  canRedo(): boolean;
  undo(): Snapshot | null;
  redo(): Snapshot | null;
  jumpTo(index: number): Snapshot | null;
}

export class HistoryNavigator {
  constructor(
    private historyManager: HistoryProvider,
    private snapshotRestorer: SnapshotRestorer,
  ) {}

  undo(): boolean {
    console.log(`[NAVIGATOR.undo] canUndo: ${this.historyManager.canUndo()}`);
    if (!this.historyManager.canUndo()) return false;

    const snapshot = this.historyManager.undo();
    console.log(`[NAVIGATOR.undo] snapshot: ${snapshot ? 'found' : 'null'}`);
    if (snapshot) {
      console.log(`[NAVIGATOR.undo] Calling restore`);
      const result = this.snapshotRestorer.restore(snapshot);
      console.log(`[NAVIGATOR.undo] restore result: ${result}`);
      return result;
    }
    return false;
  }

  redo(): boolean {
    if (!this.historyManager.canRedo()) return false;

    const snapshot = this.historyManager.redo();
    if (snapshot) {
      this.snapshotRestorer.restore(snapshot);
      return true;
    }
    return false;
  }

  jumpTo(index: number): boolean {
    const snapshot = this.historyManager.jumpTo(index);
    if (snapshot) {
      this.snapshotRestorer.restore(snapshot);
      return true;
    }
    return false;
  }
}
