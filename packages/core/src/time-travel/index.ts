/**
 * SimpleTimeTravel - Time travel debugging for Nexus State
 *
 * @packageDocumentation
 * Main entry point for the time travel package.
 * Provides time travel capabilities for state management.
 */

// ============================================================================
// Core exports
// ============================================================================

import { SimpleTimeTravel } from "./core/SimpleTimeTravel";
export { SimpleTimeTravel };

// ============================================================================
// Types from main types file
// ============================================================================

import type {
  TimeTravelAPI,
  TimeTravelOptions,
  Snapshot,
  SnapshotMetadata,
  SnapshotStateEntry,
  HistoryEventType,
  HistoryEventListener,
  TimeTravelStats,
  StoreRegistry,
  TimeTravelMiddlewareConfig,
  BatchResult,
  HistorySearchCriteria,
  SearchResult,
  ExportFormat,
} from "./types";

export type {
  TimeTravelAPI,
  TimeTravelOptions,
  Snapshot,
  SnapshotMetadata,
  SnapshotStateEntry,
  HistoryEventType,
  HistoryEventListener,
  TimeTravelStats,
  StoreRegistry,
  TimeTravelMiddlewareConfig,
  BatchResult,
  HistorySearchCriteria,
  SearchResult,
  ExportFormat,
};

// ============================================================================
// Core components types
// ============================================================================

import type {
  HistoryManagerConfig,
  NavigationResult,
  HistoryState,
  HistoryEvent,
  HistoryStats,
  HistoryDiff,
  HistorySearchResult as CoreHistorySearchResult,
  HistorySearchOptions,
  CompactionOptions,
  SerializedHistory,
} from "./core/types";

export type {
  HistoryManagerConfig,
  NavigationResult,
  HistoryState,
  HistoryEvent,
  HistoryStats,
  HistoryDiff,
  CoreHistorySearchResult as HistorySearchResult,
  HistorySearchOptions,
  CompactionOptions,
  SerializedHistory,
};

// ============================================================================
// Core components
// ============================================================================

import { HistoryManager } from "./core/HistoryManager";
import { HistoryNavigator } from "./core/HistoryNavigator";

export { HistoryManager, HistoryNavigator };

// ============================================================================
// Snapshot components and types
// ============================================================================

import { SnapshotCreator } from "./snapshot/SnapshotCreator";
import { SnapshotRestorer } from "./snapshot/SnapshotRestorer";
import { SnapshotValidator } from "./snapshot/SnapshotValidator";

export {
  SnapshotCreator,
  SnapshotRestorer,
  SnapshotValidator,
};

import type {
  SnapshotCreatorConfig,
  SnapshotRestorerConfig,
  SerializationOptions,
  ValidationResult,
  CreationResult,
  RestorationResult,
  SnapshotFilter,
  SnapshotTransform,
  SnapshotComparator,
  SnapshotDiff as SnapshotDiffType,
  SnapshotPatch,
  EnhancedSnapshot,
  SnapshotGroup,
  SnapshotSearchCriteria as SnapshotSearchCriteriaType,
  SnapshotStatistics,
  SnapshotExportOptions,
  SnapshotImportOptions,
  SnapshotImportResult,
  SnapshotMigration,
  CompressionOptions,
  IntegrityCheckResult,
  SnapshotEvent as SnapshotEventType,
  SnapshotEventListener,
  SnapshotStorageAdapter,
  SnapshotCacheConfig,
  SnapshotProcessor,
  SnapshotPipeline,
  SnapshotPipelineResult,
  SnapshotTemplate,
  SnapshotFromTemplateResult,
} from "./snapshot/types";

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
  SnapshotDiffType as SnapshotDiff,
  SnapshotPatch,
  EnhancedSnapshot,
  SnapshotGroup,
  SnapshotSearchCriteriaType as SnapshotSearchCriteria,
  SnapshotStatistics,
  SnapshotExportOptions,
  SnapshotImportOptions,
  SnapshotImportResult,
  SnapshotMigration,
  CompressionOptions,
  IntegrityCheckResult,
  SnapshotEventType as SnapshotEvent,
  SnapshotEventListener,
  SnapshotStorageAdapter,
  SnapshotCacheConfig,
  SnapshotProcessor,
  SnapshotPipeline,
  SnapshotPipelineResult,
  SnapshotTemplate,
  SnapshotFromTemplateResult,
};

