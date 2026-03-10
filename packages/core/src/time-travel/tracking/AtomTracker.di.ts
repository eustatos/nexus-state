/**
 * AtomTracker - Tracks atoms and their metadata (Facade pattern)
 * Refactored version with dependency injection for testability
 */

import type { Atom, Store } from '../../types';
import type {
  TrackerConfig,
  TrackedAtom,
  TrackingStats,
  CleanupStats,
  CleanupResult,
  TTLConfig,
} from './types';
import type {
  ITrackingOperations,
  IAccessTracking,
  ICleanupOperations,
  IStatsProvider,
  IEventSubscription,
} from './types/interfaces';
import type { TrackingEventType, TrackingEvent } from './TrackingEventManager';

import { BaseDisposable, type DisposableConfig } from '../core/disposable';
import { storeLogger as logger } from '../../debug';

/**
 * Dependencies for AtomTracker
 */
export interface AtomTrackerDeps {
  store: Store;
  tracking: ITrackingOperations;
  access: IAccessTracking;
  cleanup: ICleanupOperations;
  stats: IStatsProvider;
  events?: IEventSubscription;
  config?: Partial<TrackerConfig> & Partial<TTLConfig>;
}

/**
 * AtomTracker provides atom tracking as a facade over services
 * Uses dependency injection for testability
 */
export class AtomTracker extends BaseDisposable {
  private store: Store;
  private tracking: ITrackingOperations;
  private access: IAccessTracking;
  private cleanup: ICleanupOperations;
  private stats: IStatsProvider;
  private events?: IEventSubscription;
  private trackerConfig: Partial<TrackerConfig & TTLConfig>;

  constructor(
    deps: AtomTrackerDeps,
    disposalConfig?: DisposableConfig
  ) {
    super(disposalConfig);

    this.store = deps.store;
    this.tracking = deps.tracking;
    this.access = deps.access;
    this.cleanup = deps.cleanup;
    this.stats = deps.stats;
    this.events = deps.events;
    this.trackerConfig = deps.config ?? {};

    logger.log('[AtomTracker] Initialized with DI');
  }

  /**
   * Track an atom
   */
  track<Value>(atom: Atom<Value>): boolean {
    const now = Date.now();
    const trackedAtom: TrackedAtom = {
      id: atom.id,
      atom: atom,
      name: atom.name || atom.id.description || 'atom',
      type: 'primitive',
      status: 'active',
      createdAt: now,
      firstSeen: now,
      lastSeen: now,
      trackedAt: now,
      lastAccessedAt: now,
      lastChanged: now,
      accessCount: 0,
      changeCount: 0,
      refCount: 0,
      idleTime: 0,
      ttl: this.trackerConfig.defaultTTL ?? 300000,
      gcEligible: false,
      lifecycle: {
        createdAt: now,
        lastAccessedAt: now,
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
        accessCount: 0,
        changeCount: 0,
        tags: [],
        custom: {},
      },
      subscribers: new Set(),
    };

    const result = this.tracking.track(atom, trackedAtom);
    return result.success;
  }

  /**
   * Untrack an atom
   */
  untrack(atomId: symbol): boolean {
    const result = this.tracking.untrack(atomId);
    return result.success;
  }

  /**
   * Record atom access
   */
  recordAccess(atom: Atom<unknown>, subscriberId?: string): void {
    const trackedAtom = this.tracking.getTrackedAtom(atom.id);
    if (!trackedAtom) {
      return;
    }
    this.access.recordAccess(atom, trackedAtom, subscriberId);
  }

  /**
   * Remove subscriber from atom
   */
  removeSubscriber(atom: Atom<unknown>, subscriberId: string): boolean {
    const trackedAtom = this.tracking.getTrackedAtom(atom.id);
    if (!trackedAtom) {
      return false;
    }
    return this.access.removeSubscriber(atom, trackedAtom, subscriberId);
  }

  /**
   * Record atom change
   */
  recordChange(
    atom: Atom<unknown>,
    _oldValue: unknown,
    _newValue: unknown
  ): void {
    const trackedAtom = this.tracking.getTrackedAtom(atom.id);
    if (!trackedAtom) {
      return;
    }

    this.access.recordAccess(atom, trackedAtom);
  }

  /**
   * Perform cleanup
   */
  async performCleanup(): Promise<CleanupResult> {
    return this.cleanup.performCleanup();
  }

  /**
   * Trigger immediate cleanup
   */
  async triggerCleanup(): Promise<CleanupResult> {
    return this.cleanup.triggerCleanup();
  }

  /**
   * Wait for next cleanup cycle
   */
  async waitForCleanup(timeout: number = 5000): Promise<{ removed: number }> {
    return this.cleanup.waitForCleanup(timeout);
  }

  /**
   * Get tracking statistics
   */
  getStats(): TrackingStats {
    return this.stats.getTrackingStats();
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStats(): CleanupStats {
    return this.stats.getCleanupStats();
  }

  /**
   * Get all tracked atoms
   */
  getTrackedAtoms(): TrackedAtom[] {
    return this.tracking.getTrackedAtoms();
  }

  /**
   * Get tracked atom by ID
   */
  getTrackedAtom(atomId: symbol): TrackedAtom | null {
    return this.tracking.getTrackedAtom(atomId);
  }

  /**
   * Get atom by name
   */
  getAtomByName(name: string): TrackedAtom | undefined {
    return this.tracking.getAtomByName(name);
  }

  /**
   * Check if atom is tracked
   */
  isTracked(atomId: symbol): boolean {
    return this.tracking.isTracked(atomId);
  }

  /**
   * Get count of tracked atoms
   */
  getCount(): number {
    return this.tracking.getCount();
  }

  /**
   * Get count of tracked atoms (alias)
   */
  size(): number {
    return this.getCount();
  }

  /**
   * Subscribe to tracking events
   */
  subscribe(
    eventType: TrackingEventType,
    listener: (event: TrackingEvent) => void
  ): () => void {
    if (!this.events) {
      return () => {};
    }
    return this.events.subscribe(eventType, listener as (event: unknown) => void);
  }

  /**
   * Get configuration
   */
  getConfig(): Partial<TrackerConfig & TTLConfig> {
    return { ...this.trackerConfig };
  }

  /**
   * Dispose atom tracker
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    logger.log('[AtomTracker] Disposing');

    // Unsubscribe from events
    if (this.events) {
      this.events.unsubscribeAll();
    }

    // Dispose children
    await this.disposeChildren();

    // Run callbacks
    await this.runDisposeCallbacks();

    this.disposed = true;
    logger.log('[AtomTracker] Disposed');
  }
}
