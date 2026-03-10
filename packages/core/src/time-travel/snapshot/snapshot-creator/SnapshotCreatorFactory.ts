/**
 * SnapshotCreatorFactory - Creates SnapshotCreator with dependencies
 */

import type { Store } from '../../../types';
import type { SnapshotCreatorConfig } from './types';
import { SnapshotCreator } from './SnapshotCreator.di';
import type { SnapshotCreatorDeps } from './SnapshotCreator.di';

/**
 * Create SnapshotCreator with default dependencies
 */
export function createSnapshotCreator(
  store: Store,
  config?: Partial<SnapshotCreatorConfig>
): SnapshotCreator {
  const deps: SnapshotCreatorDeps = {
    store,
    config,
  };

  return new SnapshotCreator(deps);
}

/**
 * Create SnapshotCreator with custom dependencies
 */
export function createSnapshotCreatorWithDeps(
  deps: SnapshotCreatorDeps
): SnapshotCreator {
  return new SnapshotCreator(deps);
}

/**
 * Create SnapshotCreator for testing with mock dependencies
 */
export function createTestSnapshotCreator(
  store: Store,
  mockDeps: Partial<SnapshotCreatorDeps>
): SnapshotCreator {
  return createSnapshotCreatorWithDeps({
    store,
    ...mockDeps,
  });
}