// ============================================================================
// Tracking components and types
// ============================================================================

import { AtomTracker } from "./tracking/AtomTracker";
import { AtomChangeDetector } from "./tracking/AtomChangeDetector";
import { ComputedAtomHandler } from "./tracking/ComputedAtomHandler";

export { AtomTracker, AtomChangeDetector, ComputedAtomHandler };

import type {
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
} from "./tracking/types";

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
};

// ============================================================================

// ============================================================================
// Compression module
// ============================================================================

import * as Compression from "./compression";

export { Compression };
export type {
  CompressionStrategy,
  CompressionStrategyConfig,
  CompressionMetadata,
  TimeBasedCompressionConfig,
  SizeBasedCompressionConfig,
  SignificanceBasedCompressionConfig,
  CompressionFactoryConfig,
  CompressionStrategyType,
} from "./compression";

export {
  BaseCompressionStrategy,
  NoCompressionStrategy,
  TimeBasedCompression,
  SizeBasedCompression,
  SignificanceBasedCompression,
  CompressionFactory,
  compareSnapshots,
} from "./compression";

// History utilities and types
// ============================================================================

// ============================================================================
// Utility functions
// ============================================================================

/**
 * Check if an object is a snapshot
 * @param obj - Object to check
 * @returns True if object is a valid snapshot
 */
export function isSnapshot(obj: unknown): obj is Snapshot {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "state" in obj &&
    "metadata" in obj
  );
}

/**
 * Compare two snapshots by timestamp
 * @param a - First snapshot
 * @param b - Second snapshot
 * @returns Negative if a is older, positive if a is newer
 */
export function compareByTimestamp(a: Snapshot, b: Snapshot): number {
  return a.metadata.timestamp - b.metadata.timestamp;
}

/**
 * Compare two snapshots by atom count
 * @param a First snapshot
 * @param b Second snapshot
 * @returns Negative if a has fewer atoms
 */
export function compareByAtomCount(a: Snapshot, b: Snapshot): number {
  return (a.metadata.atomCount || 0) - (b.metadata.atomCount || 0);
}

/**
 * Create an empty snapshot
 * @param action - Optional action name
 * @returns Empty snapshot
 */
export function createEmptySnapshot(action?: string): Snapshot {
  return {
    id: Math.random().toString(36).substring(2, 9),
    state: {},
    metadata: {
      timestamp: Date.now(),
      action,
      atomCount: 0,
    },
  };
}

/**
 * Filter snapshots by action name
 * @param actionName Action name to filter by
 * @returns Filter function
 */
