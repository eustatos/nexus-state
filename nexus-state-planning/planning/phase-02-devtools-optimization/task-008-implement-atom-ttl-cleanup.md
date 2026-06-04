## Task 8: Implement Atom Time-to-Live and Automatic Cleanup in AtomTracker

**Filename:** `task-008-implement-atom-ttl-cleanup.md`

### Context

The current `AtomTracker` tracks atoms indefinitely without any cleanup mechanism. In long-running applications with dynamic atom creation (e.g., components mounting/unmounting, dynamic forms, temporary state), this leads to unbounded memory growth. Need to implement TTL (Time-To-Live) and automatic cleanup for unused atoms.

### Current Problem

```typescript
// Atoms accumulate forever
private atoms: Map<symbol, TrackedAtom> = new Map();
// No cleanup mechanism, even for atoms that are no longer used
```

### Requirements

1. **Create Atom Lifecycle Management**

```typescript
interface AtomLifecycle {
  status: "active" | "idle" | "stale" | "archived" | "deleted";
  createdAt: number;
  lastAccessed: number;
  lastChanged: number;
  accessCount: number;
  idleTime: number; // Computed: now() - lastAccessed
  ttl: number; // Time-to-live in ms
  gcEligible: boolean; // Eligible for garbage collection
}

interface TrackedAtom extends AtomLifecycle {
  id: symbol;
  atom: Atom<unknown>;
  name: string;
  type: string;
  metadata: AtomMetadata;
  refCount?: number; // Number of references/uses
  subscribers?: Set<string>; // Who is using this atom
}
```

2. **Implement TTL Configuration**

```typescript
interface TTLConfig {
  defaultTTL: number; // Default TTL in ms (e.g., 5 minutes)
  maxTTL: number; // Maximum TTL (e.g., 1 hour)
  minTTL: number; // Minimum TTL (e.g., 10 seconds)

  // Per-type TTL overrides
  typeTTL: {
    primitive?: number;
    computed?: number;
    writable?: number;
    [key: string]: number | undefined;
  };

  // Cleanup thresholds
  idleThreshold: number; // Time before atom considered idle
  staleThreshold: number; // Time before atom considered stale
  gcInterval: number; // How often to check for cleanup
  batchSize: number; // How many atoms to cleanup per batch

  // Reference counting
  enableRefCounting: boolean;
  autoUntrackWhenRefZero: boolean;

  // Strategies
  cleanupStrategy: "lru" | "lfu" | "fifo" | "time-based";
  onCleanup: "archive" | "delete" | "notify";
}
```

3. **Implement Cleanup Strategies**

```typescript
interface CleanupStrategy {
  name: string;
  selectCandidates(atoms: TrackedAtom[], count: number): TrackedAtom[];
  getPriority(atom: TrackedAtom): number; // Higher = sooner cleanup
}

class LRUCleanupStrategy implements CleanupStrategy {
  name = "lru";

  selectCandidates(atoms: TrackedAtom[], count: number): TrackedAtom[] {
    return atoms
      .filter((a) => a.gcEligible)
      .sort((a, b) => a.lastAccessed - b.lastAccessed) // Oldest access first
      .slice(0, count);
  }

  getPriority(atom: TrackedAtom): number {
    return -atom.lastAccessed; // Lower lastAccessed = higher priority
  }
}

class LFUCleanupStrategy implements CleanupStrategy {
  name = "lfu";

  selectCandidates(atoms: TrackedAtom[], count: number): TrackedAtom[] {
    return atoms
      .filter((a) => a.gcEligible)
      .sort((a, b) => a.accessCount - b.accessCount) // Least frequent first
      .slice(0, count);
  }

  getPriority(atom: TrackedAtom): number {
    return -atom.accessCount; // Lower accessCount = higher priority
  }
}

class TimeBasedCleanupStrategy implements CleanupStrategy {
  constructor(private now: number) {}

  selectCandidates(atoms: TrackedAtom[], count: number): TrackedAtom[] {
    return atoms
      .filter((a) => this.isExpired(a))
      .sort((a, b) => b.ttl - a.ttl) // Most expired first
      .slice(0, count);
  }

  private isExpired(atom: TrackedAtom): boolean {
    const age = this.now - atom.lastAccessed;
    return age > atom.ttl;
  }

  getPriority(atom: TrackedAtom): number {
    const age = this.now - atom.lastAccessed;
    return age - atom.ttl; // Positive = expired, higher = more expired
  }
}
```

4. **Enhance AtomTracker with Automatic Cleanup**

