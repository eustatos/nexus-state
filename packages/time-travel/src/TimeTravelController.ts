/**
 * TimeTravelController - Main time travel controller
 */

import type { Snapshot, SnapshotStateEntry, Store, TimeTravelAPI, TimeTravelEventType, TimeTravelOptions, TimeTravelUnsubscribe } from './types';
import { atomRegistry } from '@nexus-state/core';

export class TimeTravelController implements TimeTravelAPI {
  private store: Store;
  private maxHistory: number;
  private autoCapture: boolean;
  private autoInitializeAtoms: boolean;
  private history: Snapshot[] = [];
  private currentIndex: number = -1;
  private subscribers: Map<TimeTravelEventType, Set<() => void>> = new Map();
  private snapshotSubscribers: Set<() => void> = new Set();
  private isTimeTraveling: boolean = false;

  constructor(store: Store, options?: TimeTravelOptions) {
    this.store = store;
    this.maxHistory = options?.maxHistory ?? 50;
    this.autoCapture = options?.autoCapture ?? true;
    this.autoInitializeAtoms = options?.autoInitializeAtoms ?? true;

    if (this.autoCapture) {
      this.setupAutoCapture();
    }
  }

  private setupAutoCapture(): void {
    // Setup auto-capture on state changes
    // This is a simplified implementation
  }

  capture(action?: string): void {
    // Auto-initialize all atoms from registry if enabled
    if (this.autoInitializeAtoms) {
      const allAtoms = atomRegistry.getAll();
      for (const atom of allAtoms.values()) {
        try {
          this.store.get(atom as any);
        } catch (error) {
          // Ignore errors for computed atoms with missing dependencies
          console.warn(
            `[TimeTravelController] Failed to initialize atom during capture:`,
            error
          );
        }
      }
    }

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

    this.notify('snapshot');
  }

  undo(): boolean {
    if (this.currentIndex <= 0) {
      return false;
    }

    this.currentIndex--;
    const snapshot = this.history[this.currentIndex];
    this.restoreSnapshot(snapshot);
    this.notify('undo');
    return true;
  }

  redo(): boolean {
    if (this.currentIndex >= this.history.length - 1) {
      return false;
    }

    this.currentIndex++;
    const snapshot = this.history[this.currentIndex];
    this.restoreSnapshot(snapshot);
    this.notify('redo');
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
    this.notify('jump');
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
      Object.entries(state).forEach(([key, value]) => {
        const atom = atomRegistry.getByName(key);
        if (atom) {
          (this.store as any).set(atom as never, value as never);
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  private restoreSnapshot(snapshot: Snapshot): void {
    this.isTimeTraveling = true;

    try {
      Object.entries(snapshot.state).forEach(([key, entry]) => {
        const atom = atomRegistry.getByName(key);
        if (atom) {
          try {
            if (typeof (this.store as any).setSilently === 'function') {
              (this.store as any).setSilently(atom as never, entry.value as never);
            } else {
              console.warn(
                `[TimeTravelController] setSilently not available, using set() for atom ${key}`
              );
              (this.store as any).set(atom as never, entry.value as never);
            }
          } catch (error) {
            console.warn(`restoreSnapshot: failed to restore atom ${key}:`, error);
          }
        } else {
          console.warn(`restoreSnapshot: atom ${key} not found in registry`);
        }
      });

      this.flushComputed();
    } finally {
      this.isTimeTraveling = false;
    }
  }

  /**
   * Force re-evaluation of computed atoms
   */
  private flushComputed(): void {
    const allAtoms = atomRegistry.getAll();
    for (const atom of allAtoms.values()) {
      const metadata = atomRegistry.getMetadata(atom as { id: symbol });
      if (metadata?.type === 'computed') {
        try {
          this.store.get(atom as any);
        } catch (error) {
          console.warn(
            `[TimeTravelController] Failed to flush computed atom:`,
            error
          );
        }
      }
    }
  }

  getHistoryStats(): { length: number; currentIndex: number; canUndo: boolean; canRedo: boolean } {
    return {
      length: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }

  subscribe(event: TimeTravelEventType, callback: () => void): TimeTravelUnsubscribe {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);

    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  subscribeToSnapshots(callback: () => void): TimeTravelUnsubscribe {
    this.snapshotSubscribers.add(callback);

    return () => {
      this.snapshotSubscribers.delete(callback);
    };
  }

  private notify(event: TimeTravelEventType): void {
    const eventSubscribers = this.subscribers.get(event);
    if (eventSubscribers) {
      eventSubscribers.forEach(cb => cb());
    }

    // Также уведомляем подписчиков на snapshot события
    if (event === 'snapshot') {
      this.snapshotSubscribers.forEach(cb => cb());
    }
  }

  /**
   * Проверить, выполняется ли операция time-travel
   * @returns True, если состояние восстанавливается из snapshot
   */
  getIsTimeTraveling(): boolean {
    return this.isTimeTraveling;
  }
}
