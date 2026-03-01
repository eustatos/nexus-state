## Task 7: Implement Proper Snapshot Comparison (compareSnapshots)

**Filename:** `task-007-implement-snapshot-comparison.md`

### Context

The `compareSnapshots` method in `SimpleTimeTravel` currently returns `undefined` with a comment "compare not implemented in SnapshotCreator". This is a critical missing feature for debugging, time travel visualization, and understanding state changes. Need a comprehensive comparison system that can diff snapshots at both atom and value levels.

### Current Problem

```typescript
// Current placeholder implementation
compareSnapshots(a: Snapshot, b: Snapshot) {
  // compare not implemented in SnapshotCreator
  return undefined;
}
```

### Requirements

1. **Create Comparison Result Types**

```typescript
interface SnapshotComparison {
  id: string;
  timestamp: number;
  summary: ComparisonSummary;
  atoms: AtomComparison[];
  statistics: ComparisonStats;
  metadata: ComparisonMetadata;
}

interface ComparisonSummary {
  totalAtoms: number;
  changedAtoms: number;
  addedAtoms: number;
  removedAtoms: number;
  unchangedAtoms: number;
  hasChanges: boolean;
  changePercentage: number;
}

interface AtomComparison {
  atomId: string;
  atomName: string;
  atomType: "primitive" | "computed" | "writable";
  status: "added" | "removed" | "modified" | "unchanged";

  // Value comparison
  oldValue?: any;
  newValue?: any;
  valueDiff?: ValueDiff;

  // Metadata comparison
  oldMetadata?: SnapshotStateEntry;
  newMetadata?: SnapshotStateEntry;
  metadataChanges?: string[];

  // Nested changes (for objects)
  nestedChanges?: NestedChange[];

  // Path in state tree
  path?: string[];
}

interface ValueDiff {
  type: "primitive" | "array" | "object" | "function" | "circular";
  equal: boolean;

  // For primitives
  oldPrimitive?: any;
  newPrimitive?: any;

  // For arrays
  arrayChanges?: {
    added: number[];
    removed: number[];
    moved: number[];
    modified: Array<{ index: number; diff: ValueDiff }>;
  };

  // For objects
  objectChanges?: Record<string, ValueDiff>;

  // For circular references
  circularPath?: string[];
}

interface ComparisonStats {
  duration: number; // ms to compute comparison
  memoryUsed: number; // bytes
  depth: number; // maximum depth traversed
  totalComparisons: number;
  cacheHits: number;
  cacheMisses: number;
}

interface ComparisonMetadata {
  snapshotA: {
    id: string;
    timestamp: number;
    action?: string;
  };
  snapshotB: {
    id: string;
    timestamp: number;
    action?: string;
  };
  timeDifference: number; // ms between snapshots
  options: ComparisonOptions;
}
```

2. **Implement Comparison Engine**

