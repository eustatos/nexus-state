## Performance Standards and Optimization Guidelines

### 🎯 Core Principle: Measure Before Optimizing

## 1. Performance Budgets (Non-negotiable)

### Runtime Performance Targets:

```typescript
// ✅ DEFINE and MEET these budgets:
const PERFORMANCE_BUDGETS = {
  // Frame budget for 60fps
  FRAME_BUDGET_MS: 16,

  // User interaction response
  INTERACTION_BUDGET_MS: 100,

  // Data processing operations
  SORT_10K_ROWS_MS: 100,
  FILTER_10K_ROWS_MS: 50,

  // Network operations (perceived performance)
  LOADING_STATE_MS: 200,

  // Animation smoothness
  ANIMATION_FRAME_MS: 8,

  // Initial load time
  INITIAL_LOAD_MS: 1000,

  // Memory usage per 1000 items
  MEMORY_PER_1K_ITEMS_MB: 1,
} as const;
```

### Bundle Size Budgets:

```typescript
// ✅ MAXIMUM bundle sizes (gzipped):
const BUNDLE_BUDGETS = {
  CORE_LIBRARY_KB: 15,
  FRAMEWORK_ADAPTER_KB: 8,
  UTILITY_MODULE_KB: 5,
  PLUGIN_KB: 3,

  // Per-feature budget
  FEATURE_MODULE_KB: 10,

  // Initial load total
  INITIAL_LOAD_KB: 50,
} as const;
```

## 2. Measurement First Principle

```typescript
// ✅ ALWAYS: Measure before and after optimizations
function optimizeOperation() {
  const measurements = {
    before: {
      time: performance.now(),
      memory: performance.memory?.usedJSHeapSize || 0,
      bundle: getCurrentBundleSize(),
    },
  };

  // Perform optimization

  measurements.after = {
    time: performance.now(),
    memory: performance.memory?.usedJSHeapSize || 0,
    bundle: getUpdatedBundleSize(),
  };

  const improvements = {
    timeReduction: measurements.before.time - measurements.after.time,
    memoryReduction: measurements.before.memory - measurements.after.memory,
    bundleReduction: measurements.before.bundle - measurements.after.bundle,
  };

  // ✅ LOG measurements for tracking
  console.table(measurements);
  console.table(improvements);

  // ✅ VALIDATE against budgets
  assert(
    improvements.timeReduction >= 0,
    "Optimization should not make things slower",
  );
  assert(
    improvements.bundleReduction >= 0,
    "Optimization should not increase bundle size",
  );
}
```

## 3. Memory Management

### Allocation Optimization:

```typescript
// ❌ AVOID: Unnecessary allocations in hot paths
function processItems(items: Item[]) {
  const results = [];

  for (const item of items) {
    // ❌ New object every iteration
    const processed = {
      ...item,
      processedAt: new Date(), // New Date object each iteration
      hash: computeHash(item), // New string each iteration
    };
    results.push(processed);
  }

  return results;
}

// ✅ OPTIMIZE: Minimize allocations
function processItemsOptimized(items: Item[]) {
  // Pre-allocate array if size known
  const results = new Array(items.length);
  const now = new Date(); // Single Date instance

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // ✅ Reuse existing object if possible
    if (item.processedAt && item.hash) {
      results[i] = item; // No allocation
      continue;
    }

    // ✅ Create minimal new object
    results[i] = {
      // Only copy what changes
      ...item,
      processedAt: now, // Reuse Date instance
      hash: item.hash || computeHash(item),
    };
  }

  return results;
}

// ✅ USE: Object pooling for frequent allocations
class ObjectPool<T> {
  private pool: T[] = [];

  acquire(): T {
    return this.pool.pop() || this.create();
  }

  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }

  private create(): T {
    // Create new instance
    return {} as T;
  }

  private reset(obj: T): void {
    // Clear object for reuse
    Object.keys(obj).forEach((key) => delete (obj as any)[key]);
  }
}
```

### Garbage Collection Awareness:

