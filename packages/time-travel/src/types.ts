// Minimal types for @nexus-state/time-travel
// Re-exports from core for Store, Atom, etc.

export type {
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
} from '@nexus-state/core';

// Define Snapshot types locally
export interface SnapshotMetadata {
  timestamp: number;
  action?: string;
  atomCount: number;
}

export interface SnapshotStateEntry {
  value: unknown;
  type: 'primitive' | 'computed' | 'writable';
  name?: string;
  atomId?: string;
}

export interface Snapshot {
  id: string;
  state: Record<string, SnapshotStateEntry>;
  metadata: SnapshotMetadata;
}

export interface TimeTravelOptions {
  maxHistory?: number;
  autoCapture?: boolean;
  autoInitializeAtoms?: boolean;  // Auto-initialize atoms from registry on capture (default: true)
}

export type TimeTravelEventType = 'undo' | 'redo' | 'jump' | 'snapshot';

export type TimeTravelUnsubscribe = () => void;

export interface TimeTravelAPI {
  capture(action?: string): void;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  jumpTo(index: number): boolean;
  clearHistory(): void;
  getHistory(): Snapshot[];
  importState(state: Record<string, unknown>): boolean;
  subscribe(event: TimeTravelEventType, callback: () => void): TimeTravelUnsubscribe;
  subscribeToSnapshots(callback: () => void): TimeTravelUnsubscribe;
}

export interface TimeTravelStats {
  length: number;
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}
