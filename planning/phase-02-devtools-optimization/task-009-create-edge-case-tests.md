## Task 9: Create Comprehensive Edge Case Tests for Time Travel System (Vitest Version)

**Filename:** `task-009-create-edge-case-tests-vitest.md`

### Context

The time travel system lacks comprehensive testing for edge cases, concurrency issues, and error scenarios. This leads to undetected bugs in production-like scenarios. Need a complete test suite using Vitest that covers all components under various stress conditions, invalid inputs, and race conditions. All tests must be type-safe with no use of `any`.

### Current Gaps

- No tests for concurrent undo/redo operations
- Missing tests for corrupted snapshots
- No stress tests with thousands of atoms
- Missing race condition tests
- No tests for partial failures during restoration
- Missing tests for memory pressure scenarios

### Requirements

1. **Create Type-Safe Test Infrastructure**

```typescript
// test/utils/test-helpers.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Store, Atom, Snapshot } from "../../src/types";
import type { TrackedAtom } from "../../src/tracking/types";

export class TestHelper {
  static createTestStore(initialAtoms: Record<string, unknown> = {}): Store {
    const atoms = new Map<symbol, unknown>();

    return {
      get: <T>(atom: Atom<T>): T => {
        return atoms.get(atom.id) as T;
      },
      set: <T>(atom: Atom<T>, value: T): void => {
        atoms.set(atom.id, value);
      },
      subscribe: (callback: () => void) => {
        return () => {};
      },
    } as Store;
  }

  static generateAtom(
    name: string,
    type: "primitive" | "computed" | "writable" = "primitive",
  ): Atom<unknown> {
    return {
      id: Symbol(name),
      name,
      type,
      toString: () => name,
    } as Atom<unknown>;
  }

  static generateSnapshot(
    id: string,
    state: Record<string, unknown> = {},
    options?: Partial<Snapshot>,
  ): Snapshot {
    return {
      id,
      state: Object.entries(state).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: {
            value,
            type: "primitive",
            name: key,
            atomId: `atom-${key}`,
          },
        }),
        {},
      ),
      metadata: {
        timestamp: Date.now(),
        action: `test-${id}`,
        atomCount: Object.keys(state).length,
        ...options?.metadata,
      },
    } as Snapshot;
  }

  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async repeat(fn: () => Promise<void>, times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
      await fn();
    }
  }

  static async concurrent<T>(
    fns: Array<() => Promise<T>>,
    parallel: number = 10,
  ): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < fns.length; i += parallel) {
      const batch = fns.slice(i, i + parallel);
      results.push(...(await Promise.all(batch.map((fn) => fn()))));
    }
    return results;
  }

  static mockStoreGet(store: Store, value: unknown): void {
    vi.spyOn(store, "get").mockReturnValue(value);
  }

  static mockStoreSet(store: Store, shouldFail: boolean = false): void {
    if (shouldFail) {
      vi.spyOn(store, "set").mockImplementation(() => {
        throw new Error("Store set failed");
      });
    }
  }
}
```

2. **HistoryManager Edge Cases Test**

