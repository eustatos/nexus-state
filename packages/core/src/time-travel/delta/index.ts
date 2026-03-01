/**
 * Delta snapshot module exports
 * Provides incremental snapshot functionality for memory-efficient time travel
 */

// Types
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
  ChainManagerConfig,
  DeltaAwareHistoryManagerConfig,
  DeltaHistoryStats,
  DeltaCompressionMetadata,
  DeltaComputationResult,
  DeltaApplyResult,
  DeltaReconstructionResult,
  DeltaEventType,
  DeltaEvent,
  DeltaEventListener,
  DeltaStats,
} from "./types";

export { DEFAULT_INCREMENTAL_SNAPSHOT_CONFIG } from "./types";

// Calculator
export type { DeltaCalculator, DeltaCalculatorConfig } from "./calculator";
export { DeltaCalculatorImpl, DEFAULT_DELTA_CALCULATOR_CONFIG } from "./calculator";

// Chain Manager
export { DeltaChainManager, DEFAULT_CHAIN_MANAGER_CONFIG, ChainValidationResult } from "./chain-manager";

// Delta History Manager
export { DeltaAwareHistoryManager, DEFAULT_DELTA_HISTORY_CONFIG } from "./delta-history-manager";

// Reconstructor
export { SnapshotReconstructor, SimpleReconstructionCache, OptimizedSnapshotReconstructor } from "./reconstructor";
export type { ReconstructionCache, CacheEntryInternal as CacheEntry } from "./reconstructor";

// Delta compression
export {
  BaseDeltaCompressionStrategy,
  NoDeltaCompressionStrategy,
  TimeBasedDeltaCompressionStrategy,
  ChangesBasedDeltaCompressionStrategy,
  SizeBasedDeltaCompressionStrategy,
  SignificanceBasedDeltaCompressionStrategy,
} from "./compression/strategy";

export { DeltaCompressionFactory } from "./compression/factory";

export type {
  DeltaCompressionStrategy,
  DeltaCompressionConfig,
  DeltaCompressionFactoryConfig,
  DeltaCompressionStrategyType,
} from "./compression/types";
