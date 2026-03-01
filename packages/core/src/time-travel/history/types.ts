/**
 * History module constants
 */

/** Default maximum stack size */
export const DEFAULT_MAX_SIZE = 50;

/** Default validation level */
export const DEFAULT_VALIDATION_LEVEL = "warning";

/** Validation rules */
export const VALIDATION_RULES = {
  /** Snapshot must have an ID */
  HAS_ID: "has_id",
  /** Snapshot must have a timestamp */
  HAS_TIMESTAMP: "has_timestamp",
  /** Snapshot must have at least one atom */
  HAS_ATOMS: "has_atoms",
  /** Snapshots must be in chronological order */
  CHRONOLOGICAL: "chronological",
  /** Snapshot IDs must be unique */
  UNIQUE_IDS: "unique_ids",
  /** Atom values must be valid */
  VALID_VALUES: "valid_values",
} as const;

/** Compaction strategies */
export const COMPACTION_STRATEGIES = {
  /** Remove oldest snapshots */
  OLDEST: "oldest",
  /** Remove newest snapshots */
  NEWEST: "newest",
  /** Keep sparse snapshots (every Nth) */
  SPARSE: "sparse",
  /** Keep snapshots by time intervals */
  TIME_INTERVAL: "time_interval",
  /** Custom strategy */
  CUSTOM: "custom",
} as const;

/** Sort orders */
export const SORT_ORDERS = {
  /** Chronological order (oldest first) */
  CHRONOLOGICAL: "chronological",
  /** Reverse chronological order (newest first) */
  REVERSE_CHRONOLOGICAL: "reverse_chronological",
  /** By action name */
  BY_ACTION: "by_action",
  /** By atom count */
  BY_ATOM_COUNT: "by_atom_count",
} as const;

/** Event types */
export const HISTORY_EVENTS = {
  PUSH: "push",
  POP: "pop",
  CLEAR: "clear",
  EVICT: "evict",
  RESIZE: "resize",
  RESTORE: "restore",
  VALIDATE: "validate",
  COMPACT: "compact",
} as const;

/** Validation levels */
export const VALIDATION_LEVELS = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  DEBUG: "debug",
} as const;

/** Error codes */
export const ERROR_CODES = {
  INVALID_INDEX: "INVALID_INDEX",
  STACK_OVERFLOW: "STACK_OVERFLOW",
  STACK_UNDERFLOW: "STACK_UNDERFLOW",
  INVALID_SNAPSHOT: "INVALID_SNAPSHOT",
  DUPLICATE_ID: "DUPLICATE_ID",
  OUT_OF_BOUNDS: "OUT_OF_BOUNDS",
  VALIDATION_FAILED: "VALIDATION_FAILED",
} as const;

/** Time intervals for compaction (in milliseconds) */
export const COMPACTION_INTERVALS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

/** Default validation messages */
export const DEFAULT_VALIDATION_MESSAGES = {
  [VALIDATION_RULES.HAS_ID]: "Snapshot must have a valid ID",
  [VALIDATION_RULES.HAS_TIMESTAMP]: "Snapshot must have a valid timestamp",
  [VALIDATION_RULES.HAS_ATOMS]: "Snapshot should contain at least one atom",
  [VALIDATION_RULES.CHRONOLOGICAL]: "Snapshots must be in chronological order",
  [VALIDATION_RULES.UNIQUE_IDS]: "Duplicate snapshot IDs found",
  [VALIDATION_RULES.VALID_VALUES]: "Invalid atom values in snapshot",
} as const;
