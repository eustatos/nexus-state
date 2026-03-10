/**
 * Reconstructor module - Decomposed components for snapshot reconstruction
 *
 * @packageDocumentation
 * Provides modular snapshot reconstruction with dependency injection
 */

// Main DI classes
export { SnapshotReconstructor } from './SnapshotReconstructor.di';
export type { SnapshotReconstructorDeps } from './SnapshotReconstructor.di';
export { OptimizedSnapshotReconstructor } from './OptimizedSnapshotReconstructor';

// Factory
export {
  createSnapshotReconstructor,
  createSnapshotReconstructorWithDeps,
  createOptimizedSnapshotReconstructor,
  createTestSnapshotReconstructor,
} from './ReconstructorFactory';

// Components
export { ReconstructionCache } from './ReconstructionCache';
export { DeltaApplier } from './DeltaApplier';

// Strategies
export {
  SequentialReconstructionStrategy,
  SkipDeltasReconstructionStrategy,
  CacheAwareReconstructionStrategy,
  StrategyRegistry,
} from './ReconstructionStrategies';

// Interfaces
export type {
  IReconstructionCache,
  IDeltaApplier,
  ISnapshotReconstructor,
  IReconstructionStrategy,
  IOptimizedSnapshotReconstructor,
} from './types.interfaces';
