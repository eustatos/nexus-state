/**
 * Delta snapshot types for incremental snapshots
 * Implements delta-based history for memory-efficient time travel
 */

import type { Snapshot, SnapshotMetadata } from "../types";

// Re-export Snapshot for convenience
export type { Snapshot } from "../types";

/**
 * Type of delta change
 */
export type ChangeType = "added" | "modified" | "deleted";

/**
 * Represents a single change in a delta snapshot
 */
export interface DeltaChange {
  /** Atom ID */
  atomId: string;
  /** Atom name */
  atomName: string;
  /** Previous value (null for added atoms) */
  oldValue: unknown;
  /** New value (null for deleted atoms) */
  newValue: unknown;
  /** Type of change */
  changeType: ChangeType;
  /** Path for nested changes (optional) */
  path?: string[];
}

/**
 * Metadata specific to delta snapshots
 */
export interface DeltaMetadata extends SnapshotMetadata {
  /** Timestamp of base snapshot */
  baseTimestamp?: number;
  /** Number of changes in this delta */
  changeCount: number;
  /** Compressed size of delta (bytes) */
  compressedSize: number;
  /** Original size if this were a full snapshot (bytes) */
  originalSize: number;
  /** Index in history for reconstruction */
  historyIndex?: number;
}

/**
 * Delta snapshot that stores only changes from base
 */
export interface DeltaSnapshot extends Snapshot {
  /** Type indicator */
  type: "delta";
  /** ID of base snapshot (null for full snapshots) */
  baseSnapshotId: string | null;
  /** Map of atom name to change */
  changes: Map<string, DeltaChange>;
  /** Delta-specific metadata */
  metadata: DeltaMetadata;
}

/**
 * Full snapshot (type preserved for compatibility)
 */
export interface FullSnapshot extends Snapshot {
  /** Type indicator */
  type: "full";
  /** No base for full snapshots */
  baseSnapshotId: null;
  /** No changes for full snapshots */
  changes?: never;
  /** Standard metadata */
  metadata: SnapshotMetadata;
}

/**
 * Union of delta and full snapshots
 */
export type AnySnapshot = DeltaSnapshot | FullSnapshot;

/**
 * Options for delta computation
 */
export interface DeltaOptions {
  /** Enable deep equality check */
  deepEqual?: boolean;
  /** Skip empty deltas (no changes) */
  skipEmpty?: boolean;
  /** Include path information for nested objects */
  trackPaths?: boolean;
  /** Custom change detection */
  changeDetector?: (oldValue: unknown, newValue: unknown) => boolean;
}

/**
 * Options for delta application
 */
export interface ApplyDeltaOptions {
  /** Validate delta before applying */
  validate?: boolean;
  /** Skip validation */
  skipValidation?: boolean;
  /** Custom error handler */
  onError?: (error: Error) => void;
  /** Create copy of base (don't mutate) */
  immutable?: boolean;
}

/**
 * Options for delta reconstruction
 */
export interface ReconstructionOptions {
  /** Cache reconstructed snapshots */
  cache?: boolean;
  /** Maximum cache size */
  maxCacheSize?: number;
  /** Optimized path reconstruction */
  optimizePath?: boolean;
}

/**
 * Reconstruction path for efficient navigation
 */
export interface ReconstructionPath {
  /** Start snapshot ID */
  startId: string;
  /** End snapshot ID */
  endId: string;
  /** Delta chain to traverse */
  deltaChain: string[];
  /** Total deltas in path */
  deltaCount: number;
  /** Estimated reconstruction time (ms) */
  estimatedTime?: number;
}

/**
 * Delta chain for a single base snapshot
 */
export interface DeltaChain {
  /** Base snapshot */
  baseSnapshot: FullSnapshot;
  /** Chain of deltas from base */
  deltas: DeltaSnapshot[];
  /** Chain metadata */
  metadata: {
    /** Number of deltas */
    deltaCount: number;
    /** Total memory usage */
    memoryUsage: number;
    /** Creation timestamp */
    createdAt: number;
    /** Last update timestamp */
    updatedAt: number;
    /** Maximum allowed deltas before new base */
    maxDeltas: number;
  };
}

/**
 * Strategy for creating full snapshots
 */
export type FullSnapshotStrategy = "time" | "changes" | "size" | "significance" | "manual";

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

/**
 * Chain manager configuration
 */
export interface ChainManagerConfig {
  /** Create full snapshot every N changes */
  fullSnapshotInterval: number;
  /** Maximum deltas before forced full snapshot */
  maxDeltaChainLength: number;
  /** Maximum age of delta chain (ms) */
  maxDeltaChainAge: number;
  /** Maximum memory for delta chain (bytes) */
  maxDeltaChainSize: number;
  /** Strategy for full snapshot creation */
  fullSnapshotStrategy: FullSnapshotStrategy;
}

/**
 * Delta-aware history manager configuration
 */
export interface DeltaAwareHistoryManagerConfig {
  /** Incremental snapshot configuration */
  incrementalSnapshot?: Partial<IncrementalSnapshotConfig>;
  /** History manager max snapshots */
  maxHistory?: number;
  /** Enable delta compression */
  compressionEnabled?: boolean;
}

