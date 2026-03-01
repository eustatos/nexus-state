// Types for nexus-state core

/**
 * Function to get the current value of an atom
 * @template Value The type of value the atom holds
 * @param atom The atom to get the value from
 * @returns The current value of the atom
 */
export type Getter = <Value>(atom: Atom<Value>) => Value;

/**
 * Function to set the value of an atom
 * @template Value The type of value the atom holds
 * @param atom The atom to set the value for
 * @param update The new value or a function to compute the new value
 */
export type Setter = <Value>(
  atom: Atom<Value>,
  update: Value | ((prev: Value) => Value),
) => void;

/**
 * Function to subscribe to changes in an atom's value
 * @template Value The type of value the atom holds
 * @param value The new value of the atom
 */
export type Subscriber<Value> = (value: Value) => void;

/**
 * A plugin function that can enhance a store with additional functionality
 * @param store The store to enhance
 */
export type Plugin = (store: Store) => void;

// Import delta types for TimeTravelAPI
import type { DeltaSnapshot } from "./time-travel/delta/types";

/**
 * Metadata about an action for DevTools integration
 */
export type ActionMetadata = {
  /** The type of action */
  type: string;
  /** The source of the action (e.g., atom name) */
  source?: string;
  /** Timestamp when the action occurred */
  timestamp: number;
  /** Stack trace for the action (if enabled) */
  stackTrace?: string;
};

/**
 * Modes for store registry
 */
export type RegistryMode = "global" | "isolated";

/**
 * Interface for a store that holds atoms and provides methods to interact with them
 */
export interface Store {
  /**
   * Get the current value of an atom
   * @template Value The type of value the atom holds
   * @param atom The atom to get the value from
   * @returns The current value of the atom
   */
  get: <Value>(atom: Atom<Value>) => Value;

  /**
   * Set the value of an atom
   * @template Value The type of value the atom holds
   * @param atom The atom to set the value for
   * @param update The new value or a function to compute the new value
   */
  set: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
  ) => void;

  /**
   * Subscribe to changes in an atom's value
   * @template Value The type of value the atom holds
   * @param atom The atom to subscribe to
   * @param subscriber The function to call when the atom's value changes
   * @returns A function to unsubscribe from the atom
   */
  subscribe: <Value>(
    atom: Atom<Value>,
    subscriber: Subscriber<Value>,
  ) => () => void;

  /**
   * Get the state of all atoms in the store
   * @returns An object containing the state of all atoms
   */
  getState: () => Record<string, unknown>;

  /**
   * Apply a plugin to the store
   * @param plugin The plugin to apply
   */
  applyPlugin?: (plugin: Plugin) => void;

  /**
   * Set the value of an atom with metadata for DevTools
   * @template Value The type of value the atom holds
   * @param atom The atom to set the value for
   * @param update The new value or a function to compute the new value
   * @param metadata Metadata about the action
   */
  setWithMetadata?: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
    metadata?: ActionMetadata,
  ) => void;

  /**
   * Serialize the state of all atoms in the store
   * @returns An object containing the serialized state of all atoms
   */
  serializeState?: () => Record<string, unknown>;

  /**
   * Get the current value of an atom with interception for DevTools
   * @template Value The type of value the atom holds
   * @param atom The atom to get the value from
   * @returns The current value of the atom
   */
  getIntercepted?: <Value>(atom: Atom<Value>) => Value;

  /**
   * Set the value of an atom with interception for DevTools
   * @template Value The type of value the atom holds
   * @param atom The atom to set the value for
   * @param update The new value or a function to compute the new value
   */
  setIntercepted?: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
  ) => void;

  /**
   * Get the list of applied plugins
   * @returns An array of applied plugins
   */
  getPlugins?: () => Plugin[];
}

// === NEW HIERARCHICAL ATOM TYPES (CORE-002) ===

/**
 * Base interface for all atom types
 * @template _Value The type of value the atom holds
 */
export interface BaseAtom<_Value> {
  /** Unique identifier for the atom */
  readonly id: symbol;
  /** Type of the atom for runtime type checking */
  readonly type: "primitive" | "computed" | "writable";
  /** Optional name for debugging and DevTools */
  readonly name?: string;
}

/**
 * Primitive atom that holds a value and can be updated
 * @template Value The type of value the atom holds
 */
export interface PrimitiveAtom<Value> extends BaseAtom<Value> {
  /** Type identifier for runtime type checking */
  readonly type: "primitive";
  /** Function to read the atom's value */
  read: () => Value;
  /** Optional function to write to the atom */
  write?: (set: Setter, value: Value) => void;
}

/**
 * Computed atom that derives its value from other atoms
 * @template Value The type of value the atom holds
 */
