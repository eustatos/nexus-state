/**
 * Snapshot module types
 */

import type { Snapshot, SnapshotMetadata } from "../types";

/**
 * Configuration for SnapshotCreator
 */
export interface SnapshotCreatorConfig {
  /** Types of atoms to include (primitive, computed, writable) */
  includeTypes: Array<"primitive" | "computed" | "writable" | string>;

  /** Atoms to exclude by name */
  excludeAtoms: string[];

  /** Transform function for snapshots before storing */
  transform: ((snapshot: Snapshot) => Snapshot) | null;

  /** Whether to validate after creation */
  validate: boolean;

  /** ID generator function */
  generateId: () => string;

  /** Whether to include metadata in snapshot */
  includeMetadata: boolean;

  /** Custom serializer for values */
  valueSerializer?: (value: unknown) => unknown;

  /** Maximum number of atoms per snapshot */
  maxAtomsPerSnapshot?: number;
  /** Whether auto-capture is enabled (for state change detection) */
  autoCapture?: boolean;
  /** Whether to skip state change check (useful for initial captures) */
  skipStateCheck?: boolean;
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

  /** Custom deserializer for values */
  valueDeserializer?: (value: unknown, type: string) => unknown;

  /** Timeout for restore operation (ms) */
  timeout?: number;

  /** Whether to skip atoms with errors */
  skipErrors: boolean;
}

/**
 * Serialization options
 */
export interface SerializationOptions {
  /** Serialization format */
  format: "json" | "binary" | "compact" | "msgpack";

  /** Pretty print JSON */
  pretty: boolean;

  /** Enable compression */
  compress: boolean;

  /** Include metadata in serialization */
  includeMetadata: boolean;

  /** Encoding for binary format */
  encoding?: "base64" | "hex" | "utf8";

  /** Compression level (1-9) */
  compressionLevel?: number;

  /** Whether to include version info */
  includeVersion?: boolean;
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
  level: "error" | "warning" | "info";

  /** Whether rule is enabled */
  enabled?: boolean;

  /** Custom error handler */
  onError?: (snapshot: Snapshot, message: string) => void;
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

  /** Info messages */
  info: string[];

  /** Validation timestamp */
  timestamp: number;

  /** Duration in milliseconds */
  duration: number;

  /** Number of rules checked */
  rulesChecked: number;

  /** Detailed rule results */
  ruleResults?: Array<{
    rule: string;
    passed: boolean;
    level: string;
    message?: string;
  }>;
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

  /** Number of atoms captured */
  atomCount: number;

  /** Size estimate in bytes */
  sizeEstimate?: number;
}

/**
 * Restoration result
 */
export interface RestorationResult {
  /** Whether restoration was successful */
  success: boolean;

  /** Number of atoms restored */
  restoredCount: number;

  /** Total atoms in snapshot */
  totalAtoms: number;

  /** Error messages */
  errors: string[];

  /** Warning messages */
  warnings: string[];

  /** Duration in milliseconds */
  duration: number;

  /** Restoration timestamp */
  timestamp: number;

  /** List of atoms that failed */
  failedAtoms?: Array<{
    name: string;
    error: string;
  }>;

  /** Whether operation timed out */
  timedOut?: boolean;
}

/**
 * Checkpoint for transactional restoration
 */
export interface RestorationCheckpoint {
  /** Unique checkpoint ID */
  id: string;

  /** Timestamp when checkpoint was created */
  timestamp: number;

  /** Snapshot ID being restored */
  snapshotId: string;

  /** Previous values of atoms before restoration (atom ID -> previous value) */
  previousValues: Map<symbol, unknown>;

  /** Checkpoint metadata */
  metadata: {
    /** Number of atoms being restored */
    atomCount: number;
    /** Duration of restoration in milliseconds */
    duration: number;
    /** Whether restoration is in progress */
    inProgress: boolean;
    /** Whether checkpoint has been committed */
    committed: boolean;
  };
}