```typescript
export class AtomTracker extends BaseDisposable {
  private atoms: Map<symbol, TrackedAtom> = new Map();
  private atomsByName: Map<string, symbol> = new Map();
  private subscribers: Map<symbol, Set<string>> = new Map(); // Atom -> subscriber IDs
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private strategy: CleanupStrategy;
  private stats: CleanupStats = {
    totalCleanups: 0,
    totalAtomsRemoved: 0,
    totalMemoryFreed: 0,
    lastCleanup: null,
  };

  constructor(store: any, config?: Partial<TrackerConfig>) {
    super();
    this.config = {
      ttl: {
        defaultTTL: 5 * 60 * 1000, // 5 minutes
        idleThreshold: 60 * 1000, // 1 minute
        staleThreshold: 2 * 60 * 1000, // 2 minutes
        gcInterval: 30 * 1000, // Check every 30 seconds
        batchSize: 10,
        cleanupStrategy: "lru",
        ...config?.ttl,
      },
      ...config,
    };

    this.strategy = this.createCleanupStrategy(this.config.ttl.cleanupStrategy);

    if (this.config.ttl.gcInterval > 0) {
      this.startCleanupTimer();
    }
  }

  track<Value>(atom: Atom<Value>, name?: string, ttl?: number): boolean {
    if (this.atoms.size >= this.config.maxAtoms) {
      // Try to cleanup before rejecting
      this.cleanupNow(5); // Cleanup 5 oldest

      if (this.atoms.size >= this.config.maxAtoms) {
        this.emit("error", { message: "Max atoms limit reached" });
        return false;
      }
    }

    if (this.atoms.has(atom.id)) {
      // Update existing atom (reactivate)
      this.reactivateAtom(atom.id);
      return true;
    }

    const displayName =
      name || atom.name || this.generateName(atom as Atom<unknown>);
    const type = this.getAtomType(atom as Atom<unknown>);

    const trackedAtom: TrackedAtom = {
      id: atom.id,
      atom,
      name: displayName,
      type,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      lastAccessed: Date.now(),
      lastChanged: Date.now(),
      accessCount: 0,
      changeCount: 0,
      status: "active",
      ttl: ttl || this.getTTLForType(type),
      idleTime: 0,
      gcEligible: false,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        accessCount: 0,
        changeCount: 0,
      },
      subscribers: new Set(),
    };

    this.atoms.set(atom.id, trackedAtom);
    this.atomsByName.set(displayName, atom.id);
    this.version++;

    this.emit("track", { atom: trackedAtom });
    return true;
  }

  recordAccess(atom: Atom<unknown>, subscriberId?: string): void {
    const tracked = this.atoms.get(atom.id);
    if (tracked) {
      tracked.accessCount++;
      tracked.lastAccessed = Date.now();
      tracked.lastSeen = Date.now();
      tracked.status = "active";
      tracked.gcEligible = false;
      tracked.metadata.accessCount++;
      tracked.metadata.updatedAt = Date.now();

      if (subscriberId && this.config.ttl.enableRefCounting) {
        if (!tracked.subscribers) {
          tracked.subscribers = new Set();
        }
        tracked.subscribers.add(subscriberId);
        tracked.refCount = tracked.subscribers.size;
      }
    }
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.ttl.gcInterval);

    // Prevent timer from keeping process alive
    this.cleanupTimer.unref?.();
  }

  private async performCleanup(): Promise<CleanupResult> {
    const startTime = Date.now();
    const atoms = Array.from(this.atoms.values());

    // Update status for all atoms
    this.updateAtomStatuses(atoms);

    // Select candidates for cleanup
    const candidates = this.strategy.selectCandidates(
      atoms.filter((a) => a.gcEligible),
      this.config.ttl.batchSize,
    );

    if (candidates.length === 0) {
      return { removed: 0, freed: 0, duration: 0 };
    }

    let removed = 0;
    let freed = 0;

    for (const atom of candidates) {
      if (await this.cleanupAtom(atom)) {
        removed++;
        freed += this.estimateAtomSize(atom);
      }
    }

    this.stats.totalCleanups++;
    this.stats.totalAtomsRemoved += removed;
    this.stats.totalMemoryFreed += freed;
    this.stats.lastCleanup = Date.now();

    this.emit("cleanup", {
      removed,
      freed,
      duration: Date.now() - startTime,
    });

    return { removed, freed, duration: Date.now() - startTime };
  }

  private updateAtomStatuses(atoms: TrackedAtom[]): void {
    const now = Date.now();

    for (const atom of atoms) {
      const idleTime = now - atom.lastAccessed;
      atom.idleTime = idleTime;

      // Update status based on activity
      if (idleTime > atom.ttl) {
        atom.status = "stale";
        atom.gcEligible = true;
      } else if (idleTime > this.config.ttl.idleThreshold) {
        atom.status = "idle";
        // Idle but not yet eligible for GC
        atom.gcEligible =
          this.config.ttl.cleanupStrategy === "time-based"
            ? idleTime > atom.ttl * 0.8 // 80% of TTL
            : false;
      } else {
        atom.status = "active";
        atom.gcEligible = false;
      }

      // Check reference count
      if (this.config.ttl.enableRefCounting) {
        const refCount = atom.subscribers?.size || 0;
        if (refCount === 0 && this.config.ttl.autoUntrackWhenRefZero) {
          atom.gcEligible = true;
        }
      }
    }
  }

  private async cleanupAtom(atom: TrackedAtom): Promise<boolean> {
    try {
      // Notify subscribers before cleanup
      this.emit("beforeCleanup", { atom });

      // Handle based on strategy
      switch (this.config.ttl.onCleanup) {
        case "archive":
          // Move to archive storage (optional persistence)
          await this.archiveAtom(atom);
          break;
        case "delete":
          // Completely remove
          this.atoms.delete(atom.id);
          this.atomsByName.delete(atom.name);
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

  private getTTLForType(type: string): number {
    return this.config.ttl.typeTTL[type] || this.config.ttl.defaultTTL;
  }

  private estimateAtomSize(atom: TrackedAtom): number {
    // Rough estimate of memory usage
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

  // Manual cleanup methods
  cleanupNow(count?: number): CleanupResult {
    this.config.ttl.batchSize = count || this.config.ttl.batchSize;
    return this.performCleanup();
  }

  markForCleanup(atomId: symbol): void {
    const atom = this.atoms.get(atomId);
    if (atom) {
      atom.gcEligible = true;
    }
  }

  async waitForCleanup(timeout?: number): Promise<CleanupResult> {
    return new Promise((resolve) => {
      const check = () => {
        const result = this.performCleanup();
        if (result.removed > 0 || this.atoms.size === 0) {
          resolve(result);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  getCleanupStats(): CleanupStats {
    return { ...this.stats };
  }

  async dispose(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Final cleanup
    await this.performCleanup();

    await super.dispose();
  }
}
```

