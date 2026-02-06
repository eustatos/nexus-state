// packages/core/atom-registry.ts
/**
 * Global registry for atoms to support DevTools integration and time travel
 * 
 * Requirements:
 * - Global Registry Singleton
 * - Thread-safe for SSR environments
 * - O(1) lookup performance
 * - Automatic registration of all created atoms
 * - Store-aware registry for DevTools integration
 */

import type { Store, StoreRegistry, Atom } from './types';

type AtomType = 'primitive' | 'computed' | 'writable';

interface AtomMetadata {
  name: string;
  createdAt: number;
  type: AtomType;
}

export class AtomRegistry {
  private static instance: AtomRegistry;
  private registry: Map<symbol, any>;
  private metadata: Map<symbol, AtomMetadata>;
  private counter: number;
  // Store tracking for CORE-001
  private stores: Map<Store, StoreRegistry> = new Map();
  private globalRegistry: Map<symbol, any> = new Map();

  private constructor() {
    this.registry = new Map();
    this.metadata = new Map();
    this.counter = 0;
  }

  static getInstance(): AtomRegistry {
    if (!AtomRegistry.instance) {
      AtomRegistry.instance = new AtomRegistry();
    }
    return AtomRegistry.instance;
  }

  /**
   * Register an atom with optional name
   * @param atom The atom to register
   * @param name Optional display name for DevTools
   */
  register(atom: any, name?: string): void {
    const id = atom.id;
    
    // Handle duplicate registrations gracefully
    if (this.registry.has(id)) {
      // Atom already registered, update metadata if name provided
      if (name) {
        const existingMetadata = this.metadata.get(id);
        if (existingMetadata) {
          this.metadata.set(id, {
            ...existingMetadata,
            name
          });
        }
      }
      return;
    }

    // Generate fallback name if not provided
    const displayName = name || `atom-${++this.counter}`;
    
    // Determine atom type
    let type: AtomType = 'primitive';
    if (atom.read) {
      type = atom.write ? 'writable' : 'computed';
    }

    // Store atom and metadata
    this.registry.set(id, atom);
    this.metadata.set(id, {
      name: displayName,
      createdAt: Date.now(),
      type
    });
  }

  /**
   * Get atom by symbol ID
   * @param id Symbol ID of the atom
   * @returns The atom or undefined if not found
   */
  get(id: symbol): any | undefined {
    return this.registry.get(id);
  }

  /**
   * Get display name for atom
   * @param atom The atom
   * @returns Display name for the atom
   */
  getName(atom: any): string {
    const metadata = this.metadata.get(atom.id);
    return metadata?.name || `atom-${atom.id.toString()}`;
  }

  /**
   * Get all registered atoms
   * @returns Map of all registered atoms
   */
  getAll(): Map<symbol, any> {
    return new Map(this.registry);
  }

  /**
   * Get metadata for atom
   * @param atom The atom
   * @returns Metadata for the atom
   */
  getMetadata(atom: any): AtomMetadata | undefined {
    return this.metadata.get(atom.id);
  }

  /**
   * Clear registry (for testing)
   */
  clear(): void {
    this.registry.clear();
    this.metadata.clear();
    this.counter = 0;
    this.stores = new Map();
    this.globalRegistry.clear();
  }

  /**
   * Get registry size
   * @returns Number of registered atoms
   */
  size(): number {
    return this.registry.size;
  }

  // New methods for CORE-001 implementation

  /**
   * Attach a store to the registry with specified mode
   * @param store The store to attach
   * @param mode Registry mode - 'global' or 'isolated'
   */
  attachStore(store: Store, mode: "global" | "isolated" = "global"): void {
    if (!this.stores.has(store)) {
      this.stores.set(store, {
        store,
        atoms: new Set()
      });
    }
    
    // For global mode, register the store but keep global registry behavior
    // For isolated mode, atoms will be tracked per store
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
    if (this.globalRegistry.has(atomId)) {
      return undefined; // Global registry has no specific store owner
    }
    
    return undefined;
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
   * Get atom value through store reference
   * @param atomId Symbol ID of the atom
   * @returns The atom value or undefined if not found
   */
  getAtomValue(atomId: symbol): any | undefined {
    const atom = this.registry.get(atomId);
    if (!atom) return undefined;
    
    // Find which store owns this atom and get its value
    const store = this.getStoreForAtom(atomId);
    if (store) {
      try {
        return store.get(atom);
      } catch (error) {
        // If we can't get the value through the store, return the atom itself
        return atom;
      }
    }
    
    // If no store owns this atom, return the atom itself
    return atom;
  }

  // Additional methods for time-travel functionality

  /**
   * Get all computed atoms
   * @returns Map of computed atoms with their IDs
   */
  getAllComputedAtoms(): Map<string, any> {
    const computedAtoms = new Map<string, any>();
    for (const [id, atom] of this.registry) {
      const metadata = this.metadata.get(id);
      if (metadata && metadata.type === 'computed') {
        computedAtoms.set(id.toString(), atom);
      }
    }
    return computedAtoms;
  }

  /**
   * Get computed atom by ID
   * @param atomId The atom ID
   * @returns The computed atom or undefined if not found
   */
  getComputedAtom(atomId: string): any | undefined {
    const atom = this.registry.get(Symbol.for(atomId));
    if (atom) {
      const metadata = this.metadata.get(Symbol.for(atomId));
      if (metadata && metadata.type === 'computed') {
        return atom;
      }
    }
    return undefined;
  }

  /**
   * Get all atom IDs
   * @returns Array of all atom IDs
   */
  getAllAtomIds(): string[] {
    return Array.from(this.registry.keys()).map(id => id.toString());
  }

  /**
   * Get all atoms (alias for getAll for compatibility)
   * @returns Map of all atoms with their IDs
   */
  getAllAtoms(): Map<string, any> {
    const allAtoms = new Map<string, any>();
    for (const [id, atom] of this.registry) {
      allAtoms.set(id.toString(), atom);
    }
    return allAtoms;
  }
}

// Export singleton instance
export const atomRegistry = AtomRegistry.getInstance();