/**
 * AtomTracker - Tracks atoms and their metadata with TTL and automatic cleanup
 */

import { Atom, Store } from "../../types";
import type {
  TrackerConfig,
  TrackedAtom,
  TrackingEvent,
  TrackingStats,
  TrackerSnapshot,
  TrackerRestorePoint,
  TTLConfig,
  CleanupStrategy,
  CleanupStats,
  CleanupResult,
  AtomStatus,
} from "./types";

import { createCleanupStrategy } from "./CleanupStrategies";

// Import disposal infrastructure
import { BaseDisposable, type DisposableConfig } from "../core/disposable";

/**
 * Default TTL configuration
 */
const DEFAULT_TTL_CONFIG: TTLConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxTTL: 60 * 60 * 1000, // 1 hour
  minTTL: 10 * 1000, // 10 seconds
  typeTTL: {
    primitive: 5 * 60 * 1000,
    computed: 3 * 60 * 1000,
    writable: 5 * 60 * 1000,
  },
  idleThreshold: 60 * 1000, // 1 minute
  staleThreshold: 2 * 60 * 1000, // 2 minutes
  gcInterval: 30 * 1000, // Check every 30 seconds
  batchSize: 10,
  enableRefCounting: true,
  autoUntrackWhenRefZero: true,
  cleanupStrategy: "lru",
  onCleanup: "delete",
  logCleanups: false,
  detailedStats: true,
};

export class AtomTracker extends BaseDisposable {
  private atoms: Map<symbol, TrackedAtom> = new Map();
  private atomsByName: Map<string, symbol> = new Map();
  private subscribers: Map<symbol, Set<string>> = new Map(); // Atom -> subscriber IDs
  private store: Store;
  private trackerConfig: TrackerConfig;
  private ttlConfig: TTLConfig;
  private listeners: Set<(event: TrackingEvent) => void> = new Set();
  private version: number = 0;
  private startTime: number = Date.now();

  // Cleanup-related fields
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private strategy: CleanupStrategy;
  private archivedAtoms: Map<symbol, TrackedAtom> = new Map();
  private stats: CleanupStats = {
    totalCleanups: 0,
    totalAtomsRemoved: 0,
    totalMemoryFreed: 0,
    lastCleanup: null,
    atomsByStatus: {
      active: 0,
      idle: 0,
      stale: 0,
      archived: 0,
    },
  };
  private cleanupTimes: number[] = [];

  constructor(
    store: Store,
    config?: Partial<TrackerConfig>,
    disposalConfig?: DisposableConfig,
  ) {
    super(disposalConfig);
    this.store = store;
    // Extract only TrackerConfig properties
    const trackerConfig = config as Partial<TrackerConfig> | undefined;

    // Merge TTL configuration
    const ttlConfig: TTLConfig = {
      ...DEFAULT_TTL_CONFIG,
      ...trackerConfig?.ttl,
    };

    this.ttlConfig = ttlConfig;
    this.trackerConfig = {
      autoTrack: true,
      maxAtoms: 1000,
      trackComputed: true,
      trackWritable: true,
      trackPrimitive: true,
      validateOnTrack: true,
      trackAccess: true,
      trackChanges: true,
      ...(trackerConfig || {}),
    };

    // Initialize cleanup strategy
    this.strategy = createCleanupStrategy(
      this.ttlConfig.cleanupStrategy,
      Date.now(),
    );

    // Start cleanup timer if gcInterval > 0
    if (this.ttlConfig.gcInterval > 0) {
      this.startCleanupTimer();
    }
  }