### Integration with SimpleTimeTravel

```typescript
export class SimpleTimeTravel extends BaseDisposable {
  constructor(store: Store, options: TimeTravelOptions = {}) {
    super();

    this.atomTracker = new AtomTracker(store, {
      ttl: {
        defaultTTL: options.atomTTL || 5 * 60 * 1000,
        cleanupStrategy: options.cleanupStrategy || "lru",
        gcInterval: options.gcInterval || 30000,
        ...options.ttlConfig,
      },
      ...options.trackingConfig,
    });

    // Subscribe to cleanup events for debugging
    this.atomTracker.subscribe((event) => {
      if (event.type === "cleanup") {
        console.log(
          `Cleaned up ${event.removed} atoms, freed ${event.freed} bytes`,
        );
      }
    });
  }

  // Manual cleanup trigger
  cleanupAtoms(count?: number): CleanupResult {
    return this.atomTracker.cleanupNow(count);
  }

  // Get atoms eligible for cleanup
  getStaleAtoms(): TrackedAtom[] {
    return this.atomTracker.getAllTracked().filter((a) => a.gcEligible);
  }

  // Mark specific atom for cleanup
  forgetAtom(atomName: string): boolean {
    const atom = this.atomTracker.getAtomByName(atomName);
    if (atom) {
      this.atomTracker.markForCleanup(atom.id);
      return true;
    }
    return false;
  }
}
```

### Testing Requirements

1. **TTL Functionality Tests**

```typescript
describe("Atom TTL", () => {
  test("should mark idle atoms as stale after TTL", async () => {
    const tracker = new AtomTracker(store, {
      ttl: { defaultTTL: 100, idleThreshold: 50 },
    });

    tracker.track(testAtom);

    // Wait for TTL to expire
    await sleep(150);

    tracker["performCleanup"]();
    const atoms = tracker.getAllTracked();
    expect(atoms[0].status).toBe("stale");
    expect(atoms[0].gcEligible).toBe(true);
  });

  test("should cleanup atoms in batch", async () => {
    const tracker = new AtomTracker(store, {
      ttl: { defaultTTL: 100, batchSize: 5 },
    });

    // Track 10 atoms
    for (let i = 0; i < 10; i++) {
      tracker.track(createTestAtom(`atom${i}`));
    }

    await sleep(200);

    const result = tracker.cleanupNow();
    expect(result.removed).toBe(5); // Should cleanup 5 atoms

    expect(tracker.size()).toBe(5); // 5 remain
  });
});
```

