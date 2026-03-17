/**
 * SimpleTimeTravel - Simplified wrapper for TimeTravelController
 */

import type { Store, TimeTravelOptions, TimeTravelEventType, TimeTravelUnsubscribe } from './types';
import { TimeTravelController } from './TimeTravelController';

export class SimpleTimeTravel {
  private controller: TimeTravelController;

  constructor(store: Store, options?: TimeTravelOptions) {
    this.controller = new TimeTravelController(store, options);
  }

  capture(action?: string): void {
    this.controller.capture(action);
  }

  undo(): boolean {
    return this.controller.undo();
  }

  redo(): boolean {
    return this.controller.redo();
  }

  jumpTo(index: number): boolean {
    return this.controller.jumpTo(index);
  }

  canUndo(): boolean {
    return this.controller.canUndo();
  }

  canRedo(): boolean {
    return this.controller.canRedo();
  }

  getHistory(): unknown[] {
    return this.controller.getHistory();
  }

  clearHistory(): void {
    this.controller.clearHistory();
  }

  importState(state: Record<string, unknown>): boolean {
    return this.controller.importState(state);
  }

  getHistoryStats(): { length: number; currentIndex: number; canUndo: boolean; canRedo: boolean } {
    return this.controller.getHistoryStats();
  }

  subscribe(event: TimeTravelEventType, callback: () => void): TimeTravelUnsubscribe {
    return this.controller.subscribe(event, callback);
  }

  subscribeToSnapshots(callback: () => void): TimeTravelUnsubscribe {
    return this.controller.subscribeToSnapshots(callback);
  }

  dispose(): void {
    // Cleanup if needed
  }
}
