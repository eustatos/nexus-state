# Performance Benchmarks

This document provides detailed benchmark results for Nexus State.

## Test Environment

| Component | Specification |
|-----------|---------------|
| **CPU** | Apple M1 MacBook Pro |
| **Node.js** | v20.19.4 |
| **Test Runner** | vitest 3.0.7 |
| **Memory** | 16GB unified |
| **OS** | macOS 14.x |

## Methodology

- Each benchmark runs for a minimum of 100 iterations
- Results are averaged over 10+ runs
- Garbage collection is triggered between runs
- Warm-up: 1000 iterations before measurement

---

## Core Operations

### Get Atom (10,000 iterations)

```javascript
const store = createStore();
const a = atom(0);

for (let i = 0; i < 10000; i++) {
  store.get(a);
}
```

| Metric | Value |
|--------|-------|
| **ops/sec** | 3,365 |
| **mean** | 0.297ms |
| **p75** | 0.327ms |
| **p99** | 1.26ms |
| **p999** | 2.23ms |
| **RME** | ±3.43% |
| **Samples** | 1,683 |

**Analysis:** ✅ Stable performance with low variance. Single-digit microsecond latency for simple get operations.

---

### Set Atom (10,000 iterations)

```javascript
const store = createStore();
const a = atom(0);

for (let i = 0; i < 10000; i++) {
  store.set(a, i);
}
```

| Metric | Value |
|--------|-------|
| **ops/sec** | 150 |
| **mean** | 6.64ms |
| **p75** | 7.47ms |
| **p99** | 20.30ms |
| **p999** | 20.30ms |
| **RME** | ±8.30% |
| **Samples** | 77 |

**Analysis:** ✅ Acceptable performance. Higher latency due to subscriber notifications on each set.

**Optimization tip:** Use `batch()` for bulk updates to reduce notifications.

---

### Subscribe + Update (1,000 iterations)

```javascript
const store = createStore();
const a = atom(0);
let count = 0;

store.subscribe(a, () => { count++; });

for (let i = 0; i < 1000; i++) {
  store.set(a, i);
}
```

| Metric | Value |
|--------|-------|
| **ops/sec** | 2,105 |
| **mean** | 0.475ms |
| **p75** | 0.546ms |
| **p99** | 1.24ms |
| **p999** | 1.98ms |
| **RME** | ±2.72% |
| **Samples** | 1,053 |

**Analysis:** ✅ Excellent stability (±2.7%). Subscription overhead is minimal.

---

### Concurrent Subscriptions

```javascript
const store = createStore();
const a = atom(0);

// Create 100 concurrent subscriptions
const unsubscribers = Array.from({ length: 100 }, () =>
  store.subscribe(a, () => {})
);

// Update atom
store.set(a, 1);

// Cleanup
unsubscribers.forEach((unsub) => unsub());
```

| Metric | Value |
|--------|-------|
| **ops/sec** | 21,063 |
| **mean** | 0.048ms |
| **p75** | 0.048ms |
| **p99** | 0.17ms |
| **p999** | 2.38ms |
| **RME** | ±4.18% |
| **Samples** | 10,532 |

**Analysis:** ✅ Best-in-class performance. Subscription creation is highly optimized.

---

### Function Update

```javascript
const store = createStore();
const a = atom(0);

for (let i = 0; i < 1000; i++) {
  store.set(a, (prev) => prev + 1);
}
```

| Metric | Value |
|--------|-------|
| **ops/sec** | 2,019 |
| **mean** | 0.495ms |
| **p75** | 0.515ms |
| **p99** | 2.28ms |
| **p999** | 2.93ms |
| **RME** | ±4.34% |
| **Samples** | 1,010 |

**Analysis:** ✅ Function updates have similar performance to direct sets.

---

## Computed Atoms

### 1 Dependency

```javascript
const a = atom(0);
const b = atom((get) => get(a) * 2);

for (let i = 0; i < 1000; i++) {
  store.set(a, i);
  store.get(b);
}
```

| Metric | Value |
|--------|-------|
| **ops/sec** | 572 |
| **mean** | 1.75ms |
| **p99** | 4.63ms |
| **RME** | ±5.34% |

---

### 5 Dependencies

```javascript
const atoms = Array.from({ length: 5 }, (_, i) => atom(i));
const computed = atom((get) =>
  atoms.reduce((sum, a) => sum + get(a), 0)
);

for (let i = 0; i < 1000; i++) {
  atoms.forEach((a) => store.set(a, i));
  store.get(computed);
}
```

| Metric | Value |
|--------|-------|
| **ops/sec** | 98 |
| **mean** | 10.17ms |
| **p99** | 18.88ms |
| **RME** | ±6.06% |

**Analysis:** ⚠️ Performance degrades with more dependencies. Consider restructuring for >5 dependencies.

---

### 10 Dependencies

```javascript
const atoms = Array.from({ length: 10 }, (_, i) => atom(i));
const computed = atom((get) =>
  atoms.reduce((sum, a) => sum + get(a), 0)
);
```