/**
 * Configuration for transactional restoration
 */
export interface TransactionalRestorerConfig {
  /** Enable transactional restoration */
  enableTransactions: boolean;

  /** Automatically rollback on error */
  rollbackOnError: boolean;

  /** Validate snapshot before restoration */
  validateBeforeRestore: boolean;

  /** Batch size for batch restoration (0 = no batching) */
  batchSize?: number;

  /** Maximum time for restoration in milliseconds */
  timeout?: number;

  /** Error handling strategy */
  onError?: "rollback" | "continue" | "throw";

  /** Maximum number of checkpoints to keep in memory */
  maxCheckpoints?: number;

  /** Checkpoint timeout in milliseconds (auto-cleanup) */
  checkpointTimeout?: number;
}

/**
 * Transactional restoration result
 */
export interface TransactionalRestorationResult extends RestorationResult {
  /** Checkpoint ID if transactional restoration was used */
  checkpointId?: string;

  /** Whether rollback was performed */
  rollbackPerformed?: boolean;

  /** List of successfully restored atoms */
  successAtoms?: Array<{
    name: string;
    atomId: symbol;
  }>;

  /** List of failed atoms with error details */
  failedAtomDetails?: Array<{
    name: string;
    atomId: symbol;
    error: string;
    action: string;
  }>;

  /** Number of atoms that were rolled back */
  rolledBackCount?: number;

  /** Whether the operation was interrupted */
  interrupted?: boolean;
}

/**
 * Error class for restoration failures
 */
export class RestorationError extends Error {
  constructor(
    message: string,
    public readonly details?: {
      errors?: string[];
      failedAtoms?: Array<{ name: string; atomId: symbol; error: string }>;
    },
  ) {
    super(message);
    this.name = "RestorationError";
  }
}

/**
 * Transaction configuration
 */
export interface TransactionConfig {
  /** Enable transactions */
  enabled: boolean;

  /** Auto-rollback on error */
  autoRollback: boolean;

  /** Checkpoint timeout in milliseconds */
  checkpointTimeout: number;

  /** Maximum number of stored checkpoints */
  maxCheckpoints: number;

  /** Error handler */
  onError: "rollback" | "continue" | "throw";
}

/**
 * Restoration options with transaction support
 */
export interface RestorationOptions {
  /** Enable transactional restoration */
  transactional?: boolean;

  /** Transaction configuration */
  transactionConfig?: TransactionConfig;

  /** Checkpoint ID for manual rollback */
  checkpointId?: string;

  /** Progress callback for batch operations */
  onProgress?: (progress: RestorationProgress) => void;
}

/**
 * Restoration progress information
 */
export interface RestorationProgress {
  /** Current atom index */
  currentIndex: number;

  /** Total atoms to restore */
  totalAtoms: number;

  /** Current atom being restored */
  currentAtomName: string;

  /** Current atom ID */
  currentAtomId?: symbol;

  /** Whether this is a rollback operation */
  isRollback: boolean;

  /** Timestamp when this progress update was created */
  timestamp: number;
}

/**
 * Checkpoint management result
 */
export interface CheckpointResult {
  /** Checkpoint ID */
  checkpointId: string;

  /** Whether creation was successful */
  success: boolean;

  /** Error message if failed */
  error?: string;

  /** Number of atoms in checkpoint */
  atomCount: number;

  /** Timestamp when checkpoint was created */
  timestamp: number;
}

/**
 * Rollback result
 */
export interface RollbackResult {
  /** Whether rollback was successful */
  success: boolean;

  /** Checkpoint ID that was rolled back */
  checkpointId: string;

  /** Number of atoms successfully rolled back */
  rolledBackCount: number;

  /** Number of atoms that failed to rollback */
  failedCount: number;

  /** List of atoms that failed to rollback */
  failedAtoms?: Array<{
    name: string;
    atomId: symbol;
    error: string;
  }>;

  /** Error message if failed */
  error?: string;

  /** Timestamp when rollback completed */
  timestamp: number;
}