export interface ComputedAtom<Value> extends BaseAtom<Value> {
  /** Type identifier for runtime type checking */
  readonly type: "computed";
  /** Function to compute the atom's value based on other atoms */
  read: (get: Getter) => Value;
  /** Computed atoms are read-only */
  write?: undefined;
}

/**
 * Writable atom that can both read and write values
 * @template Value The type of value the atom holds
 */
export interface WritableAtom<Value> extends BaseAtom<Value> {
  /** Type identifier for runtime type checking */
  readonly type: "writable";
  /** Function to compute the atom's value based on other atoms */
  read: (get: Getter) => Value;
  /** Function to write to the atom */
  write: (get: Getter, set: Setter, value: Value) => void;
}

/**
 * Union type for all atom types
 * @template Value The type of value the atom holds
 */
export type Atom<Value> =
  | PrimitiveAtom<Value>
  | ComputedAtom<Value>
  | WritableAtom<Value>;

// === TYPE GUARDS ===

/**
 * Type guard to check if an atom is a primitive atom
 * @template Value The type of value the atom holds
 * @param atom The atom to check
 * @returns True if the atom is a primitive atom
 */
export function isPrimitiveAtom<Value>(
  atom: Atom<Value>,
): atom is PrimitiveAtom<Value> {
  return atom.type === "primitive";
}

/**
 * Type guard to check if an atom is a computed atom
 * @template Value The type of value the atom holds
 * @param atom The atom to check
 * @returns True if the atom is a computed atom
 */
export function isComputedAtom<Value>(
  atom: Atom<Value>,
): atom is ComputedAtom<Value> {
  return atom.type === "computed";
}

/**
 * Type guard to check if an atom is a writable atom
 * @template Value The type of value the atom holds
 * @param atom The atom to check
 * @returns True if the atom is a writable atom
 */
export function isWritableAtom<Value>(
  atom: Atom<Value>,
): atom is WritableAtom<Value> {
  return atom.type === "writable";
}

// === UTILITY TYPES ===

/**
 * Extract the value type from an atom
 * @template A The atom type
 */
export type AtomValue<A> = A extends Atom<infer V> ? V : never;

/**
 * Any atom type
 */
export type AnyAtom = Atom<any>;

// Store registry interface for tracking atom ownership
export interface StoreRegistry {
  /** The store that owns the atoms */
  store: Store;
  /** The set of atom IDs owned by the store */
  atoms: Set<symbol>;
}

// === INCREMENTAL SNAPSHOT TYPES (basic types needed by TimeTravelOptions) ===

/**
 * Configuration for incremental snapshots
 */
export interface IncrementalSnapshotConfig {
  /** Enable incremental snapshots */
  enabled: boolean;
  /** Create full snapshot every N changes */
  fullSnapshotInterval: number;
  /** Maximum deltas before forced full snapshot */
  maxDeltaChainLength: number;
  /** Maximum age of delta chain (ms) */
  maxDeltaChainAge: number;
  /** Maximum memory for delta chain (bytes) */
  maxDeltaChainSize: number;
  /** Change detection strategy */
  changeDetection: "shallow" | "deep" | "reference";
  /** Reconstruct on demand */
  reconstructOnDemand: boolean;
  /** Cache reconstructed snapshots */
  cacheReconstructed: boolean;
  /** Cache size limit */
  maxCacheSize: number;
  /** Compression level */
  compressionLevel: "none" | "light" | "aggressive";
}

/**
 * Default configuration for incremental snapshots
 */
export const DEFAULT_INCREMENTAL_SNAPSHOT_CONFIG: IncrementalSnapshotConfig = {
  enabled: true,
  fullSnapshotInterval: 10,
  maxDeltaChainLength: 20,
  maxDeltaChainAge: 5 * 60 * 1000, // 5 minutes
  maxDeltaChainSize: 1024 * 1024, // 1MB
  changeDetection: "deep",
  reconstructOnDemand: true,
  cacheReconstructed: true,
  maxCacheSize: 100,
  compressionLevel: "light",
};

// === RESTORATION TYPES (for transactional restoration) ===

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
export interface TransactionalRestorationResult {
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
      failedAtoms?: Array<{
        name: string;
        atomId: symbol;
        error: string;
      }>;
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
 * Restoration options with transaction support */
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
 * Restoration progress information */
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
 * Checkpoint management result */
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
 * Rollback result */
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

// === TIME TRAVEL TYPES ===

// === TIME TRAVEL TYPES ===

import type {
  TrackerConfig,
  TTLConfig,
  CleanupStrategyType,
} from "./time-travel/tracking/types";

export interface TimeTravelOptions {
  maxHistory?: number;
  autoCapture?: boolean;
  registryMode?: "global" | "isolated";
  /** Enable incremental snapshots (delta-based history) - legacy alias */
  enableIncrementalSnapshots?: boolean;
  /** Configuration for incremental snapshots - legacy alias */
  incrementalSnapshotConfig?: Partial<IncrementalSnapshotConfig>;
  /** Delta snapshots configuration (preferred) */
  deltaSnapshots?: Partial<IncrementalSnapshotConfig>;
  atoms?: any[]; // Add atoms property to TimeTravelOptions

