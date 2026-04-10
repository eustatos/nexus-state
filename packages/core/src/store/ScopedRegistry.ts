/**
 * ScopedRegistry — unified per-store atom registry
 *
 * Combines atom references, state, and metadata into a single data structure.
 * Each Store owns exactly one ScopedRegistry instance.
 *
 * @packageDocumentation
 */

import type { Atom, Store, AtomMetadata } from '../types';
import type {
  AtomState,
  AtomEntry,
  ScopedRegistryInterface,
} from './types';

/**
 * Unified registry for a single store.
 *
 * Replaces the previous triple-registry architecture where atom data was
 * split across AtomStateManager (values), StoreImpl.registry (IDs),
 * and AtomRegistry (references + metadata).
 *
 * @example
 * ```typescript
 * const registry = new ScopedRegistry(store);
 * const entry = registry.ensure(atom, () => createState());
 * console.log(entry.state.value);
 * ```
 */
export class ScopedRegistry implements ScopedRegistryInterface {
  private entries: Map<symbol, AtomEntry>;
  private nameToId: Map<string, symbol>;
  private store: Store;
  private counter: number;
  private duplicateWarnedNames: Set<string>;

  /**
   * Create a new scoped registry for a store
   * @param store The store that owns this registry
   */
  constructor(store: Store) {
    this.entries = new Map();
    this.nameToId = new Map();
    this.store = store;
    this.counter = 0;
    this.duplicateWarnedNames = new Set();
  }

  /**
   * Ensure an atom is registered, creating it if necessary.
   *
   * This is the single entry point for atom registration.
   * If the atom is already registered, returns the existing entry (no-op).
   *
   * @template Value The type of the atom's value
   * @param atom The atom to register
   * @param stateFactory Function to create initial state (called only on first registration)
   * @returns The atom entry (atom + state + metadata)
   */
  ensure<Value>(
    atom: Atom<Value>,
    stateFactory: () => AtomState<Value>
  ): AtomEntry<Value> {
    const id = atom.id;

    // Fast path: atom already registered
    const existing = this.entries.get(id) as AtomEntry<Value> | undefined;
    if (existing !== undefined) {
      // Update lazy registration metadata
      const lazyMeta = atom._lazyRegistration;
      if (lazyMeta !== undefined && lazyMeta !== null) {
        lazyMeta.accessCount++;
      }
      return existing;
    }

    // Mark lazy registration as complete
    const lazyMeta = atom._lazyRegistration;
    if (lazyMeta !== undefined && lazyMeta !== null) {
      if (!lazyMeta.registered) {
        lazyMeta.registered = true;
        lazyMeta.registeredAt = Date.now();
      }
      lazyMeta.accessCount++;
    }

    // Cast to unknown for internal processing (private methods don't use value type)
    const atomUnknown = atom as Atom<unknown>;

    // Determine display name
    const displayName = this.resolveName(atomUnknown);

    // Check for duplicate names (warn once per name)
    const isDuplicateName =
      atom.name !== undefined && this.nameToId.has(atom.name);
    if (isDuplicateName && !this.duplicateWarnedNames.has(atom.name)) {
      this.duplicateWarnedNames.add(atom.name);
      console.warn(
        '[nexus-state] Atom with name "' +
          atom.name +
          '" already exists. ' +
          'Using duplicate names may cause issues with DevTools and time-travel. ' +
          'Consider using unique names for all atoms.'
      );
    }

    // Determine atom type
    const type = this.resolveType(atomUnknown);

    // Create state via factory
    const state = stateFactory();

    // Create and store entry
    const metadata: AtomMetadata = {
      name: displayName,
      createdAt: Date.now(),
      type: type,
    };

    const entry: AtomEntry<Value> = {
      atom: atom,
      state: state,
      metadata: metadata,
    };

    this.entries.set(id, entry as AtomEntry);

    // Register name lookup (skip duplicates to preserve first registration)
    if (!isDuplicateName) {
      this.nameToId.set(displayName, id);
    }

    return entry;
  }

  /**
   * Get entry by atom symbol ID
   * @param id Symbol ID of the atom
   * @returns Atom entry or undefined if not found
   */
  get<Value>(id: symbol): AtomEntry<Value> | undefined {
    return this.entries.get(id) as AtomEntry<Value> | undefined;
  }