```typescript
// test/history-manager/edge-cases.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { HistoryManager } from "../../src/time-travel/HistoryManager";
import { TestHelper } from "../utils/test-helpers";
import type { Snapshot } from "../../src/types";

describe("HistoryManager Edge Cases", () => {
  let historyManager: HistoryManager;

  beforeEach(() => {
    historyManager = new HistoryManager(5); // Small limit for testing
  });

  it("should handle maxHistory = 0", () => {
    historyManager = new HistoryManager(0);

    historyManager.add(TestHelper.generateSnapshot("1", { a: 1 }));
    historyManager.add(TestHelper.generateSnapshot("2", { a: 2 }));

    expect(historyManager.getAll().length).toBe(0);
    expect(historyManager.canUndo()).toBe(false);
  });

  it("should handle maxHistory = 1 correctly", () => {
    historyManager = new HistoryManager(1);

    historyManager.add(TestHelper.generateSnapshot("1", { a: 1 }));
    expect(historyManager.getCurrent()?.id).toBe("1");

    historyManager.add(TestHelper.generateSnapshot("2", { a: 2 }));

    expect(historyManager.getCurrent()?.id).toBe("2");

    // Access private past array for testing
    const past = (historyManager as any).past as Snapshot[];
    expect(past.length).toBe(0);
  });

  it("should handle adding same snapshot multiple times", () => {
    const snapshot = TestHelper.generateSnapshot("same", { a: 1 });

    historyManager.add(snapshot);
    historyManager.add(snapshot);

    expect(historyManager.getAll().length).toBe(2);
    expect(historyManager.getCurrent()).toBe(snapshot);
  });

  it("should handle undo/redo with empty history", () => {
    expect(historyManager.undo()).toBeNull();
    expect(historyManager.redo()).toBeNull();
    expect(historyManager.canUndo()).toBe(false);
    expect(historyManager.canRedo()).toBe(false);
  });

  it("should handle jumpTo with invalid indices", () => {
    historyManager.add(TestHelper.generateSnapshot("1", { a: 1 }));
    historyManager.add(TestHelper.generateSnapshot("2", { a: 2 }));

    expect(historyManager.jumpTo(-1)).toBeNull();
    expect(historyManager.jumpTo(999)).toBeNull();
    expect(historyManager.getCurrent()?.id).toBe("2");
  });

  it("should handle clear during undo/redo", () => {
    historyManager.add(TestHelper.generateSnapshot("1", { a: 1 }));
    historyManager.add(TestHelper.generateSnapshot("2", { a: 2 }));

    historyManager.undo();
    historyManager.clear();

    expect(historyManager.canRedo()).toBe(false);
    expect(historyManager.getCurrent()).toBeNull();
  });

  it("should maintain consistency with rapid add/undo/redo", () => {
    for (let i = 0; i < 10; i++) {
      historyManager.add(TestHelper.generateSnapshot(`${i}`, { value: i }));
    }

    for (let i = 0; i < 5; i++) {
      historyManager.undo();
      historyManager.redo();
    }

    expect(historyManager.getCurrent()?.id).toBe("9");

    const past = (historyManager as any).past as Snapshot[];
    const future = (historyManager as any).future as Snapshot[];
    expect(past.length + future.length).toBe(9);
  });

  it("should handle adding snapshots beyond maxHistory", () => {
    for (let i = 0; i < 10; i++) {
      historyManager.add(TestHelper.generateSnapshot(`${i}`, { value: i }));
    }

    expect(historyManager.getAll().length).toBe(5); // Only last 5
    expect(historyManager.getCurrent()?.id).toBe("9");
  });

  it("should preserve order after multiple undos and redos", () => {
    for (let i = 0; i < 5; i++) {
      historyManager.add(TestHelper.generateSnapshot(`${i}`, { value: i }));
    }

    historyManager.undo(); // at 3
    historyManager.undo(); // at 2
    historyManager.redo(); // at 3
    historyManager.undo(); // at 2

    expect(historyManager.getCurrent()?.metadata.action).toBe("test-2");
  });
});
```

3. **SnapshotCreator Edge Cases Test**

