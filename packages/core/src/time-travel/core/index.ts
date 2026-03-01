/**
 * Core module for SimpleTimeTravel
 * Provides the main implementation and core components
 */

// Re-export main class
export { SimpleTimeTravel } from "./SimpleTimeTravel";

// Re-export types
export type {
  TimeTravelAPI,
  TimeTravelOptions,
  Snapshot,
  SnapshotMetadata,
  SnapshotStateEntry,
} from "../types";

// Re-export core components (for advanced use cases or testing)
export { HistoryManager } from "./HistoryManager";
export { HistoryNavigator } from "./HistoryNavigator";
export type { HistoryManagerConfig, NavigationResult } from "./types";

// Re-export internal types (useful for extensions)
export type {
  HistoryState,
  HistoryOperation,
  HistoryValidationResult,
  HistoryIndex,
  HistoryBounds,
} from "./types";

// Re-export disposal infrastructure
export {
  BaseDisposable,
  LeakDetector,
  FinalizationHelper,
  DisposalError,
  AggregateDisposalError,
} from "./disposable";
export type {
  Disposable,
  DisposableConfig,
} from "./disposable";