/**
 * Restoration error details
 */
export interface RestorationErrorDetails {
  /** Atom name */
  atomName: string;

  /** Atom ID */
  atomId: string;

  /** Error message */
  error: string;

  /** Original value (if available) */
  originalValue?: unknown;

  /** Attempted value (if available) */
  attemptedValue?: unknown;
}

/**
 * Restoration configuration
 */
export interface RestorationConfig {
  /** Validate before restore */
  validateBeforeRestore: boolean;

  /** Strict mode - fail on any error */
  strictMode: boolean;

  /** Behavior when atom not found */
  onAtomNotFound: "error" | "warn" | "skip" | "throw";

  /** Batch restore enabled */
  batchRestore: boolean;

  /** Batch size for restoration */
  batchSize: number;

  /** Rollback on error */
  rollbackOnError: boolean;

  /** Checkpoint timeout in ms */
  checkpointTimeout: number;

  /** Maximum number of checkpoints */
  maxCheckpoints: number;
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
    oldType: string;
    newType: string;
  }>;

  /** Metadata differences */
  metadataDiff?: {
    timestamp?: { old: number; new: number };
    action?: { old?: string; new?: string };
    atomCount?: { old: number; new: number };
  };
}

/**
 * Snapshot patch operation
 */
export interface SnapshotPatch {
  /** Patch type */
  type: "add" | "remove" | "modify" | "replace";

  /** Atom name */
  atomName: string;

  /** New value (for add/modify/replace) */
  value?: unknown;

  /** Old value (for modify) */
  oldValue?: unknown;

  /** New type (for modify) */
  valueType?: string;
}

/**
 * Snapshot patch result
 */
export interface SnapshotPatchResult {
  /** Whether patch was applied */
  applied: boolean;

  /** Resulting snapshot */
  snapshot: Snapshot;

  /** Changes made */
  changes: SnapshotPatch[];

  /** Error if any */
  error?: string;
}

/**
 * Snapshot metadata with additional info
 */
export interface EnhancedSnapshotMetadata extends SnapshotMetadata {
  /** Version of the snapshot format */
  version?: string;

  /** Source of the snapshot (user, system, import) */
  source?: "user" | "system" | "import" | "replay";

  /** Tags for categorization */
  tags?: string[];

  /** User comments */
  comments?: string;

  /** Environment info */
  environment?: {
    userAgent?: string;
    platform?: string;
    url?: string;
  };

  /** Custom data */
  custom?: Record<string, unknown>;
}

/**
 * Enhanced snapshot with additional metadata
 */
export interface EnhancedSnapshot extends Snapshot {
  /** Enhanced metadata */
  metadata: EnhancedSnapshotMetadata;

  /** Snapshot checksum for integrity */
  checksum?: string;

  /** Previous snapshot ID (for chain) */
  previousId?: string;

  /** Next snapshot ID (for chain) */
  nextId?: string;

  /** Branch information */
  branch?: string;
}

/**
 * Snapshot group
 */
export interface SnapshotGroup {
  /** Group ID */
  id: string;

  /** Group name */
  name: string;

  /** Snapshot IDs in group */
  snapshotIds: string[];

  /** Group metadata */
  metadata: {
    createdAt: number;
    updatedAt: number;
    snapshotCount: number;
    tags?: string[];
  };
}

/**
 * Snapshot search criteria
 */
export interface SnapshotSearchCriteria {
  /** Search by action name */
  action?: string | RegExp;

  /** Search by time range */
  timeRange?: { start: number; end: number };

  /** Search by atom value */
  atomValue?: {
    name: string;
    value: unknown;
    operator?:
      | "eq"
      | "neq"
      | "gt"
      | "lt"
      | "gte"
      | "lte"
      | "contains"
      | "regex";
  };

  /** Search by atom type */
  atomType?: string | string[];

  /** Search by snapshot ID */
  id?: string | string[];

  /** Search by tag */
  tag?: string | string[];