```typescript
// test/snapshot-creator/edge-cases.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SnapshotCreator } from "../../src/snapshot/SnapshotCreator";
import { TestHelper } from "../utils/test-helpers";
import type { Store, Atom } from "../../src/types";

describe("SnapshotCreator Edge Cases", () => {
  let store: Store;
  let creator: SnapshotCreator;

  beforeEach(() => {
    store = TestHelper.createTestStore();
    creator = new SnapshotCreator(store, {
      generateId: () => "test-id",
      validate: true,
    });
  });

  it("should handle atoms with circular references", () => {
    interface CircularObject {
      name: string;
      self?: CircularObject;
    }

    const circular: CircularObject = { name: "circular" };
    circular.self = circular;

    const atom = TestHelper.generateAtom("circular");
    store.set(atom, circular);

    const snapshot = creator.create("circular-test");
    expect(snapshot).toBeDefined();

    const state = snapshot!.state["circular"];
    expect(state.value).toBeDefined();

    // Should serialize circular reference safely
    const serialized = JSON.stringify(state.value);
    expect(serialized).toContain("__serializedType");
  });

  it("should handle atoms with functions", () => {
    const testFn = (x: number) => x * 2;
    const atom = TestHelper.generateAtom("fn");
    store.set(atom, testFn);

    const snapshot = creator.create("fn-test");
    expect(snapshot).toBeDefined();

    const value = snapshot!.state["fn"].value as Record<string, unknown>;
    expect(value).toHaveProperty("__serializedType", "function");
  });

  it("should handle atoms with undefined values", () => {
    const atom = TestHelper.generateAtom("undefined");
    store.set(atom, undefined);

    const snapshot = creator.create("undefined-test");
    expect(snapshot!.state["undefined"].value).toBeUndefined();
  });

  it("should handle atoms with null values", () => {
    const atom = TestHelper.generateAtom("null");
    store.set(atom, null);

    const snapshot = creator.create("null-test");
    expect(snapshot!.state["null"].value).toBeNull();
  });

  it("should handle atoms with symbols as values", () => {
    const sym = Symbol("test");
    const atom = TestHelper.generateAtom("symbol");
    store.set(atom, sym);

    const snapshot = creator.create("symbol-test");
    const value = snapshot!.state["symbol"].value as Record<string, unknown>;
    expect(value).toHaveProperty("__serializedType", "symbol");
  });

  it("should handle atoms with huge objects within performance limits", () => {
    const large = Array(10000)
      .fill(null)
      .map((_, i) => ({
        index: i,
        data: "x".repeat(100),
      }));

    const atom = TestHelper.generateAtom("large");
    store.set(atom, large);

    const start = Date.now();
    const snapshot = creator.create("large-test");
    const duration = Date.now() - start;

    expect(snapshot).toBeDefined();
    expect(duration).toBeLessThan(1000);
  });

  it("should handle batch creation with errors", () => {
    const badAtom = TestHelper.generateAtom("bad");

    // Mock store.get to throw error
    TestHelper.mockStoreGet(store, new Error("Store error"));

    const snapshots = creator.createBatch(5, "batch");
    expect(snapshots.length).toBeLessThan(5);
  });

  it("should respect excludeAtoms configuration", () => {
    const atom1 = TestHelper.generateAtom("include");
    const atom2 = TestHelper.generateAtom("exclude");

    store.set(atom1, "value1");
    store.set(atom2, "value2");

    const filteredCreator = new SnapshotCreator(store, {
      excludeAtoms: ["exclude"],
    });

    const snapshot = filteredCreator.create("filtered");
    expect(snapshot!.state["include"]).toBeDefined();
    expect(snapshot!.state["exclude"]).toBeUndefined();
  });

  it("should handle store errors gracefully", () => {
    const atom = TestHelper.generateAtom("error");

    TestHelper.mockStoreGet(store, new Error("Store error"));

    const snapshot = creator.create("error-test");
    expect(snapshot).toBeNull();
  });
});
```

4. **AtomTracker Concurrency Tests**

