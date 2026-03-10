/**
 * Types for TimeTravel core modules
 */

import type { Snapshot, Store, TimeTravelAPI } from '../../types';
import type {
  TimeTravelOptions,
  RestorationOptions,
  TransactionalRestorationResult,
  RollbackResult,
  RestorationCheckpoint,
} from '../types';
import type { DeltaSnapshot } from '../delta/types';
import type {
  TimeTravelEvent,
  TimeTravelEventType,
} from './SubscriptionManager';

// ==================== EXISTING TYPES (for backward compatibility) ====================

/**
 * History event types
 */
export type HistoryOperation =
  | 'add'
  | 'undo'
  | 'redo'
  | 'jump'
  | 'clear'
  | 'change';

export interface HistoryEvent {
  type: HistoryOperation;
  timestamp: number;
  snapshotId?: string;
  data?: any;
  operation?: HistoryOperation;
}

export interface HistoryStats {
  length: number;
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  pastCount?: number;
  futureCount?: number;
  totalSnapshots?: number;
  hasCurrent?: boolean;
  estimatedMemoryUsage?: number;
  oldestTimestamp?: number;
  newestTimestamp?: number;
}

export interface HistoryManagerConfig {
  maxHistory?: number;
  useDeltaSnapshots?: boolean;
  compressionConfig?: any;
}

export interface NavigationResult {
  success: boolean;
  current?: Snapshot;
  error?: string;
}

export interface HistoryState {
  past: Snapshot[];
  future: Snapshot[];
  current: Snapshot | null;
}

// Additional history types for backward compatibility
export interface HistoryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface HistoryIndex {
  past: number;
  future: number;
  current: number | null;
}

export interface HistoryBounds {
  min: number;
  max: number;
  current: number;
}

export interface HistoryServiceConfig {
  maxHistory?: number;
  useDeltaSnapshots?: boolean;
}

// ==================== NEW DECOMPOSED TYPES ====================

/**
 * Configuration for TimeTravelController
 */
export interface TimeTravelControllerConfig extends TimeTravelOptions {
  /** TTL in milliseconds */
  ttl?: number;
  /** Cleanup interval in milliseconds */
  cleanupInterval?: number;
  /** Delta snapshots config */
  deltaSnapshots?: {
    enabled?: boolean;
    fullSnapshotInterval?: number;
    maxDeltaChainLength?: number;
    changeDetection?: 'deep' | 'shallow' | 'reference';
  };
}

/**
 * Statistics for time travel history
 */
export interface TimeTravelStats {
  /** Total history length */
  length: number;
  /** Current snapshot index */
  currentIndex: number;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
}

/**
 * Result of capture operation
 */
export interface CaptureResult {
  /** Whether capture was successful */
  success: boolean;
  /** Created snapshot (if successful) */
  snapshot?: Snapshot;
  /** Error message (if failed) */
  error?: string;
  /** Duration in milliseconds */
  duration?: number;
}

/**
 * Result of jump operation
 */
