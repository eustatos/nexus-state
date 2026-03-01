/**
 * Public types for SimpleTimeTravel
 */

import type { Store, Snapshot, SnapshotStateEntry } from "../types";

// Re-export core types that are used by SimpleTimeTravel
export type {
  TimeTravelAPI,
  TimeTravelOptions,
  Snapshot,
  SnapshotMetadata,
  SnapshotStateEntry,
} from "../types";

// Re-export snapshot module types
export type {
  RestorationCheckpoint,
  TransactionalRestorerConfig,
  TransactionalRestorationResult,
  RestorationError,
  TransactionConfig,
  RestorationOptions,
  RestorationProgress,
  CheckpointResult,
  RollbackResult,
} from "./snapshot/types";

// Define HistoryEvent for history manager compatibility
export type HistoryEventType =
  | "capture"
  | "undo"
  | "redo"
  | "jump"
  | "clear"
  | "import"
  | "error";

export interface HistoryEvent {
  type: HistoryEventType;
  timestamp: number;
  snapshot?: Snapshot;
  data?: Record<string, unknown>;
}

/**
 * Compression metadata for tracking compression statistics
 */
export interface CompressionMetadata {
  /** Strategy name used for compression */
  strategy: string;
  /** Timestamp when compression was applied */
  timestamp: number;
  /** Number of snapshots before compression */
  originalCount: number;
  /** Number of snapshots after compression */
  compressedCount: number;
  /** Compression ratio (compressed / original) */
  compressionRatio: number;
  /** Whether snapshots were removed or just modified */
  removedCount: number;
}

export type HistoryEventListener = (event: HistoryEvent) => void;

export interface TimeTravelStats {
  totalSnapshots: number;
  undoCount: number;
  redoCount: number;
  jumpCount: number;
  captureCount: number;
  averageSnapshotSize: number;
  totalMemoryUsage: number;
  timeRange?: {
    oldest: number;
    newest: number;
    span: number;
  };
}

export interface StoreRegistry {
  store: Store;
  atoms: Set<symbol>;
}

export interface AtomMetadata {
  name: string;
  createdAt: number;
  type: "primitive" | "computed" | "writable";
  [key: string]: unknown;
}

export interface TimeTravelMiddlewareConfig {
  enabled?: boolean;
  whitelist?: string[];
  blacklist?: string[];
  transform?: (
    state: Record<string, SnapshotStateEntry>,
  ) => Record<string, SnapshotStateEntry>;
  validate?: (snapshot: Snapshot) => boolean;
}

export interface BatchResult {
  success: number;
  failed: number;
  errors: string[];
  snapshots: Snapshot[];
}

export interface HistorySearchCriteria {
  action?: string | RegExp;
  timeRange?: { start: number; end: number };
  atomValue?: {
    name: string;
    value: unknown;
    operator?: "eq" | "neq" | "gt" | "lt" | "regex";
  };
  id?: string | string[];
  filter?: (snapshot: Snapshot) => boolean;
}

export interface SearchResult {
  snapshots: Snapshot[];
  total: number;
  metadata: {
    searchTime: number;
    criteria: HistorySearchCriteria;
    executionTime: number;
  };
}

export interface ExportFormat {
  version: "1.0";
  exportedAt: number;
  snapshots: Snapshot[];
  metadata: {
    snapshotCount: number;
    timeRange: { from: number; to: number };
    atomNames: string[];
  };
  compression?: {
    algorithm: string;
    originalSize: number;
    compressedSize: number;
  };
}

// Re-export delta types
export type {
  ChangeType,
  DeltaChange,
  DeltaMetadata,
  DeltaSnapshot,
  FullSnapshot,
  AnySnapshot,
  DeltaOptions,
  ApplyDeltaOptions,
  ReconstructionOptions,
  ReconstructionPath,
  DeltaChain,
  FullSnapshotStrategy,
  IncrementalSnapshotConfig,
  DeltaCompressionMetadata,
  DeltaComputationResult,
  DeltaApplyResult,
  DeltaReconstructionResult,
  DeltaEventType,
  DeltaEvent,
  DeltaEventListener,
  DeltaStats,
  DeltaAwareHistoryManager,
  DeltaAwareHistoryManagerConfig,
  DeltaHistoryStats,
  DeltaCalculator,
  DeltaCalculatorConfig,
  DeltaChainManager,
  ChainManagerConfig,
  ChainValidationResult,
  SnapshotReconstructor,
  ReconstructionCache,
  CacheEntry,
  DeltaCompressionConfig,
  DeltaCompressionFactoryConfig,
  DeltaCompressionStrategyType,
} from "./delta/index";

// Re-export delta compression strategy
export type {
  DeltaCompressionStrategy,
} from "./delta/compression/types";
