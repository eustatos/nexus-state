/**
 * AtomTracker - Tracks atoms and their metadata (Facade pattern)
 *
 * This class is a facade that coordinates all tracking services:
 * - AtomTrackingService: Track/untrack operations
 * - AtomAccessService: Access tracking and subscribers
 * - AtomCleanupService: Cleanup operations
 * - AtomStatsService: Statistics collection
 * - AtomEventService: Event management
 */

import type { Atom, Store } from '../../types';
import type {
  TrackerConfig,
  TrackedAtom,
  TrackingEvent,
  TrackingStats,
  TTLConfig,
  CleanupStats,
  CleanupResult,
} from './types';

import { TrackedAtomsRepository } from './TrackedAtomsRepository';
import { TTLManager } from './TTLManager';
import { CleanupScheduler } from './CleanupScheduler';
import { CleanupEngine } from './CleanupEngine';
import { StatisticsCollector } from './StatisticsCollector';
import {
  TrackingEventManager,
  type TrackingEventType,
} from './TrackingEventManager';
import { ReferenceCounter } from './ReferenceCounter';
import { ArchiveManager } from './ArchiveManager';

import { AtomTrackingService } from './AtomTrackingService';
import { AtomAccessService } from './AtomAccessService';
import { AtomCleanupService } from './AtomCleanupService';
import { AtomStatsService } from './AtomStatsService';
import { AtomEventService } from './AtomEventService';

import { storeLogger as logger } from '../../debug';
import { BaseDisposable, type DisposableConfig } from '../core/disposable';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: TrackerConfig = {
  autoTrack: true,
  maxAtoms: 1000,
  trackComputed: true,
  trackWritable: true,
  trackPrimitive: true,
  validateOnTrack: false,
  trackAccess: false,
  trackChanges: false,
  logChanges: false,
  enableCleanup: true,
  archiveOnCleanup: false,
};

const DEFAULT_TTL_CONFIG: TTLConfig = {
  defaultTTL: 5 * 60 * 1000,
  maxTTL: 24 * 60 * 60 * 1000,
  minTTL: 1000,
  ttlByType: {
    primitive: 5 * 60 * 1000,
    computed: 3 * 60 * 1000,
    writable: 5 * 60 * 1000,
  },
  idleTimeout: 60 * 1000,
  staleTimeout: 2 * 60 * 1000,
  gcInterval: 30000,
  batchSize: 10,
  enableRefCounting: false,
  autoUntrackWhenRefZero: false,
  cleanupStrategy: 'lru',
  onCleanup: 'archive',
  logCleanups: false,
  detailedStats: false,
};

/**
 * AtomTracker provides atom tracking as a facade over services
 */
export class AtomTracker extends BaseDisposable {
  private store: Store;
  private trackerConfig: TrackerConfig;
  private ttlConfig: TTLConfig;

  // Core components
  private repository: TrackedAtomsRepository;
  private ttlManager: TTLManager;
  private cleanupEngine: CleanupEngine;
  private scheduler: CleanupScheduler;
  private statsCollector: StatisticsCollector;
  private eventManager: TrackingEventManager;
  private refCounter: ReferenceCounter;
  private archiveManager: ArchiveManager;

  // Services
  private trackingService: AtomTrackingService;
  private accessService: AtomAccessService;
  private cleanupService: AtomCleanupService;
  private statsService: AtomStatsService;
  private eventService: AtomEventService;