```typescript
// ✅ USE: Weak references for caches
const expensiveCache = new WeakMap<object, ExpensiveResult>();

// ✅ AVOID: Memory leaks in closures
function createEventListener() {
  const largeData = loadLargeData(); // ❌ Captured in closure

  return () => {
    // largeData stays in memory even if not needed
    process(largeData);
  };
}

// ✅ FIX: Release references
function createEventListenerFixed() {
  let largeData: LargeData | null = loadLargeData();

  const handler = () => {
    if (!largeData) return;
    process(largeData);
  };

  // Provide cleanup method
  handler.cleanup = () => {
    largeData = null; // Allow GC
  };

  return handler;
}
```

## 4. Computational Efficiency

### Algorithm Complexity Awareness:

```typescript
// ✅ CHOOSE algorithms wisely
const ALGORITHM_CHOICES = {
  // Small datasets
  SMALL_N: {
    sort: "Array.prototype.sort",
    search: "linear search",
    unique: "Set",
  },

  // Medium datasets (1K-10K items)
  MEDIUM_N: {
    sort: "TimSort (built-in)",
    search: "binary search (sorted)",
    unique: "Map with custom hash",
  },

  // Large datasets (>10K items)
  LARGE_N: {
    sort: "external sort or streaming",
    search: "indexed search (Map/WeakMap)",
    unique: "probabilistic (Bloom filter)",
  },
} as const;

// ✅ IMPLEMENT: Efficient data structures
class EfficientLookup {
  // Use Map for string/number keys
  private primaryIndex = new Map<string, Item>();

  // Use multiple indexes for different queries
  private secondaryIndex = new Map<string, Map<string, Item>>();

  // Use WeakMap for object keys (prevents memory leaks)
  private weakIndex = new WeakMap<object, Item>();

  // Use Set for membership tests
  private uniqueValues = new Set<string>();
}
```

### Loop Optimization:

```typescript
// ✅ OPTIMIZE: Loops for performance
function processArrayOptimized(array: number[]) {
  // 1. Cache length
  const length = array.length;

  // 2. Use for loop instead of for...of for arrays
  for (let i = 0; i < length; i++) {
    // Direct index access is fastest
    const item = array[i];

    // 3. Minimize work inside loop
    // Move invariant calculations outside
    processItem(item);
  }
}

// ✅ USE: Batch processing
async function processInBatches(
  items: Item[],
  batchSize = 100,
  processBatch: (batch: Item[]) => Promise<void>,
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Process batch without blocking
    await processBatch(batch);

    // Yield to event loop for large batches
    if (i % 1000 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
}
```

## 5. Bundle Size Optimization

### Tree Shaking Requirements:

```typescript
// ✅ STRUCTURE code for optimal tree shaking
// Module structure that enables tree shaking:

// ❌ BAD: Side effects prevent tree shaking
// utils.ts
export const util1 = () => {
  /* ... */
};
export const util2 = () => {
  /* ... */
};

// Side effect at module level!
console.log("Utils loaded"); // ❌ Prevents tree shaking

// ✅ GOOD: Pure modules
// utils.ts - No side effects at module level
export const util1 = () => {
  /* ... */
};
export const util2 = () => {
  /* ... */
};

// Only export what's needed
export { util1, util2 };

// ❌ BAD: Barrel files with wildcards
// index.ts
export * from "./utils"; // ❌ Can't tree shake individual exports
export * from "./api";
export * from "./components";

// ✅ GOOD: Explicit exports
// index.ts
export { util1, util2 } from "./utils";
export { fetchData, postData } from "./api";
export { Button, Input } from "./components";

// Export types separately
export type { User, ApiResponse } from "./types";
```

### Code Splitting Strategy:

```typescript
// ✅ IMPLEMENT: Dynamic imports for code splitting
// Component that loads heavy dependencies lazily
const HeavyComponent = lazy(
  () =>
    import(
      /* webpackChunkName: "heavy-component" */
      "./HeavyComponent"
    ),
);

// Utility that loads only when needed
async function loadAdvancedFeature() {
  // Dynamic import creates separate chunk
  const { advancedAlgorithm } = await import(
    /* webpackChunkName: "advanced-algorithms" */
    "./algorithms/advanced"
  );
  return advancedAlgorithm;
}

// ✅ USE: Route-based splitting
const routes = [
  {
    path: "/dashboard",
    component: lazy(() => import("./Dashboard")),
  },
  {
    path: "/analytics",
    component: lazy(() => import("./Analytics")), // Separate chunk
  },
];
```

## 6. Rendering Performance

### React/Vue Specific Optimizations:

```typescript
// ✅ USE: Memoization effectively
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // Compute expensive value only when dependencies change
  const processedData = useMemo(() => {
    return processExpensively(data);
  }, [data]); // Only recompute when data changes

  // Cache callbacks
  const handleClick = useCallback(() => {
    process(processedData);
  }, [processedData]);

  // Virtualize large lists
  const rowRenderer = useCallback(({ index, style }) => {
    return <div style={style}>{processedData[index]}</div>;
  }, [processedData]);

  return (
    <VirtualList
      height={400}
      rowCount={processedData.length}
      rowHeight={40}
      rowRenderer={rowRenderer}
    />
  );
});

// ✅ AVOID: Unnecessary re-renders
function OptimizedParent({ items }) {
  // Memoize to prevent child re-renders
  const processedItems = useMemo(() => items.map(process), [items]);

  // Extract static parts
  const staticHeader = <Header title="Static Title" />;

  return (
    <div>
      {staticHeader}
      <Child items={processedItems} />
      {/* Inline functions cause re-renders */}
      <BadChild onClick={() => console.log('click')} /> {/* ❌ */}
      <GoodChild onClick={useCallback(() => console.log('click'), [])} /> {/* ✅ */}
    </div>
  );
}
```

## 7. Network and I/O Performance

### Request Optimization:

```typescript
// ✅ IMPLEMENT: Request batching and caching
class OptimizedApiClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private batchQueue = new Map<string, Array<(data: any) => void>>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  async fetchWithCache(url: string): Promise<any> {
    const cached = this.cache.get(url);

    // ✅ Serve from cache if valid
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // ✅ Batch identical requests
    if (this.batchQueue.has(url)) {
      return new Promise((resolve) => {
        this.batchQueue.get(url)!.push(resolve);
      });
    }

    // Create new batch
    const resolvers: Array<(data: any) => void> = [];
    this.batchQueue.set(url, resolvers);

    try {
      const data = await fetch(url);
      const json = await data.json();

      // Cache result
      this.cache.set(url, { data: json, timestamp: Date.now() });

      // Resolve all batched requests
      resolvers.forEach((resolve) => resolve(json));
      return json;
    } finally {
      this.batchQueue.delete(url);
    }
  }
}

// ✅ USE: Request prioritization
const PRIORITY = {
  CRITICAL: 0, // User interaction
  HIGH: 1, // Visible content
  MEDIUM: 2, // Prefetching
  LOW: 3, // Background sync
} as const;

class PriorityQueue {
  private queues = new Map<number, Array<() => Promise<void>>>();

  enqueue(task: () => Promise<void>, priority: number): void {
    if (!this.queues.has(priority)) {
      this.queues.set(priority, []);
    }
    this.queues.get(priority)!.push(task);
    this.process();
  }

  private async process(): Promise<void> {
    // Process higher priority first
    const priorities = Array.from(this.queues.keys()).sort();

    for (const priority of priorities) {
      const queue = this.queues.get(priority)!;

      while (queue.length > 0) {
        const task = queue.shift()!;
        await task();
      }
    }
  }
}
```

## 8. Performance Monitoring

### Instrumentation and Metrics:

