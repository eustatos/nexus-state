/**
 * Types for ScopedRegistry — unified per-store atom registry
 *
 * Combines atom references, state, and metadata into a single entry.
 * Replaces the previous triple-registry architecture:
 *   - AtomStateManager.states (values)
 *   - StoreImpl.registry.atoms (IDs)
 *   - AtomRegistry (references + metadata)
 *
 * @packageDocumentation
 */

import type { AnyAtom, Atom, Store, AtomMetadata } from '../types';

/**
 * Internal state for an atom (alias for AtomStateManager.AtomState)
 */
export interface AtomState<Value = unknown> {
  /** The current value of the atom */
  value: Value;
  /** Set of subscribers to notify when the value changes */
  subscribers: Set<(value: Value) => void>;
  /** Set of dependent atoms that depend on this atom */
  dependents: Set<AnyAtom>;
}

/**
 * Unified entry for a registered atom within a ScopedRegistry.
 * Combines the atom reference, its state, and metadata.
 */
export interface AtomEntry<Value = unknown> {
  /** The atom reference */
  atom: Atom<Value>;
  /** The atom's state (value, subscribers, dependents) */
  state: AtomState<Value>;
  /** Metadata (name, type, creation time) */
  metadata: AtomMetadata;
}

/**
 * Per-store registry that owns all atom data for a single store.
 * Replaces the global AtomRegistry singleton + per-store Set<symbol>.
 */
export interface ScopedRegistryInterface {
  /**
   * Ensure an atom is registered, creating it if necessary
   */
  ensure<Value>(
    atom: Atom<Value>,
    stateFactory: () => AtomState<Value>
  ): AtomEntry<Value>;

  /**
   * Get entry by atom ID
   */
  get<Value>(id: symbol): AtomEntry<Value> | undefined;

  /**
   * Get entry by atom name
   */
  getByName<Value>(name: string): AtomEntry<Value> | undefined;

  /**
   * Check if atom is registered
   */
  has(id: symbol): boolean;

  /**
   * Get all entries
   */
  getAll(): Map<symbol, AtomEntry>;

  /**
   * Get all atom IDs
   */
  getAllIds(): symbol[];

  /**
   * Get state as a plain record for serialization
   */
  getStateAsRecord(): Record<string, unknown>;

  /**
   * Get state as a Map for iteration
   */
  getStateAsMap(): Map<string, unknown>;

  /**
   * Get display name for an atom
   */
  getName(atom: { id: symbol }): string;

  /**
   * Get metadata for an atom
   */
  getMetadata(id: symbol): AtomMetadata | undefined;

  /**
   * Clear all entries
   */
  clear(): void;

  /**
   * Get number of registered atoms
   */
  size(): number;
}