  constructor(
    store: Store,
    config?: Partial<TrackerConfig> & Partial<TTLConfig>,
    disposalConfig?: DisposableConfig
  ) {
    super(disposalConfig);

    this.store = store;
    this.trackerConfig = { ...DEFAULT_CONFIG, ...config };
    this.ttlConfig = { ...DEFAULT_TTL_CONFIG, ...config };

    // Initialize components
    this.repository = new TrackedAtomsRepository();
    this.ttlManager = new TTLManager(this.ttlConfig);
    this.eventManager = new TrackingEventManager();
    this.refCounter = new ReferenceCounter();
    this.statsCollector = new StatisticsCollector();
    this.archiveManager = new ArchiveManager({
      enabled: this.trackerConfig.archiveOnCleanup ?? false,
    });

    // Initialize cleanup engine and scheduler
    this.cleanupEngine = new CleanupEngine(this.repository, this.ttlManager, {
      defaultStrategy: this.trackerConfig.archiveOnCleanup
        ? 'archive'
        : 'remove',
      removeExpired: true,
      archiveStale: this.trackerConfig.archiveOnCleanup ?? false,
    });

    this.scheduler = new CleanupScheduler(() => this.performCleanup(), {
      enabled: this.trackerConfig.enableCleanup ?? true,
      cleanupInterval: this.ttlConfig.gcInterval ?? 30000,
      initialDelay: 100,
    });

    // Initialize services
    this.trackingService = new AtomTrackingService(
      this.repository,
      this.eventManager
    );

    this.accessService = new AtomAccessService(
      this.refCounter,
      this.ttlManager,
      this.eventManager
    );

    this.cleanupService = new AtomCleanupService(
      this.scheduler,
      this.cleanupEngine,
      this.eventManager
    );

    this.statsService = new AtomStatsService(
      this.statsCollector,
      this.repository,
      this.archiveManager
    );
    this.statsService.setCleanupService(this.cleanupService);

    this.eventService = new AtomEventService(this.eventManager);

    // Start scheduler if enabled
    if (this.trackerConfig.enableCleanup) {
      this.scheduler.start();
    }

    logger.log('[AtomTracker] Initialized');
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
      lastAccessed: now,
      lastChanged: now,
      accessCount: 0,
      idleTime: 0,
      ttl: this.ttlConfig.defaultTTL,
      gcEligible: false,
      firstSeen: now,
      lastSeen: now,
      changeCount: 0,
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

    const result = this.trackingService.track(atom, trackedAtom);
    return result.success;
  }

  /**
   * Untrack an atom
   */
  untrack(atomId: symbol): boolean {
    const result = this.trackingService.untrack(atomId);
    return result.success;
  }

  /**
   * Record atom access
   */
  recordAccess(atom: Atom<unknown>, subscriberId?: string): void {
    const trackedAtom = this.trackingService.getTrackedAtom(atom.id);
    if (!trackedAtom) {
      return;
    }
    this.accessService.recordAccess(atom, trackedAtom, subscriberId);
  }

  /**
   * Remove subscriber from atom
   */
  removeSubscriber(atom: Atom<unknown>, subscriberId: string): boolean {
    const trackedAtom = this.trackingService.getTrackedAtom(atom.id);
    if (!trackedAtom) {
      return false;
    }
    return this.accessService.removeSubscriber(atom, trackedAtom, subscriberId);
  }

  /**
   * Record atom change (legacy method for backward compatibility)
   */
  recordChange(
    atom: Atom<unknown>,
    oldValue: unknown,
    newValue: unknown
  ): void {
    const trackedAtom = this.trackingService.getTrackedAtom(atom.id);
    if (!trackedAtom) {
      return;
    }

    this.ttlManager.resetAccessTime(trackedAtom);
    this.accessService.recordAccess(atom, trackedAtom);

    this.eventManager.emit({
      type: 'atom-changed',
      timestamp: Date.now(),
      atom: trackedAtom,
      data: { oldValue, newValue },
    });
  }

  /**
   * Perform cleanup
   */
  async performCleanup(): Promise<CleanupResult> {
    return this.cleanupService.performCleanup();
  }

  /**
   * Trigger immediate cleanup
   */
  async triggerCleanup(): Promise<CleanupResult> {
    return this.cleanupService.triggerCleanup();
  }

  /**
   * Wait for next cleanup cycle
   */
  async waitForCleanup(timeout: number = 5000): Promise<{ removed: number }> {
    return this.cleanupService.waitForCleanup(timeout);
  }