/**
 * Statistics for delta-aware history
 */
export interface DeltaHistoryStats {
  /** Standard history stats */
  standard: any;
  /** Delta-specific statistics */
  delta: DeltaStats;
  /** Memory efficiency ratio */
  memoryEfficiency: number;
}

/**
 * Delta compression metadata
 */
export interface DeltaCompressionMetadata {
  /** Strategy used */
  strategy: FullSnapshotStrategy | string;
  /** Timestamp of compression */
  timestamp: number;
  /** Chain length before compression */
  originalChainLength: number;
  /** Chain length after compression */
  compressedChainLength: number;
  /** Memory saved */
  memorySaved: number;
}

/**
 * Result of delta computation
 */
export interface DeltaComputationResult {
  /** Success flag */
  success: boolean;
  /** Delta snapshot if successful */
  delta?: DeltaSnapshot;
  /** Error message if failed */
  error?: string;
  /** Metadata about computation */
  metadata: {
    /** Computation time (ms) */
    computationTime: number;
    /** Number of changes detected */
    changeCount: number;
    /** Original size (bytes) */
    originalSize: number;
    /** Delta size (bytes) */
    deltaSize: number;
    /** Compression ratio */
    compressionRatio: number;
  };
}

/**
 * Result of delta application
 */
export interface DeltaApplyResult {
  /** Success flag */
  success: boolean;
  /** Resulting snapshot if successful */
  snapshot?: Snapshot;
  /** Error message if failed */
  error?: string;
  /** Metadata about application */
  metadata: {
    /** Application time (ms) */
    applicationTime: number;
    /** Number of atoms affected */
    atomsAffected: number;
    /** Validation errors */
    validationErrors?: string[];
  };
}

/**
 * Result of delta reconstruction
 */
export interface DeltaReconstructionResult {
  /** Success flag */
  success: boolean;
  /** Reconstructed snapshot if successful */
  snapshot?: Snapshot;
  /** Error message if failed */
  error?: string;
  /** Metadata about reconstruction */
  metadata: {
    /** Reconstruction time (ms) */
    reconstructionTime: number;
    /** Number of deltas applied */
    deltasApplied: number;
    /** Cache hit/miss */
    cacheHit?: boolean;
  };
}

/**
 * Events emitted by delta system
 */
export type DeltaEventType = "delta-created" | "delta-applied" | "reconstruction" | "full-snapshot" | "error";

/**
 * Delta event
 */
export interface DeltaEvent {
  /** Event type */
  type: DeltaEventType;
  /** Timestamp */
  timestamp: number;
  /** Delta snapshot (if applicable) */
  delta?: DeltaSnapshot;
  /** Snapshot (if applicable) */
  snapshot?: Snapshot;
  /** Error (if applicable) */
  error?: Error;
  /** Additional data */
  data?: Record<string, unknown>;
}

/**
 * Delta event listener
 */
export type DeltaEventListener = (event: DeltaEvent) => void;

/**
 * Statistics for delta system
 */
export interface DeltaStats {
  /** Total delta snapshots created */
  deltaCount: number;
  /** Total full snapshots created */
  fullSnapshotCount: number;
  /** Current delta chains */
  activeChains: number;
  /** Total deltas in all chains */
  totalDeltasInChains: number;
  /** Memory usage (bytes) */
  memoryUsage: number;
  /** Cache hits */
  cacheHits: number;
  /** Cache misses */
  cacheMisses: number;
  /** Average delta size (bytes) */
  averageDeltaSize: number;
  /** Average compression ratio */
  averageCompressionRatio: number;
  /** Last full snapshot timestamp */
  lastFullSnapshot?: number;
  /** Last delta timestamp */
  lastDelta?: number;
}

/**
 * Delta compression config
 */
export interface DeltaCompressionConfig {
  /** Enable/disable compression */
  enabled?: boolean;
  /** Minimum chain length before compression */
  minChainLength?: number;
  /** Maximum age of chain (time-based) */
  maxAge?: number;
  /** Maximum number of deltas (changes-based) */
  maxDeltas?: number;
  /** Maximum chain size in bytes (size-based) */
  maxSize?: number;
}

/**
 * Delta compression factory config
 */
export interface DeltaCompressionFactoryConfig {
  /** Strategy to use */
  strategy: DeltaCompressionStrategyType | any;
  /** Time-based strategy options */
  time?: {
    /** Maximum age in ms */
    maxAge?: number;
  };
  /** Changes-based strategy options */
  changes?: {
    /** Maximum deltas before compression */
    maxDeltas?: number;
  };
  /** Size-based strategy options */
  size?: {
    /** Maximum size in bytes */
    maxSize?: number;
  };
  /** Minimum chain length */
  minChainLength?: number;
  /** Enable/disable compression */
  enabled?: boolean;
}

/**
 * Strategy name type
 */
export type DeltaCompressionStrategyType = 
  | "none" 
  | "time" 
  | "changes" 
  | "size" 
  | "significance";