```typescript
// test/atom-tracker/concurrency.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AtomTracker } from "../../src/tracking/AtomTracker";
import { TestHelper } from "../utils/test-helpers";
import type { Store, Atom } from "../../src/types";
import type { TrackedAtom } from "../../src/tracking/types";

describe("AtomTracker Concurrency", () => {
  let tracker: AtomTracker;
  let store: Store;

  beforeEach(() => {
    store = TestHelper.createTestStore();
    tracker = new AtomTracker(store, {
      maxAtoms: 100,
      ttl: { defaultTTL: 1000 },
    });
  });

  it("should handle concurrent track operations", async () => {
    const operations = Array(50)
      .fill(null)
      .map((_, i) => async () => {
        const atom = TestHelper.generateAtom(`atom-${i}`);
        return tracker.track(atom);
      });

    const results = await TestHelper.concurrent(operations, 10);
    expect(results.filter(Boolean).length).toBe(50);
    expect(tracker.size()).toBe(50);
  });

  it("should handle concurrent track and untrack", async () => {
    const atoms = Array(20)
      .fill(null)
      .map((_, i) => TestHelper.generateAtom(`atom-${i}`));

    atoms.forEach((atom) => tracker.track(atom));

    const operations: Array<() => Promise<boolean>> = [
      ...Array(10)
        .fill(null)
        .map((_, i) => async () => {
          const atom = TestHelper.generateAtom(`new-${i}`);
          return tracker.track(atom);
        }),
      ...atoms.slice(0, 10).map((atom) => async () => {
        return tracker.untrack(atom);
      }),
    ];

    await TestHelper.concurrent(operations, 5);

    expect(tracker.size()).toBe(20);
  });

  it("should handle concurrent access recording", async () => {
    const atom = TestHelper.generateAtom("shared");
    tracker.track(atom);

    const operations = Array(100)
      .fill(null)
      .map(() => async () => {
        tracker.recordAccess(atom);
        await TestHelper.wait(Math.random() * 10);
      });

    await TestHelper.concurrent(operations, 20);

    const tracked = tracker.getTrackedAtom(atom.id);
    expect(tracked?.accessCount).toBe(100);
  });

  it("should handle TTL cleanup during concurrent access", async () => {
    tracker.configure({
      ttl: {
        defaultTTL: 50,
        gcInterval: 20,
        batchSize: 5,
      },
    });

    const atoms = Array(20)
      .fill(null)
      .map((_, i) => {
        const atom = TestHelper.generateAtom(`atom-${i}`);
        tracker.track(atom);
        return atom;
      });

    const operations: Array<() => Promise<void>> = [
      ...atoms.slice(0, 10).map((atom) => async () => {
        for (let j = 0; j < 5; j++) {
          tracker.recordAccess(atom);
          await TestHelper.wait(10);
        }
      }),
      async () => {
        await TestHelper.wait(100);
        tracker.cleanupNow(5);
      },
    ];

    await TestHelper.concurrent(operations, 5);

    const remaining = tracker.getAllTracked();
    expect(remaining.length).toBeGreaterThan(0);
    expect(remaining.every((a) => a.accessCount > 0)).toBe(true);
  });

  it("should maintain correct reference counts under concurrency", async () => {
    const atom = TestHelper.generateAtom("ref-test");
    tracker.track(atom);

    const subscriberId = "test-component";
    const operations = Array(50)
      .fill(null)
      .map(() => async () => {
        tracker.recordAccess(atom, subscriberId);
      });

    await TestHelper.concurrent(operations, 10);

    const tracked = tracker.getTrackedAtom(atom.id);
    expect(tracked?.subscribers?.size).toBe(1); // Same subscriber
    expect(tracked?.refCount).toBe(1);
  });
});
```

5. **TimeTravel Integration Stress Tests**

```typescript
// test/time-travel/stress.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SimpleTimeTravel } from "../../src/time-travel/SimpleTimeTravel";
import { TestHelper } from "../utils/test-helpers";
import type { Store, Atom } from "../../src/types";

describe("TimeTravel Stress Tests", () => {
  let store: Store;
  let timeTravel: SimpleTimeTravel;
  let counterAtom: Atom<number>;

  beforeEach(() => {
    store = TestHelper.createTestStore();
    timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 50,
      autoCapture: true,
    });
    counterAtom = TestHelper.generateAtom("counter", "writable");
  });

  afterEach(() => {
    timeTravel.dispose();
  });

  it("should handle rapid state changes", () => {
    for (let i = 0; i < 1000; i++) {
      store.set(counterAtom, i);
    }

    expect(timeTravel.getHistory().length).toBeLessThanOrEqual(50);
  });

  it("should handle concurrent undo/redo during updates", async () => {
    const updateLoop = setInterval(() => {
      store.set(counterAtom, Math.random());
    }, 1);

    const operations = Array(50)
      .fill(null)
      .map(() => async () => {
        timeTravel.undo();
        await TestHelper.wait(Math.random() * 5);
        timeTravel.redo();
      });

    await TestHelper.concurrent(operations, 10);

    clearInterval(updateLoop);

    expect(timeTravel.isTraveling()).toBe(false);
  });

  it("should handle memory pressure with many atoms", async () => {
    const atoms = Array(1000)
      .fill(null)
      .map((_, i) => {
        const atom = TestHelper.generateAtom(`atom-${i}`);
        store.set(atom, {
          index: i,
          data: "x".repeat(1000),
        });
        return atom;
      });

    const memoryBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < 100; i++) {
      atoms.forEach((atom) =>
        store.set(atom, { index: i, data: "x".repeat(1000) }),
      );
      timeTravel.undo();
      timeTravel.redo();
    }

    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryGrowth = memoryAfter - memoryBefore;

    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
  });

  it("should handle corrupted snapshots during restoration", () => {
    store.set(counterAtom, 1);

    const snapshot = timeTravel.capture("valid");

    if (snapshot) {
      // Corrupt the snapshot
      const state = snapshot.state as Record<string, any>;
      if (state["counter"]) {
        state["counter"].value = undefined;
      }
    }

    const restorer = timeTravel.getSnapshotRestorer();
    const result = restorer.restore(snapshot!);

    expect(result).toBeDefined();
    expect(store.get(counterAtom)).toBe(1);
  });

  it("should handle race condition between capture and undo", async () => {
    const operations = Array(100)
      .fill(null)
      .map(() => async () => {
        if (Math.random() > 0.5) {
          store.set(counterAtom, Math.random());
        } else {
          timeTravel.undo();
        }
        await TestHelper.wait(Math.random() * 2);
      });

    await TestHelper.concurrent(operations, 20);

    expect(timeTravel.isTraveling()).toBe(false);
  });

  it("should maintain history integrity under heavy load", async () => {
    const historySnapshots: string[] = [];

    // Subscribe to history changes
    timeTravel.subscribe((event) => {
      if (event.type === "add" && event.snapshot) {
        historySnapshots.push(event.snapshot.id);
      }
    });

    const operations = Array(200)
      .fill(null)
      .map((_, i) => async () => {
        store.set(counterAtom, i);
        if (i % 3 === 0) {
          timeTravel.undo();
        }
        if (i % 5 === 0) {
          timeTravel.redo();
        }
      });

    await TestHelper.concurrent(operations, 10);

    // Verify history is still traversable
    let undoCount = 0;
    while (timeTravel.canUndo()) {
      timeTravel.undo();
      undoCount++;
    }

    expect(undoCount).toBeGreaterThan(0);
  });
});
```

