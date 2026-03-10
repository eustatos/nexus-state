/**
 * ReconstructorFactory - Creates reconstructors with dependencies
 */

import { SnapshotReconstructor } from './SnapshotReconstructor.di';
import { OptimizedSnapshotReconstructor } from './OptimizedSnapshotReconstructor';
import type { SnapshotReconstructorDeps } from './SnapshotReconstructor.di';
import type { ReconstructionOptions } from '../types';

/**
 * Create SnapshotReconstructor with default dependencies
 */
export function createSnapshotReconstructor(
  config?: Partial<ReconstructionOptions>
): SnapshotReconstructor {
  return new SnapshotReconstructor({ config });
}

/**
 * Create SnapshotReconstructor with custom dependencies
 */
export function createSnapshotReconstructorWithDeps(
  deps: SnapshotReconstructorDeps
): SnapshotReconstructor {
  return new SnapshotReconstructor(deps);
}

/**
 * Create OptimizedSnapshotReconstructor
 */
export function createOptimizedSnapshotReconstructor(
  config?: Partial<ReconstructionOptions>
): OptimizedSnapshotReconstructor {
  return new OptimizedSnapshotReconstructor({ config });
}

/**
 * Create SnapshotReconstructor for testing with mock dependencies
 */
export function createTestSnapshotReconstructor(
  mockDeps: Partial<SnapshotReconstructorDeps>
): SnapshotReconstructor {
  return new SnapshotReconstructor(mockDeps);
}
