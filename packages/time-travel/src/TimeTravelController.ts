/**
 * TimeTravelController - Main time travel controller
 */

import type { Snapshot, SnapshotStateEntry, Store, TimeTravelAPI, TimeTravelOptions } from './types';

export class TimeTravelController implements TimeTravelAPI {
  private store: Store;
  private maxHistory: number;
  private autoCapture: boolean;
  private history: Snapshot[] = [];
  private currentIndex: number = -1;

  constructor(store: Store, options?: TimeTravelOptions) {
    this.store = store;
    this.maxHistory = options?.maxHistory ?? 50;
    this.autoCapture = options?.autoCapture ?? true;

    if (this.autoCapture) {
      this.setupAutoCapture();
    }
  }

  private setupAutoCapture(): void {
    // Setup auto-capture on state changes
    // This is a simplified implementation
  }

  capture(action?: string): void {
    const state = this.store.getState();
    const snapshotState: Record<string, SnapshotStateEntry> = {};
    
    Object.entries(state).forEach(([key, value]) => {
      snapshotState[key] = {
        value,
        type: 'primitive' as const,
        name: key,
      };
    });

    const snapshot: Snapshot = {
      id: Math.random().toString(36).substring(2, 9),
      state: snapshotState,
      metadata: {
        timestamp: Date.now(),
        action,
        atomCount: Object.keys(state).length,
      },
    };

    // Remove future history if we're not at the end
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(snapshot);
    this.currentIndex = this.history.length - 1;

    // Trim history if it exceeds maxHistory
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): boolean {
    if (this.currentIndex <= 0) {
      return false;
    }

    this.currentIndex--;
    const snapshot = this.history[this.currentIndex];
    this.restoreSnapshot(snapshot);
    return true;
  }

  redo(): boolean {
    if (this.currentIndex >= this.history.length - 1) {
      return false;
    }

    this.currentIndex++;
    const snapshot = this.history[this.currentIndex];
    this.restoreSnapshot(snapshot);
    return true;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  jumpTo(index: number): boolean {
    if (index < 0 || index >= this.history.length) {
      return false;
    }

    this.currentIndex = index;
    const snapshot = this.history[this.currentIndex];
    this.restoreSnapshot(snapshot);
    return true;
  }

  clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  getHistory(): Snapshot[] {
    return this.history;
  }

  importState(state: Record<string, unknown>): boolean {
    try {
      Object.entries(state).forEach(([key]) => {
        console.warn(`importState: atom ${key} not found for restoration`);
      });
      return true;
    } catch {
      return false;
    }
  }

  private restoreSnapshot(snapshot: Snapshot): void {
    // This is a simplified restore - in real implementation would need proper atom lookup
    Object.entries(snapshot.state).forEach(([key]) => {
      console.warn(`restoreSnapshot: atom ${key} not found for restoration`);
    });
  }

  getHistoryStats(): { length: number; currentIndex: number; canUndo: boolean; canRedo: boolean } {
    return {
      length: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }
}
