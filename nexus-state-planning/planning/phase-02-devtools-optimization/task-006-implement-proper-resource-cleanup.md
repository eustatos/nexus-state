## Task 6: Implement Proper Resource Cleanup in dispose() Methods

**Filename:** `task-006-implement-proper-resource-cleanup.md`

### Context

The current `dispose()` method in `SimpleTimeTravel` is incomplete and doesn't properly clean up all resources. This leads to memory leaks, lingering event listeners, and potential issues with garbage collection. All components (HistoryManager, SnapshotCreator, SnapshotRestorer, AtomTracker) need proper cleanup mechanisms.

### Current Problems

```typescript
// Current incomplete implementation
dispose(): void {
  // Restore original store.set
  this.store.set = this.originalSet;

  // Clear all listeners and history
  // Clear not implemented in HistoryManager  <-- ACTUAL COMMENT IN CODE
  this.atomTracker.clear();

  // @ts-expect-error - Clean up references
  this.store = null;
}
```

### Requirements

1. **Create Cleanup Interface**

```typescript
interface Disposable {
  dispose(): void;
  isDisposed(): boolean;
  onDispose(callback: () => void): () => void; // Register cleanup callback
}

interface DisposableConfig {
  autoDisposeChildren: boolean;
  timeout?: number; // Timeout for async disposal
  onError?: (error: Error) => void;
}
```

2. **Implement Base Disposable Class**

```typescript
abstract class BaseDisposable implements Disposable {
  protected disposed: boolean = false;
  protected disposeCallbacks: Set<() => void> = new Set();
  protected children: Set<Disposable> = new Set();
  protected disposePromise: Promise<void> | null = null;

  abstract dispose(): Promise<void> | void;

  isDisposed(): boolean {
    return this.disposed;
  }

  onDispose(callback: () => void): () => void {
    this.disposeCallbacks.add(callback);
    return () => this.disposeCallbacks.delete(callback);
  }

  protected registerChild(child: Disposable): void {
    this.children.add(child);
  }

  protected async disposeChildren(): Promise<void> {
    const errors: Error[] = [];

    for (const child of this.children) {
      try {
        if (!child.isDisposed()) {
          await child.dispose();
        }
      } catch (error) {
        errors.push(error as Error);
      }
    }

    this.children.clear();

    if (errors.length > 0) {
      throw new AggregateDisposalError(errors);
    }
  }

  protected async runDisposeCallbacks(): Promise<void> {
    const callbacks = Array.from(this.disposeCallbacks);
    this.disposeCallbacks.clear();

    for (const callback of callbacks) {
      try {
        await callback();
      } catch (error) {
        console.error("Error in dispose callback:", error);
      }
    }
  }
}
```

3. **Enhance Each Component with Proper Cleanup**

**HistoryManager Cleanup:**

```typescript
export class HistoryManager extends BaseDisposable {
  private past: Snapshot[] = [];
  private future: Snapshot[] = [];
  private current: Snapshot | null = null;
  private listeners: Set<(event: HistoryEvent) => void> = new Set();
  private timers: Set<ReturnType<typeof setTimeout>> = new Set();

  async dispose(): Promise<void> {
    if (this.disposed) return;

    // Clear all listeners
    this.listeners.clear();

    // Clear all timers
    this.timers.forEach(clearTimeout);
    this.timers.clear();

    // Clear references to snapshots (help GC)
    this.past = [];
    this.future = [];
    this.current = null;

    // Dispose children
    await this.disposeChildren();

    // Run callbacks
    await this.runDisposeCallbacks();

    this.disposed = true;
  }

  // Helper to track timers
  protected setTimeout(
    callback: () => void,
    ms: number,
  ): ReturnType<typeof setTimeout> {
    const timer = setTimeout(callback, ms);
    this.timers.add(timer);
    return timer;
  }
}
```

**AtomTracker Cleanup:**

