/**
 * SnapshotCreator module - Decomposed components for snapshot creation
 *
 * @packageDocumentation
 * Provides modular snapshot creation with dependency injection
 */

// Main DI class
export { SnapshotCreator } from './SnapshotCreator.di';
export type { SnapshotCreatorDeps } from './SnapshotCreator.di';

// Factory
export {
  createSnapshotCreator,
  createSnapshotCreatorWithDeps,
  createTestSnapshotCreator,
} from './SnapshotCreatorFactory';

// Components
export { StateCaptureService } from './StateCaptureService';
export { SnapshotValidator } from './SnapshotValidator';
export { StateComparator } from './StateComparator';
export { SnapshotEventEmitter } from './SnapshotEventEmitter';
export { SnapshotIdGenerator } from './SnapshotIdGenerator';
export { AtomRegistryAdapter } from './AtomRegistryAdapter';

// Interfaces
export type {
  IStateCapture,
  ISnapshotValidator,
  ISnapshotTransformer,
  ISnapshotSerializer,
  ISnapshotIdGenerator,
  IStateComparator,
  ISnapshotEventEmitter,
  IAtomRegistryAdapter,
} from './types.interfaces';
