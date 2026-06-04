---
title: 'Time-Travel Debugging in State Management: Part 2 — Performance & Advanced Topics'
description: 'Deep dive into time-travel optimization: Delta compression, serialization, benchmark comparisons, and turning debugging tools into user-facing features.'
published: true
tags: javascript, typescript, performance, statemanagement
cover:
  alt: Performance benchmark comparison chart for cloning methods
---

> **📖 Series:** Time-Travel Debugging in State Management (Part 2 of 3)
>
> Memory optimization, navigation, transactionality, and UX

## Introduction

**Imagine:** your application uses time-travel — for debugging or as a user feature. After 50 changes, problems start: 500MB memory, 200ms undo/redo delay.

Sound familiar? This article covers **advanced optimization techniques** used in production applications:

- Delta compression (up to 90% memory savings)
- Batching (change grouping)
- Smart navigation algorithms
- Transactional restoration
- Turning time-travel from debugging tool into a **UX feature**

> **📖 From Part 1:** We covered architectural patterns (Command, Snapshot, Delta, Hybrid). In this part, we dive into optimization and performance.

> **💡 Note:** Examples use `SimpleTimeTravel` from Nexus State for demonstration. For other libraries (Zustand, Redux, Jotai), use similar patterns — change tracking + snapshot array + navigation. API may differ, but concepts are universal.

> **💡 Note:** Optimizations in this article apply to both scenarios — debugging AND user-facing undo/redo.

## Memory Optimization: Delta Snapshots

### The Memory Problem

With full snapshots, memory grows linearly:

```plaintext
State: 100KB
History: 50 snapshots
Memory: 100KB × 50 = 5MB
```