  /** Search by source */
  source?: string | string[];

  /** Search by branch */
  branch?: string;

  /** Custom filter function */
  filter?: (snapshot: Snapshot) => boolean;

  /** Maximum results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;

  /** Sort order */
  sort?: "asc" | "desc";

  /** Sort field */
  sortBy?: "timestamp" | "atomCount" | "id";
}

/**
 * Snapshot search result
 */
export interface SnapshotSearchResult {
  /** Matching snapshots */
  snapshots: Snapshot[];

  /** Total matches (without pagination) */
  total: number;

  /** Search metadata */
  metadata: {
    /** Search time in milliseconds */
    searchTime: number;

    /** Search criteria used */
    criteria: SnapshotSearchCriteria;

    /** Execution time in milliseconds */
    executionTime: number;

    /** Whether more results are available */
    hasMore: boolean;

    /** Current offset */
    offset: number;

    /** Limit used */
    limit: number;
  };
}

/**
 * Snapshot statistics
 */
export interface SnapshotStatistics {
  /** Total snapshots */
  totalCount: number;

  /** Average snapshot size */
  averageSize: number;

  /** Total size of all snapshots */
  totalSize: number;

  /** Time range */
  timeRange: {
    earliest: number;
    latest: number;
    span: number;
  };

  /** Atom statistics */
  atoms: {
    /** Most common atoms */
    topAtoms: Array<{ name: string; count: number }>;

    /** Atom types distribution */
    typeDistribution: Record<string, number>;

    /** Average atoms per snapshot */
    averageAtomsPerSnapshot: number;
  };

  /** Action statistics */
  actions: {
    /** Most common actions */
    topActions: Array<{ action: string; count: number }>;

    /** Actions without name */
    unnamedCount: number;
  };

  /** Time-based statistics */
  timeStats: {
    /** Snapshots per hour */
    perHour: Record<string, number>;

    /** Busiest hour */
    busiestHour: { hour: string; count: number };
  };
}

/**
 * Snapshot export options
 */
export interface SnapshotExportOptions {
  /** Format to export */
  format: "json" | "binary" | "compact";

  /** Whether to compress */
  compress?: boolean;

  /** Whether to include metadata */
  includeMetadata?: boolean;

  /** Whether to include statistics */
  includeStats?: boolean;

  /** Filter snapshots to export */
  filter?: SnapshotFilter;

  /** Custom transformer */
  transform?: SnapshotTransform;

  /** Export filename */
  filename?: string;

  /** Whether to export as single file or multiple */
  multiFile?: boolean;
}

/**
 * Snapshot import options
 */
export interface SnapshotImportOptions {
  /** Whether to validate on import */
  validate?: boolean;

  /** What to do with duplicates */
  onDuplicate?: "skip" | "replace" | "rename" | "error";

  /** Whether to merge with existing */
  merge?: boolean;

  /** Custom transformer */
  transform?: SnapshotTransform;

  /** Maximum snapshots to import */
  limit?: number;

  /** Whether to import in background */
  background?: boolean;
}

/**
 * Snapshot import result
 */
export interface SnapshotImportResult {
  /** Whether import was successful */
  success: boolean;

  /** Number imported */
  importedCount: number;

  /** Number skipped */
  skippedCount: number;

  /** Number failed */
  failedCount: number;

  /** Imported snapshots */
  snapshots: Snapshot[];

  /** Failed imports */
  failed: Array<{ snapshot: unknown; reason: string }>;

  /** Warnings */
  warnings: string[];

  /** Import duration */
  duration: number;

  /** Import timestamp */
  timestamp: number;
}

/**
 * Snapshot migration
 */
export interface SnapshotMigration {
  /** From version */
  fromVersion: string;

  /** To version */
  toVersion: string;

  /** Migration function */
  migrate: (snapshot: unknown) => Snapshot;

  /** Description */
  description?: string;
}

/**
 * Snapshot compression options
 */
