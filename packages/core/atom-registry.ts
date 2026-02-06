// packages/core/atom-registry.ts
/**
 * Global registry for atoms to support DevTools integration and time travel
 * 
 * Requirements:
 * - Global Registry Singleton
 * - Thread-safe for SSR environments
 * - O(1) lookup performance
 * - Automatic registration of all created atoms
 */

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
  }

  /**
   * Get registry size
   * @returns Number of registered atoms
   */
  size(): number {
    return this.registry.size;
  }
}

// Export singleton instance
export const atomRegistry = AtomRegistry.getInstance();