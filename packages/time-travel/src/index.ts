/**
 * TimeTravel - Time travel debugging for Nexus State
 * @packageDocumentation
 */

// Re-export from core for convenience
export { atom, createStore, createEnhancedStore } from '@nexus-state/core';

export { TimeTravelController } from './TimeTravelController';
export { SimpleTimeTravel } from './SimpleTimeTravel';

export type {
  TimeTravelAPI,
  TimeTravelOptions,
  TimeTravelStats,
  Store,
  Atom,
  PrimitiveAtom,
  ComputedAtom,
  WritableAtom,
  Getter,
  Setter,
  Subscriber,
  Plugin,
  PluginHooks,
  Snapshot,
  SnapshotMetadata,
  SnapshotStateEntry,
} from './types';

export { VERSION, DEFAULT_MAX_HISTORY, DEFAULT_AUTO_CAPTURE } from './constants';