![Visual comparison](https://habrastorage.org/webt/0d/kr/l2/0dkrl2wj06q2jw1unvsbrv9-lra.png)

### Solution: Delta Compression

```typescript
interface DeltaSnapshot {
  id: string;
  type: 'delta';
  baseSnapshotId: string;
  changes: Record<
    string,
    {
      oldValue: any;
      newValue: any;
    }
  >;
  timestamp: number;
  metadata: {
    changedAtoms: string[];
    deltaSize: number;
  };
}
```

### Delta Calculation Algorithm

```typescript
class DeltaCalculator {
  computeDelta(base: Snapshot, target: Snapshot): DeltaSnapshot | null {
    const changes: Record<string, any> = {};
    let hasChanges = false;

    for (const [key, entry] of Object.entries(target.state)) {
      const baseEntry = base.state[key];

      if (!deepEqual(baseEntry?.value, entry.value)) {
        changes[key] = {
          oldValue: baseEntry?.value,
          newValue: entry.value,
        };
        hasChanges = true;
      }
    }

    if (!hasChanges) return null;

    return {
      id: generateId(),
      type: 'delta',
      baseSnapshotId: base.id,
      changes,
      timestamp: target.metadata.timestamp,
      metadata: {
        changedAtoms: Object.keys(changes),
        deltaSize: Object.keys(changes).length,
      },
    };
  }
}
```

### Efficiency

```plaintext
Scenario: Form with 50 fields, 1-2 fields change at a time

Full Snapshots: 50 × 50KB = 2.5MB
Delta Snapshots: 50KB + (49 × 2KB) = 148KB
Savings: ~94%
```

## Batching: Grouping Changes

### The Problem

User fills a 5-field form. Each change creates a snapshot:

```typescript
// Without batching: 5 snapshots
store.set(form.name, 'John'); // Snapshot 1
store.set(form.email, 'john@'); // Snapshot 2
store.set(form.email, 'john@ex'); // Snapshot 3
// ... and so on
```

**Result:** 5 snapshots instead of 1, history fills 5x faster.

### Solution

```typescript
class BatchManager {
  private isBatching = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  batch<T>(updateFn: () => T, actionName: string, debounceMs = 0): T {
    if (this.isBatching) return updateFn();

    this.isBatching = true;

    try {
      const result = updateFn();

      if (debounceMs > 0) {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          timeTravel.capture(actionName);
          this.isBatching = false;
        }, debounceMs);
      } else {
        timeTravel.capture(actionName);
        this.isBatching = false;
      }

      return result;
    } catch (error) {
      this.isBatching = false;
      throw error;
    }
  }
}

// Usage
batchManager.batch(() => {
  store.set(form.name, 'John');
  store.set(form.email, 'john@example.com');
  store.set(form.age, 25);
}, 'form-update');
// → One snapshot for all three changes
```

### When to Use

| Approach             | Use when                | Example                      |
| -------------------- | ----------------------- | ---------------------------- |
| **Batch**            | Known number of changes | Form, profile update         |
| **Debounce**         | Frequent changes        | Text input, scroll           |
| **Batch + Debounce** | Combined                | Code editor, validated forms |

## Snapshot Comparison

### Why Compare?

1. **Visualization** — Diff View for users
2. **Optimization** — Compute only changed parts
3. **Analysis** — Understand what changed between versions

### Comparison Algorithm

```typescript
interface ComparisonResult {
  added: string[];
  removed: string[];
  changed: { key: string; oldValue: any; newValue: any }[];
  unchanged: string[];
  similarity: number; // 0-1
}

class SnapshotComparator {
  compare(a: Snapshot, b: Snapshot): ComparisonResult {
    const result: ComparisonResult = {
      added: [],
      removed: [],
      changed: [],
      unchanged: [],
      similarity: 0,
    };

    const allKeys = new Set([...Object.keys(a.state), ...Object.keys(b.state)]);

    for (const key of allKeys) {
      const aHas = key in a.state;
      const bHas = key in b.state;

      if (!aHas && bHas) {
        result.added.push(key);
      } else if (aHas && !bHas) {
        result.removed.push(key);
      } else if (!deepEqual(a.state[key], b.state[key])) {
        result.changed.push({
          key,
          oldValue: a.state[key],
          newValue: b.state[key],
        });
      } else {
        result.unchanged.push(key);
      }
    }

    result.similarity = 1 - result.changed.length / allKeys.size;
    return result;
  }
}
```

### Optimization Use Case

```typescript
// Restore only changes
function restoreChangesOnly(comparison: ComparisonResult) {
  for (const { key, newValue } of comparison.changed) {
    if (newValue !== undefined) store.set(key, newValue);
  }
  for (const key of comparison.added) {
    store.set(key /* newValue */);
  }
  for (const key of comparison.removed) {
    store.delete(key);
  }
}

// Savings: 67% (25.1ms → 8.3ms for 100 atoms)
```

## Serialization & Persistence

### JSON.stringify Problems

Standard serialization doesn't work with complex types:

```typescript
const state = {
  date: new Date(), // → ISO string (loses type)
  map: new Map([['a', 1]]), // → {} (loses data)
  set: new Set([1, 2]), // → {} (loses data)
  sparse: [1, , 3], // → [1, null, 3] (loses "hole")
  typed: new Uint8Array([1, 2, 3]), // → {} (loses data)
  circular: null,
};
state.circular = state; // ❌ TypeError: Circular structure
```

### Custom Revivers

```typescript
const customStringifier = (key: string, value: any): any => {
  if (value instanceof Date)
    return { __type: 'date', value: value.toISOString() };
  if (value instanceof Map)
    return { __type: 'map', value: Array.from(value.entries()) };
  if (value instanceof Set) return { __type: 'set', value: Array.from(value) };
  if (value === undefined) return { __type: 'undefined' };
  return value;
};

const customReviver = (key: string, value: any): any => {
  if (value?.__type) {
    switch (value.__type) {
      case 'date':
        return new Date(value.value);
      case 'map':
        return new Map(value.value);
      case 'set':
        return new Set(value.value);
      case 'undefined':
        return undefined;
    }
  }
  return value;
};
```

### Advanced Types

```typescript
const advancedStringifier = (key, value) => {
  // BigInt
  if (typeof value === 'bigint') {
    return { __type: 'bigint', value: value.toString() };
  }
  // RegExp
  if (value instanceof RegExp) {
    return { __type: 'regexp', source: value.source, flags: value.flags };
  }
  // URL
  if (value instanceof URL) {
    return { __type: 'url', href: value.href };
  }
  // ArrayBuffer
  if (value instanceof ArrayBuffer) {
    return { __type: 'array-buffer', data: Array.from(new Uint8Array(value)) };
  }
  return value;
};
```

### Deep Equality for Map/Set

```typescript
function deepEqual(a, b): boolean {
  if (a === b) return true;

  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, value] of a) {
      if (!b.has(key) || !deepEqual(value, b.get(key))) return false;
    }
    return true;
  }

  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const value of a) {
      if (!b.has(value)) return false;
    }
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return a === b;
}
```

### Circular References

```typescript
function safeStringify(obj, indent = 2) {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    },
    indent
  );
}
```

### Type Support Table

| Type                  | Serialization              | Comparison   | Notes                    |
| --------------------- | -------------------------- | ------------ | ------------------------ |
| string/number/boolean | ✅                         | ✅           | NaN, Infinity, -0        |
| undefined             | ⚠️ `{ __type }`            | ✅           | Lost in JSON             |
| Object/Array          | ✅                         | ✅           | Key order, sparse arrays |
| Date                  | ✅ `{ __type }`            | ✅ timestamp |                          |
| Map/Set               | ✅ entries                 | ✅ recursion | Object keys              |
| WeakMap/WeakSet       | ❌                         | ❌           | Replace with Map/Set     |
| RegExp                | ✅ `{ source, flags }`     | ✅           |                          |
| BigInt                | ✅ `{ __type }`            | ✅           |                          |
| URL                   | ✅ `{ href }`              | ✅           |                          |
| TypedArray            | ✅ `{ constructor, data }` | ✅           | 8 types                  |
| ArrayBuffer           | ✅ data array              | ✅           |                          |
| Promise               | ❌                         | ❌           | Async                    |
| Blob/File             | ⚠️ base64                  | ✅ size+type | Large                    |
| Function              | ❌                         | ❌           | Not serializable         |
| Circular ref          | ✅ WeakSet                 | ✅ WeakMap   |                          |

---

## Performance: stringify vs deepClone

For creating snapshots, you need to clone objects. Let's compare approaches:

### Benchmark (real data)

> **Methodology:** Node 20.19.4, macOS x64. Testing on real data with nested objects, Map, Set, Date, TypedArray (~765KB). [Benchmark source code](https://gist.github.com/eustatos/a69ecdeb29f25d5798e1bceaed20cbaf) (GitHub Gist).

```plaintext
┌──────────────────────┬────────────┬────────────┬──────────────┬─────────┐
│ Method               │ Time (ms)  │ Avg (ms)   │ Memory       │ Tests   │
├──────────────────────┼────────────┼────────────┼──────────────┼─────────┤
│ JSON.stringify       │ 16491.61   │ 16.492     │ 192%         │ 3/7 ✅  │
│ structuredClone      │ 19956.35   │ 19.956     │ 58%          │ 7/7 ✅  │
│ deepClone (custom)   │ 7369.91    │ 7.370      │ 125%         │ 7/7 ✅  │
│ lodash cloneDeep     │ 20419.67   │ 20.420     │ 101%         │ 7/7 ✅  │
└──────────────────────┴────────────┴────────────┴──────────────┴─────────┘

🏆 Fastest: deepClone (custom) — 2-3x faster for large data
```

> **Note:** Results vary by data size, structure, and environment. For small objects (<100KB), structuredClone is usually faster. For large data (>500KB), custom deepClone shows better performance.

### Recommendations

| Scenario                | Method               | Why                     |
| ----------------------- | -------------------- | ----------------------- |
| **Large data (>500KB)** | `deepClone (custom)` | 2-3x faster             |
| **Small data (<100KB)** | `structuredClone()`  | Fast, built-in          |
| **Memory efficiency**   | `structuredClone()`  | 58% memory              |
| **Prototyping**         | `JSON.stringify`     | Simple, but loses types |
| **Avoid**               | `lodash cloneDeep`   | Slow + 24KB bundle      |

## Navigation Algorithms

### Undo/Redo with Two Stacks

![Navigation Algorithm](https://habrastorage.org/webt/7t/vr/gk/7tvrgkc_303893hgcy5cbq2fbta.png)

```typescript
class HistoryNavigator {
  private past: Snapshot[] = [];
  private future: Snapshot[] = [];
  private current: Snapshot | null = null;

  undo(): Snapshot | null {
    if (this.past.length === 0) return null;
    if (this.current) this.future.unshift(this.current);
    this.current = this.past.pop()!;
    return this.current;
  }

  redo(): Snapshot | null {
    if (this.future.length === 0) return null;
    if (this.current) this.past.push(this.current);
    this.current = this.future.shift()!;
    return this.current;
  }

  jumpTo(index: number): Snapshot | null {
    const all = [...this.past, this.current, ...this.future].filter(
      Boolean
    ) as Snapshot[];
    if (index < 0 || index >= all.length) return null;
    this.past = all.slice(0, index);
    this.future = all.slice(index + 1);
    this.current = all[index];
    return this.current;
  }
}
```

### Operation Complexity

| Operation   | Complexity |
| ----------- | ---------- |
| `undo()`    | O(1)       |
| `redo()`    | O(1)       |
| `jumpTo(n)` | O(n)       |

## Transactionality

### The Problem

During restoration, errors can occur: atom doesn't exist, type changed, side effects.

### Solution

```typescript
class TransactionalRestorer {
  async restoreWithTransaction(snapshot: Snapshot): Promise<{
    success: boolean;
    restored: string[];
    failed: string[];
    rolledBack: boolean;
  }> {
    const checkpoint = this.saveCurrentState();
    const restored: string[] = [];
    const failed: string[] = [];

    try {
      for (const [key, entry] of Object.entries(snapshot.state)) {
        try {
          await this.restoreAtom(key, entry);
          restored.push(key);
        } catch {
          failed.push(key);
          await this.rollback(checkpoint);
          return { success: false, restored, failed, rolledBack: true };
        }
      }
      return {
        success: failed.length === 0,
        restored,
        failed,
        rolledBack: false,
      };
    } catch (error) {
      await this.rollback(checkpoint);
      return { success: false, restored: [], failed: [], rolledBack: true };
    }
  }

  private saveCurrentState() {
    /* ... */
  }
  private async rollback(checkpoint: any) {
    /* ... */
  }
}
```

## Performance Issues

### 1. Memory Consumption

```typescript
// LRU cleanup
class LRUHistoryCleaner {
  cleanup(history: Snapshot[], maxHistory = 50): Snapshot[] {
    if (history.length <= maxHistory) return history;
    return history.slice(history.length - maxHistory);
  }
}

// TTL cleanup
class TTLHistoryCleaner {
  cleanup(history: Snapshot[], ttl = 300000): Snapshot[] {
    const now = Date.now();
    return history.filter((s) => now - s.timestamp < ttl);
  }
}
```

### 2. Comparison Performance

```typescript
// Structural equality for immutable
function structuralEqual(a: any, b: any): boolean {
  return a === b; // For immutable, reference check is enough
}

// Lazy comparison with cache
class LazyComparator {
  private cache = new Map<string, boolean>();

  isEqual(a: any, b: any, path: string): boolean {
    const key = `${path}:${hashCode(a)}:${hashCode(b)}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
    const result = deepEqual(a, b);
    this.cache.set(key, result);
    return result;
  }
}
```

### 3. UI Blocking

```typescript
// Chunked restoration
async function chunkedRestore(snapshot: Snapshot, chunkSize = 10) {
  const entries = Object.entries(snapshot.state);
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);
    for (const [key, value] of chunk) {
      await restoreAtom(key, value);
    }
    await new Promise((resolve) => setTimeout(resolve, 0)); // Let UI update
  }
}

