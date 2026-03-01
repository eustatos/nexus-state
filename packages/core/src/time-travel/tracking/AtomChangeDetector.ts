/**
 * AtomChangeDetector - Detects and tracks changes in atoms
 */

import type {
  ChangeEvent,
  ChangeListener,
  ChangeFilter,
  ChangeBatch,
  TrackedAtom,
} from "./types";
import { AtomTracker } from "./AtomTracker";
import { Atom } from "../../types";

export class AtomChangeDetector {
  private tracker: AtomTracker;
  private listeners: Map<symbol, Set<ChangeListener>> = new Map();
  private globalListeners: Set<ChangeListener> = new Set();
  private filters: ChangeFilter[] = [];
  private batchMode: boolean = false;
  private batchQueue: ChangeEvent[] = [];
  private previousValues: Map<symbol, unknown> = new Map();
  private watchInterval: NodeJS.Timeout | null = null;

  constructor(tracker: AtomTracker) {
    this.tracker = tracker;
    this.setupTracking();
  }

  /**
   * Setup tracking integration
   */
  private setupTracking(): void {
    // Subscribe to tracker events
    this.tracker.subscribe((event) => {
      if (event.type === "change" && event.atom) {
        this.handleAtomChange(event.atom, event.oldValue, event.newValue);
      }
    });
  }

  /**
   * Handle atom change
   * @param atom Tracked atom
   * @param oldValue Old value
   * @param newValue New value
   */
  private handleAtomChange(
    atom: TrackedAtom,
    oldValue: unknown,
    newValue: unknown,
  ): void {
    const changeEvent: ChangeEvent = {
      atom: atom.atom,
      atomId: atom.id,
      atomName: atom.name,
      oldValue,
      newValue,
      timestamp: Date.now(),
      type: this.detectChangeType(oldValue, newValue),
    };

    // Apply filters
    if (!this.passesFilters(changeEvent)) {
      return;
    }

    if (this.batchMode) {
      this.batchQueue.push(changeEvent);
    } else {
      this.notifyListeners(changeEvent);
    }
  }

