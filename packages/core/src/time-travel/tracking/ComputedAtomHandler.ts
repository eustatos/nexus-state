/**
 * ComputedAtomHandler - Manages computed atoms and their dependencies
 */

import type {
  ComputedAtomConfig,
  ComputedDependency,
  ComputedCache,
  TrackedAtom,
} from "./types";
import { AtomTracker } from "./AtomTracker";

export class ComputedAtomHandler {
  private tracker: AtomTracker;
  private dependencies: Map<symbol, ComputedDependency[]> = new Map();
  private dependents: Map<symbol, Set<symbol>> = new Map();
  private cache: Map<symbol, ComputedCache> = new Map();
  private configs: Map<symbol, ComputedAtomConfig> = new Map();
  private recomputeQueue: Set<symbol> = new Set();
  private recomputeTimeout: NodeJS.Timeout | null = null;

  constructor(tracker: AtomTracker) {
    this.tracker = tracker;
    this.setupChangeTracking();
  }

  /**
   * Setup change tracking for dependencies
   */
  private setupChangeTracking(): void {
    this.tracker.subscribe((event) => {
      if (event.type === "change" && event.atom) {
        this.handleDependencyChange(event.atom);
      }
    });
  }

  /**
   * Handle dependency change
   * @param atom Changed atom
   */
  private handleDependencyChange(atom: TrackedAtom): void {
    const dependents = this.dependents.get(atom.id);
    if (dependents) {
      dependents.forEach((computedId) => {
        this.invalidateCache(computedId);
        this.scheduleRecompute(computedId);
      });
    }
  }

  /**
   * Register a computed atom
   * @param atom Computed atom
   * @param dependencies Dependencies
   * @param config Configuration
   */
  registerComputed(
    atom: any,
    dependencies: ComputedDependency[],
    config?: Partial<ComputedAtomConfig>,
  ): void {
    if (!this.tracker.isTracked(atom)) {
      this.tracker.track(atom, atom.name);
    }

    const atomId = atom.id;

    // Store dependencies
    this.dependencies.set(atomId, dependencies);

    // Store config
    this.configs.set(atomId, {
      lazy: true,
      cache: true,
      cacheTTL: 5000,
      invalidateOnChange: true,
      ...config,
    });

    // Register as dependent
    dependencies.forEach((dep) => {
      const depId = dep.atom.id;
      if (!this.dependents.has(depId)) {
        this.dependents.set(depId, new Set());
      }
      this.dependents.get(depId)!.add(atomId);
    });

    // Initial compute
    if (!this.configs.get(atomId)!.lazy) {
      this.compute(atom);
    }
  }

  /**
   * Compute value for computed atom
   * @param atom Computed atom
   */
  compute(atom: any): any {
    const atomId = atom.id;
    const deps = this.dependencies.get(atomId);
    const config = this.configs.get(atomId);

    if (!deps) {
      throw new Error(
        `No dependencies registered for computed atom: ${atomId}`,
      );
    }

    // Check cache
    if (config?.cache) {
      const cached = this.cache.get(atomId);
      if (cached && !this.isCacheExpired(cached, config)) {
        return cached.value;
      }
    }

    // Get dependency values
    const depValues = deps.map((dep) => {
      const value = this.tracker["store"].get(dep.atom);
      return dep.transform ? dep.transform(value) : value;
    });

    // Compute new value
    let newValue;
    try {
      newValue = atom.read ? atom.read(...depValues) : atom(...depValues);
    } catch (error) {
      console.error("Error computing atom:", error);
      return undefined;
    }

    // Update cache
    if (config?.cache) {
      this.cache.set(atomId, {
        value: newValue,
        timestamp: Date.now(),
        dependencies: depValues,
      });
    }

    return newValue;
  }

  /**
   * Get dependencies for computed atom
   * @param atomId Computed atom ID
   */
  getDependencies(atomId: symbol): ComputedDependency[] {
    return this.dependencies.get(atomId) || [];
  }

  /**
   * Get dependents of an atom
   * @param atomId Atom ID
   */
  getDependents(atomId: symbol): symbol[] {
    return Array.from(this.dependents.get(atomId) || []);
  }