// RequestIdleCallback
function idleCallbackRestore(snapshot: Snapshot) {
  const restoreChunk = (deadline?: IdleDeadline) => {
    if (!deadline || deadline.timeRemaining() > 0) {
      restoreNextChunk();
      if (hasMoreChunks()) requestIdleCallback(restoreChunk);
    } else {
      requestIdleCallback(restoreChunk);
    }
  };
  requestIdleCallback(restoreChunk);
}
```

## Time-Travel as User-Facing Feature

### Evolution

```plaintext
2015-2020: "Developer Tool"
    └─ Redux DevTools, debugging only

2020+: "UX Competitive Advantage"
    └─ Undo/Redo, version history, visible value
```

### Production Examples

| Application     | Feature         | Value               |
| --------------- | --------------- | ------------------- |
| **Google Docs** | 30-day history  | Version restoration |
| **Figma**       | Version history | Design comparison   |
| **Notion**      | Page history    | Change rollback     |
| **VS Code**     | Timeline view   | Local history       |

### Technical Requirements

| Requirement | Debugging  | UX              |
| ----------- | ---------- | --------------- |
| Depth       | 20-50      | 100-1000+       |
| Persistence | Memory     | localStorage/DB |
| Performance | Background | Non-blocking    |
| Hotkeys     | No         | Ctrl+Z / Ctrl+Y |

### Implementation Patterns

#### Undo/Redo

```typescript
// Universal pattern (works for any library)
function useUndoRedo(timeTravel: TimeTravel) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          timeTravel.redo();
        } else {
          timeTravel.undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timeTravel]);
}