```typescript
// ✅ ADD: Performance instrumentation
class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures = new Map<string, number[]>();

  mark(name: string): void {
    if (typeof performance !== "undefined") {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }

  measure(name: string, startMark: string, endMark: string): void {
    if (typeof performance !== "undefined") {
      performance.measure(name, startMark, endMark);

      const measure = performance.getEntriesByName(name)[0];
      if (measure) {
        if (!this.measures.has(name)) {
          this.measures.set(name, []);
        }
        this.measures.get(name)!.push(measure.duration);
      }
    }
  }

  getStats(name: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } {
    const measures = this.measures.get(name) || [];
    if (measures.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    const sum = measures.reduce((a, b) => a + b, 0);
    return {
      avg: sum / measures.length,
      min: Math.min(...measures),
      max: Math.max(...measures),
      count: measures.length,
    };
  }

  // ✅ LOG performance violations
  assertBudget(operation: string, duration: number, budget: number): void {
    if (duration > budget) {
      console.warn(
        `Performance budget exceeded: ${operation} took ${duration}ms, budget was ${budget}ms`,
      );

      // Send to monitoring service in production
      if (process.env.NODE_ENV === "production") {
        sendMetric("performance_violation", {
          operation,
          duration,
          budget,
        });
      }
    }
  }
}
```

## 9. Performance Testing

### Automated Performance Tests:

```typescript
// ✅ WRITE: Performance regression tests
describe("performance regression tests", () => {
  const BASELINE = {
    process_1000_items: 50, // ms
    render_large_list: 100, // ms
    bundle_size: 15000, // bytes
  };

  it("should not regress in processing speed", () => {
    const items = generateTestData(1000);
    const start = performance.now();
    processItems(items);
    const duration = performance.now() - start;

    // Allow 20% degradation before failing
    const maxAllowed = BASELINE.process_1000_items * 1.2;
    expect(duration).toBeLessThan(maxAllowed);

    // Log for tracking
    console.log(
      `Processing 1000 items: ${duration}ms (baseline: ${BASELINE.process_1000_items}ms)`,
    );
  });

  it("should maintain bundle size budget", () => {
    const bundleSize = getCurrentBundleSize();
    const maxAllowed = BASELINE.bundle_size * 1.1; // 10% increase allowed

    expect(bundleSize).toBeLessThan(maxAllowed);
    console.log(
      `Bundle size: ${bundleSize} bytes (budget: ${maxAllowed} bytes)`,
    );
  });

  it("should not cause memory leaks", async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;

    // Stress test
    for (let i = 0; i < 100; i++) {
      await simulateUserSession();
    }

    // Force GC if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const increase = finalMemory - initialMemory;

    // Allow up to 10MB increase for test run
    expect(increase).toBeLessThan(10 * 1024 * 1024);
  });
});
```

## Checklist Before Submission:

### Runtime Performance:

- [ ] All operations meet frame budget (16ms for 60fps)
- [ ] No unnecessary allocations in hot paths
- [ ] Algorithms chosen appropriately for data size
- [ ] Memory usage tracked and within budget
- [ ] Garbage collection optimized (WeakMap/WeakSet where appropriate)

### Bundle Size:

- [ ] Bundle size measured and within budget
- [ ] Tree shaking enabled (no module-level side effects)
- [ ] Code splitting implemented for large features
- [ ] Unused code eliminated from production bundle

### Network Performance:

- [ ] Requests batched where possible
- [ ] Caching implemented for repeat requests
- [ ] Assets optimized (compression, lazy loading)
- [ ] Critical path minimized

### Monitoring:

- [ ] Performance instrumentation added to critical paths
- [ ] Budget violations logged and alerted
- [ ] Performance tests cover critical user journeys
- [ ] Metrics tracked for regression detection

### Testing:

- [ ] Performance regression tests implemented
- [ ] Load tests for data-intensive operations
- [ ] Memory leak tests for long-running features
- [ ] Bundle size tracked in CI/CD

### Optimization Validation:

- [ ] Measurements taken before and after optimizations
- [ ] No premature optimization (profile first)
- [ ] Optimizations justified with data
- [ ] Trade-offs documented (readability vs performance)

---

**Remember:** Performance is a feature. Every user experiences it. Write code that's not just correct, but also fast and efficient. Measure constantly, optimize strategically, and always validate that optimizations actually help.