2. **Reference Counting Tests**

```typescript
test("should track subscriber references", () => {
  const tracker = new AtomTracker(store, {
    ttl: { enableRefCounting: true, autoUntrackWhenRefZero: true },
  });

  tracker.track(testAtom);

  // Simulate subscribers
  tracker.recordAccess(testAtom, "component1");
  tracker.recordAccess(testAtom, "component2");

  const tracked = tracker.getTrackedAtom(testAtom.id);
  expect(tracked?.subscribers?.size).toBe(2);
  expect(tracked?.refCount).toBe(2);

  // Remove subscribers (simulate unmount)
  // Implementation would track unsubscription
  tracked?.subscribers?.delete("component1");
  tracked?.subscribers?.delete("component2");

  tracker["updateAtomStatuses"]([tracked!]);
  expect(tracked?.gcEligible).toBe(true);
});
```

3. **Memory Leak Tests**

```typescript
test("should not leak memory with dynamic atoms", async () => {
  const tracker = new AtomTracker(store, {
    ttl: { defaultTTL: 100, gcInterval: 50 },
  });

  const initialMemory = process.memoryUsage().heapUsed;

  // Create and track 1000 temporary atoms
  for (let i = 0; i < 1000; i++) {
    const atom = createTemporaryAtom(`temp${i}`);
    tracker.track(atom);

    // Access some
    if (i % 2 === 0) {
      tracker.recordAccess(atom);
    }
  }

  // Wait for cleanup
  await tracker.waitForCleanup();

  if (global.gc) global.gc();

  const finalMemory = process.memoryUsage().heapUsed;
  const leak = finalMemory - initialMemory;

  expect(leak).toBeLessThan(1024 * 50); // Less than 50KB leak
});
```

### Configuration Options

```typescript
interface TTLConfig {
  // Core TTL settings
  defaultTTL: number; // Default time-to-live in ms
  maxTTL: number; // Maximum allowed TTL
  minTTL: number; // Minimum allowed TTL

  // Type-specific overrides
  typeTTL: {
    primitive?: number;
    computed?: number;
    writable?: number;
    [key: string]: number | undefined;
  };

  // Activity thresholds
  idleThreshold: number; // Time before considered idle
  staleThreshold: number; // Time before considered stale

  // Cleanup settings
  gcInterval: number; // How often to run cleanup (0 to disable)
  batchSize: number; // How many atoms to cleanup per run
  cleanupStrategy: "lru" | "lfu" | "fifo" | "time-based";
  onCleanup: "archive" | "delete" | "notify";

  // Reference counting
  enableRefCounting: boolean;
  autoUntrackWhenRefZero: boolean;

  // Archive storage (if using archive strategy)
  archiveStorage?: {
    enabled: boolean;
    maxArchived: number;
    storagePath?: string;
  };

  // Debug options
  logCleanups: boolean;
  detailedStats: boolean;
}
```

### Metrics and Monitoring

```typescript
interface CleanupStats {
  totalCleanups: number;
  totalAtomsRemoved: number;
  totalMemoryFreed: number;
  lastCleanup: number | null;
  averageCleanupTime?: number;
  atomsByStatus?: {
    active: number;
    idle: number;
    stale: number;
    archived: number;
  };
}
```

### Definition of Done

- [ ] TTL configuration system implemented
- [ ] All cleanup strategies working (LRU, LFU, FIFO, time-based)
- [ ] Reference counting with subscriber tracking
- [ ] Automatic cleanup timer with batch processing
- [ ] Manual cleanup methods available
- [ ] Archive storage for important atoms
- [ ] Comprehensive test coverage
- [ ] Memory leak tests passing
- [ ] Integration with SimpleTimeTravel
- [ ] Documentation with examples and best practices
- [ ] Performance benchmarks showing memory improvement

### SPR Requirements

- Single responsibility: TTL management separate from core tracking
- Clean separation between strategies
- Pluggable strategy architecture
- Immutable atom data where possible
- Proper error handling during cleanup
- Observable cleanup events for monitoring
- No side effects in status calculation

---

**Note:** After completion, provide memory usage graphs showing improvement over time and recommendations for TTL values based on application type. Include examples of handling different atom types with different TTLs.