// Nexus State: new SimpleTimeTravel(store)
// Zustand: createZustandTimeTravel(store) — pseudo-code
// Redux: enhanceStoreWithTimeTravel(store) — pseudo-code
// Jotai: createTimeTravelProvider(store) — pseudo-code
```

#### Version History

```typescript
interface UserVersion {
  id: string;
  name: string; // "Draft 1"
  timestamp: number;
  snapshotId: string;
}

function saveVersion(name: string) {
  const snapshot = timeTravel.capture(name);
  saveToDatabase({
    id: uuid(),
    name,
    timestamp: Date.now(),
    snapshotId: snapshot.id,
  });
}

// For different libraries:
// - Nexus State: timeTravel.capture(name)
// - Zustand: timeTravel.saveSnapshot(name) — pseudo-code
// - Redux: dispatch(saveSnapshot(name)) — pseudo-code
```

### Implementation Checklist

- [ ] Hotkeys (Ctrl+Z / Ctrl+Y)
- [ ] Visible UI (undo/redo buttons)
- [ ] Availability indicators (disabled when unavailable)
- [ ] Version history (with names)
- [ ] Fast restoration (<100ms)
- [ ] Auto-save (localStorage / DB)
- [ ] Version export
- [ ] Version comparison (diff view)

## Adapting for Your Library

**Time-travel is a universal pattern.** Here's how to implement it with different libraries:

| Library         | Solution           | Example                               |
| --------------- | ------------------ | ------------------------------------- |
| **Nexus State** | `SimpleTimeTravel` | `new SimpleTimeTravel(store)`         |
| **Zustand**     | Middleware         | `createTimeTravelMiddleware(store)`\* |
| **Redux**       | Store enhancer     | `enhanceStoreWithTimeTravel(store)`\* |
| **Jotai**       | Provider           | `createTimeTravelProvider(store)`\*   |
| **MobX**        | Reaction           | `autorun(() => saveSnapshot())`       |
| **Vue/Pinia**   | Plugin             | `app.use(timeTravelPlugin)`           |

> \*Examples marked as pseudo-code — implement for your library by analogy.

**Universal pattern for all:**

```typescript
// 1. Create snapshot storage
const history: Snapshot[] = [];
let currentIndex = -1;