  /**
   * Detect change type
   * @param oldValue Old value
   * @param newValue New value
   */
  private detectChangeType(
    oldValue: unknown,
    newValue: unknown,
  ): "created" | "deleted" | "value" | "type" | "unknown" {
    if (oldValue === undefined) return "created";
    if (newValue === undefined) return "deleted";
    if (typeof oldValue !== typeof newValue) return "type";
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) return "value";
    return "unknown";
  }

  /**
   * Check if change passes filters
   * @param event Change event
   */
  private passesFilters(event: ChangeEvent): boolean {
    return this.filters.every((filter) => filter(event));
  }

  /**
   * Notify listeners of change
   * @param event Change event
   */
  private notifyListeners(event: ChangeEvent): void {
    // Atom-specific listeners
    const atomListeners = this.listeners.get(event.atomId);
    if (atomListeners) {
      atomListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error("Change listener error:", error);
        }
      });
    }

    // Global listeners
    this.globalListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Global change listener error:", error);
      }
    });
  }

  /**
   * Watch specific atom
   * @param atom Atom to watch
   * @param listener Change listener
   */
  watch(atom: Atom<unknown>, listener: ChangeListener): () => void {
    if (!this.tracker.isTracked(atom)) {
      this.tracker.track(atom);
    }

    const atomId = atom.id;
    if (!this.listeners.has(atomId)) {
      this.listeners.set(atomId, new Set());
      // Store initial value
      this.previousValues.set(atomId, this.tracker["store"].get(atom));
    }

    this.listeners.get(atomId)!.add(listener);

    return () => {
      const listeners = this.listeners.get(atomId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(atomId);
          this.previousValues.delete(atomId);
        }
      }
    };
  }

  /**
   * Watch multiple atoms
   * @param atoms Atoms to watch
   * @param listener Change listener
   */
  watchMany(atoms: any[], listener: ChangeListener): () => void {
    const unwatchFns = atoms.map((atom) => this.watch(atom, listener));

    return () => {
      unwatchFns.forEach((fn) => fn());
    };
  }

  /**
   * Watch for changes with pattern
   * @param pattern Atom name pattern
   * @param listener Change listener
   */
  watchPattern(pattern: RegExp, listener: ChangeListener): () => void {
    const atoms = this.tracker
      .getAllTracked()
      .filter((t) => pattern.test(t.name))
      .map((t) => t.atom);

    return this.watchMany(atoms, listener);
  }

  /**
   * Add global listener
   * @param listener Change listener
   */
  addGlobalListener(listener: ChangeListener): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  /**
   * Add change filter
   * @param filter Filter function
   */
  addFilter(filter: ChangeFilter): () => void {
    this.filters.push(filter);
    return () => {
      const index = this.filters.indexOf(filter);
      if (index >= 0) this.filters.splice(index, 1);
    };
  }

  /**
   * Start batching changes
   */
  startBatch(): void {
    this.batchMode = true;
  }

  /**
   * End batching and process changes
   * @returns Batch of changes
   */
  endBatch(): ChangeBatch {
    this.batchMode = false;
    const batch = {
      changes: [...this.batchQueue],
      count: this.batchQueue.length,
      startTime: this.batchQueue[0]?.timestamp || Date.now(),
      endTime: Date.now(),
      atoms: new Set(this.batchQueue.map((c) => c.atomId)),
    };

    // Process batch
    this.batchQueue.forEach((event) => this.notifyListeners(event));
    this.batchQueue = [];

    return batch;
  }

  /**
   * Execute function in batch mode
   * @param fn Function to execute
   */
  batch(fn: () => void): ChangeBatch {
    this.startBatch();
    try {
      fn();
      return this.endBatch();
    } finally {
      // Cleanup in finally block
    }
  }

  /**
   * Start polling for changes
   * @param interval Polling interval in ms
   */
  startPolling(interval: number = 100): void {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
    }

    this.watchInterval = setInterval(() => {
      this.checkForChanges();
    }, interval);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
  }

  /**
   * Check for changes manually
   */
  checkForChanges(): void {
    this.tracker.getTrackedAtoms().forEach((atom) => {
      const atomId = atom.id;
      const currentValue = this.tracker["store"].get(atom);
      const previousValue = this.previousValues.get(atomId);

      if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
        this.tracker.recordChange(atom, previousValue, currentValue);
        this.previousValues.set(atomId, currentValue);
      }
    });
  }

  /**
   * Get change history for atom
   * @param _atom Atom
   * @param _limit Max number of changes
   */
  getChangeHistory(_atom: any, _limit: number = 10): ChangeEvent[] {
    // This would need a history store - simplified version
    return [];
  }

  /**
   * Get most changed atoms
   * @param count Number of atoms to return
   */
  getMostChanged(count: number = 5): TrackedAtom[] {
    return this.tracker
      .getAllTracked()
      .sort((a, b) => b.changeCount - a.changeCount)
      .slice(0, count);
  }

  /**
   * Get recently changed atoms
   * @param minutes Last N minutes
   */
  getRecentlyChanged(minutes: number = 5): TrackedAtom[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.tracker.getAllTracked().filter((t) => t.lastSeen > cutoff);
  }

  /**
   * Clear all listeners
   */
  clearListeners(): void {
    this.listeners.clear();
    this.globalListeners.clear();
    this.filters = [];
  }

  /**
   * Get listener count
   */
  listenerCount(): number {
    return (
      this.globalListeners.size +
      Array.from(this.listeners.values()).reduce(
        (sum, set) => sum + set.size,
        0,
      )
    );
  }

  /**
   * Check if atom is being watched
   * @param atom Atom
   */
  isWatched(atom: any): boolean {
    return this.listeners.has(atom.id);
  }

  /**
   * Get watched atoms
   */
  getWatchedAtoms(): symbol[] {
    return Array.from(this.listeners.keys());
  }
}
