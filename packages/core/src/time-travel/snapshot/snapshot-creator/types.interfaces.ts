/**
 * SnapshotCreator module interfaces
 * Enables dependency injection and testability
 */

import type { Snapshot, SnapshotStateEntry } from '../types';
import type { Atom, Store } from '../../types';
import type { SnapshotCreatorConfig } from './types';

/**
 * State capture service
 */
export interface IStateCapture {
  /**
   * Capture current state
   */
  captureState(atomIds?: Set<symbol>): Record<string, SnapshotStateEntry>;

  /**
   * Add atom to state
   */
  addAtomToState(atom: Atom<any>, state: Record<string, SnapshotStateEntry>): void;
}

/**
 * Snapshot validator
 */
export interface ISnapshotValidator {
  /**
   * Validate snapshot
   */
  validate(snapshot: Snapshot): boolean;

  /**
   * Validate snapshot state
   */
  validateState(state: Record<string, SnapshotStateEntry>): boolean;
}

/**
 * Snapshot transformer
 */
export interface ISnapshotTransformer {
  /**
   * Apply transform to snapshot
   */
  transform(snapshot: Snapshot): Snapshot;
}

/**
 * Snapshot serializer
 */
export interface ISnapshotSerializer {
  /**
   * Serialize value
   */
  serialize(value: unknown): unknown;

  /**
   * Deserialize value
   */
  deserialize(value: unknown): unknown;
}

/**
 * Snapshot ID generator
 */
export interface ISnapshotIdGenerator {
  /**
   * Generate unique ID
   */
  generate(): string;
}

/**
 * State comparison service
 */
export interface IStateComparator {
  /**
   * Compare two states
   */
  statesEqual(
    a: Record<string, SnapshotStateEntry>,
    b: Record<string, SnapshotStateEntry>
  ): boolean;

  /**
   * Compare two values
   */
  valuesEqual(a: unknown, b: unknown): boolean;
}

/**
 * Atom registry adapter
 */
export interface IAtomRegistryAdapter {
  /**
   * Get all atoms
   */
  getAll(): Map<symbol, Atom<any>>;

  /**
   * Get atom by ID
   */
  get(atomId: symbol): Atom<any> | undefined;
}

/**
 * Snapshot event emitter
 */
export interface ISnapshotEventEmitter {
  /**
   * Subscribe to events
   */
  subscribe(event: 'create' | 'error', listener: (snapshot: Snapshot) => void): () => void;

  /**
   * Emit event
   */
  emit(event: 'create' | 'error', snapshot?: Snapshot): void;

  /**
   * Clear all listeners
   */
  clearListeners(): void;

  /**
   * Get listener count
   */
  getListenerCount(event: 'create' | 'error'): number;
}

/**
 * Dependencies for SnapshotCreator
 */
export interface SnapshotCreatorDeps {
  store: Store;
  stateCapture?: IStateCapture;
  validator?: ISnapshotValidator;
  transformer?: ISnapshotTransformer;
  serializer?: ISnapshotSerializer;
  idGenerator?: ISnapshotIdGenerator;
  comparator?: IStateComparator;
  eventEmitter?: ISnapshotEventEmitter;
  config?: Partial<SnapshotCreatorConfig>;
}