```typescript
export class SnapshotComparator {
  private cache: Map<string, CachedComparison> = new Map();
  private valueComparator: ValueComparator;
  private options: ComparisonOptions;

  constructor(options?: Partial<ComparisonOptions>) {
    this.options = {
      deepCompare: true,
      maxDepth: 100,
      compareMetadata: true,
      cacheResults: true,
      cacheSize: 100,
      ignoreFunctions: false,
      ignoreSymbols: false,
      circularHandling: "path",
      ...options,
    };

    this.valueComparator = new ValueComparator(this.options);
  }

  compare(
    a: Snapshot,
    b: Snapshot,
    options?: Partial<ComparisonOptions>,
  ): SnapshotComparison {
    const startTime = Date.now();
    const memoryBefore = process.memoryUsage?.().heapUsed || 0;

    // Check cache
    const cacheKey = this.generateCacheKey(a, b, options);
    if (this.options.cacheResults && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      cached.stats.cacheHits++;
      return cached.comparison;
    }

    // Find all atom names from both snapshots
    const allAtomNames = new Set([
      ...Object.keys(a.state),
      ...Object.keys(b.state),
    ]);

    const atoms: AtomComparison[] = [];
    let comparisons = 0;

    // Compare each atom
    for (const atomName of allAtomNames) {
      comparisons++;
      const entryA = a.state[atomName];
      const entryB = b.state[atomName];

      const atomComparison = this.compareAtom(atomName, entryA, entryB);
      atoms.push(atomComparison);
    }

    // Calculate summary
    const summary = this.calculateSummary(atoms);

    // Calculate statistics
    const memoryAfter = process.memoryUsage?.().heapUsed || 0;
    const stats: ComparisonStats = {
      duration: Date.now() - startTime,
      memoryUsed: memoryAfter - memoryBefore,
      depth: this.valueComparator.getMaxDepth(),
      totalComparisons: comparisons,
      cacheHits: 0,
      cacheMisses: 1,
    };

    const comparison: SnapshotComparison = {
      id: generateId(),
      timestamp: Date.now(),
      summary,
      atoms,
      statistics: stats,
      metadata: {
        snapshotA: {
          id: a.id,
          timestamp: a.metadata.timestamp,
          action: a.metadata.action,
        },
        snapshotB: {
          id: b.id,
          timestamp: b.metadata.timestamp,
          action: b.metadata.action,
        },
        timeDifference: Math.abs(a.metadata.timestamp - b.metadata.timestamp),
        options: this.options,
      },
    };

    // Cache result
    if (this.options.cacheResults) {
      this.cache.set(cacheKey, {
        comparison,
        timestamp: Date.now(),
        stats: { cacheHits: 0, cacheMisses: 1 },
      });

      // Limit cache size
      if (this.cache.size > this.options.cacheSize!) {
        const oldestKey = this.findOldestCacheKey();
        this.cache.delete(oldestKey);
      }
    }

    return comparison;
  }

  private compareAtom(
    atomName: string,
    entryA?: SnapshotStateEntry,
    entryB?: SnapshotStateEntry,
  ): AtomComparison {
    // Handle added/removed atoms
    if (!entryA && entryB) {
      return {
        atomId: entryB.atomId,
        atomName,
        atomType: entryB.type,
        status: "added",
        newValue: entryB.value,
        oldMetadata: undefined,
        newMetadata: entryB,
      };
    }

    if (entryA && !entryB) {
      return {
        atomId: entryA.atomId,
        atomName,
        atomType: entryA.type,
        status: "removed",
        oldValue: entryA.value,
        oldMetadata: entryA,
        newMetadata: undefined,
      };
    }

    // Compare existing atoms
    if (entryA && entryB) {
      const valueEqual = this.valueComparator.areEqual(
        entryA.value,
        entryB.value,
      );
      const metadataEqual = this.compareMetadata(entryA, entryB);

      if (!valueEqual || !metadataEqual) {
        return {
          atomId: entryB.atomId,
          atomName,
          atomType: entryB.type,
          status: "modified",
          oldValue: entryA.value,
          newValue: entryB.value,
          valueDiff: this.valueComparator.diff(entryA.value, entryB.value),
          oldMetadata: entryA,
          newMetadata: entryB,
          metadataChanges: metadataEqual
            ? undefined
            : this.getMetadataChanges(entryA, entryB),
        };
      }
    }

    // Unchanged
    return {
      atomId: entryA?.atomId || entryB?.atomId || "",
      atomName,
      atomType: entryA?.type || entryB?.type || "primitive",
      status: "unchanged",
    };
  }

  private calculateSummary(atoms: AtomComparison[]): ComparisonSummary {
    const totalAtoms = atoms.length;
    const changedAtoms = atoms.filter((a) => a.status !== "unchanged").length;
    const addedAtoms = atoms.filter((a) => a.status === "added").length;
    const removedAtoms = atoms.filter((a) => a.status === "removed").length;
    const unchangedAtoms = atoms.filter((a) => a.status === "unchanged").length;

    return {
      totalAtoms,
      changedAtoms,
      addedAtoms,
      removedAtoms,
      unchangedAtoms,
      hasChanges: changedAtoms > 0,
      changePercentage: totalAtoms > 0 ? (changedAtoms / totalAtoms) * 100 : 0,
    };
  }
}
```

