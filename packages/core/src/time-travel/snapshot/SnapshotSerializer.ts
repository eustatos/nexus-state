/**
 * Snapshot module types
 */

import type { Snapshot } from "../types";

/**
 * Configuration for SnapshotCreator
 */
export interface SnapshotCreatorConfig {
  /** Types of atoms to include */
  includeTypes: string[];
  /** Atoms to exclude by name */
  excludeAtoms: string[];
  /** Transform function for snapshots */
  transform: ((snapshot: Snapshot) => Snapshot) | null;
  /** Whether to validate after creation */
  validate: boolean;
  /** ID generator function */
  generateId: () => string;
}

/**
 * Configuration for SnapshotRestorer
 */
export interface SnapshotRestorerConfig {
  /** Whether to validate before restore */
  validateBeforeRestore: boolean;
  /** Strict mode - fail on any error */
  strictMode: boolean;
  /** Behavior when atom not found */
  onAtomNotFound: "skip" | "warn" | "throw";
  /** Transform function before restore */
  transform: ((snapshot: Snapshot) => Snapshot) | null;
  /** Whether to restore in batch mode */
  batchRestore: boolean;
}

/**
 * Serialization options
 */
export interface SerializationOptions {
  /** Serialization format */
  format: "json" | "binary" | "compact";
  /** Pretty print JSON */
  pretty: boolean;
  /** Enable compression */
  compress: boolean;
  /** Include metadata in serialization */
  includeMetadata: boolean;
}

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Rule name */
  name: string;
  /** Validation function */
  validate: (snapshot: Snapshot) => boolean;
  /** Error message */
  message: string;
  /** Severity level */
  level: "error" | "warning";
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Validation timestamp */
  timestamp: number;
}

/**
 * Creation result
 */
export interface CreationResult {
  /** Whether creation was successful */
  success: boolean;
  /** Created snapshot (if successful) */
  snapshot: Snapshot | null;
  /** Duration in milliseconds */
  duration: number;
  /** Creation timestamp */
  timestamp: number;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Restoration result
 */
export interface RestorationResult {
  /** Whether restoration was successful */
  success: boolean;
  /** Number of atoms restored */
  restoredCount: number;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Duration in milliseconds */
  duration: number;
  /** Restoration timestamp */
  timestamp: number;
}

/**
 * Snapshot filter function
 */
export type SnapshotFilter = (snapshot: Snapshot) => boolean;

/**
 * Snapshot transform function
 */
export type SnapshotTransform = (snapshot: Snapshot) => Snapshot;

/**
 * Snapshot comparator function
 */
export type SnapshotComparator = (a: Snapshot, b: Snapshot) => number;

/**
 * Snapshot diff
 */
export interface SnapshotDiff {
  /** Whether snapshots are different */
  different: boolean;
  /** Added atoms */
  added: string[];
  /** Removed atoms */
  removed: string[];
  /** Changed atoms */
  changed: Array<{
    name: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
}

/**
 * Snapshot patch
 */
export interface SnapshotPatch {
  /** Patch type */
  type: "add" | "remove" | "modify";
  /** Atom name */
  atomName: string;
  /** New value (for add/modify) */
  value?: unknown;
}