  /**
   * Start the cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.ttlConfig.gcInterval);

    // Prevent timer from keeping process alive in Node.js
    if (typeof (this.cleanupTimer as any).unref === "function") {
      (this.cleanupTimer as any).unref();
    }
  }

  /**
   * Stop the cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Track an atom
   * @param atom Atom to track
   * @param name Optional name
   * @param ttl Optional custom TTL in ms
   * @returns True if tracking started
   */
  track<Value>(atom: Atom<Value>, name?: string, ttl?: number): boolean {
    console.log(`[TRACKER.track] Tracking atom: ${atom.name}, id: ${atom.id?.toString()}, atoms.size: ${this.atoms.size}`);

    if (this.atoms.size >= this.trackerConfig.maxAtoms) {
      // Try to cleanup before rejecting
      this.cleanupNow(5); // Cleanup 5 oldest

      if (this.atoms.size >= this.trackerConfig.maxAtoms) {
        this.emit("error", { message: "Max atoms limit reached" });
        return false;
      }
    }

    if (this.atoms.has(atom.id)) {
      // Update existing atom (reactivate)
      this.reactivateAtom(atom.id);
      console.log(`[TRACKER.track] Atom already tracked, reactivated!`);
      return true;
    }

    // Validate atom type
    const type = this.getAtomType(atom as Atom<unknown>);
    if (!this.shouldTrackType(type)) {
      return false;
    }

    // Validate if configured
    if (
      this.trackerConfig.validateOnTrack &&
      !this.validateAtom(atom as Atom<unknown>)
    ) {
      return false;
    }

    const displayName =
      name || atom.name || this.generateName(atom as Atom<unknown>);

    const now = Date.now();
    const atomTTL = ttl ?? this.getTTLForType(type);

    const trackedAtom: TrackedAtom = {
      id: atom.id,
      atom,
      name: displayName,
      type,
      status: "active",
      createdAt: now,
      lastAccessed: now,
      lastChanged: now,
      firstSeen: now,
      lastSeen: now,
      accessCount: 0,
      changeCount: 0,
      idleTime: 0,
      ttl: atomTTL,
      gcEligible: false,
      metadata: {
        createdAt: now,
        updatedAt: now,
        accessCount: 0,
        changeCount: 0,
      },
      subscribers: new Set(),
      refCount: 0,
    };

    this.atoms.set(atom.id, trackedAtom);
    this.atomsByName.set(displayName, atom.id);
    this.subscribers.set(atom.id, new Set());
    this.version++;

    this.emit("track", { atom: trackedAtom });
    return true;
  }

  /**
   * Reactivate an existing atom
   * @param atomId Atom ID to reactivate
   */
  private reactivateAtom(atomId: symbol): void {
    const atom = this.atoms.get(atomId);
    if (atom) {
      const now = Date.now();
      atom.status = "active";
      atom.lastAccessed = now;
      atom.lastSeen = now;
      atom.gcEligible = false;
      atom.metadata.updatedAt = now;
      this.version++;
    }
  }

  /**
   * Get TTL for a specific atom type
   * @param type Atom type
   * @returns TTL in ms
   */
  private getTTLForType(type: string): number {
    const typeTTL = this.ttlConfig.typeTTL[type];
    if (typeTTL !== undefined) {
      return Math.max(
        this.ttlConfig.minTTL,
        Math.min(typeTTL, this.ttlConfig.maxTTL),
      );
    }
    return Math.max(
      this.ttlConfig.minTTL,
      Math.min(this.ttlConfig.defaultTTL, this.ttlConfig.maxTTL),
    );
  }

  /**
   * Track multiple atoms
   * @param atoms Atoms to track
   * @returns Number successfully tracked
   */
  trackMany<Value>(atoms: Atom<Value>[]): number {
    let tracked = 0;
    atoms.forEach((atom) => {
      if (this.track(atom)) {
        tracked++;
      }
    });
    return tracked;
  }

  /**
   * Untrack an atom
   * @param atom Atom to untrack
   * @returns True if untracked
   */
  untrack<Value>(atom: Atom<Value>): boolean {
    const tracked = this.atoms.get(atom.id);
    if (!tracked) return false;

    // Emit before untrack event
    this.emit("beforeCleanup", { atom: tracked });

    this.atoms.delete(atom.id);
    this.atomsByName.delete(tracked.name);
    this.subscribers.delete(atom.id);
    this.version++;

    this.emit("untrack", { atom: tracked });
    return true;
  }

  /**
   * Untrack multiple atoms
   * @param atoms Atoms to untrack
   * @returns Number successfully untracked
   */
  untrackMany<Value>(atoms: Atom<Value>[]): number {
    let untracked = 0;
    atoms.forEach((atom) => {
      if (this.untrack(atom)) {
        untracked++;
      }
    });
    return untracked;
  }

  /**
   * Check if atom is tracked
   * @param atom Atom to check
   */
  isTracked<Value>(atom: Atom<Value>): boolean {
    return this.atoms.has(atom.id);
  }

  /**
   * Get tracked atom by ID
   * @param id Atom ID
   */
  getTrackedAtom(id: symbol): TrackedAtom | undefined {
    return this.atoms.get(id);
  }