3. **Implement Value Comparator with Deep Diff**

```typescript
export class ValueComparator {
  private depth: number = 0;
  private seen: WeakMap<object, string> = new WeakMap();

  constructor(private options: ComparisonOptions) {}

  areEqual(a: any, b: any, currentDepth: number = 0): boolean {
    if (currentDepth > this.options.maxDepth!) {
      return true; // Assume equal beyond max depth
    }

    this.depth = Math.max(this.depth, currentDepth);

    // Handle primitives
    if (Object.is(a, b)) return true;

    // Handle null/undefined
    if (a == null || b == null) return a === b;

    // Handle types
    if (typeof a !== typeof b) return false;

    // Handle circular references
    if (typeof a === "object") {
      if (this.seen.has(a) || this.seen.has(b)) {
        return this.seen.get(a) === this.seen.get(b);
      }

      const refId = `ref_${Math.random()}`;
      this.seen.set(a, refId);
      this.seen.set(b, refId);
    }

    // Handle different types
    if (a.constructor !== b.constructor) return false;

    // Handle specific types
    if (a instanceof Date) return a.getTime() === b.getTime();
    if (a instanceof RegExp) return a.toString() === b.toString();
    if (a instanceof Map) return this.areMapsEqual(a, b, currentDepth + 1);
    if (a instanceof Set) return this.areSetsEqual(a, b, currentDepth + 1);
    if (Array.isArray(a)) return this.areArraysEqual(a, b, currentDepth + 1);

    // Handle objects
    return this.areObjectsEqual(a, b, currentDepth + 1);
  }

  diff(a: any, b: any, path: string[] = []): ValueDiff {
    // Implementation of detailed diff structure
    // Returns nested changes with paths
  }

  getMaxDepth(): number {
    return this.depth;
  }
}
```

4. **Add Formatters for Human-Readable Output**

```typescript
export class ComparisonFormatter {
  format(
    comparison: SnapshotComparison,
    format: "detailed" | "summary" | "json",
  ): string {
    switch (format) {
      case "summary":
        return this.formatSummary(comparison);
      case "detailed":
        return this.formatDetailed(comparison);
      case "json":
        return JSON.stringify(comparison, null, 2);
    }
  }

  private formatSummary(comparison: SnapshotComparison): string {
    const lines = [
      "=== Snapshot Comparison ===",
      `Time difference: ${comparison.metadata.timeDifference}ms`,
      `Total atoms: ${comparison.summary.totalAtoms}`,
      `Changed: ${comparison.summary.changedAtoms} (${comparison.summary.changePercentage.toFixed(1)}%)`,
      `  ├─ Added: ${comparison.summary.addedAtoms}`,
      `  ├─ Removed: ${comparison.summary.removedAtoms}`,
      `  └─ Modified: ${comparison.summary.changedAtoms - comparison.summary.addedAtoms - comparison.summary.removedAtoms}`,
      `Computed in: ${comparison.statistics.duration}ms`,
    ];

    return lines.join("\n");
  }

  private formatDetailed(comparison: SnapshotComparison): string {
    // Detailed format with color coding for CLI
  }
}
```

### Integration with TimeTravelAPI

```typescript
interface TimeTravelAPI {
  // Replace placeholder
  compareSnapshots(a: Snapshot | string, b: Snapshot | string, options?: ComparisonOptions): SnapshotComparison;

  // New methods
  compareWithCurrent(snapshot: Snapshot | string): SnapshotComparison;
  getDiffSince(action?: string): SnapshotComparison;
  visualizeChanges(comparison: SnapshotComparison, format?: 'tree' | 'list'): string;
  exportComparison(comparison: SnapshotComparison, format: 'json' | 'html' | 'md'): string;
}

// Implementation in SimpleTimeTravel
compareSnapshots(
  a: Snapshot | string,
  b: Snapshot | string,
  options?: Partial<ComparisonOptions>
): SnapshotComparison {
  const snapshotA = typeof a === 'string' ? this.getSnapshotById(a) : a;
  const snapshotB = typeof b === 'string' ? this.getSnapshotById(b) : b;

  if (!snapshotA || !snapshotB) {
    throw new Error('Invalid snapshot reference');
  }

  return this.comparator.compare(snapshotA, snapshotB, options);
}
```

