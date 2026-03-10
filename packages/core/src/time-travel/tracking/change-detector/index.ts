/**
 * ChangeDetector module - Decomposed components for change detection
 *
 * @packageDocumentation
 * Provides modular change detection with dependency injection
 */

// Main DI class
export { AtomChangeDetector } from './AtomChangeDetector.di';
export type { ChangeDetectorDeps } from './AtomChangeDetector.di';

// Factory
export { createChangeDetector, createTestChangeDetector } from './ChangeDetectorFactory';

// Components
export { ChangeListenerRegistry } from './ChangeListenerRegistry';
export { ChangeFilterManager } from './ChangeFilterManager';
export { ChangeBatcher } from './ChangeBatcher';
export { ChangeDetector } from './ChangeDetector';
export { ValueTracker } from './ValueTracker';

// Interfaces
export type {
  IChangeListenerRegistry,
  IChangeFilterManager,
  IChangeBatcher,
  IChangeDetector,
  IValueTracker,
} from './types.interfaces';