  /**
   * Get atom by name
   * @param name Atom name
   */
  getAtomByName(name: string): Atom<unknown> | undefined {
    const id = this.atomsByName.get(name);
    if (!id) return undefined;
    return this.atoms.get(id)?.atom;
  }

  /**
   * Get all tracked atoms
   */
  getTrackedAtoms(): Atom<unknown>[] {
    return Array.from(this.atoms.values()).map((t) => t.atom);
  }

  /**
   * Get all tracked atoms with metadata
   */
  getAllTracked(): TrackedAtom[] {
    return Array.from(this.atoms.values());
  }

  /**
   * Get atoms by type
   * @param type Atom type
   */
  getAtomsByType(type: string): TrackedAtom[] {
    return Array.from(this.atoms.values()).filter((t) => t.type === type);
  }

  /**
   * Record atom access
   * @param atom Atom accessed
   * @param subscriberId Optional subscriber ID for reference counting
   */
  recordAccess(atom: Atom<unknown>, subscriberId?: string): void {
    const tracked = this.atoms.get(atom.id);
    if (tracked) {
      const now = Date.now();
      tracked.accessCount++;
      tracked.lastAccessed = now;
      tracked.lastSeen = now;
      tracked.status = "active";
      tracked.gcEligible = false;
      tracked.metadata.accessCount++;
      tracked.metadata.updatedAt = now;

      // Reference counting
      if (subscriberId && this.ttlConfig.enableRefCounting) {
        if (!tracked.subscribers) {
          tracked.subscribers = new Set();
        }
        tracked.subscribers.add(subscriberId);
        tracked.refCount = tracked.subscribers.size;

        // Also track in subscribers map
        if (!this.subscribers.has(atom.id)) {
          this.subscribers.set(atom.id, new Set());
        }
        this.subscribers.get(atom.id)?.add(subscriberId);
      }
    }
  }

  /**
   * Remove subscriber from atom (for unmount scenarios)
   * @param atom Atom to remove subscriber from
   * @param subscriberId Subscriber ID to remove
   */
  removeSubscriber(atom: Atom<unknown>, subscriberId: string): void {
    const tracked = this.atoms.get(atom.id);
    if (tracked && tracked.subscribers) {
      tracked.subscribers.delete(subscriberId);
      tracked.refCount = tracked.subscribers.size;

      const subs = this.subscribers.get(atom.id);
      if (subs) {
        subs.delete(subscriberId);
      }

      // Mark for cleanup if ref count is zero
      if (this.ttlConfig.autoUntrackWhenRefZero && tracked.refCount === 0) {
        tracked.gcEligible = true;
      }
    }
  }

  /**
   * Record atom change
   * @param atom Atom changed
   * @param oldValue Previous value
   * @param newValue New value
   */
  recordChange<Value>(
    atom: Atom<Value>,
    oldValue: Value,
    newValue: Value,
  ): void {
    const tracked = this.atoms.get(atom.id);
    if (tracked) {
      const now = Date.now();
      tracked.changeCount++;
      tracked.lastChanged = now;
      tracked.lastSeen = now;
      tracked.metadata.changeCount++;
      tracked.metadata.updatedAt = now;

      this.emit("change", {
        atom: tracked,
        oldValue,
        newValue,
      });
    }
  }

  /**
   * Update atom statuses based on current time
   * @param atoms - Atoms to update (defaults to all tracked atoms)
   */
  updateAtomStatuses(atoms?: TrackedAtom[]): void {
    const atomsToUpdate = atoms ?? Array.from(this.atoms.values());
    const now = Date.now();

    for (const atom of atomsToUpdate) {
      const idleTime = now - atom.lastAccessed;
      atom.idleTime = idleTime;

      // Update status based on activity
      if (idleTime > atom.ttl) {
        atom.status = "stale";
        atom.gcEligible = true;
      } else if (idleTime > this.ttlConfig.idleThreshold) {
        atom.status = "idle";
        // Idle but not yet eligible for GC (unless time-based strategy)
        atom.gcEligible =
          this.ttlConfig.cleanupStrategy === "time-based"
            ? idleTime > atom.ttl * 0.8 // 80% of TTL
            : false;
      } else {
        atom.status = "active";
        atom.gcEligible = false;
      }

      // Check reference count
      if (this.ttlConfig.enableRefCounting) {
        const refCount = atom.subscribers?.size ?? 0;
        if (refCount === 0 && this.ttlConfig.autoUntrackWhenRefZero) {
          atom.gcEligible = true;
        }
      }
    }

    // Update stats
    this.updateStatusStats();
  }

