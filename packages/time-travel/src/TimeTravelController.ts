/**
 * TimeTravelController - Main time travel controller
 *
 * ARCHITECTURE: Store-specific time travel
 * - Tracks only atoms accessed in the specific store
 * - Snapshots contain only initialized atom states
 * - Unaccessed atoms are excluded from snapshots (no state to save)
 * - DevTools can show unaccessed atoms with "not initialized" status
 */

import type { Snapshot, SnapshotStateEntry, Store, TimeTravelAPI, TimeTravelEventType, TimeTravelOptions, TimeTravelUnsubscribe } from './types';

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

  /**
   * Capture current store state as a snapshot
   * 
   * Only includes atoms that have been accessed via store.get()/set()/subscribe()
   * Unaccessed atoms are excluded because they have no state in this store
   * 
   * @param action Optional action name for the snapshot
   */
  capture(action?: string): void {
    // Get state - only includes accessed atoms
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

    // Warn about unaccessed named atoms in DEV mode
    if (process.env.NODE_ENV !== 'production') {
      this.warnAboutUnaccessedAtoms();
    }

    this.notify('snapshot');
  }

  /**
   * Warn about named atoms that haven't been accessed in this store
   * Helps developers understand why some atoms don't appear in snapshots
   */
  private warnAboutUnaccessedAtoms(): void {
    const storeAtoms = this.store.getRegistryAtoms?.() || [];
    const accessedNames = new Set<string>();

    // Collect names of accessed atoms from store state
    const state = this.store.getState();
    Object.keys(state).forEach(key => accessedNames.add(key));

    // Check which registered atoms haven't been accessed
    const unaccessed: string[] = [];
    for (const atomId of storeAtoms) {
      const metadata = this.store.getAtomMetadata?.(atomId);
      if (metadata?.name && !accessedNames.has(metadata.name)) {
        unaccessed.push(metadata.name);
      }
    }

    if (unaccessed.length > 0) {
      console.warn(
        `[TimeTravel] ${unaccessed.length} atom(s) not accessed in this store: ${unaccessed.join(', ')}. ` +
        `They won't be included in snapshots. Access them via store.get() or store.set() before capture().`
      );
    }
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
        if (this.store.setByName) {
          this.store.setByName(key, value);
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
        try {
          if (typeof (this.store as any).setSilently === 'function') {
            const atom = this.store.getByName?.(key);
            if (atom) {
              (this.store as any).setSilently(atom, entry.value);
            } else {
              console.warn(`restoreSnapshot: atom ${key} not found in store`);
            }
          } else {
            console.warn(
              `[TimeTravelController] setSilently not available, using setByName() for atom ${key}`
            );
            if (this.store.setByName) {
              this.store.setByName(key, entry.value);
            }
          }
        } catch (error) {
          console.warn(`restoreSnapshot: failed to restore atom ${key}:`, error);
        }
      });

      this.flushComputed();
    } finally {
      this.isTimeTraveling = false;
    }
  }

  /**
   * Force re-evaluation of computed atoms
   *
   * Optimization: Only iterate atoms from current store's registry instead of
   * all atoms in global registry. This reduces overhead during time-travel
   * operations, especially with many atoms across multiple stores.
   */
  private flushComputed(): void {
    // Use store-specific registry to ensure isolation and optimal performance
    const storeAtoms = this.store.getRegistryAtoms?.() || [];

    for (const atomId of storeAtoms) {
      const metadata = this.store.getAtomMetadata?.(atomId);
      if (metadata?.type === 'computed') {
        try {
          const atom = this.store.getByName?.(metadata.name!);
          if (atom) {
            this.store.get(atom as any);
          }
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