  /**
   * Get tracking statistics
   */
  getStats(): TrackingStats {
    return this.statsService.getTrackingStats();
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStats(): CleanupStats {
    return this.statsService.getCleanupStats() as CleanupStats;
  }

  /**
   * Get all tracked atoms
   */
  getTrackedAtoms(): TrackedAtom[] {
    return this.trackingService.getTrackedAtoms();
  }

  /**
   * Get tracked atom by ID
   */
  getTrackedAtom(atomId: symbol): TrackedAtom | undefined {
    return this.trackingService.getTrackedAtom(atomId);
  }

  /**
   * Get atom by name
   */
  getAtomByName(name: string): TrackedAtom | undefined {
    return this.trackingService.getAtomByName(name);
  }

  /**
   * Check if atom is tracked
   */
  isTracked(atomId: symbol): boolean {
    return this.trackingService.isTracked(atomId);
  }

  /**
   * Get count of tracked atoms
   */
  getCount(): number {
    return this.trackingService.getCount();
  }

  /**
   * Get count of tracked atoms (alias for backward compatibility)
   */
  size(): number {
    return this.getCount();
  }

  /**
   * Get stale atoms
   */
  getStaleAtoms(): TrackedAtom[] {
    return this.statsService.getStaleAtoms();
  }

  /**
   * Update statuses for all atoms (legacy method for backward compatibility)
   */
  updateAtomStatuses(): void {
    const atoms = this.repository.getAll();
    this.ttlManager.updateStatuses(atoms);
  }

  /**
   * Mark atom for cleanup (legacy method for backward compatibility)
   */
  markForCleanup(atomId: symbol): void {
    this.repository.update(atomId, { status: 'stale' });
  }

  /**
   * Subscribe to tracking events
   */
  subscribe(
    eventType: TrackingEventType,
    listener: (event: TrackingEvent) => void
  ): () => void {
    return this.eventService.subscribe(eventType, listener);
  }

  /**
   * Get scheduler stats
   */
  getSchedulerStats(): {
    isRunning: boolean;
    cleanupsPerformed: number;
    lastCleanupTimestamp?: number;
    nextCleanupTimestamp?: number;
  } {
    return this.cleanupService.getScheduler().getStats();
  }

  /**
   * Get archive stats
   */
  getArchiveStats() {
    return this.statsService.getArchiveStats();
  }

  /**
   * Get repository stats
   */
  getRepositoryStats() {
    return this.statsService.getRepositoryStats();
  }

  /**
   * Get configuration
   */
  getConfig(): TrackerConfig {
    return { ...this.trackerConfig };
  }

  /**
   * Get TTL configuration
   */
  getTTLConfig(): TTLConfig {
    return { ...this.ttlConfig };
  }

  /**
   * Update configuration
   */
  configure(config: Partial<TrackerConfig> & Partial<TTLConfig>): void {
    this.trackerConfig = { ...this.trackerConfig, ...config };
    this.ttlConfig = { ...this.ttlConfig, ...config };

    this.ttlManager.configure(this.ttlConfig);
    this.scheduler.configure({
      cleanupInterval: this.ttlConfig.gcInterval,
    });
  }

  /**
   * Get the tracking service
   */
  getTrackingService(): AtomTrackingService {
    return this.trackingService;
  }

  /**
   * Get the access service
   */
  getAccessService(): AtomAccessService {
    return this.accessService;
  }

  /**
   * Get the cleanup service
   */
  getCleanupService(): AtomCleanupService {
    return this.cleanupService;
  }

  /**
   * Get the stats service
   */
  getStatsService(): AtomStatsService {
    return this.statsService;
  }

  /**
   * Get the event service
   */
  getEventService(): AtomEventService {
    return this.eventService;
  }

  /**
   * Get the repository
   */
  getRepository(): TrackedAtomsRepository {
    return this.repository;
  }

  /**
   * Get the TTL manager
   */
  getTTLManager(): TTLManager {
    return this.ttlManager;
  }

  /**
   * Get the cleanup engine
   */
  getCleanupEngine(): CleanupEngine {
    return this.cleanupEngine;
  }

  /**
   * Get the scheduler
   */
  getScheduler(): CleanupScheduler {
    return this.scheduler;
  }

  /**
   * Get the stats collector
   */
  getStatsCollector(): StatisticsCollector {
    return this.statsCollector;
  }

  /**
   * Get the event manager
   */
  getEventManager(): TrackingEventManager {
    return this.eventManager;
  }

  /**
   * Get the reference counter
   */
  getReferenceCounter(): ReferenceCounter {
    return this.refCounter;
  }

  /**
   * Get the archive manager
   */
  getArchiveManager(): ArchiveManager {
    return this.archiveManager;
  }

  /**
   * Dispose atom tracker
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    logger.log('[AtomTracker] Disposing');

    // Stop scheduler
    this.scheduler.stop();

    // Clear subscriptions
    this.eventService.unsubscribeAll();

    // Clear repository
    this.repository.clear();

    // Clear stats
    this.statsCollector.clear();

    // Dispose children
    await this.disposeChildren();

    // Run callbacks
    await this.runDisposeCallbacks();

    this.disposed = true;
    logger.log('[AtomTracker] Disposed');
  }
}
