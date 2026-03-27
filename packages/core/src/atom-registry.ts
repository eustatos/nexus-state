// packages/core/atom-registry.ts
/**
 * Global registry for atoms to support DevTools integration and time travel
 *
 * ARCHITECTURE: Atom reference registry (not state)
 * - Stores atom REFERENCES for lookup by name
 * - Does NOT store atom values (states are in Store)
 * - Supports SSR isolation via createIsolatedRegistry()
 * - Uses WeakRef to allow GC of unused atoms (optional optimization)
 */

import type { Store, StoreRegistry, Atom } from './types';

type AtomType = 'primitive' | 'computed' | 'writable';

export interface AtomMetadata {
  name: string;
  createdAt: number;
  type: AtomType;
}

export class AtomRegistry {
  private static instance: AtomRegistry;
  private atoms: Map<symbol, Atom<unknown>>;
  private metadata: Map<symbol, AtomMetadata>;
  private nameToId: Map<string, symbol>;
  private counter: number;
  // Store tracking for SSR isolation
  private stores: Map<Store, StoreRegistry> = new Map();

  constructor() {
    this.atoms = new Map();
    this.metadata = new Map();
    this.nameToId = new Map();
    this.counter = 0;
  }

  static getInstance(): AtomRegistry {
    if (!AtomRegistry.instance) {
      AtomRegistry.instance = new AtomRegistry();
    }
    return AtomRegistry.instance;
  }

  /**
   * Register atom reference and metadata for lookup by name
   * Called on first store access (store.get/set/subscribe)
   * 
   * @param atom The atom to register
   * @param name Optional display name for DevTools
   */
  register(atom: Atom<unknown>, name?: string): void {
    const id = atom.id;

    // Handle duplicate registrations gracefully (same ID registered twice)
    if (this.atoms.has(id)) {
      // Atom already registered, update metadata if name provided
      if (name) {
        const existingMetadata = this.metadata.get(id);
        if (existingMetadata) {
          this.metadata.set(id, {
            ...existingMetadata,
            name
          });
          // Update nameToId for same ID re-registration (allows name changes)
          this.nameToId.set(name, id);
        }
      }
      return;
    }

    // Generate fallback name if not provided
    const displayName = name || `atom-${++this.counter}`;

    // Check for duplicate names (different IDs with same name)
    const isDuplicateName = name && this.nameToId.has(name);
    if (isDuplicateName) {
      console.warn(
        `[nexus-state] Atom with name "${name}" already exists. ` +
        `Using duplicate names may cause issues with DevTools and time-travel. ` +
        `Consider using unique names for all atoms.`
      );
      // Don't add duplicate name to nameToId - keep first registration
      // But still register the atom with its ID
    }

    // Determine atom type - use explicit type if available, otherwise infer from read/write
    let type: AtomType;
    if (atom.type) {
      type = atom.type;
    } else if ('read' in atom) {
      // Infer type from read/write properties
      type = 'write' in atom ? 'writable' : 'computed';
    } else {
      type = 'primitive';
    }

    // Store atom reference and metadata
    this.atoms.set(id, atom);
    this.metadata.set(id, {
      name: displayName,
      createdAt: Date.now(),
      type
    });

    // Add to name lookup map only if not a duplicate
    // For duplicates, keep the first registration
    if (!isDuplicateName) {
      this.nameToId.set(displayName, id);
    }
  }

  /**
   * Get atom reference by symbol ID
   * @param id Symbol ID of the atom
   * @returns Atom reference or undefined if not found
   */
  get(id: symbol): Atom<unknown> | undefined {
    return this.atoms.get(id);
  }

  /**
   * Get atom metadata by symbol ID
   * @param id Symbol ID of the atom
   * @returns Metadata or undefined if not found
   */
  getMetadata(id: symbol): AtomMetadata | undefined;
  
  /**
   * Get atom metadata by atom object (convenience overload)
   * @param atom Atom object
   * @returns Metadata or undefined if not found
   */
  getMetadata(atom: { id: symbol }): AtomMetadata | undefined;
  
  /**
   * Get atom metadata by symbol ID or atom object
   * @param idOrAtom Symbol ID or atom object
   * @returns Metadata or undefined if not found
   */
  getMetadata(idOrAtom: symbol | { id: symbol }): AtomMetadata | undefined {
    const id = typeof idOrAtom === 'symbol' ? idOrAtom : idOrAtom.id;
    return this.metadata.get(id);
  }

  /**
   * Get atom reference by name
   * 
   * Returns the atom reference, which can then be used with store.get/set()
   * 
   * @param name The atom name
   * @returns Atom reference or undefined if not found
   */
  getByName(name: string): Atom<unknown> | undefined {
    const id = this.nameToId.get(name);
    if (id) {
      return this.atoms.get(id);
    }
    return undefined;
  }

  /**
   * Get display name for atom
   * @param atom The atom
   * @returns Display name for the atom
   */
  getName(atom: { id: symbol }): string {
    const metadata = this.metadata.get(atom.id);
    if (metadata && metadata.name) {
      // Remove 'atom-' prefix if present (from auto-generated names)
      const name = metadata.name;
      return name.startsWith('atom-') ? name.substring(5) : name;
    }
    // Return just the atom ID string without 'atom-' prefix
    const idStr = atom.id.toString();
    return idStr.startsWith('atom-') ? idStr.substring(5) : idStr;
  }

  /**
   * Get all registered atom references
   * @returns Map of atom ID to atom reference
   */
  getAll(): Map<symbol, Atom<unknown>> {
    return new Map(this.atoms);
  }