```typescript
export class AtomTracker extends BaseDisposable {
  private atoms: Map<symbol, TrackedAtom> = new Map();
  private atomsByName: Map<string, symbol> = new Map();
  private listeners: Set<(event: TrackingEvent) => void> = new Set();
  private store: Store;
  private storeUnsubscribe: (() => void) | null = null;

  async dispose(): Promise<void> {
    if (this.disposed) return;

    // Unsubscribe from store
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }

    // Clear all listeners
    this.listeners.clear();

    // Clear atom references
    this.atoms.clear();
    this.atomsByName.clear();

    // Remove store reference
    this.store = null as any;

    await super.dispose();
  }

  // Track store subscription for cleanup
  subscribeToStore(store: Store): void {
    const unsubscribe = store.subscribe(() => {
      // Handle store changes
    });
    this.storeUnsubscribe = unsubscribe;
    this.registerDisposable({ dispose: unsubscribe });
  }
}
```

**SnapshotCreator Cleanup:**

```typescript
export class SnapshotCreator extends BaseDisposable {
  private listeners: Set<(snapshot: Snapshot) => void> = new Set();
  private serializer: AdvancedSerializer;
  private workerPool: WorkerPool | null = null;

  async dispose(): Promise<void> {
    if (this.disposed) return;

    // Clear listeners
    this.listeners.clear();

    // Dispose worker pool if exists
    if (this.workerPool) {
      await this.workerPool.dispose();
      this.workerPool = null;
    }

    // Dispose serializer
    if (this.serializer && "dispose" in this.serializer) {
      await (this.serializer as Disposable).dispose();
    }

    await super.dispose();
  }
}
```

**SnapshotRestorer Cleanup:**

```typescript
export class SnapshotRestorer extends BaseDisposable {
  private checkpoints: Map<string, RestorationCheckpoint> = new Map();
  private activeRestoration: boolean = false;
  private transactionLog: TransactionLog | null = null;

  async dispose(): Promise<void> {
    if (this.disposed) return;

    // Abort any active restoration
    if (this.activeRestoration) {
      await this.abortActiveRestoration();
    }

    // Clear checkpoints
    this.checkpoints.clear();

    // Dispose transaction log
    if (this.transactionLog) {
      await this.transactionLog.dispose();
      this.transactionLog = null;
    }

    await super.dispose();
  }

  private async abortActiveRestoration(): Promise<void> {
    this.activeRestoration = false;
    // Rollback any pending changes
    await this.rollbackAll();
  }
}
```

4. **Enhance SimpleTimeTravel with Comprehensive Cleanup**

```typescript
export class SimpleTimeTravel extends BaseDisposable implements TimeTravelAPI {
  private historyManager: HistoryManager;
  private historyNavigator: HistoryNavigator;
  private snapshotCreator: SnapshotCreator;
  private snapshotRestorer: SnapshotRestorer;
  private atomTracker: AtomTracker;
  private store: Store;
  private originalSet: Function;
  private wrappedSet: Function;
  private subscriptions: Set<() => void> = new Set();

  constructor(store: Store, options: TimeTravelOptions = {}) {
    super();
    this.store = store;
    this.originalSet = store.set;

    // Initialize components with disposal tracking
    this.atomTracker = new AtomTracker(store, options.trackingConfig);
    this.registerChild(this.atomTracker);

    this.snapshotCreator = new SnapshotCreator(store, options.snapshotConfig);
    this.registerChild(this.snapshotCreator);

    this.snapshotRestorer = new SnapshotRestorer(store, options.restoreConfig);
    this.registerChild(this.snapshotRestorer);

    this.historyManager = new HistoryManager(options.maxHistory || 50);
    this.registerChild(this.historyManager);

    this.historyNavigator = new HistoryNavigator(
      this.historyManager,
      this.snapshotRestorer,
    );
    this.registerChild(this.historyNavigator);

    // Track all subscriptions for cleanup
    this.trackSubscriptions();
  }

  private trackSubscriptions(): void {
    // Track history subscriptions
    const unsubscribeHistory = this.historyManager.subscribe((event) => {
      // Handle event
    });
    this.subscriptions.add(unsubscribeHistory);

    // Track snapshot subscriptions
    const unsubscribeSnapshots = this.snapshotCreator.subscribe((snapshot) => {
      // Handle snapshot
    });
    this.subscriptions.add(unsubscribeSnapshots);

    // Track tracking subscriptions
    const unsubscribeTracking = this.atomTracker.subscribe((event) => {
      // Handle tracking event
    });
    this.subscriptions.add(unsubscribeTracking);
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;

    // 1. Stop all operations
    this.pauseAutoCapture();

    // 2. Restore original store.set
    if (this.store && this.originalSet) {
      this.store.set = this.originalSet;
    }

    // 3. Clear all subscriptions
    this.subscriptions.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (e) {
        /* ignore */
      }
    });
    this.subscriptions.clear();

    // 4. Dispose all child components (in reverse order)
    const children = Array.from(this.children).reverse();
    for (const child of children) {
      try {
        await child.dispose();
      } catch (error) {
        console.error("Error disposing child:", error);
      }
    }
    this.children.clear();

    // 5. Clear references
    this.store = null as any;
    this.originalSet = null as any;
    this.wrappedSet = null as any;

    // 6. Run final callbacks
    await this.runDisposeCallbacks();

    this.disposed = true;
  }

  // Add finalization registry for garbage collection
  private finalizationRegistry = new FinalizationRegistry(
    (heldValue: string) => {
      console.log(`TimeTravel instance ${heldValue} was garbage collected`);
    },
  );
}
```

