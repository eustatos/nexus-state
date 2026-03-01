/**
 * Tracking module for SimpleTimeTravel
 *
 * @packageDocumentation
 * Provides atom tracking, change detection, and computed atom handling.
 */

import { AtomChangeDetector } from "./AtomChangeDetector";
import { AtomTracker } from "./AtomTracker";
import { ComputedAtomHandler } from "./ComputedAtomHandler";
import type { ComputedDependency, ChangeListener, TrackerConfig } from "./types";
import {
  LRUCleanupStrategy,
  LFUCleanupStrategy,
  FIFOCleanupStrategy,
  TimeBasedCleanupStrategy,
  createCleanupStrategy,
} from "./CleanupStrategies";

// Re-export main classes
export { AtomTracker } from "./AtomTracker";
export { AtomChangeDetector } from "./AtomChangeDetector";
export { ComputedAtomHandler } from "./ComputedAtomHandler";
export {
  LRUCleanupStrategy,
  LFUCleanupStrategy,
  FIFOCleanupStrategy,
  TimeBasedCleanupStrategy,
  createCleanupStrategy,
} from "./CleanupStrategies";

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
} from "./types";

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
 * Create a new atom tracker
 * @param store Store instance
 * @param config Configuration options
 * @returns AtomTracker instance
 */
export function createAtomTracker(
  store: any,
  config?: Partial<TrackerConfig>,
): AtomTracker {
  return new AtomTracker(store, config);
}

/**
 * Create a new change detector
 * @param tracker Atom tracker instance
 * @returns AtomChangeDetector instance
 */
export function createChangeDetector(tracker: AtomTracker): AtomChangeDetector {
  return new AtomChangeDetector(tracker);
}

/**
 * Create a new computed atom handler
 * @param tracker Atom tracker instance
 * @returns ComputedAtomHandler instance
 */
export function createComputedHandler(
  tracker: AtomTracker,
): ComputedAtomHandler {
  return new ComputedAtomHandler(tracker);
}

/**
 * Check if an atom is tracked
 * @param tracker Atom tracker
 * @param atom Atom to check
 * @returns True if tracked
 */
export function isTracked(tracker: AtomTracker, atom: any): boolean {
  return tracker.isTracked(atom);
}

/**
 * Get tracked atoms as array
 * @param tracker Atom tracker
 * @returns Array of tracked atoms
 */
export function getTrackedAtoms(tracker: AtomTracker): any[] {
  return tracker.getTrackedAtoms();
}

/**
 * Get atom by name
 * @param tracker Atom tracker
 * @param name Atom name
 * @returns Atom or undefined
 */
export function getAtomByName(
  tracker: AtomTracker,
  name: string,
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
  listener: ChangeListener,
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
  listener: ChangeListener,
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
  transform?: (value: any) => any,
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
  fn: () => void,
): void {
  detector.batch(fn);
}