// 2. Track changes
store.subscribe((newState) => {
  history.push({ state: newState, timestamp: Date.now() });
  currentIndex++;
});

// 3. Implement navigation
function undo() {
  if (currentIndex > 0) {
    currentIndex--;
    store.setState(history[currentIndex].state);
  }
}

function redo() {
  if (currentIndex < history.length - 1) {
    currentIndex++;
    store.setState(history[currentIndex].state);
  }
}
```

## Conclusion

### Key Takeaways

1. **Memory optimization is critical:** Delta compression saves up to 90%
2. **Batching solves frequent snapshot problem:** 5 changes → 1 snapshot
3. **Serialization needed for production:** localStorage for small, IndexedDB for large
4. **Transactionality ensures reliability:** Rollback on errors
5. **Dual nature:** Debugging → UX feature

## 🤔 Food for Thought

> **What competitive advantage would time-travel give YOUR product?**
>
> Think about:
>
> - Which scenarios would benefit from undo/redo?
> - How would version history improve UX?

## What's Next?

> **💡 Note:** Part 3 ("Practical Implementation") is in development. [Subscribe](#) to get notified when it's published.

**In Part 3** (in development):

- Step-by-step implementation from scratch
- Integration with React/Zustand/Redux
- DevTools integration
- Examples: forms, text and graphic editors

## Resources

- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [Nexus State](https://github.com/astashkin-a/nexus-state)
- [Zustand Middleware](https://github.com/pmndrs/zustand#middlewares)
- [Figma Version History](https://help.figma.com/hc/en-us/articles/360042531073)
- [Google Docs Revision History](https://support.google.com/docs/answer/190843)
- [Benchmark Source Code](https://gist.github.com/eustatos/a69ecdeb29f25d5798e1bceaed20cbaf)