  /**
   * Get entry by atom display name
   * @param name The atom name
   * @returns Atom entry or undefined if not found
   */
  getByName<Value>(name: string): AtomEntry<Value> | undefined {
    const id = this.nameToId.get(name);
    if (id === undefined) {
      return undefined;
    }
    return this.get<Value>(id);
  }

  /**
   * Check if an atom is registered
   * @param id Symbol ID of the atom
   * @returns True if the atom is registered
   */
  has(id: symbol): boolean {
    return this.entries.has(id);
  }

  /**
   * Get all registered entries
   * @returns Map of atom ID to entry
   */
  getAll(): Map<symbol, AtomEntry> {
    return new Map(this.entries);
  }

  /**
   * Get all registered atom IDs
   * @returns Array of atom symbol IDs
   */
  getAllIds(): symbol[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Get state as a plain record for serialization.
   * Keys are atom names, values are current values.
   * @returns Record of name to value
   */
  getStateAsRecord(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const keys = this.entries.keys();
    let current = keys.next();
    while (!current.done) {
      const entry = this.entries.get(current.value);
      if (entry !== undefined) {
        result[entry.metadata.name] = entry.state.value;
      }
      current = keys.next();
    }
    return result;
  }

  /**
   * Get state as a Map for iteration.
   * Keys are atom names, values are current values.
   * @returns Map of name to value
   */
  getStateAsMap(): Map<string, unknown> {
    const result = new Map<string, unknown>();
    const keys = this.entries.keys();
    let current = keys.next();
    while (!current.done) {
      const entry = this.entries.get(current.value);
      if (entry !== undefined) {
        result.set(entry.metadata.name, entry.state.value);
      }
      current = keys.next();
    }
    return result;
  }

  /**
   * Get display name for an atom.
   * Strips 'atom-' prefix from auto-generated names for cleaner output.
   * @param atom The atom object or any object with an id property
   * @returns Display name for the atom
   */
  getName(atom: { id: symbol }): string {
    const entry = this.entries.get(atom.id);
    if (entry !== undefined) {
      const name = entry.metadata.name;
      return this.stripPrefix(name);
    }
    // Fallback: return raw ID string
    const idStr = atom.id.toString();
    return this.stripPrefix(idStr);
  }

  /**
   * Get metadata for an atom
   * @param id Symbol ID of the atom
   * @returns Metadata or undefined if not found
   */
  getMetadata(id: symbol): AtomMetadata | undefined {
    const entry = this.entries.get(id);
    if (entry === undefined) {
      return undefined;
    }
    return entry.metadata;
  }

  /**
   * Clear all entries and reset counter
   */
  clear(): void {
    this.entries.clear();
    this.nameToId.clear();
    this.counter = 0;
  }

  /**
   * Get number of registered atoms
   * @returns Count of registered atoms
   */
  size(): number {
    return this.entries.size;
  }

  /**
   * Resolve display name for an atom
   */
  private resolveName(atom: Atom<unknown>): string {
    if (atom.name !== undefined && atom.name !== '') {
      return atom.name;
    }
    return 'atom-' + ++this.counter;
  }

  /**
   * Resolve atom type from its properties
   */
  private resolveType(atom: Atom<unknown>): 'primitive' | 'computed' | 'writable' {
    // Explicit type field is always available on Atom
    if (atom.type !== undefined) {
      return atom.type;
    }
    // Fallback: infer from read/write properties (for compatibility)
    const atomAny = atom as Record<string, unknown>;
    if ('write' in atomAny && atomAny.write !== undefined) {
      return 'writable';
    }
    if ('read' in atomAny) {
      return 'computed';
    }
    return 'primitive';
  }

  /**
   * Strip 'atom-' prefix from auto-generated names
   */
  private stripPrefix(name: string): string {
    if (name.length > 5 && name.charAt(0) === 'a' && name.charAt(1) === 't' && name.charAt(2) === 'o' && name.charAt(3) === 'm' && name.charAt(4) === '-') {
      return name.substring(5);
    }
    return name;
  }
}
