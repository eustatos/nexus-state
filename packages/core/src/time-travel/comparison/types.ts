/**
 * Types for snapshot comparison functionality
 */

import type { SnapshotStateEntry } from "../types";

/**
 * Comparison options for snapshot comparison
 */
export interface ComparisonOptions {
  /** Deep compare objects */
  deepCompare: boolean;
  /** Maximum depth for deep comparison */
  maxDepth: number;
  /** Include metadata in comparison */
  compareMetadata: boolean;
  /** Cache comparison results */
  cacheResults: boolean;
  /** Maximum cache entries */
  cacheSize: number;
  /** Skip function comparison */
  ignoreFunctions: boolean;
  /** Skip symbol comparison */
  ignoreSymbols: boolean;
  /** How to handle circular references */
  circularHandling: "error" | "path" | "ignore";
  /** Equality check method */
  valueEquality: "strict" | "loose" | "json";
  /** Colorize output in console */
  colorize: boolean;
}

/**
 * Default comparison options
 */
export const DEFAULT_COMPARISON_OPTIONS: ComparisonOptions = {
  deepCompare: true,
  maxDepth: 100,
  compareMetadata: true,
  cacheResults: true,
  cacheSize: 100,
  ignoreFunctions: false,
  ignoreSymbols: false,
  circularHandling: "path",
  valueEquality: "strict",
  colorize: false,
};

/**
 * Summary of snapshot comparison
 */
export interface ComparisonSummary {
  /** Total number of atoms compared */
  totalAtoms: number;
  /** Number of atoms that changed */
  changedAtoms: number;
  /** Number of atoms added */
  addedAtoms: number;
  /** Number of atoms removed */
  removedAtoms: number;
  /** Number of atoms unchanged */
  unchangedAtoms: number;
  /** Whether there are any changes */
  hasChanges: boolean;
  /** Percentage of changed atoms (0-100) */
  changePercentage: number;
}

/**
 * Status of atom comparison
 */
export type AtomComparisonStatus = "added" | "removed" | "modified" | "unchanged";

/**
 * Nested change within an object or array
 */
export interface NestedChange {
  /** Path to the changed property */
  path: string[];
  /** Type of change */
  type: "added" | "removed" | "modified";
  /** Old value (for modified/removed) */
  oldValue?: any;
  /** New value (for added/modified) */
  newValue?: any;
  /** Nested diff for complex values */
  diff?: ValueDiff;
}

/**
 * Comparison result for a single atom
 */
export interface AtomComparison {
  /** Atom ID */
  atomId: string;
  /** Atom name */
  atomName: string;
  /** Atom type */
  atomType: "primitive" | "computed" | "writable";
  /** Comparison status */
  status: AtomComparisonStatus;

  /** Old value (if exists) */
  oldValue?: any;
  /** New value (if exists) */
  newValue?: any;
  /** Value diff (for modified atoms) */
  valueDiff?: ValueDiff;

  /** Old metadata (if exists) */
  oldMetadata?: SnapshotStateEntry;
  /** New metadata (if exists) */
  newMetadata?: SnapshotStateEntry;
  /** List of metadata changes */
  metadataChanges?: string[];

  /** Nested changes (for objects) */
  nestedChanges?: NestedChange[];

  /** Path in state tree */
  path?: string[];
}

/**
 * Type of value diff
 */
export type ValueDiffType = "primitive" | "array" | "object" | "function" | "circular";

/**
 * Diff result for a value
 */
export interface ValueDiff {
  /** Type of diff */
  type: ValueDiffType;
  /** Whether values are equal */
  equal: boolean;

  /** For primitives */
  oldPrimitive?: any;
  newPrimitive?: any;

  /** For arrays */
  arrayChanges?: {
    /** Indices of added elements */
    added: number[];
    /** Indices of removed elements */
    removed: number[];
    /** Indices of moved elements */
    moved: number[];
    /** Modified elements with their diffs */
    modified: Array<{ index: number; diff: ValueDiff }>;
  };

  /** For objects */
  objectChanges?: Record<string, ValueDiff>;

  /** For circular references */
  circularPath?: string[];
}

/**
 * Statistics for comparison operation
 */
export interface ComparisonStats {
  /** Duration in milliseconds */
  duration: number;
  /** Memory used in bytes */
  memoryUsed: number;
  /** Maximum depth traversed */
  depth: number;
  /** Total number of comparisons made */
  totalComparisons: number;
  /** Number of cache hits */
  cacheHits: number;
  /** Number of cache misses */
  cacheMisses: number;
}

/**
 * Metadata for comparison result
 */
export interface ComparisonMetadata {
  /** Snapshot A info */
  snapshotA: {
    /** Snapshot ID */
    id: string;
    /** Snapshot timestamp */
    timestamp: number;
    /** Action name (if any) */
    action?: string;
  };
  /** Snapshot B info */
  snapshotB: {
    /** Snapshot ID */
    id: string;
    /** Snapshot timestamp */
    timestamp: number;
    /** Action name (if any) */
    action?: string;
  };
  /** Time difference in milliseconds between snapshots */
  timeDifference: number;
  /** Options used for comparison */
  options: ComparisonOptions;
}

/**
 * Complete comparison result between two snapshots
 */
export interface SnapshotComparison {
  /** Unique comparison ID */
  id: string;
  /** Comparison timestamp */
  timestamp: number;
  /** Summary of changes */
  summary: ComparisonSummary;
  /** Array of atom comparisons */
  atoms: AtomComparison[];
  /** Comparison statistics */
  statistics: ComparisonStats;
  /** Comparison metadata */
  metadata: ComparisonMetadata;
}

/**
 * Cached comparison result
 */
export interface CachedComparison {
  /** The comparison result */
  comparison: SnapshotComparison;
  /** Cache entry timestamp */
  timestamp: number;
  /** Cache statistics */
  stats: {
    cacheHits: number;
    cacheMisses: number;
  };
}

/**
 * Format type for comparison output
 */
export type ComparisonFormat = "detailed" | "summary" | "json";

/**
 * Visualization format for changes
 */
export type VisualizationFormat = "tree" | "list";

/**
 * Export format for comparison
 */
export type ExportFormat = "json" | "html" | "md";
