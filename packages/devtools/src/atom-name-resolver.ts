/**
 * AtomNameResolver - Resolves atom names for DevTools display
 * 
 * This service provides utilities for getting and formatting atom names
 * for display in DevTools. It integrates with the atom registry and
 * provides configurable formatting options.
 */

import type { BasicAtom } from "./types";
import { atomRegistry } from "@nexus-state/core";

/**
 * Atom name formatting options
 */
export interface AtomNameFormatOptions {
  /** Whether to show atom names (default: true) */
  showAtomNames?: boolean;
  /** Custom formatter function */
  formatter?: (atom: BasicAtom, defaultName: string) => string;
  /** Whether to include atom ID (default: false) */
  includeId?: boolean;
  /** Whether to include atom type (default: false) */
  includeType?: boolean;
  /** Maximum name length (default: 50) */
  maxLength?: number;
  /** Ellipsis for truncated names (default: "...") */
  ellipsis?: string;
}

/**
 * AtomNameResolver class for resolving and formatting atom names
 */
export class AtomNameResolver {
  private options: Required<AtomNameFormatOptions>;

  constructor(options: AtomNameFormatOptions = {}) {
    this.options = {
      showAtomNames: options.showAtomNames ?? true,
      formatter: options.formatter ?? ((_atom, defaultName) => defaultName),
      includeId: options.includeId ?? false,
      includeType: options.includeType ?? false,
      maxLength: options.maxLength ?? 50,
      ellipsis: options.ellipsis ?? "...",
    };
  }

  /**
   * Get the name for an atom
   * @param atom The atom to get name for
   * @returns Display name for the atom
   */
  getName(atom: BasicAtom): string {
    try {
      // If showAtomNames is disabled, use atom's toString method
      if (!this.options.showAtomNames) {
        return this.formatName(atom.toString());
      }

      // Get default name from registry
      const defaultName = this.getDefaultName(atom);

      // Apply custom formatter if provided
      const formattedName = this.options.formatter(atom, defaultName);
      
      // Apply final formatting
      return this.formatName(formattedName);
    } catch (error) {
      // Fallback for any errors
      return this.getFallbackName(atom);
    }
  }

  /**
   * Format a name according to options
   * @param name The name to format
   * @returns Formatted name
   */
  formatName(name: string): string {
    let formatted = name;

    // Truncate if too long
    if (formatted.length > this.options.maxLength) {
      const keepLength = this.options.maxLength - this.options.ellipsis.length;
      formatted = formatted.substring(0, keepLength) + this.options.ellipsis;
    }

    return formatted;
  }

  /**
   * Get default name for an atom
   * @param atom The atom
   * @returns Default name
   */
  private getDefaultName(atom: BasicAtom): string {
    // Try to get name from registry
    const registryName = atomRegistry.getName(atom);
    if (registryName) {
      return registryName;
    }

    // Try to get name from atom's toString method
    const toStringName = atom.toString();
    if (toStringName && toStringName !== "[object Object]") {
      return toStringName;
    }

    // Try to get name from atom's displayName property
    if ((atom as any).displayName && typeof (atom as any).displayName === "string") {
      return (atom as any).displayName;
    }

    // Try to get name from atom's name property
    if ((atom as any).name && typeof (atom as any).name === "string") {
      return (atom as any).name;
    }

    // Fallback to atom ID
    if (atom.id?.toString()) {
      return atom.id.toString();
    }

    return "unknown-atom";
  }

  /**
   * Get fallback name for an atom (used when errors occur)
   * @param atom The atom
   * @returns Fallback name
   */
  private getFallbackName(atom: BasicAtom): string {
    if (atom.id?.toString()) {
      return `atom-${atom.id.toString()}`;
    }

    // Generate a simple hash from the atom object
    const simpleHash = this.generateSimpleHash(atom);
    return `atom-${simpleHash}`;
  }

  /**
   * Generate a simple hash for an object
   * @param obj The object to hash
   * @returns Simple hash string
   */
  private generateSimpleHash(obj: unknown): string {
    try {
      const str = JSON.stringify(obj) || String(obj);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36).substring(0, 8);
    } catch (error) {
      return "unknown";
    }
  }

  /**
   * Get atom name with additional metadata
   * @param atom The atom
   * @returns Name with metadata
   */
  getNameWithMetadata(atom: BasicAtom): {
    name: string;
    id?: string;
    type?: string;
    registryName?: string;
  } {
    const name = this.getName(atom);
    const result: {
      name: string;
      id?: string;
      type?: string;
      registryName?: string;
    } = { name };

    if (this.options.includeId && atom.id?.toString()) {
      result.id = atom.id.toString();
    }

    if (this.options.includeType) {
      result.type = this.getAtomType(atom);
    }

    try {
      const registryName = atomRegistry.getName(atom);
      if (registryName) {
        result.registryName = registryName;
      }
    } catch (error) {
      // Ignore errors when getting registry name
    }

    return result;
  }

  /**
   * Get atom type
   * @param atom The atom
   * @returns Atom type string
   */
  private getAtomType(atom: BasicAtom): string {
    if (typeof atom === "function") {
      return "function";
    }
    if (atom && typeof atom === "object") {
      if ((atom as any).read && typeof (atom as any).read === "function") {
        return "readable";
      }
      if ((atom as any).write && typeof (atom as any).write === "function") {
        return "writable";
      }
      if ((atom as any).subscribe && typeof (atom as any).subscribe === "function") {
        return "store";
      }
      return "object";
    }
    return typeof atom;
  }

  /**
   * Update resolver options
   * @param options New options
   */
  updateOptions(options: AtomNameFormatOptions): void {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  /**
   * Get current options
   * @returns Current options
   */
  getOptions(): Required<AtomNameFormatOptions> {
    return { ...this.options };
  }
}

/**
 * Create a new AtomNameResolver instance
 * @param options Resolver options
 * @returns New AtomNameResolver instance
 */
export function createAtomNameResolver(options: AtomNameFormatOptions = {}): AtomNameResolver {
  return new AtomNameResolver(options);
}

/**
 * Default atom name resolver instance for convenience
 */
export const defaultAtomNameResolver = createAtomNameResolver();