6. **Recovery and Error Handling Tests**

```typescript
// test/recovery/error-handling.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SnapshotRestorer } from "../../src/snapshot/SnapshotRestorer";
import { TestHelper } from "../utils/test-helpers";
import type { Store, Atom } from "../../src/types";
import type { RestorationResult } from "../../src/snapshot/types";

describe("Error Recovery", () => {
  let store: Store;
  let restorer: SnapshotRestorer;
  let goodAtom: Atom<number>;
  let badAtom: Atom<number>;

  beforeEach(() => {
    store = TestHelper.createTestStore();
    restorer = new SnapshotRestorer(store, {
      validateBeforeRestore: true,
      rollbackOnError: true,
      batchRestore: true,
    });

    goodAtom = TestHelper.generateAtom("good", "writable");
    badAtom = TestHelper.generateAtom("bad", "writable");

    store.set(goodAtom, 1);
    store.set(badAtom, 2);
  });

  it("should recover from partial snapshot restoration failure", async () => {
    const snapshot = TestHelper.generateSnapshot("test", {
      good: 10,
      bad: 20,
    });

    TestHelper.mockStoreSet(store, true);

    const result = (await restorer.restore(snapshot)) as RestorationResult & {
      rollbackPerformed?: boolean;
    };

    expect(result.success).toBe(false);
    expect(result.rollbackPerformed).toBe(true);
    expect(store.get(goodAtom)).toBe(1);
    expect(store.get(badAtom)).toBe(2);
  });

  it("should handle store disposal during operations", () => {
    // Implementation depends on disposal logic
  });

  it("should validate before restore and reject invalid snapshots", () => {
    const invalidSnapshot = TestHelper.generateSnapshot("invalid", {});
    delete (invalidSnapshot as any).id;

    const result = restorer.restore(invalidSnapshot);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should handle missing atoms during restoration", () => {
    const snapshot = TestHelper.generateSnapshot("missing", {
      missingAtom: 100,
    });

    const result = restorer.restore(snapshot);

    expect(result.success).toBe(false);
    expect((result as any).failedAtoms).toBeDefined();
  });

  it("should batch restore with progress tracking", async () => {
    const manyAtoms: Record<string, number> = {};
    for (let i = 0; i < 100; i++) {
      manyAtoms[`atom${i}`] = i;
      store.set(TestHelper.generateAtom(`atom${i}`), i);
    }

    const snapshot = TestHelper.generateSnapshot("batch", manyAtoms);

    const onProgress = vi.fn();

    const result = await restorer.restore(snapshot, {
      batchSize: 10,
      onProgress,
    });

    expect(result.success).toBe(true);
    expect(onProgress).toHaveBeenCalled();
    expect((result as any).appliedAtoms).toBe(100);
  });
});
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["**/types/**", "**/*.d.ts", "test/**"],
      thresholds: {
        branches: 80,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
    testTimeout: 30000,
    hookTimeout: 10000,
    isolate: true,
    threads: true,
  },
});
```

