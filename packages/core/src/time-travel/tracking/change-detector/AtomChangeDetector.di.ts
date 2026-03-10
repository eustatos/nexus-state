/**
 * AtomChangeDetector - Detects and tracks changes in atoms
 * Refactored version with dependency injection
 */

import type { ChangeEvent, ChangeFilter, ChangeBatch } from '../types';
import type { AtomTracker } from '../AtomTracker';
import type { Atom } from '../../../types';
import type {
  IChangeListenerRegistry,
  IChangeFilterManager,
  IChangeBatcher,
  IChangeDetector,
  IValueTracker,
} from './types.interfaces';
import { ChangeListenerRegistry } from './ChangeListenerRegistry';
import { ChangeFilterManager } from './ChangeFilterManager';
import { ChangeBatcher } from './ChangeBatcher';
import { ChangeDetector } from './ChangeDetector';
import { ValueTracker } from './ValueTracker';

/**
 * Dependencies for AtomChangeDetector
 */
export interface ChangeDetectorDeps {
  tracker: AtomTracker;
  listenerRegistry?: IChangeListenerRegistry;
  filterManager?: IChangeFilterManager;
  batcher?: IChangeBatcher;
  detector?: IChangeDetector;
  valueTracker?: IValueTracker;
}

/**
 * AtomChangeDetector with dependency injection
 */
export class AtomChangeDetector {
  private tracker: AtomTracker;
  private listenerRegistry: IChangeListenerRegistry;
  private filterManager: IChangeFilterManager;
  private batcher: IChangeBatcher;
  private detector: IChangeDetector;
  private valueTracker: IValueTracker;
  private watchInterval: NodeJS.Timeout | null = null;

  constructor(deps: ChangeDetectorDeps) {
    this.tracker = deps.tracker;
    this.listenerRegistry = deps.listenerRegistry ?? new ChangeListenerRegistry();
    this.filterManager = deps.filterManager ?? new ChangeFilterManager();
    this.batcher = deps.batcher ?? new ChangeBatcher();
    this.detector = deps.detector ?? new ChangeDetector();
    this.valueTracker = deps.valueTracker ?? new ValueTracker();

    this.setupTracking();
  }

  /**
   * Setup tracking integration
   */
  private setupTracking(): void {
    this.tracker.subscribe('atom-changed', (event) => {
      if (event.atom) {
        this.handleAtomChange(event.atom, undefined, undefined);
      }
    });
  }

  /**
   * Handle atom change
   */
  private handleAtomChange(
    atom: any,
    oldValue: unknown,
    newValue: unknown,
  ): void {
    const changeEvent = this.detector.createEvent(
      atom.id,
      atom.name,
      atom.atom,
      oldValue,
      newValue,
    );

    if (!this.filterManager.passesFilters(changeEvent)) {
      return;
    }

    if (this.batcher.isBatching()) {
      this.batcher.addChange(changeEvent);
    } else {
      this.listenerRegistry.notify(changeEvent);
    }
  }

  /**
   * Watch specific atom
   */
  watch(atom: Atom<unknown>, listener: (event: ChangeEvent) => void): () => void {
    if (!this.tracker.isTracked(atom.id)) {
      this.tracker.track(atom);
    }

    const atomId = atom.id;
    if (!this.valueTracker.hasValue(atomId)) {
      this.valueTracker.storeValue(atomId, this.tracker['store'].get(atom));
    }

    const unsubscribe = this.listenerRegistry.addListener(atomId, listener);

    return unsubscribe;
  }

  /**
   * Watch multiple atoms
   */
  watchMany(atoms: Atom<unknown>[], listener: (event: ChangeEvent) => void): () => void {
    const unwatchFns = atoms.map((atom) => this.watch(atom, listener));

    return () => {
      unwatchFns.forEach((fn) => fn());
    };
  }

  /**
   * Watch for changes with pattern
   */
  watchPattern(pattern: RegExp, listener: (event: ChangeEvent) => void): () => void {
    const atoms = this.tracker
      .getTrackedAtoms()
      .filter((t) => pattern.test(t.name))
      .map((t) => t.atom as Atom<unknown>);

    return this.watchMany(atoms, listener);
  }

  /**
   * Add global listener
   */
  addGlobalListener(listener: (event: ChangeEvent) => void): () => void {
    return this.listenerRegistry.addGlobalListener(listener);
  }

  /**
   * Add change filter
   */
  addFilter(filter: ChangeFilter): () => void {
    return this.filterManager.addFilter(filter);
  }

  /**
   * Execute function in batch mode
   */
  batch(fn: () => void): ChangeBatch {
    return this.batcher.batch(fn);
  }

  /**
   * Start polling for changes
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
    this.tracker.getTrackedAtoms().forEach((trackedAtom) => {
      const atom = trackedAtom.atom as Atom<unknown>;
      const atomId = trackedAtom.id;
      const currentValue = this.tracker['store'].get(atom);
      const previousValue = this.valueTracker.getValue(atomId);

      if (this.detector.hasChanged(atomId, previousValue, currentValue)) {
        this.tracker.recordChange(atom, previousValue, currentValue);
        this.valueTracker.storeValue(atomId, currentValue);
      }
    });
  }

  /**
   * Get most changed atoms
   */
  getMostChanged(count: number = 5): any[] {
    return this.tracker
      .getTrackedAtoms()
      .sort((a, b) => b.changeCount - a.changeCount)
      .slice(0, count);
  }

  /**
   * Get recently changed atoms
   */
  getRecentlyChanged(minutes: number = 5): any[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.tracker.getTrackedAtoms().filter((t) => t.lastSeen > cutoff);
  }

  /**
   * Get listener count
   */
  listenerCount(): number {
    return this.listenerRegistry.getListenerCount();
  }

  /**
   * Check if atom is being watched
   */
  isWatched(atom: Atom<unknown>): boolean {
    return this.listenerRegistry.hasListeners(atom.id);
  }

  /**
   * Clear all listeners and filters
   */
  clear(): void {
    this.listenerRegistry.clear();
    this.filterManager.clear();
    this.batcher.clearPending();
    this.valueTracker.clear();
    this.stopPolling();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.clear();
  }
}