5. **Add Resource Leak Detection**

```typescript
export class LeakDetector {
  private static instances: Map<string, WeakRef<Disposable>> = new Map();
  private static interval: ReturnType<typeof setInterval> | null = null;

  static track(instance: Disposable, id: string): void {
    this.instances.set(id, new WeakRef(instance));

    if (!this.interval) {
      this.startMonitoring();
    }
  }

  static startMonitoring(intervalMs: number = 60000): void {
    this.interval = setInterval(() => {
      this.checkForLeaks();
    }, intervalMs);
  }

  private static checkForLeaks(): void {
    for (const [id, ref] of this.instances.entries()) {
      const instance = ref.deref();

      if (!instance) {
        // Instance was garbage collected - good
        this.instances.delete(id);
        continue;
      }

      if (!instance.isDisposed()) {
        console.warn(`Potential leak: ${id} was not disposed before GC`);
      }
    }
  }

  static stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
```

### Testing Requirements

1. **Memory Leak Tests**

```typescript
describe("Disposal Memory Leaks", () => {
  test("should not leak after dispose", async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Create and dispose many instances
    for (let i = 0; i < 100; i++) {
      const tt = new SimpleTimeTravel(store);
      await tt.dispose();
    }

    // Force GC (if available)
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const leak = finalMemory - initialMemory;

    expect(leak).toBeLessThan(1024 * 10); // Less than 10KB leak
  });
});
```

2. **Event Listener Cleanup**

```typescript
test("should remove all event listeners", () => {
  const tt = new SimpleTimeTravel(store);
  const listener = jest.fn();

  const unsubscribe = tt.subscribe(listener);
  tt.dispose();

  // Trigger event (should not call listener)
  tt.capture("test");

  expect(listener).not.toHaveBeenCalled();
});
```

3. **Circular Reference Cleanup**

```typescript
test("should break circular references", () => {
  const tt = new SimpleTimeTravel(store);
  const weakRef = new WeakRef(tt);

  tt.dispose();
  tt = null as any;

  // Force GC
  if (global.gc) {
    global.gc();
  }

  expect(weakRef.deref()).toBeUndefined();
});
```

### Configuration Options

```typescript
interface DisposalConfig {
  timeout: number; // Timeout for async disposal (ms)
  throwOnError: boolean; // Throw or log errors
  forceGarbageCollection: boolean; // Call gc() after dispose (dev only)
  detectLeaks: boolean; // Enable leak detection
  logDisposal: boolean; // Log disposal steps
}
```

### Definition of Done

- [ ] BaseDisposable class implemented
- [ ] All components extend BaseDisposable
- [ ] Proper cleanup in each component
- [ ] SimpleTimeTravel.dispose() fully implemented
- [ ] Memory leak tests passing
- [ ] Event listener cleanup verified
- [ ] Circular references properly broken
- [ ] FinalizationRegistry integrated
- [ ] Leak detection system working
- [ ] Documentation with disposal patterns

### SPR Requirements

- Single responsibility: each component cleans up its own resources
- Clear ownership hierarchy
- Predictable disposal order (children first)
- No side effects after disposal
- Idempotent dispose operations
- Proper error isolation

---

**Note:** After completion, provide memory usage metrics showing improvement and leak detection reports from long-running tests.
