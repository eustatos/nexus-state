/**
 * StatsCollector module - Decomposed components for statistics collection
 *
 * @packageDocumentation
 * Provides modular statistics collection with dependency injection
 */

// Main DI class
export { StatisticsCollector } from './StatisticsCollector.di';
export type { StatsCollectorDeps } from './StatisticsCollector.di';

// Factory
export { createStatsCollector, createTestStatsCollector } from './StatsCollectorFactory';

// Components
export { CleanupHistoryManager } from './CleanupHistoryManager';
export { AccessTracker } from './AccessTracker';
export { TrackingStatsCollector } from './TrackingStatsCollector';

// Interfaces
export type {
  ICleanupHistoryManager,
  IAccessTracker,
  ITrackingStatsCollector,
  IStatsProvider,
  CleanupStats,
  AccessStats,
} from './types.interfaces';
