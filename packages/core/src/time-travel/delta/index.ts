/**
 * Delta snapshot module exports
 * Provides incremental snapshot functionality for memory-efficient time travel
 *
 * @example
 * // Using factory (recommended)
 * const manager = DeltaAwareHistoryFactory.createManager(config);
 *
 * @example
 * // With custom services
 * const services = DeltaAwareHistoryFactory.createServices(config);
 * const manager = DeltaAwareHistoryFactory.createManagerWithServices(services, config);
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
export { DeltaAwareHistoryManager, DEFAULT_DELTA_HISTORY_CONFIG, type DeltaAwareServices } from "./DeltaAwareHistoryManager";
export { DeltaAwareHistoryFactory } from "./DeltaAwareHistoryFactory";

// Storage and Strategy (new decomposed components)
export { DeltaSnapshotStorage } from "./DeltaSnapshotStorage";
export { SnapshotStrategy } from "./SnapshotStrategy";
export type { DeltaSnapshotStorageConfig, DeltaStorageStats } from "./DeltaSnapshotStorage";
export type { SnapshotStrategyConfig, SnapshotDecision, DeltaChainInfo } from "./SnapshotStrategy";

// Optimized components
export { DeepCloneService } from "./DeepCloneService";
export { DeltaProcessor } from "./DeltaProcessor";
export { SnapshotReconstructor } from "./SnapshotReconstructor";

// Reconstructor (legacy)
export { SnapshotReconstructor as LegacySnapshotReconstructor } from "./reconstructor";
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