### Testing Requirements

1. **Basic Comparisons**

```typescript
test("should detect added atoms", () => {
  const snapshot1 = createSnapshot({});
  const snapshot2 = createSnapshot({ counter: 1 });

  const result = comparator.compare(snapshot1, snapshot2);
  expect(result.summary.addedAtoms).toBe(1);
  expect(result.atoms[0].status).toBe("added");
});

test("should detect removed atoms", () => {
  const snapshot1 = createSnapshot({ counter: 1 });
  const snapshot2 = createSnapshot({});

  const result = comparator.compare(snapshot1, snapshot2);
  expect(result.summary.removedAtoms).toBe(1);
});

test("should detect modified values", () => {
  const snapshot1 = createSnapshot({ counter: 1 });
  const snapshot2 = createSnapshot({ counter: 2 });

  const result = comparator.compare(snapshot1, snapshot2);
  expect(result.summary.changedAtoms).toBe(1);
  expect(result.atoms[0].valueDiff).toBeDefined();
});
```

2. **Complex Value Comparisons**

```typescript
test("should deep compare nested objects", () => {
  const snapshot1 = createSnapshot({ user: { name: "John", age: 30 } });
  const snapshot2 = createSnapshot({ user: { name: "John", age: 31 } });

  const result = comparator.compare(snapshot1, snapshot2);
  expect(result.atoms[0].valueDiff?.objectChanges?.age).toBeDefined();
});

test("should handle circular references", () => {
  const obj: any = { name: "circular" };
  obj.self = obj;

  const snapshot1 = createSnapshot({ data: obj });
  const snapshot2 = createSnapshot({ data: obj });

  const result = comparator.compare(snapshot1, snapshot2);
  expect(result.atoms[0].valueDiff?.circularPath).toBeDefined();
});
```

3. **Performance Tests**

```typescript
test("should compare large snapshots efficiently", () => {
  const largeSnapshot1 = createLargeSnapshot(1000);
  const largeSnapshot2 = createLargeSnapshot(1000, { modifyEvery: 10 });

  const start = Date.now();
  const result = comparator.compare(largeSnapshot1, largeSnapshot2);
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(100); // Less than 100ms for 1000 atoms
  expect(result.statistics.cacheHits).toBe(0);
});
```

### Configuration Options

```typescript
interface ComparisonOptions {
  deepCompare: boolean; // Deep compare objects
  maxDepth: number; // Maximum depth for deep comparison
  compareMetadata: boolean; // Include metadata in comparison
  cacheResults: boolean; // Cache comparison results
  cacheSize: number; // Maximum cache entries
  ignoreFunctions: boolean; // Skip function comparison
  ignoreSymbols: boolean; // Skip symbol comparison
  circularHandling: "error" | "path" | "ignore"; // How to handle circular refs
  valueEquality: "strict" | "loose" | "json"; // Equality check method
  colorize: boolean; // Colorize output in console
}
```

### Definition of Done

- [ ] SnapshotComparator implemented with all features
- [ ] ValueComparator with deep diff working
- [ ] ComparisonFormatter for multiple output formats
- [ ] Integration with TimeTravelAPI
- [ ] Cache system working with size limits
- [ ] All test scenarios passing
- [ ] Performance benchmarks meeting targets
- [ ] Documentation with examples
- [ ] CLI tool for comparing snapshots
- [ ] Integration with visualization tools

### SPR Requirements

- Single responsibility: comparator only compares, formatter only formats
- Open/closed: easy to add new comparison strategies
- Clean separation between comparison and storage
- Immutable comparison results
- Proper error handling for edge cases
- Efficient caching without memory leaks

---

**Note:** After completion, provide examples of comparison outputs and performance benchmarks for different snapshot sizes. Include guidance on interpreting comparison results.
