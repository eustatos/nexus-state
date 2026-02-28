# TASK-009: Create Benchmark Suite

**Priority:** Medium  
**Effort:** 5 hours  
**Dependencies:** None

---

## Context

- **Current:** No performance benchmarks
- **Problem:** Can't track performance regressions
- **Expected:** Automated benchmark suite in CI/CD

---

## Requirements

- ✅ TypeScript strict mode
- ✅ Benchmark common operations (read, write, computed)
- ✅ Compare with Jotai/Zustand/Redux
- ✅ CI/CD integration
- ✅ Performance budget thresholds

---

## Implementation Steps

### 1. Create benchmark directory

**Directory:** `benchmarks/`

### 2. Create benchmark scripts

**File:** `benchmarks/atom-operations.bench.ts`

```typescript
import { bench, describe } from 'vitest/bench';
import { atom, createStore } from '@nexus-state/core';

describe('Atom Operations', () => {
  bench('create atom', () => {
    atom(0);
  });

  bench('get atom value', () => {
    const store = createStore();
    const countAtom = atom(0);
    store.get(countAtom);
  });

  bench('set atom value', () => {
    const store = createStore();
    const countAtom = atom(0);
    store.set(countAtom, 1);
  });

  bench('create 1000 atoms', () => {
    for (let i = 0; i < 1000; i++) {
      atom(i);
    }
  });

  bench('subscribe to atom', () => {
    const store = createStore();
    const countAtom = atom(0);
    store.subscribe(countAtom, () => {});
  });
});
```

### 3. Create comparison benchmarks

**File:** `benchmarks/comparison.bench.ts`

```typescript
import { bench, describe } from 'vitest/bench';
import { atom as nexusAtom, createStore } from '@nexus-state/core';
import { atom as jotaiAtom } from 'jotai';
import { create } from 'zustand';

describe('Library Comparison', () => {
  bench('Nexus State: create atom', () => {
    nexusAtom(0);
  });

  bench('Jotai: create atom', () => {
    jotaiAtom(0);
  });

  bench('Zustand: create store', () => {
    create(() => ({ count: 0 }));
  });
});
```

### 4. Update package.json

**File:** `package.json` (root)

```json
{
  "scripts": {
    "bench": "vitest bench",
    "bench:compare": "vitest bench benchmarks/comparison.bench.ts"
  }
}
```

### 5. Create CI workflow

**File:** `.github/workflows/benchmarks.yml`

```yaml
name: Benchmarks

on:
  pull_request:
    branches: [main]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
      - name: Install dependencies
        run: pnpm install
      - name: Run benchmarks
        run: pnpm bench
      - name: Comment PR with results
        uses: benchmark-action/github-action-benchmark@v1
        with:
          tool: 'benchmarkjs'
          output-file-path: bench-results.json
          github-token: ${{ secrets.GITHUB_TOKEN }}
          auto-comment-on-alert: true
```

### 6. Set performance budgets

**File:** `benchmarks/budget.json`

```json
{
  "atom-create": { "maxMs": 0.01 },
  "atom-get": { "maxMs": 0.001 },
  "atom-set": { "maxMs": 0.01 },
  "subscribe": { "maxMs": 0.005 },
  "computed-recalculate": { "maxMs": 0.05 }
}
```

---

## Acceptance Criteria

- [ ] Benchmark suite runs with `pnpm bench`
- [ ] Comparison benchmarks work
- [ ] CI/CD runs benchmarks on PR
- [ ] Performance budgets enforced
- [ ] Results saved and compared over time

---

## Files to Create

- `benchmarks/atom-operations.bench.ts`
- `benchmarks/comparison.bench.ts`
- `benchmarks/budget.json`
- `.github/workflows/benchmarks.yml`

---

## Performance Budgets

| Operation | Max Time |
|-----------|----------|
| Create atom | 0.01ms |
| Get atom | 0.001ms |
| Set atom | 0.01ms |
| Subscribe | 0.005ms |
| Computed recalculate | 0.05ms |

---

## Progress

- [ ] Create benchmark directory
- [ ] Create atom-operations.bench.ts
- [ ] Create comparison.bench.ts
- [ ] Create budget.json
- [ ] Create CI workflow
- [ ] Run initial benchmarks
- [ ] Set up result tracking