export interface JumpResult {
  /** Whether jump was successful */
  success: boolean;
  /** Current snapshot after jump */
  current?: Snapshot;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Comparison result interface
 */
export interface ComparisonResult {
  /** Comparison ID */
  id: string;
  /** Timestamp */
  timestamp: number;
  /** Summary of changes */
  summary: {
    totalAtoms: number;
    changedAtoms: number;
    addedAtoms: number;
    removedAtoms: number;
    unchangedAtoms: number;
    hasChanges: boolean;
    changePercentage: number;
  };
  /** Atom-level changes */
  atoms: any[];
  /** Statistics */
  statistics: {
    duration: number;
    memoryUsed: number;
    depth: number;
    totalComparisons: number;
    cacheHits: number;
    cacheMisses: number;
  };
  /** Metadata */
  metadata: {
    snapshotA: { id: string; timestamp: number };
    snapshotB: { id: string; timestamp: number };
    timeDifference: number;
    options: any;
  };
}

/**
 * Service interface for TimeTravel API operations
 */
export interface TimeTravelApiService {
  /** Capture a snapshot */
  capture(action?: string): Snapshot | undefined;
  /** Undo last action */
  undo(): boolean;
  /** Redo previously undone action */
  redo(): boolean;
  /** Jump to specific snapshot by ID */
  jumpTo(snapshotId: string): boolean;
  /** Jump to specific index */
  jumpToIndex(index: number): boolean;
  /** Check if undo is available */
  canUndo(): boolean;
  /** Check if redo is available */
  canRedo(): boolean;
  /** Get current snapshot */
  getCurrentSnapshot(): Snapshot | undefined;
  /** Get history length */
  getHistoryLength(): number;
  /** Get all history */
  getAllHistory(): Snapshot[];
  /** Get history stats */
  getHistoryStats(): TimeTravelStats;
  /** Clear history */
  clearHistory(): void;
  /** Get history */
  getHistory(): Snapshot[];
}

/**
 * Service interface for event emission
 */
export interface TimeTravelEventService {
  /** Subscribe to events */
  subscribe(
    eventType: TimeTravelEventType,
    listener: (event: TimeTravelEvent) => void
  ): () => void;
  /** Emit an event */
  emit(event: TimeTravelEvent): void;
  /** Unsubscribe all */
  unsubscribeAll(): void;
}

/**
 * Service interface for comparison operations
 */
export interface TimeTravelComparisonService {
  /** Compare two snapshots */
  compareSnapshots(
    a: Snapshot | string,
    b: Snapshot | string,
    options?: any
  ): ComparisonResult;
  /** Compare snapshot with current state */
  compareWithCurrent(
    snapshot: Snapshot | string,
    options?: any
  ): ComparisonResult | null;
  /** Get diff since action */
  getDiffSince(action?: string, options?: any): ComparisonResult | null;
  /** Visualize changes */
  visualizeChanges(comparison: ComparisonResult, format?: string): string;
  /** Export comparison */
  exportComparison(comparison: ComparisonResult, format: string): string;
}

/**
 * Service interface for transactional operations
 */
export interface TimeTravelTransactionalService {
  /** Restore with transaction */
  restoreWithTransaction(
    snapshotId: string,
    options?: RestorationOptions
  ): Promise<TransactionalRestorationResult>;
  /** Get last checkpoint */
  getLastCheckpoint(): RestorationCheckpoint | null;
  /** Rollback to checkpoint */
  rollbackToCheckpoint(checkpointId: string): Promise<RollbackResult>;
  /** Get all checkpoints */
  getCheckpoints(): RestorationCheckpoint[];
  /** Import state */
  importState(state: Record<string, unknown>): boolean;
}

/**
 * Service interface for metrics
 */
export interface TimeTravelMetricsService {
  /** Get delta stats */
  getDeltaStats(): any;
  /** Get cleanup stats */
  getCleanupStats(): any;
}

/**
 * Service interface for lifecycle management
 */
export interface TimeTravelLifecycleService {
  /** Check if time traveling */
  isTraveling(): boolean;
  /** Start time travel */
  startTimeTravel(): void;
  /** End time travel */
  endTimeTravel(): void;
  /** Dispose */
  dispose(): Promise<void>;
}

/**
 * Service interface for configuration
 */
export interface TimeTravelConfigService {
  /** Get current config */
  getConfig(): TimeTravelControllerConfig;
  /** Update config */
  configure(config: Partial<TimeTravelControllerConfig>): void;
}

// Missing types for backward compatibility
export type HistoryDiff = Record<string, unknown>;

export type HistorySearchResult = Record<string, unknown>;

export type HistorySearchOptions = Record<string, unknown>;

export type CompactionOptions = Record<string, unknown>;

export type SerializedHistory = Record<string, unknown>;
