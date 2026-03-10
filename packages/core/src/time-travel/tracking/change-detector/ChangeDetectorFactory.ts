/**
 * ChangeDetectorFactory - Creates AtomChangeDetector with dependencies
 */

import type { AtomTracker } from '../AtomTracker';
import { AtomChangeDetector } from './AtomChangeDetector.di';
import type { ChangeDetectorDeps } from './AtomChangeDetector.di';
import type {
  IChangeListenerRegistry,
  IChangeFilterManager,
  IChangeBatcher,
  IChangeDetector,
  IValueTracker,
} from './types.interfaces';
import { ChangeListenerRegistry } from './ChangeListenerRegistry';
import { ChangeFilterManager } from './ChangeFilterManager';
import { ChangeBatcher } from './ChangeBatcher';
import { ChangeDetector } from './ChangeDetector';
import { ValueTracker } from './ValueTracker';

/**
 * Create AtomChangeDetector with default dependencies
 */
export function createChangeDetector(
  tracker: AtomTracker,
  overrides?: Partial<ChangeDetectorDeps>
): AtomChangeDetector {
  const deps: ChangeDetectorDeps = {
    tracker,
    listenerRegistry: overrides?.listenerRegistry ?? new ChangeListenerRegistry(),
    filterManager: overrides?.filterManager ?? new ChangeFilterManager(),
    batcher: overrides?.batcher ?? new ChangeBatcher(),
    detector: overrides?.detector ?? new ChangeDetector(),
    valueTracker: overrides?.valueTracker ?? new ValueTracker(),
  };

  return new AtomChangeDetector(deps);
}

/**
 * Create AtomChangeDetector with mock/test dependencies
 */
export function createTestChangeDetector(
  tracker: AtomTracker,
  mockDeps: Partial<ChangeDetectorDeps>
): AtomChangeDetector {
  return createChangeDetector(tracker, mockDeps);
}