  /**
   * Check if cache is expired
   * @param cache Cache entry
   * @param config Atom config
   */
  private isCacheExpired(
    cache: ComputedCache,
    config: ComputedAtomConfig,
  ): boolean {
    return Date.now() - cache.timestamp > config.cacheTTL!;
  }

  /**
   * Invalidate cache for computed atom
   * @param atomId Computed atom ID
   */
  invalidateCache(atomId: symbol): void {
    this.cache.delete(atomId);
  }

  /**
   * Schedule recompute
   * @param atomId Computed atom ID
   */
  private scheduleRecompute(atomId: symbol): void {
    this.recomputeQueue.add(atomId);

    if (!this.recomputeTimeout) {
      this.recomputeTimeout = setTimeout(() => {
        this.processRecomputeQueue();
      }, 0);
    }
  }

  /**
   * Process recompute queue
   */
  private processRecomputeQueue(): void {
    this.recomputeQueue.forEach((atomId) => {
      const atom = this.tracker.getTrackedAtom(atomId)?.atom;
      if (atom) {
        this.compute(atom);
      }
    });

    this.recomputeQueue.clear();
    this.recomputeTimeout = null;
  }

  /**
   * Get cached value
   * @param atomId Computed atom ID
   */
  getCachedValue(atomId: symbol): any {
    return this.cache.get(atomId)?.value;
  }

  /**
   * Clear cache for all atoms
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific atom
   * @param atomId Atom ID
   */
  clearAtomCache(atomId: symbol): void {
    this.cache.delete(atomId);
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};

    this.dependencies.forEach((deps, atomId) => {
      const atom = this.tracker.getTrackedAtom(atomId);
      graph[atom?.name || String(atomId)] = deps.map((d) => {
        const depAtom = this.tracker.getTrackedAtom(d.atom.id);
        return depAtom?.name || String(d.atom.id);
      });
    });

    return graph;
  }

  /**
   * Check for circular dependencies
   * @returns Circular dependencies if found
   */
  detectCircularDependencies(): Array<symbol[]> {
    const visited = new Set<symbol>();
    const recursionStack = new Set<symbol>();
    const circular: symbol[][] = [];

    const dfs = (atomId: symbol, path: symbol[] = []) => {
      if (recursionStack.has(atomId)) {
        const cycleStart = path.indexOf(atomId);
        circular.push([...path.slice(cycleStart), atomId]);
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
   * Get recompute statistics
   */
  getStats(): {
    totalComputed: number;
    cachedCount: number;
    queueSize: number;
    dependencyCount: number;
  } {
    return {
      totalComputed: this.dependencies.size,
      cachedCount: this.cache.size,
      queueSize: this.recomputeQueue.size,
      dependencyCount: Array.from(this.dependencies.values()).reduce(
        (sum, deps) => sum + deps.length,
        0,
      ),
    };
  }

  /**
   * Update computed atom config
   * @param atomId Computed atom ID
   * @param config New config
   */
  updateConfig(atomId: symbol, config: Partial<ComputedAtomConfig>): void {
    const existing = this.configs.get(atomId);
    if (existing) {
      this.configs.set(atomId, { ...existing, ...config });
      this.invalidateCache(atomId);
    }
  }

  /**
   * Remove computed atom
   * @param atomId Computed atom ID
   */
  removeComputed(atomId: symbol): void {
    this.dependencies.delete(atomId);
    this.configs.delete(atomId);
    this.cache.delete(atomId);

    // Remove from dependents lists
    this.dependents.forEach((deps, depId) => {
      deps.delete(atomId);
      if (deps.size === 0) {
        this.dependents.delete(depId);
      }
    });
  }

  /**
   * Warm up cache for computed atoms
   * @param atomIds Optional list of atom IDs
   */
  warmCache(atomIds?: symbol[]): void {
    const targets = atomIds || Array.from(this.dependencies.keys());

    targets.forEach((atomId) => {
      const atom = this.tracker.getTrackedAtom(atomId)?.atom;
      if (atom) {
        this.compute(atom);
      }
    });
  }

  /**
   * Check if atom is computed
   * @param atomId Atom ID
   */
  isComputed(atomId: symbol): boolean {
    return this.dependencies.has(atomId);
  }

  /**
   * Get all computed atoms
   */
  getAllComputed(): symbol[] {
    return Array.from(this.dependencies.keys());
  }
}
