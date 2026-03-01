/**
 * Core internal types for SimpleTimeTravel
 * These types are used internally by core components
 */

import type { Snapshot } from "../types";

/**
 * Represents the complete history state
 */
export interface HistoryState {
  /** Past snapshots in chronological order */
  past: Snapshot[];
  /** Current snapshot */
  current: Snapshot | null;
  /** Future snapshots in chronological order */
  future: Snapshot[];
}

/**
 * Configuration for HistoryManager
 */
export interface HistoryManagerConfig {
  /** Maximum number of snapshots to keep in history */
  maxHistory: number;
  /** Whether to validate snapshots before adding */
  validateSnapshots?: boolean;
  /** Custom validator function */
  validator?: (snapshot: Snapshot) => boolean;
}

/**
 * Result of a navigation operation
 */
export interface NavigationResult {
  /** Whether the navigation was successful */
  success: boolean;
  /** The snapshot that was navigated to (if successful) */
  snapshot?: Snapshot;
  /** Error message (if unsuccessful) */
  error?: string;
}

/**
 * Represents a position in history
 */
export interface HistoryIndex {
  /** Index in the full history array */
  index: number;
  /** Whether this is a valid position */
  isValid: boolean;
  /** Total length of history */
  totalLength: number;
}

/**
 * Bounds of the history timeline
 */
export interface HistoryBounds {
  /** Oldest available index */
  minIndex: number;
  /** Newest available index */
  maxIndex: number;
  /** Current position */
  currentIndex: number;
}

/**
 * Type of history operation
 */
export type HistoryOperation =
  | { type: "capture"; snapshot: Snapshot }
  | { type: "undo"; from: Snapshot; to: Snapshot }
  | { type: "redo"; from: Snapshot; to: Snapshot }
  | { type: "jump"; fromIndex: number; toIndex: number; snapshot: Snapshot }
  | { type: "clear" };

/**
 * Validation result for history operations
 */
export interface HistoryValidationResult {
  /** Whether the operation is valid */
  isValid: boolean;
  /** Reason if invalid */
  reason?: string;
  /** Suggested action */
  suggestion?: string;
}

/**
 * Event emitted by history manager
 */
export interface HistoryEvent {
  /** Type of event */
  type: "change" | "error" | "warning";
  /** Operation that triggered the event */
  operation: HistoryOperation;
  /** Timestamp of the event */
  timestamp: number;
  /** Additional data */
  data?: unknown;
}

/**
 * History manager event handler
 */
export type HistoryEventHandler = (event: HistoryEvent) => void;

/**
 * Options for history navigation
 */
export interface NavigationOptions {
  /** Whether to validate the navigation */
  validate?: boolean;
  /** Whether to emit events */
  emitEvents?: boolean;
  /** Custom context */
  context?: Record<string, unknown>;
}

/**
 * History statistics
 */
export interface HistoryStats {
  /** Total number of snapshots */
  totalSnapshots: number;
  /** Number of past snapshots */
  pastCount: number;
  /** Number of future snapshots */
  futureCount: number;
  /** Whether there is a current snapshot */
  hasCurrent: boolean;
  /** Memory usage estimate (in bytes) */
  estimatedMemoryUsage: number;
  /** Oldest snapshot timestamp */
  oldestTimestamp?: number;
  /** Newest snapshot timestamp */
  newestTimestamp?: number;
  /** Compression metadata if compression was applied */
  compressionMetadata?: import("../types").CompressionMetadata;
  /** Original history size before compression */
  originalHistorySize?: number;
  /** Compressed history size after compression */
  compressedHistorySize?: number;
}

/**
 * Serialized history for persistence
 */
export interface SerializedHistory {
  /** Version of the serialization format */
  version: string;
  /** Serialized past snapshots */
  past: SerializedSnapshot[];
  /** Serialized current snapshot */
  current: SerializedSnapshot | null;
  /** Serialized future snapshots */
  future: SerializedSnapshot[];
  /** Metadata about the serialization */
  metadata: {
    timestamp: number;
    snapshotCount: number;
    maxHistory: number;
  };
}

/**
 * Serialized snapshot format
 */
export interface SerializedSnapshot {
  id: string;
  state: Record<string, SerializedStateEntry>;
  metadata: {
    timestamp: number;
    action?: string;
    atomCount: number;
  };
}

/**
 * Serialized state entry
 */
export interface SerializedStateEntry {
  value: unknown;
  type: string;
  name: string;
  atomId?: string;
}

/**
 * History compaction options
 */
export interface CompactionOptions {
  /** Maximum age in milliseconds */
  maxAge?: number;
  /** Maximum number of snapshots to keep */
  maxSnapshots?: number;
  /** Strategy for compaction */
  strategy: "oldest" | "sparse" | "custom";
  /** Custom compaction function */
  customFn?: (snapshots: Snapshot[]) => Snapshot[];
}

/**
 * History diff result
 */
export interface HistoryDiff {
  /** Whether histories are different */
  hasChanges: boolean;
  /** Added snapshots */
  added: Snapshot[];
  /** Removed snapshots */
  removed: Snapshot[];
  /** Changed snapshots (by id) */
  changed: Array<{ old: Snapshot; new: Snapshot }>;
}

/**
 * History search options
 */
export interface HistorySearchOptions {
  /** Search by action name */
  action?: string | RegExp;
  /** Search by time range */
  timeRange?: { from: number; to: number };
  /** Search by atom value */
  atomValue?: { atomName: string; value: unknown };
  /** Maximum number of results */
  limit?: number;
}

/**
 * History search result
 */
export interface HistorySearchResult {
  /** Found snapshots */
  snapshots: Snapshot[];
  /** Total matches found */
  total: number;
  /** Search metadata */
  metadata: {
    searchTime: number;
    criteria: HistorySearchOptions;
  };
}
