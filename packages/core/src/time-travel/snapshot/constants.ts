/**
 * Snapshot module constants
 */

/** Default creator configuration */
export const DEFAULT_CREATOR_CONFIG = {
  includeTypes: ["primitive", "computed", "writable"],
  excludeAtoms: [],
  transform: null,
  validate: true,
  generateId: () => Math.random().toString(36).substring(2, 9),
};

/** Default restorer configuration */
export const DEFAULT_RESTORER_CONFIG = {
  validateBeforeRestore: true,
  strictMode: false,
  onAtomNotFound: "skip",
  transform: null,
  batchRestore: true,
};

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

/** Snapshot events */
export const SNAPSHOT_EVENTS = {
  CREATE: "create",
  RESTORE: "restore",
  VALIDATE: "validate",
  ERROR: "error",
} as const;

/** Atom types */
export const ATOM_TYPES = {
  PRIMITIVE: "primitive",
  COMPUTED: "computed",
  WRITABLE: "writable",
  DATE: "date",
  REGEXP: "regexp",
  MAP: "map",
  SET: "set",
} as const;

/** Default validation messages */
export const DEFAULT_VALIDATION_MESSAGES = {
  HAS_ID: "Snapshot must have an ID",
  HAS_TIMESTAMP: "Snapshot must have a valid timestamp",
  HAS_STATE: "Snapshot must have a state object",
  HAS_ATOMS: "Snapshot should contain at least one atom",
  VALID_ENTRIES: "All atom entries must have value, type, and name",
  VALID_TYPES: "Atom types must be valid",
  TIMESTAMP_REASONABLE: "Snapshot timestamp is unreasonable",
  ATOM_COUNT_MATCHES: "Actual atom count does not match metadata",
} as const;

/** Error codes */
export const ERROR_CODES = {
  CREATION_FAILED: "CREATION_FAILED",
  RESTORATION_FAILED: "RESTORATION_FAILED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  ATOM_NOT_FOUND: "ATOM_NOT_FOUND",
  INVALID_SNAPSHOT: "INVALID_SNAPSHOT",
  SERIALIZATION_FAILED: "SERIALIZATION_FAILED",
  DESERIALIZATION_FAILED: "DESERIALIZATION_FAILED",
} as const;
