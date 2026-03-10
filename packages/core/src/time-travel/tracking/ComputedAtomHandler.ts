/**
 * ComputedAtomHandler - Manages computed atoms and their dependencies
 *
 * Coordinates dependency tracking, caching, and change notifications
 * for computed atoms.
 */

import type { ComputedAtomConfig, ComputedDependency, TrackedAtom } from './types';
import type { AtomTracker } from './AtomTracker.di';
import { DependencyTracker } from './DependencyTracker';
import { ComputedCacheManager } from './ComputedCacheManager';
import { ChangeNotifier } from './ChangeNotifier';

export interface ComputedAtomConfigExtended extends Partial<ComputedAtomConfig> {
  lazy?: boolean;
  cache?: boolean;
  cacheTTL?: number;
  invalidateOnChange?: boolean;
}

/**
 * ComputedAtomHandler coordinates computed atom management
 * using dependency tracker, cache manager, and change notifier
 */
export class ComputedAtomHandler {
  private tracker: AtomTracker;
  private dependencyTracker: DependencyTracker;
  private cacheManager: ComputedCacheManager;
  private changeNotifier: ChangeNotifier;
  private configs: Map<symbol, ComputedAtomConfigExtended> = new Map();
  private recomputeQueue: Set<symbol> = new Set();
  private recomputeTimeout: NodeJS.Timeout | null = null;

  constructor(tracker: AtomTracker) {
    this.tracker = tracker;
    this.dependencyTracker = new DependencyTracker();
    this.cacheManager = new ComputedCacheManager({ defaultTTL: 5000, maxSize: 100 });
    this.changeNotifier = new ChangeNotifier();

    this.setupChangeTracking();
  }

  /**
   * Setup change tracking for dependencies
   */
  private setupChangeTracking(): void {
    this.tracker.subscribe('atom-changed', (event) => {
      if (event.atom) {
        const trackedAtom = event.atom as TrackedAtom;
        this.handleDependencyChange(trackedAtom);
      }
    });
  }

  /**
   * Handle dependency change
   * @param atom Changed atom
   */
  private handleDependencyChange(atom: TrackedAtom): void {
    const dependents = this.dependencyTracker.getDependents(atom.id);
    if (dependents.length > 0) {
      dependents.forEach((computedId) => {
        this.cacheManager.invalidate(computedId);
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
    config?: ComputedAtomConfigExtended,
  ): void {
    if (!this.tracker.isTracked(atom.id)) {
      this.tracker.track(atom);
    }

    const atomId = atom.id;

    // Store dependencies using DependencyTracker
    this.dependencyTracker.register(atomId, dependencies);

    // Store config with defaults
    this.configs.set(atomId, {
      lazy: true,
      cache: true,
      cacheTTL: 5000,
      invalidateOnChange: true,
      ...config,
    });

    // Initial compute if not lazy
    const atomConfig = this.configs.get(atomId);
    if (!atomConfig?.lazy) {
      this.compute(atom);
    }
  }

  /**
   * Compute value for computed atom
   * @param atom Computed atom
   */
  compute(atom: any): any {
    const atomId = atom.id;
    const deps = this.dependencyTracker.getDependencies(atomId);
    const config = this.configs.get(atomId);

    if (deps.length === 0) {
      throw new Error(`No dependencies registered for computed atom: ${atomId}`);
    }

    // Check cache
    if (config?.cache) {
      const cached = this.cacheManager.get(atomId, config.cacheTTL);
      if (cached !== null) {
        return cached;
      }
    }

    // Get dependency values
    const depValues = deps.map((dep) => {
      const value = this.tracker['store'].get(dep.atom);
      return dep.transform ? dep.transform(value) : value;
    });

    // Compute new value
    let newValue;
    try {
      newValue = atom.read ? atom.read(() => {}) : atom(...depValues);
    } catch (error) {
      console.error('Error computing atom:', error);
      return undefined;
    }

    // Update cache
    if (config?.cache) {
      this.cacheManager.set(atomId, newValue, 0);
    }

    return newValue;
  }

  /**
   * Get dependencies for computed atom
   * @param atomId Computed atom ID
   */
  getDependencies(atomId: symbol): ComputedDependency[] {
    return this.dependencyTracker.getDependencies(atomId);
  }

  /**
   * Get dependents of an atom
   * @param atomId Atom ID
   */
  getDependents(atomId: symbol): symbol[] {
    return this.dependencyTracker.getDependents(atomId);
  }

  /**
   * Invalidate cache for computed atom
   * @param atomId Computed atom ID
   */
  invalidateCache(atomId: symbol): void {
    this.cacheManager.invalidate(atomId);
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
      const trackedAtom = this.tracker.getTrackedAtom(atomId);
      if (trackedAtom?.atom) {
        this.compute(trackedAtom.atom);
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
    return this.cacheManager.get(atomId);
  }

  /**
   * Clear cache for all atoms
   */
  clearCache(): void {
    this.cacheManager.clear();
  }

  /**
   * Clear cache for specific atom
   * @param atomId Atom ID
   */
  clearAtomCache(atomId: symbol): void {
    this.cacheManager.clear(atomId);
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph(): Record<string, string[]> {
    return this.dependencyTracker.getDependencyGraph(
      (atomId) => this.tracker.getTrackedAtom(atomId)?.name || String(atomId)
    );
  }

  /**
   * Check for circular dependencies
   * @returns Circular dependencies if found
   */
  detectCircularDependencies(): Array<symbol[]> {
    const circular = this.dependencyTracker.detectCircularDependencies();
    return circular.map((c) => c.cycle);
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
    const depStats = this.dependencyTracker.getStats();
    return {
      totalComputed: depStats.totalComputed,
      cachedCount: this.cacheManager.getSize(),
      queueSize: this.recomputeQueue.size,
      dependencyCount: depStats.dependencyCount,
    };
  }

  /**
   * Update computed atom config
   * @param atomId Computed atom ID
   * @param config New config
   */
  updateConfig(atomId: symbol, config: ComputedAtomConfigExtended): void {
    const existing = this.configs.get(atomId);
    if (existing) {
      this.configs.set(atomId, { ...existing, ...config });
      this.cacheManager.invalidate(atomId);
    }
  }

  /**
   * Remove computed atom
   * @param atomId Computed atom ID
   */
  removeComputed(atomId: symbol): void {
    this.dependencyTracker.remove(atomId);
    this.configs.delete(atomId);
    this.cacheManager.clear(atomId);
  }

  /**
   * Warm up cache for computed atoms
   * @param atomIds Optional list of atom IDs
   */
  warmCache(atomIds?: symbol[]): void {
    const targets = atomIds || this.dependencyTracker.getAllComputed();

    targets.forEach((atomId) => {
      const trackedAtom = this.tracker.getTrackedAtom(atomId);
      if (trackedAtom?.atom) {
        this.compute(trackedAtom.atom);
      }
    });
  }

  /**
   * Check if atom is computed
   * @param atomId Atom ID
   */
  isComputed(atomId: symbol): boolean {
    return this.dependencyTracker.isComputed(atomId);
  }

  /**
   * Get all computed atoms
   */
  getAllComputed(): symbol[] {
    return this.dependencyTracker.getAllComputed();
  }
}