export interface CompressionOptions {
  /** Compression algorithm */
  algorithm: "gzip" | "deflate" | "lz4" | "none";

  /** Compression level */
  level?: number;

  /** Whether to cache compressed results */
  cache?: boolean;

  /** Minimum size to compress (bytes) */
  minSize?: number;
}

/**
 * Snapshot integrity check result
 */
export interface IntegrityCheckResult {
  /** Whether integrity check passed */
  passed: boolean;

  /** Corrupted snapshots */
  corrupted: Array<{ id: string; error: string }>;

  /** Missing dependencies */
  missing: Array<{ id: string; dependency: string }>;

  /** Check timestamp */
  timestamp: number;

  /** Duration */
  duration: number;
}

/**
 * Snapshot event
 */
export interface SnapshotEvent {
  /** Event type */
  type:
    | "created"
    | "restored"
    | "deleted"
    | "updated"
    | "exported"
    | "imported";

  /** Event timestamp */
  timestamp: number;

  /** Snapshot ID */
  snapshotId: string;

  /** Snapshot (if available) */
  snapshot?: Snapshot;

  /** Previous state (for updates) */
  previous?: Snapshot;

  /** Additional data */
  data?: Record<string, unknown>;
}

/**
 * Snapshot event listener
 */
export type SnapshotEventListener = (event: SnapshotEvent) => void;

/**
 * Snapshot storage adapter
 */
export interface SnapshotStorageAdapter {
  /** Save snapshot */
  save(snapshot: Snapshot): Promise<void> | void;

  /** Load snapshot by ID */
  load(id: string): Promise<Snapshot | null> | Snapshot | null;

  /** Delete snapshot */
  delete(id: string): Promise<boolean> | boolean;

  /** List all snapshot IDs */
  list(): Promise<string[]> | string[];

  /** Check if snapshot exists */
  exists(id: string): Promise<boolean> | boolean;

  /** Clear all snapshots */
  clear(): Promise<void> | void;
}

/**
 * Snapshot cache configuration
 */
export interface SnapshotCacheConfig {
  /** Maximum cache size */
  maxSize: number;

  /** TTL in milliseconds */
  ttl: number;

  /** Eviction policy */
  evictionPolicy: "lru" | "lfu" | "fifo";

  /** Whether to enable caching */
  enabled: boolean;
}

/**
 * Snapshot processor
 */
export interface SnapshotProcessor<T = unknown> {
  /** Process snapshot */
  process(snapshot: Snapshot): Promise<T> | T;

  /** Get processor name */
  name: string;

  /** Get processor version */
  version?: string;
}

/**
 * Snapshot pipeline
 */
export interface SnapshotPipeline {
  /** Pipeline name */
  name: string;

  /** Processors in order */
  processors: SnapshotProcessor[];

  /** Whether to stop on error */
  stopOnError: boolean;

  /** Error handler */
  onError?: (error: Error, processor: SnapshotProcessor) => void;
}

/**
 * Snapshot pipeline result
 */
export interface SnapshotPipelineResult {
  /** Whether pipeline succeeded */
  success: boolean;

  /** Final result */
  result: unknown;

  /** Processor results */
  steps: Array<{
    processor: string;
    success: boolean;
    duration: number;
    error?: string;
  }>;

  /** Total duration */
  totalDuration: number;
}

/**
 * Snapshot template
 */
export interface SnapshotTemplate {
  /** Template name */
  name: string;

  /** Template pattern */
  pattern: Partial<Snapshot>;

  /** Default values */
  defaults?: Record<string, unknown>;

  /** Required fields */
  required?: string[];

  /** Validation rules */
  validations?: Array<(snapshot: Snapshot) => boolean>;
}

/**
 * Snapshot from template result
 */
export interface SnapshotFromTemplateResult {
  /** Generated snapshot */
  snapshot: Snapshot;

  /** Template used */
  template: string;

  /** Filled fields */
  filled: string[];

  /** Missing required fields */
  missing?: string[];
}