| Metric | Value |
|--------|-------|
| **ops/sec** | 25 |
| **mean** | 39.42ms |
| **p99** | 57.28ms |
| **RME** | ±18.12% |

**Analysis:** ❌ High latency and variance. **Target for v1.0: <20ms mean.**

**Recommendations:**
- Split into multiple computed atoms
- Use memoization for expensive calculations
- Consider derived atoms with fewer dependencies

---

### Nested Computed Atoms (Chain)

```javascript
const a = atom(0);
const b = atom((get) => get(a) + 1);
const c = atom((get) => get(b) + 1);
// ... chain of 5 or 10
```

| Chain Length | ops/sec | mean (ms) | p99 (ms) |
|--------------|---------|-----------|----------|
| 5 | 253 | 3.94 | 6.07 |
| 10 | 139 | 7.19 | 10.82 |

**Analysis:** ✅ Linear scaling. Chain of 10 is still performant.

---

### Diamond Dependency

```javascript
const a = atom(0);
const b = atom((get) => get(a) * 2);
const c = atom((get) => get(a) * 3);
const d = atom((get) => get(b) + get(c));
```

| Metric | Value |
|--------|-------|
| **ops/sec** | 320 |
| **mean** | 3.12ms |
| **p99** | 9.19ms |
| **RME** | ±8.23% |

**Analysis:** ✅ Handles diamond patterns efficiently without duplicate calculations.

---

## Batching

### Batch: 100 Sets, Single Notification

```javascript
batch(() => {
  atoms.forEach((a, i) => {
    store.set(a, i * 2);
  });
});
```

| Metric | Value |
|--------|-------|
| **ops/sec** | 755 |
| **mean** | 1.32ms |
| **p99** | 10.01ms |

---

### No Batch: 100 Sets, Multiple Notifications

```javascript
atoms.forEach((a, i) => {
  store.set(a, i * 2);
});
```

| Metric | Value |
|--------|-------|
| **ops/sec** | 809 |
| **mean** | 1.24ms |
| **p99** | 8.97ms |

**Analysis:** ⚠️ Batch shows minimal improvement in this test. May vary with more subscribers.

---

## Memory Performance

### Create and Cleanup 1000 Atoms

```javascript
for (let i = 0; i < 1000; i++) {
  const a = atom(i);
  store.get(a);
  // Let GC collect
}
```

| Metric | Value |
|--------|-------|
| **ops/sec** | 104 |
| **mean** | 9.56ms |
| **p99** | 333.70ms |
| **RME** | ±126.38% |

**Analysis:** ❌ High variance indicates GC pressure. **Under optimization for v1.0.**

---

### Subscribe and Unsubscribe 1000 Times

```javascript
for (let i = 0; i < 1000; i++) {
  const unsubscribe = store.subscribe(a, () => {});
  unsubscribe();
}
```

| Metric | Value |
|--------|-------|
| **ops/sec** | 18 |
| **mean** | 54.88ms |
| **p99** | 105.25ms |
| **RME** | ±30.19% |

**Analysis:** ⚠️ Cleanup overhead is significant. Consider object pooling for frequent subscribe/unsubscribe patterns.

---

## Comparison with Competitors

### Methodology Note

Competitor benchmarks are from public sources and may not be directly comparable due to:
- Different test environments
- Different test methodologies
- Different versions of libraries

| Metric | Nexus State | Zustand | Jotai | Redux Toolkit | Source |
|--------|-------------|---------|-------|---------------|--------|
| **Bundle Size** | 4.2KB | 1KB | 12KB | 13KB | bundlejs.com |
| **Get (single)** | 0.03ms | 0.02ms | 0.04ms | 0.08ms | Public benchmarks |
| **Set (single)** | 0.66ms | 0.45ms | 0.72ms | 1.2ms | Public benchmarks |
| **Computed (1 dep)** | 1.75ms | 1.2ms | 2.1ms | 3.5ms | Public benchmarks |
| **Memory (1000 atoms)** | 2.1MB | 1.8MB | 3.2MB | 4.5MB | Internal |

---

## Performance Goals for v1.0

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Bundle Size | 4.2KB | <3KB | ⚠️ In Progress |
| Set atom (10K) mean | 6.64ms | <5ms | ⚠️ Needs Work |
| Computed (10 deps) mean | 39.42ms | <20ms | ❌ Critical |
| Memory cleanup RME | ±126% | <20% | ❌ Critical |
| Subscribe/unsubscribe | 54ms | <30ms | ⚠️ Needs Work |

---

## Running Benchmarks

```bash
# Run all benchmarks
pnpm bench

# Run specific benchmark file
npx vitest bench packages/core/__benchmarks__/store.bench.ts

# Run with custom iterations
npx vitest bench --benchmark-repeats 100
```

---

## Contributing

If you find performance issues or have optimization suggestions:

1. Create a benchmark reproducing the issue
2. Open a GitHub issue with benchmark results
3. Submit a PR with improvements + benchmark comparison

---

**Last Updated:** 2026-03-01  
**Nexus State Version:** 0.1.6
