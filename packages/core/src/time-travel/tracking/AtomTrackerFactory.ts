/**
 * AtomTrackerFactory - Creates AtomTracker with all dependencies
 * Provides backward compatibility and easy instantiation
 */

import type { Store } from '../../types';
import type { TrackerConfig, TTLConfig } from './types';
import { AtomTracker } from './AtomTracker.di';
import type { AtomTrackerDeps } from './AtomTracker.di';

import { TrackedAtomsRepository } from './TrackedAtomsRepository';
import { TTLManager } from './TTLManager';
import { CleanupScheduler } from './CleanupScheduler';
import { CleanupEngine } from './CleanupEngine';
import { StatisticsCollector } from './StatisticsCollector';
import { TrackingEventManager } from './TrackingEventManager';
import { ReferenceCounter } from './ReferenceCounter';
import { ArchiveManager } from './ArchiveManager';

import { AtomTrackingService } from './AtomTrackingService';
import { AtomAccessService } from './AtomAccessService';
import { AtomCleanupService } from './AtomCleanupService';
import { AtomStatsService } from './AtomStatsService';
import { AtomEventService } from './AtomEventService';

import { storeLogger as logger } from '../../debug';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Partial<TrackerConfig> = {
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

const DEFAULT_TTL_CONFIG: Partial<TTLConfig> = {
  defaultTTL: 5 * 60 * 1000,
  maxTTL: 24 * 60 * 60 * 1000,
  minTTL: 1000,
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
 * Create AtomTracker with all dependencies
 */
export function createAtomTracker(
  store: Store,
  config?: Partial<TrackerConfig> & Partial<TTLConfig>
): AtomTracker {
  const trackerConfig = { ...DEFAULT_CONFIG, ...config };
  const ttlConfig = { ...DEFAULT_TTL_CONFIG, ...config };

  // Initialize core components
  const repository = new TrackedAtomsRepository();
  const ttlManager = new TTLManager(ttlConfig);
  const eventManager = new TrackingEventManager();
  const refCounter = new ReferenceCounter();
  const statsCollector = new StatisticsCollector();
  const archiveManager = new ArchiveManager({
    enabled: trackerConfig.archiveOnCleanup ?? false,
  });

  // Initialize cleanup engine and scheduler
  const cleanupEngine = new CleanupEngine(repository, ttlManager, {
    defaultStrategy: trackerConfig.archiveOnCleanup ? 'archive' : 'remove',
    removeExpired: true,
    archiveStale: trackerConfig.archiveOnCleanup ?? false,
  });

  const scheduler = new CleanupScheduler(async () => {
    const result = await cleanupEngine.performCleanup();
    return result;
  }, {
    enabled: trackerConfig.enableCleanup ?? true,
    cleanupInterval: ttlConfig.gcInterval ?? 30000,
    initialDelay: 100,
  });

  // Initialize services
  const tracking = new AtomTrackingService(repository, eventManager);

  const access = new AtomAccessService(
    refCounter,
    ttlManager,
    eventManager
  );

  const cleanup = new AtomCleanupService(
    scheduler,
    cleanupEngine,
    eventManager
  );

  const stats = new AtomStatsService(
    statsCollector,
    repository,
    archiveManager
  );
  stats.setCleanupService(cleanup);

  const events = new AtomEventService(eventManager);

  // Create deps object
  const deps: AtomTrackerDeps = {
    store,
    tracking,
    access,
    cleanup,
    stats,
    events,
    config: { ...trackerConfig, ...ttlConfig },
  };

  // Create tracker
  const tracker = new AtomTracker(deps);

  // Start scheduler if enabled
  if (trackerConfig.enableCleanup) {
    scheduler.start();
  }

  logger.log('[AtomTrackerFactory] Created tracker');

  return tracker;
}

/**
 * Create AtomTracker with mock/test dependencies
 * Useful for testing
 */
export function createTestAtomTracker(
  store: Store,
  _overrides?: Partial<AtomTrackerDeps>
): AtomTracker {
  const defaultTracker = createAtomTracker(store);
  
  // For testing, we'd inject mocks here
  // This is a placeholder for test-specific creation
  return defaultTracker;
}
