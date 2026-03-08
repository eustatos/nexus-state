/**
 * Tracking module for TimeTravelController
 *
 * @packageDocumentation
 * Provides atom tracking, change detection, and computed atom handling.
 */

import { AtomChangeDetector } from './AtomChangeDetector';
import { ComputedAtomHandler } from './ComputedAtomHandler';
import type {
  ComputedDependency,
  TrackerConfig,
} from './types';
import type { AtomTracker as DIAtomTracker } from './AtomTracker.di';

// Re-export main classes
export { AtomTracker as LegacyAtomTracker } from './AtomTracker';
export { AtomTracker } from './AtomTracker.di';
export { createAtomTracker } from './AtomTrackerFactory';
export { AtomChangeDetector } from './AtomChangeDetector';
export { ComputedAtomHandler } from './ComputedAtomHandler';
export {
  LRUCleanupStrategy,
  LFUCleanupStrategy,
  FIFOCleanupStrategy,
  TimeBasedCleanupStrategy,
  createCleanupStrategy,
} from './CleanupStrategies';

// Re-export services (decomposed components)
export { AtomTrackingService } from './AtomTrackingService';
export { AtomAccessService } from './AtomAccessService';
export { AtomCleanupService } from './AtomCleanupService';
export { AtomStatsService } from './AtomStatsService';
export { AtomEventService } from './AtomEventService';

// Re-export refactored components
export { TrackedAtomsRepository } from './TrackedAtomsRepository';
export { TTLManager } from './TTLManager';
export { CleanupScheduler } from './CleanupScheduler';
export { CleanupEngine } from './CleanupEngine';
export { StatisticsCollector } from './StatisticsCollector';
export { TrackingEventManager } from './TrackingEventManager';
export { ReferenceCounter } from './ReferenceCounter';
export { ArchiveManager } from './ArchiveManager';

// Re-export types
export type {
  TrackerConfig,
  TrackedAtom,
  TrackingEvent,
  TrackingStats,
  ChangeEvent,
  ChangeListener,
  ChangeFilter,
  ChangeBatch,
  ComputedAtomConfig,
  ComputedDependency,
  ComputedCache,
  ComputedInvalidationStrategy,
  AtomMetadata,
  AtomGroup,
  AtomRelationship,
  AtomSubscription,
  TrackerSnapshot,
  TrackerRestorePoint,
  // TTL and cleanup types
  AtomLifecycle,
  AtomStatus,
  TTLConfig,
  CleanupStrategy,
  CleanupStrategyType,
  CleanupAction,
  CleanupStats,
  CleanupResult,
} from './types';

// Re-export DI types
export type {
  ITrackingOperations,
  IAccessTracking,
  ICleanupOperations,
  IStatsProvider,
  AtomTrackerDeps,
} from './types/interfaces';

// Re-export constants - TODO: create constants.ts
// export {
//   DEFAULT_TRACKER_CONFIG,
//   TRACKING_EVENTS,
//   CHANGE_TYPES,
//   COMPUTED_STRATEGIES,
//   INVALIDATION_STRATEGIES,
//   ATOM_TYPES,
// } from "./constants";

/**
 * Create a new change detector
 * @param tracker Atom tracker instance
 * @returns AtomChangeDetector instance
 */
export function createChangeDetector(tracker: DIAtomTracker): AtomChangeDetector {
  return new AtomChangeDetector(tracker);
}

/**
 * Create a new computed atom handler
 * @param tracker Atom tracker instance
 * @returns ComputedAtomHandler instance
 */
export function createComputedHandler(
  tracker: DIAtomTracker
): ComputedAtomHandler {
  return new ComputedAtomHandler(tracker);
}

/**
 * Check if an atom is tracked
 * @param tracker Atom tracker
 * @param atom Atom to check
 * @returns True if tracked
 */
export function isTracked(tracker: DIAtomTracker, atom: any): boolean {
  return tracker.isTracked(atom);
}

/**
 * Get tracked atoms as array
 * @param tracker Atom tracker
 * @returns Array of tracked atoms
 */
export function getTrackedAtoms(tracker: DIAtomTracker): any[] {
  return tracker.getTrackedAtoms();
}

/**
 * Get atom by name
 * @param tracker Atom tracker
 * @param name Atom name
 * @returns Atom or undefined
 */
export function getAtomByName(
  tracker: DIAtomTracker,
  name: string
): any | undefined {
  return tracker.getAtomByName(name);
}

/**
 * Watch for atom changes
 * @param detector Change detector
 * @param atom Atom to watch
 * @param listener Change listener
 * @returns Unwatch function
 */
export function watchAtom(
  detector: AtomChangeDetector,
  atom: any,
  listener: (event: import('./types/types').ChangeEvent) => void
): () => void {
  return detector.watch(atom, listener);
}

/**
 * Watch for multiple atoms changes
 * @param detector Change detector
 * @param atoms Atoms to watch
 * @param listener Change listener
 * @returns Unwatch function
 */
export function watchAtoms(
  detector: AtomChangeDetector,
  atoms: any[],
  listener: (event: import('./types/types').ChangeEvent) => void
): () => void {
  return detector.watchMany(atoms, listener);
}

/**
 * Create a computed atom dependency
 * @param atom Source atom
 * @param transform Value transform
 * @returns Computed dependency
 */
export function createDependency(
  atom: any,
  transform?: (value: any) => any
): ComputedDependency {
  return { atom, transform };
}

/**
 * Batch multiple changes
 * @param detector Change detector
 * @param fn Function to execute in batch
 */
export function batchChanges(
  detector: AtomChangeDetector,
  fn: () => void
): void {
  detector.batch(fn);
}