  /**
   * Update status statistics
   */
  private updateStatusStats(): void {
    const stats: Record<AtomStatus, number> = {
      active: 0,
      idle: 0,
      stale: 0,
      archived: 0,
      deleted: 0,
    };
    for (const atom of this.atoms.values()) {
      stats[atom.status] = (stats[atom.status] ?? 0) + 1;
    }
    this.stats.atomsByStatus = stats as any;
  }

  /**
   * Perform cleanup of eligible atoms
   * @returns Cleanup result
   */
  async performCleanup(): Promise<CleanupResult> {
    const startTime = Date.now();
    const atoms = Array.from(this.atoms.values());

    // Update status for all atoms
    this.updateAtomStatuses(atoms);

    // Select candidates for cleanup
    const candidates = this.strategy.selectCandidates(
      atoms.filter((a) => a.gcEligible),
      this.ttlConfig.batchSize,
    );

    if (candidates.length === 0) {
      return { removed: 0, freed: 0, duration: Date.now() - startTime };
    }

    let removed = 0;
    let freed = 0;

    for (const atom of candidates) {
      if (await this.cleanupAtom(atom)) {
        removed++;
        freed += this.estimateAtomSize(atom);
      }
    }

    // Update stats
    this.stats.totalCleanups++;
    this.stats.totalAtomsRemoved += removed;
    this.stats.totalMemoryFreed += freed;
    this.stats.lastCleanup = Date.now();

    // Track cleanup time for averaging
    const duration = Date.now() - startTime;
    this.cleanupTimes.push(duration);
    if (this.cleanupTimes.length > 100) {
      this.cleanupTimes.shift();
    }
    this.stats.averageCleanupTime =
      this.cleanupTimes.reduce((a, b) => a + b, 0) / this.cleanupTimes.length;

    // Update status stats
    this.updateStatusStats();

    // Emit cleanup event
    this.emit("cleanup", {
      data: {
        removed,
        freed,
        duration,
      },
    });

    if (this.ttlConfig.logCleanups && removed > 0) {
      console.log(`[TRACKER.cleanup] Cleaned up ${removed} atoms, freed ${freed} bytes in ${duration}ms`);
    }

    return { removed, freed, duration };
  }

  /**
   * Cleanup a single atom
   * @param atom Atom to cleanup
   * @returns True if successfully cleaned up
   */
  private async cleanupAtom(atom: TrackedAtom): Promise<boolean> {
    try {
      // Notify subscribers before cleanup
      this.emit("beforeCleanup", { atom });

      // Handle based on strategy
      switch (this.ttlConfig.onCleanup) {
        case "archive":
          // Move to archive storage
          await this.archiveAtom(atom);
          break;
        case "delete":
          // Completely remove
          this.atoms.delete(atom.id);
          this.atomsByName.delete(atom.name);
          this.subscribers.delete(atom.id);
          break;
        case "notify":
          // Just notify, keep atom
          break;
      }

      this.emit("afterCleanup", { atom });
      return true;
    } catch (error) {
      console.error(`Failed to cleanup atom ${atom.name}:`, error);
      return false;
    }
  }

  /**
   * Archive an atom for potential restoration
   * @param atom Atom to archive
   */
  private async archiveAtom(atom: TrackedAtom): Promise<void> {
    atom.status = "archived";
    this.archivedAtoms.set(atom.id, atom);
    this.atoms.delete(atom.id);
    this.atomsByName.delete(atom.name);

    // Limit archive size
    const maxArchived = this.ttlConfig.archiveStorage?.maxArchived ?? 100;
    if (this.archivedAtoms.size > maxArchived) {
      // Remove oldest archived atom
      const oldest = Array.from(this.archivedAtoms.values()).sort(
        (a, b) => a.createdAt - b.createdAt,
      )[0];
      if (oldest) {
        this.archivedAtoms.delete(oldest.id);
      }
    }
  }

  /**
   * Estimate memory size of an atom
   * @param atom Tracked atom
   * @returns Estimated size in bytes
   */
  private estimateAtomSize(atom: TrackedAtom): number {
    let size = 0;
    size += atom.name.length * 2; // String size
    size += 100; // Base object overhead

    try {
      const value = this.store.get(atom.atom);
      size += JSON.stringify(value).length * 2;
    } catch {
      // Ignore if can't get value
    }

    return size;
  }