  /**
   * Get all registered atom metadata
   * @returns Map of atom ID to metadata
   */
  getAllMetadata(): Map<symbol, AtomMetadata> {
    return new Map(this.metadata);
  }

  /**
   * Get all registered atom names
   * @returns Array of atom names
   */
  getAllNames(): string[] {
    return Array.from(this.nameToId.keys());
  }

  /**
   * Get atom by symbol ID (alias for get)
   * @param id Symbol ID of the atom
   * @returns Atom reference or undefined if not found
   */
  getAtom(id: symbol): Atom<unknown> | undefined {
    return this.atoms.get(id);
  }

  /**
   * Get all atom IDs
   * @returns Array of all atom IDs
   */
  getAllAtomIds(): string[] {
    return Array.from(this.atoms.keys()).map(id => id.toString());
  }

  /**
   * Get all atoms (alias for getAll for compatibility)
   * @returns Map of all atoms with string IDs
   */
  getAllAtoms(): Map<string, Atom<unknown>> {
    const allAtoms = new Map<string, Atom<unknown>>();
    for (const [id, atom] of this.atoms) {
      allAtoms.set(id.toString(), atom);
    }
    return allAtoms;
  }

  /**
   * Get atom value through store reference
   * @param atomId Symbol ID of the atom
   * @returns The atom value or undefined if not found
   */
  getAtomValue(atomId: symbol): unknown | undefined {
    const atom = this.atoms.get(atomId);
    if (!atom) return undefined;

    // Find which store owns this atom and get its value
    const store = this.getStoreForAtom(atomId);
    if (store) {
      try {
        return store.get(atom as never);
      } catch (error) {
        // If we can't get the value through the store, return the atom itself
        return atom;
      }
    }

    // If no store owns this atom, return the atom itself
    return atom;
  }

  /**
   * Get the store that owns the specified atom
   * @param atomId Symbol ID of the atom
   * @returns The store that owns the atom, or undefined if not found
   */
  getStoreForAtom(atomId: symbol): Store | undefined {
    // Check isolated registries first
    for (const [store, registry] of this.stores) {
      if (registry.atoms.has(atomId)) {
        return store;
      }
    }

    // If not found in isolated registries, atom belongs to global registry
    // Global registry has no specific store owner
    return undefined;
  }

  /**
   * Get all computed atoms
   * @returns Map of computed atoms with their IDs
   */
  getAllComputedAtoms(): Map<string, Atom<unknown>> {
    const computedAtoms = new Map<string, Atom<unknown>>();
    for (const [id, atom] of this.atoms) {
      const metadata = this.metadata.get(id);
      if (metadata && metadata.type === 'computed') {
        computedAtoms.set(id.toString(), atom);
      }
    }
    return computedAtoms;
  }

  /**
   * Get computed atom by ID string
   * @param atomId The atom ID as string
   * @returns The computed atom or undefined if not found or not computed
   */
  getComputedAtom(atomId: string): Atom<unknown> | undefined {
    // Try to find atom by string ID
    for (const [id, atom] of this.atoms) {
      if (id.toString() === atomId) {
        const metadata = this.metadata.get(id);
        if (metadata && metadata.type === 'computed') {
          return atom;
        }
        return undefined; // Found but not computed
      }
    }
    return undefined; // Not found
  }

  /**
   * Clear registry (for testing)
   */
  clear(): void {
    this.atoms.clear();
    this.metadata.clear();
    this.nameToId.clear();
    this.counter = 0;
    this.stores.clear();
  }

  /**
   * Get registry size
   * @returns Number of registered atoms
   */
  size(): number {
    return this.atoms.size;
  }

  /**
   * Check if atom is registered
   * @param atomId Symbol ID of the atom
   * @returns True if atom is registered
   */
  isRegistered(atomId: symbol): boolean {
    return this.atoms.has(atomId);
  }

  // Store tracking methods for SSR isolation

  /**
   * Attach a store to the registry with specified mode
   * @param store The store to attach
   * @param _mode Registry mode - 'global' or 'isolated'
   */
  attachStore(store: Store, _mode: "global" | "isolated" = "global"): void {
    if (!this.stores.has(store)) {
      this.stores.set(store, {
        store,
        atoms: new Set()
      });
    }
  }

  /**
   * Get all atoms associated with a specific store
   * @param store The store
   * @returns Array of atom IDs associated with the store
   */
  getAtomsForStore(store: Store): symbol[] {
    const registry = this.stores.get(store);
    if (registry) {
      return Array.from(registry.atoms);
    }
    return [];
  }

  /**
   * Get all stores that contain the specified atom
   * @param atomId Symbol ID of the atom
   * @returns Array of stores that contain the atom
   */
  getAllStoresForAtom(atomId: symbol): Store[] {
    const stores: Store[] = [];
    for (const [store, registry] of this.stores) {
      if (registry.atoms.has(atomId)) {
        stores.push(store);
      }
    }
    return stores;
  }

  /**
   * Get the stores map for internal use
   * @returns Map of stores
   */
  getStoresMap(): Map<Store, StoreRegistry> {
    return this.stores;
  }
}

// Export singleton instance
export const atomRegistry = AtomRegistry.getInstance();

/**
 * Create an isolated atom registry for SSR
 * @returns A new AtomRegistry instance not tied to the global singleton
 * @example
 * // Usage in SSR
 * export async function handleRequest() {
 *   const registry = createIsolatedRegistry();
 *   const store = createStore(registry);
 *   // ...
 * }
 */
export function createIsolatedRegistry(): AtomRegistry {
  return new AtomRegistry();
}