export function filterByAction(
  actionName: string | RegExp,
): (snapshot: Snapshot) => boolean {
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
export function filterByTimeRange(
  start: number,
  end: number,
): (snapshot: Snapshot) => boolean {
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
  value: any,
): (snapshot: Snapshot) => boolean {
  return (snapshot: Snapshot) => {
    const entry = snapshot.state?.[atomName];
    return entry?.value === value;
  };
}

/**
 * Batch multiple operations
 * @param operations Array of functions to execute
 * @returns Batch result
 */
export function batch<T>(
  operations: Array<() => T>,
): Array<{ success: boolean; result?: T; error?: string }> {
  return operations.map((op) => {
    try {
      return { success: true, result: op() };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
}

/**
 * Merge two snapshots
 * @param target Target snapshot
 * @param source Source snapshot
 * @returns Merged snapshot
 */
export function mergeSnapshots(target: Snapshot, source: Snapshot): Snapshot {
  return {
    id: target.id,
    state: {
      ...target.state,
      ...source.state,
    },
    metadata: {
      ...target.metadata,
      ...source.metadata,
      timestamp: Date.now(),
      atomCount:
        Object.keys(target.state).length + Object.keys(source.state).length,
    },
  };
}

/**
 * Create a snapshot patch
 * @param source Source snapshot
 * @param target Target snapshot
 * @returns Patch operations
 */
export function createPatch(
  source: Snapshot,
  target: Snapshot,
): SnapshotPatch[] {
  const patches: SnapshotPatch[] = [];

  // Find added and modified atoms
  Object.entries(target.state).forEach(([key, entry]) => {
    const sourceEntry = source.state[key];
    if (!sourceEntry) {
      patches.push({ type: "add", atomName: key, value: entry.value });
    } else if (
      JSON.stringify(sourceEntry.value) !== JSON.stringify(entry.value)
    ) {
      patches.push({
        type: "modify",
        atomName: key,
        value: entry.value,
        oldValue: sourceEntry.value,
      });
    }
  });

  // Find removed atoms
  Object.keys(source.state).forEach((key) => {
    if (!target.state[key]) {
      patches.push({ type: "remove", atomName: key });
    }
  });

  return patches;
}

/**
 * Apply patch to snapshot
 * @param snapshot Source snapshot
 * @param patches Patches to apply
 * @returns New snapshot
 */
export function applyPatch(
  snapshot: Snapshot,
  patches: SnapshotPatch[],
): Snapshot {
  const newState = { ...snapshot.state };

  patches.forEach((patch) => {
    switch (patch.type) {
      case "add":
      case "modify":
        newState[patch.atomName] = {
          ...newState[patch.atomName],
          value: patch.value,
          type: newState[patch.atomName]?.type || "primitive",
          name: patch.atomName,
        };
        break;
      case "remove":
        delete newState[patch.atomName];
        break;
    }
  });

  return {
    ...snapshot,
    state: newState,
    metadata: {
      ...snapshot.metadata,
      timestamp: Date.now(),
      atomCount: Object.keys(newState).length,
    },
  };
}

// ============================================================================
// Constants
// ============================================================================

/** Current version of SimpleTimeTravel */
export const VERSION = "1.0.0";

/** Default maximum history size */
export const DEFAULT_MAX_HISTORY = 50;

/** Default auto-capture setting */
export const DEFAULT_AUTO_CAPTURE = true;

/** Supported registry modes */
export const REGISTRY_MODES = {
  GLOBAL: "global",
  ISOLATED: "isolated",
} as const;

/** Event types */
export const EVENT_TYPES = {
  CAPTURE: "capture",
  UNDO: "undo",
  REDO: "redo",
  JUMP: "jump",
  CLEAR: "clear",
  IMPORT: "import",
  ERROR: "error",
} as const;

/** Snapshot events */
export const SNAPSHOT_EVENTS = {
  CREATED: "created",
  RESTORED: "restored",
  DELETED: "deleted",
  UPDATED: "updated",
  EXPORTED: "exported",
  IMPORTED: "imported",
} as const;

/** Tracking events */
export const TRACKING_EVENTS = {
  TRACK: "track",
  UNTRACK: "untrack",
  CHANGE: "change",
  ACCESS: "access",
  ERROR: "error",
} as const;

/** History events */
export const HISTORY_EVENTS = {
  PUSH: "push",
  POP: "pop",
  CLEAR: "clear",
  EVICT: "evict",
  RESIZE: "resize",
} as const;

/** Change types */
export const CHANGE_TYPES = {
  CREATED: "created",
  DELETED: "deleted",
  VALUE: "value",
  TYPE: "type",
} as const;

/** Atom types */
export const ATOM_TYPES = {
  PRIMITIVE: "primitive",
  COMPUTED: "computed",
  WRITABLE: "writable",
} as const;

/** Serialization formats */
export const SERIALIZATION_FORMATS = {
  JSON: "json",
  BINARY: "binary",
  COMPACT: "compact",
} as const;

/** Validation levels */
export const VALIDATION_LEVELS = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const;

// ============================================================================
// Default export
// ============================================================================

export default SimpleTimeTravel;