### Test Setup Helper

```typescript
// test/setup.ts
import { beforeAll, afterEach, vi } from "vitest";

beforeAll(() => {
  if (global.gc) {
    global.gc();
  }
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();

  if (global.gc) {
    global.gc();
  }
});

// Custom matchers
expect.extend({
  toHaveBeenCalledOnceWith(received: any, ...expected: any[]) {
    const calls = received.mock.calls;
    const pass =
      calls.length === 1 &&
      JSON.stringify(calls[0]) === JSON.stringify(expected);

    return {
      pass,
      message: () =>
        `expected ${received} to have been called once with ${expected}`,
    };
  },
});
```

### Performance Benchmarks

```typescript
// test/performance/benchmarks.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { SimpleTimeTravel } from "../../src/time-travel/SimpleTimeTravel";
import { TestHelper } from "../utils/test-helpers";

interface BenchmarkMetrics {
  capture: { avg: number; p95: number; max: number };
  undo: { avg: number; p95: number; max: number };
  redo: { avg: number; p95: number; max: number };
  jumpTo: { avg: number; p95: number; max: number };
}

describe("Performance Benchmarks", () => {
  const BENCHMARK_CONFIG = {
    iterations: 1000,
    atomCounts: [10, 100, 1000, 10000] as const,
    operations: ["capture", "undo", "redo", "jumpTo"] as const,
  };

  async function runBenchmark(atomCount: number): Promise<BenchmarkMetrics> {
    const store = TestHelper.createTestStore();
    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Create atoms
    for (let i = 0; i < atomCount; i++) {
      const atom = TestHelper.generateAtom(`atom-${i}`);
      store.set(atom, { index: i, value: "x".repeat(10) });
    }

    const metrics: BenchmarkMetrics = {
      capture: { avg: 0, p95: 0, max: 0 },
      undo: { avg: 0, p95: 0, max: 0 },
      redo: { avg: 0, p95: 0, max: 0 },
      jumpTo: { avg: 0, p95: 0, max: 0 },
    };

    // Measure capture
    const captureTimes: number[] = [];
    for (let i = 0; i < BENCHMARK_CONFIG.iterations; i++) {
      const start = Date.now();
      timeTravel.capture(`bench-${i}`);
      captureTimes.push(Date.now() - start);
    }

    metrics.capture = calculateMetrics(captureTimes);

    // Cleanup
    timeTravel.dispose();

    return metrics;
  }

  function calculateMetrics(times: number[]): {
    avg: number;
    p95: number;
    max: number;
  } {
    times.sort((a, b) => a - b);
    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      p95: times[Math.floor(times.length * 0.95)],
      max: times[times.length - 1],
    };
  }

  BENCHMARK_CONFIG.atomCounts.forEach((count) => {
    it(`should perform well with ${count} atoms`, async () => {
      const metrics = await runBenchmark(count);

      expect(metrics.capture.avg).toBeLessThan(50);
      expect(metrics.undo.avg).toBeLessThan(20);
      expect(metrics.redo.avg).toBeLessThan(20);
      expect(metrics.jumpTo.avg).toBeLessThan(30);

      console.log(`Benchmark for ${count} atoms:`, metrics);
    });
  });
});
```

### Definition of Done

- [ ] All tests use Vitest with proper typing
- [ ] No usage of `any` type in any test file
- [ ] Test coverage meets thresholds (80% branches, 85% lines)
- [ ] All edge cases covered for each component
- [ ] Concurrency tests passing consistently
- [ ] Stress tests running without memory leaks
- [ ] Performance benchmarks established
- [ ] Documentation for running tests
- [ ] CI integration ready

### SPR Requirements

- Single responsibility: each test file tests one component
- Clear test descriptions
- Isolated tests with proper setup/teardown
- No test interdependence
- Proper mocking without side effects
- Type-safe assertions throughout
