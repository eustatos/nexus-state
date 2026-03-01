/**
 * Snapshot module for SimpleTimeTravel
 *
 * @packageDocumentation
 * Provides snapshot creation, restoration, validation, and serialization.
 */

import { Snapshot } from "..";
import { Store } from "../../types";
import { SnapshotCreator } from "./SnapshotCreator";
import { SnapshotRestorer } from "./SnapshotRestorer";
import { SnapshotValidator } from "./SnapshotValidator";

import type {
  SnapshotCreatorConfig,
  SnapshotRestorerConfig,
  TransactionalRestorerConfig,
  RestorationConfig,
  SnapshotFilter,
} from "./types";

// Re-export main classes
export { SnapshotCreator } from "./SnapshotCreator";
export { SnapshotRestorer } from "./SnapshotRestorer";
export { SnapshotValidator } from "./SnapshotValidator";


// Re-export types
export type {
  SnapshotCreatorConfig,
  SnapshotRestorerConfig,
  SerializationOptions,
  ValidationResult,
  CreationResult,
  RestorationResult,
  SnapshotFilter,
  SnapshotTransform,
  SnapshotComparator,
  SnapshotDiff,
  SnapshotPatch,
  RestorationCheckpoint,
  TransactionalRestorerConfig,
  TransactionalRestorationResult,
  RestorationError,
  TransactionConfig,
  RestorationOptions,
  RestorationProgress,
  CheckpointResult,
  RollbackResult,
} from "./types";

// Re-export constants
export {
  DEFAULT_CREATOR_CONFIG,
  DEFAULT_RESTORER_CONFIG,
  SERIALIZATION_FORMATS,
  VALIDATION_LEVELS,
  SNAPSHOT_EVENTS,
} from "./constants";

/**
 * Create a new snapshot creator
 * @param store Store instance
 * @param config Configuration options
 * @returns SnapshotCreator instance
 */
export function createSnapshotCreator(
  store: Store,
  config?: Partial<SnapshotCreatorConfig>,
): SnapshotCreator {
  return new SnapshotCreator(store, config);
}

/**
 * Create a new snapshot restorer
 * @param store Store instance
 * @param config Configuration options
 * @returns SnapshotRestorer instance
 */
export function createSnapshotRestorer(
  store: Store,
  config?: Partial<SnapshotRestorerConfig> & Partial<TransactionalRestorerConfig> & Partial<RestorationConfig>,
): SnapshotRestorer {
  return new SnapshotRestorer(store, config);
}

/**
 * Create a new snapshot validator
 * @returns SnapshotValidator instance
 */
export function createSnapshotValidator(): SnapshotValidator {
  return new SnapshotValidator();
}

/**
 * Compare two snapshots by timestamp
 * @param a First snapshot
 * @param b Second snapshot
 * @returns Negative if a is older, positive if a is newer
 */
export function compareByTimestamp(a: Snapshot, b: Snapshot): number {
  return (a.metadata?.timestamp || 0) - (b.metadata?.timestamp || 0);
}

/**
 * Compare two snapshots by atom count
 * @param a First snapshot
 * @param b Second snapshot
 * @returns Negative if a has fewer atoms
 */
export function compareByAtomCount(a: Snapshot, b: Snapshot): number {
  return (a.metadata?.atomCount || 0) - (b.metadata?.atomCount || 0);
}

/**
 * Filter snapshots by action name
 * @param actionName Action name to filter by
 * @returns Filter function
 */
export function filterByAction(actionName: string | RegExp): SnapshotFilter {
  return (snapshot: Snapshot) => {
    const action = snapshot.metadata?.action || "";
    if (actionName instanceof RegExp) {
      return actionName.test(action);
    }
    return action === actionName;
  };
}

/**
 * Filter snapshots by time range
 * @param start Start timestamp
 * @param end End timestamp
 * @returns Filter function
 */
export function filterByTimeRange(start: number, end: number): SnapshotFilter {
  return (snapshot: Snapshot) => {
    const timestamp = snapshot.metadata?.timestamp || 0;
    return timestamp >= start && timestamp <= end;
  };
}

/**
 * Filter snapshots by atom value
 * @param atomName Atom name
 * @param value Expected value
 * @returns Filter function
 */
export function filterByAtomValue(
  atomName: string,
  value: unknown,
): SnapshotFilter {
  return (snapshot: Snapshot) => {
    const entry = snapshot.state?.[atomName];
    return entry?.value === value;
  };
}