  /** Atom TTL configuration */
  atomTTL?: number;
  /** Cleanup strategy type */
  cleanupStrategy?: CleanupStrategyType;
  /** GC interval in ms */
  gcInterval?: number;
  /** TTL configuration (preferred, overrides individual options) */
  ttlConfig?: Partial<TTLConfig>;
  /** Tracking configuration */
  trackingConfig?: Partial<TrackerConfig>;
}

export interface SnapshotMetadata {
  timestamp: number;
  action?: string;
  atomCount: number;
}

export interface SnapshotStateEntry {
  value: any;
  type: "primitive" | "computed" | "writable";
  name?: string; // Atom name for restoration lookup
  atomId?: string;
}

export interface Snapshot {
  id: string;
  state: Record<string, SnapshotStateEntry>;
  metadata: SnapshotMetadata;
}

// Import comparison types
import type {
  SnapshotComparison,
  ComparisonOptions,
  VisualizationFormat,
  ExportFormat,
} from "./time-travel/comparison/types";

export interface TimeTravelAPI {
  capture(action?: string): Snapshot | undefined;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  jumpTo(index: number): boolean;
  clearHistory(): void;
  getHistory(): Snapshot[];
  importState(state: Record<string, unknown>): boolean;

  // Transactional restoration methods
  restoreWithTransaction(
    snapshotId: string,
    options?: RestorationOptions,
  ): Promise<TransactionalRestorationResult>;

  getLastCheckpoint(): RestorationCheckpoint | null;
  rollbackToCheckpoint(checkpointId: string): Promise<RollbackResult>;
  getCheckpoints(): RestorationCheckpoint[];

  // Delta snapshot methods (incremental snapshots)
  /** Get raw delta chain */
  getDeltaChain?(): DeltaSnapshot[];
  /** Force creation of full snapshot */
  forceFullSnapshot?(): void;
  /** Set delta compression strategy */
  setDeltaStrategy?(strategy: any): void;
  /** Reconstruct to specific index */
  reconstructTo?(index: number): Snapshot | null;
  /** Get delta statistics */
  getDeltaStats?(): any;

  // Snapshot comparison methods
  /**
   * Compare two snapshots
   * @param a - First snapshot or snapshot ID
   * @param b - Second snapshot or snapshot ID
   * @param options - Comparison options
   * @returns Comparison result
   */
  compareSnapshots(
    a: Snapshot | string,
    b: Snapshot | string,
    options?: Partial<ComparisonOptions>,
  ): SnapshotComparison;

  /**
   * Compare snapshot with current state
   * @param snapshot - Snapshot or snapshot ID to compare with current state
   * @param options - Comparison options
   * @returns Comparison result
   */
  compareWithCurrent(
    snapshot: Snapshot | string,
    options?: Partial<ComparisonOptions>,
  ): SnapshotComparison;

  /**
   * Get diff since specific action or time
   * @param action - Action name to compare since (optional)
   * @param options - Comparison options
   * @returns Comparison result or null if no snapshot found
   */
  getDiffSince(
    action?: string,
    options?: Partial<ComparisonOptions>,
  ): SnapshotComparison | null;

  /**
   * Visualize changes between snapshots
   * @param comparison - Comparison result to visualize
   * @param format - Visualization format (tree or list)
   * @returns Formatted visualization string
   */
  visualizeChanges(
    comparison: SnapshotComparison,
    format?: VisualizationFormat,
  ): string;

  /**
   * Export comparison result
   * @param comparison - Comparison result to export
   * @param format - Export format (json, html, md)
   * @returns Exported string
   */
  exportComparison(
    comparison: SnapshotComparison,
    format: ExportFormat,
  ): string;
}

// Enhanced store types
export interface EnhancedStore extends Store, TimeTravelAPI {
  /** Connect to DevTools */
  connectDevTools?: () => void;
}

export type StoreEnhancementOptions = {
  /** Enable DevTools integration */
  enableDevTools?: boolean;
  /** Name for the DevTools instance */
  devToolsName?: string;
  /** Registry mode for the store */
  registryMode?: RegistryMode;
  /** Enable Time Travel functionality */
  enableTimeTravel?: boolean;
  /** Maximum number of snapshots to keep */
  maxHistory?: number;
  /** Automatically capture snapshots on store changes */
  autoCapture?: boolean;
  /** Atoms to track for time travel */
  atoms?: any[]; // Add atoms to StoreEnhancementOptions as well
};
