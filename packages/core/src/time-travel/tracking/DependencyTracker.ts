/**
 * DependencyTracker - Manages dependencies between atoms
 *
 * Tracks which atoms depend on which other atoms,
 * provides dependency graph analysis and cycle detection.
 */

import type { ComputedDependency } from './types';

/**
 * Dependency graph structure
 */
export interface DependencyGraph {
  /** Map of atom name to its dependencies */
  [atomName: string]: string[];
}

/**
 * Circular dependency detection result
 */
export interface CircularDependency {
  /** Atoms in the cycle */
  cycle: symbol[];
  /** Names of atoms in the cycle (for display) */
  names: string[];
}

/**
 * Statistics about dependencies
 */
export interface DependencyStats {
  /** Total number of computed atoms */
  totalComputed: number;
  /** Total number of dependencies */
  dependencyCount: number;
  /** Number of atoms with dependents */
  atomsWithDependents: number;
  /** Has circular dependencies */
  hasCircular: boolean;
}

/**
 * DependencyTracker provides dependency management
 * for computed atoms without external dependencies
 */
export class DependencyTracker {
  /** Map of atom ID to its dependencies */
  private dependencies: Map<symbol, ComputedDependency[]> = new Map();

  /** Map of atom ID to set of dependent atom IDs */
  private dependents: Map<symbol, Set<symbol>> = new Map();

  /**
   * Register dependencies for a computed atom
   * @param atomId - ID of the computed atom
   * @param dependencies - Array of dependencies
   */
  register(atomId: symbol, dependencies: ComputedDependency[]): void {
    this.dependencies.set(atomId, dependencies);

    // Register this atom as dependent on each dependency
    dependencies.forEach((dep) => {
      const depId = dep.atom.id;
      if (!this.dependents.has(depId)) {
        this.dependents.set(depId, new Set());
      }
      this.dependents.get(depId)!.add(atomId);
    });
  }

  /**
   * Get dependencies for a computed atom
   * @param atomId - ID of the computed atom
   * @returns Array of dependencies or empty array
   */
  getDependencies(atomId: symbol): ComputedDependency[] {
    return this.dependencies.get(atomId) || [];
  }

  /**
   * Get all atoms that depend on the given atom
   * @param atomId - ID of the atom
   * @returns Array of dependent atom IDs
   */
  getDependents(atomId: symbol): symbol[] {
    return Array.from(this.dependents.get(atomId) || []);
  }

  /**
   * Check if an atom has dependents
   * @param atomId - ID of the atom
   * @returns True if atom has dependents
   */
  hasDependents(atomId: symbol): boolean {
    const deps = this.dependents.get(atomId);
    return deps !== undefined && deps.size > 0;
  }

  /**
   * Get all computed atom IDs
   * @returns Array of atom IDs
   */
  getAllComputed(): symbol[] {
    return Array.from(this.dependencies.keys());
  }

  /**
   * Check if an atom is computed (has dependencies)
   * @param atomId - ID of the atom
   * @returns True if atom is computed
   */
  isComputed(atomId: symbol): boolean {
    return this.dependencies.has(atomId);
  }

  /**
   * Remove an atom and its dependencies
   * @param atomId - ID of the atom to remove
   */
  remove(atomId: symbol): void {
    // Remove from dependencies
    this.dependencies.delete(atomId);

    // Remove from dependents lists
    this.dependents.forEach((deps, depId) => {
      deps.delete(atomId);
      // Clean up empty sets
      if (deps.size === 0) {
        this.dependents.delete(depId);
      }
    });
  }

  /**
   * Get dependency statistics
   * @returns Statistics object
   */
  getStats(): DependencyStats {
    const hasCircular = this.detectCircularDependencies().length > 0;

    return {
      totalComputed: this.dependencies.size,
      dependencyCount: Array.from(this.dependencies.values()).reduce(
        (sum, deps) => sum + deps.length,
        0
      ),
      atomsWithDependents: this.dependents.size,
      hasCircular,
    };
  }

  /**
   * Get dependency graph as a plain object
   * @param getName - Function to get atom name from ID
   * @returns Dependency graph
   */
  getDependencyGraph(
    getName: (atomId: symbol) => string
  ): DependencyGraph {
    const graph: DependencyGraph = {};

    this.dependencies.forEach((deps, atomId) => {
      const atomName = getName(atomId);
      graph[atomName] = deps.map((dep) => getName(dep.atom.id));
    });

    return graph;
  }

  /**
   * Detect circular dependencies in the graph
   * @returns Array of circular dependencies
   */
  detectCircularDependencies(): CircularDependency[] {
    const visited = new Set<symbol>();
    const recursionStack = new Set<symbol>();
    const circular: CircularDependency[] = [];

    const dfs = (atomId: symbol, path: symbol[] = []) => {
      if (recursionStack.has(atomId)) {
        // Found a cycle
        const cycleStart = path.indexOf(atomId);
        const cycle = [...path.slice(cycleStart), atomId];
        circular.push({
          cycle,
          names: cycle.map((id) => this.getAtomName(id)),
        });
        return;
      }

      if (visited.has(atomId)) return;

      visited.add(atomId);
      recursionStack.add(atomId);
      path.push(atomId);

      const deps = this.dependencies.get(atomId) || [];
      deps.forEach((dep) => {
        dfs(dep.atom.id, [...path]);
      });

      recursionStack.delete(atomId);
    };

    this.dependencies.forEach((_, atomId) => {
      if (!visited.has(atomId)) {
        dfs(atomId);
      }
    });

    return circular;
  }

  /**
   * Get atom name for display purposes
   * @param atomId - Atom ID
   * @returns Atom name or string representation
   */
  private getAtomName(atomId: symbol): string {
    // Try to get name from tracked atoms
    // For now, return string representation
    return String(atomId);
  }

  /**
   * Clear all dependencies
   */
  clear(): void {
    this.dependencies.clear();
    this.dependents.clear();
  }
}