  /**
   * Manual cleanup - cleanup now
   * @param count Optional count override
   * @returns Cleanup result
   */
  async cleanupNow(count?: number): Promise<CleanupResult> {
    const oldBatchSize = this.ttlConfig.batchSize;
    if (count !== undefined) {
      this.ttlConfig.batchSize = count;
    }
    const result = await this.performCleanup();
    if (count !== undefined) {
      this.ttlConfig.batchSize = oldBatchSize;
    }
    return result;
  }

  /**
   * Mark an atom for cleanup
   * @param atomId Atom ID to mark
   */
  markForCleanup(atomId: symbol): void {
    const atom = this.atoms.get(atomId);
    if (atom) {
      atom.gcEligible = true;
    }
  }

  /**
   * Wait for cleanup to complete
   * @param timeout Optional timeout in ms
   * @returns Cleanup result
   */
  async waitForCleanup(timeout?: number): Promise<CleanupResult> {
    const startTime = Date.now();

    const check = async (): Promise<CleanupResult> => {
      const result = await this.performCleanup();
      if (result.removed > 0 || this.atoms.size === 0) {
        return result;
      } else if (timeout && Date.now() - startTime > timeout) {
        return result;
      } else {
        return new Promise((resolve) => setTimeout(() => check().then(resolve), 100));
      }
    };

    return check();
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStats(): CleanupStats {
    return { ...this.stats };
  }

  /**
   * Get all archived atoms
   */
  getArchivedAtoms(): TrackedAtom[] {
    return Array.from(this.archivedAtoms.values());
  }

  /**
   * Restore an archived atom
   * @param atomId Atom ID to restore
   * @returns True if restored
   */
  restoreArchivedAtom(atomId: symbol): boolean {
    const atom = this.archivedAtoms.get(atomId);
    if (atom) {
      atom.status = "active";
      atom.gcEligible = false;
      atom.lastAccessed = Date.now();
      this.atoms.set(atomId, atom);
      this.atomsByName.set(atom.name, atomId);
      this.archivedAtoms.delete(atomId);
      this.version++;
      return true;
    }
    return false;
  }

  /**
   * Get stale atoms (eligible for cleanup)
   */
  getStaleAtoms(): TrackedAtom[] {
    return Array.from(this.atoms.values()).filter((a) => a.gcEligible);
  }

  /**
   * Get tracking statistics
   */
  getStats(): TrackingStats {
    const atoms = this.getAllTracked();
    const byType = this.getTypeDistribution();

    const accessStats = atoms.reduce(
      (acc, atom) => {
        return {
          total: acc.total + atom.accessCount,
          min: Math.min(acc.min, atom.accessCount),
          max: Math.max(acc.max, atom.accessCount),
          avg: 0,
        };
      },
      { total: 0, min: Infinity, max: 0, avg: 0 },
    );

    accessStats.avg = atoms.length ? accessStats.total / atoms.length : 0;

    // Find most accessed atom
    let mostAccessed: TrackedAtom | null = null;
    let maxAccess = -1;
    atoms.forEach((atom) => {
      if (atom.accessCount > maxAccess) {
        maxAccess = atom.accessCount;
        mostAccessed = atom;
      }
    });

    // Find most changed atom
    let mostChanged: TrackedAtom | null = null;
    let maxChange = -1;
    atoms.forEach((atom) => {
      if (atom.changeCount > maxChange) {
        maxChange = atom.changeCount;
        mostChanged = atom;
      }
    });

    // Find oldest atom
    let oldestAtom: TrackedAtom | null = null;
    let oldestTime = Infinity;
    atoms.forEach((atom) => {
      if (atom.firstSeen < oldestTime) {
        oldestTime = atom.firstSeen;
        oldestAtom = atom;
      }
    });

    // Find newest atom
    let newestAtom: TrackedAtom | null = null;
    let newestTime = -1;
    atoms.forEach((atom) => {
      if (atom.firstSeen > newestTime) {
        newestTime = atom.firstSeen;
        newestAtom = atom;
      }
    });

    return {
      totalAtoms: atoms.length,
      byType,
      accessCount: accessStats.total,
      changeCount: atoms.reduce((sum, a) => sum + a.changeCount, 0),
      averageAccesses: accessStats.avg,
      mostAccessed,
      mostChanged,
      oldestAtom,
      newestAtom,
      version: this.version,
      uptime: Date.now() - this.startTime,
      cleanupStats: this.getCleanupStats(),
    };
  }

  /**
   * Get type distribution
   */
  private getTypeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.atoms.forEach((atom) => {
      distribution[atom.type] = (distribution[atom.type] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Get atom type
   * @param atom Atom
   */
  private getAtomType(atom: any): string {
    if (atom && typeof atom === "object" && "type" in atom) {
      return (atom as { type: string }).type;
    }
    return "primitive";
  }

  /**
   * Check if type should be tracked
   * @param type Atom type
   */
  private shouldTrackType(type: string): boolean {
    switch (type) {
      case "primitive":
        return this.trackerConfig.trackPrimitive;
      case "computed":
        return this.trackerConfig.trackComputed;
      case "writable":
        return this.trackerConfig.trackWritable;
      default:
        return true;
    }
  }

  /**
   * Validate atom
   * @param atom Atom to validate
   */
  private validateAtom(atom: any): boolean {
    return !!(atom && atom.id && typeof atom.id === "symbol");
  }

  /**
   * Generate name for atom
   * @param atom Atom
   */
  private generateName(atom: any): string {
    const base = atom.name || atom.id?.description || "atom";
    let counter = 1;
    let name = base;

    while (this.atomsByName.has(name)) {
      name = `${base}_${counter++}`;
    }

    return name;
  }

  /**
   * Create a snapshot of current tracking state
   */
  snapshot(): TrackerSnapshot {
    return {
      atoms: this.getAllTracked(),
      version: this.version,
      timestamp: Date.now(),
      config: { ...this.trackerConfig },
    };
  }

  /**
   * Create a restore point
   */
  createRestorePoint(): TrackerRestorePoint {
    return {
      id: Math.random().toString(36).substring(2, 9),
      atoms: new Map(this.atoms),
      atomsByName: new Map(this.atomsByName),
      version: this.version,
      timestamp: Date.now(),
    };
  }

  /**
   * Restore from restore point
   * @param point Restore point
   */
  restore(point: TrackerRestorePoint): void {
    this.atoms = new Map(point.atoms);
    this.atomsByName = new Map(point.atomsByName);
    this.version = point.version;

    this.emit("restore", { data: { point } });
  }

  /**
   * Clear all tracked atoms
   */
  clear(): void {
    const count = this.atoms.size;
    this.atoms.clear();
    this.atomsByName.clear();
    this.subscribers.clear();
    this.version++;

    this.emit("clear", { data: { count } });
  }

  /**
   * Subscribe to tracking events
   * @param listener Event listener
   */
  subscribe(listener: (event: TrackingEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit event
   * @param type Event type
   * @param data Event data
   */
  private emit(
    type: TrackingEvent["type"],
    data: Partial<TrackingEvent>,
  ): void {
    const event: TrackingEvent = {
      type,
      timestamp: Date.now(),
      ...data,
    } as TrackingEvent;

    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<TrackerConfig>): void {
    this.trackerConfig = { ...this.trackerConfig, ...config };
    if (config.ttl) {
      this.ttlConfig = { ...this.ttlConfig, ...config.ttl };
      // Update strategy if changed
      if (config.ttl.cleanupStrategy) {
        this.strategy = createCleanupStrategy(
          config.ttl.cleanupStrategy,
          Date.now(),
        );
      }
      // Restart timer if interval changed
      if (config.ttl.gcInterval !== undefined) {
        if (config.ttl.gcInterval > 0) {
          this.startCleanupTimer();
        } else {
          this.stopCleanupTimer();
        }
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): TrackerConfig {
    return { ...this.trackerConfig };
  }

  /**
   * Get TTL configuration
   */
  getTTLConfig(): TTLConfig {
    return { ...this.ttlConfig };
  }

  /**
   * Get version
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Get total tracked count
   */
  size(): number {
    return this.atoms.size;
  }

  /**
   * Dispose the atom tracker and clean up all resources
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.log("Disposing AtomTracker");

    // Stop cleanup timer
    this.stopCleanupTimer();

    // Clear all listeners
    this.listeners.clear();

    // Clear atom references
    this.atoms.clear();
    this.atomsByName.clear();
    this.subscribers.clear();
    this.archivedAtoms.clear();

    // Remove store reference
    // @ts-expect-error - Clean up references
    this.store = null;

    // Dispose children
    await this.disposeChildren();

    // Run callbacks
    await this.runDisposeCallbacks();

    this.disposed = true;
    this.log("AtomTracker disposed");
  }
}
