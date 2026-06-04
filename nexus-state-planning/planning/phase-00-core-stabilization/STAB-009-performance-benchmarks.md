# STAB-009: Establish Performance Benchmarks

## 📋 Task Overview

**Priority:** 🟡 Medium  
**Estimated Time:** 3-4 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Create a comprehensive performance benchmark suite to establish baseline metrics and ensure Nexus State meets performance targets for production use.

---

## 🎯 Performance Targets

| Metric | Current | Target | Competitor (Zustand) |
|--------|---------|--------|---------------------|
| **Bundle Size (core)** | 4.2KB | <3KB | ~1KB |
| **1000 Atom Operations** | 120ms | <50ms | ~30ms |
| **Subscribe/Notify** | Unknown | <1ms | ~0.5ms |
| **Memory (1000 atoms)** | Unknown | <5MB | ~3MB |
| **Cold Start** | Unknown | <10ms | ~5ms |

---

## ✅ Acceptance Criteria

- [ ] Benchmark suite created using `vitest bench`
- [ ] 5+ performance metrics tracked
- [ ] Baseline metrics documented
- [ ] Comparison with competitors (Zustand/Jotai)
- [ ] CI integration for regression detection
- [ ] Performance report generated
- [ ] Optimization opportunities identified

---

## 📝 Implementation Steps

### Step 1: Set Up Benchmark Infrastructure

**File:** `packages/core/src/__benchmarks__/setup.bench.ts`

```typescript
import { bench, describe } from 'vitest';
import { atom, createStore } from '../index';

// Benchmark configuration
const ITERATIONS = 1000;
const ATOM_COUNT = 1000;

export { bench, describe, ITERATIONS, ATOM_COUNT };
```

### Step 2: Create Atom Performance Benchmarks

**File:** `packages/core/src/__benchmarks__/atom-performance.bench.ts`

```typescript
import { bench, describe } from 'vitest';
import { atom, createStore } from '../index';

describe('Atom Performance', () => {
  bench('create 1000 primitive atoms', () => {
    const atoms = Array.from({ length: 1000 }, (_, i) => atom(i));
    // Cleanup not needed - just measuring creation
  });

  bench('create 1000 computed atoms', () => {
    const baseAtom = atom(0);
    const computedAtoms = Array.from(
      { length: 1000 },
      () => atom((get) => get(baseAtom) * 2)
    );
  });

  bench('create atoms with names', () => {
    const atoms = Array.from(
      { length: 1000 },
      (_, i) => atom(i, `atom-${i}`)
    );
  });
});
```

### Step 3: Create Store Performance Benchmarks

**File:** `packages/core/src/__benchmarks__/store-performance.bench.ts`

```typescript
import { bench, describe, beforeEach } from 'vitest';
import { atom, createStore } from '../index';

describe('Store Performance', () => {
  let store: any;
  let testAtoms: any[];

  beforeEach(() => {
    store = createStore();
    testAtoms = Array.from({ length: 1000 }, (_, i) => atom(i));
  });

  bench('get() 1000 atoms', () => {
    testAtoms.forEach(a => store.get(a));
  });

  bench('set() 1000 atoms', () => {
    testAtoms.forEach((a, i) => store.set(a, i * 2));
  });

  bench('subscribe() to 1000 atoms', () => {
    const unsubscribers = testAtoms.map(a => 
      store.subscribe(a, () => {})
    );
    // Cleanup
    unsubscribers.forEach(u => u());
  });

  bench('rapid updates on single atom', () => {
    const testAtom = atom(0);
    for (let i = 0; i < 1000; i++) {
      store.set(testAtom, i);
    }
  });

  bench('getState() with 1000 atoms', () => {
    testAtoms.forEach((a, i) => store.set(a, i));
    store.getState();
  });
});
```

### Step 4: Create Computed Atom Benchmarks

**File:** `packages/core/src/__benchmarks__/computed-performance.bench.ts`

```typescript
import { bench, describe } from 'vitest';
import { atom, createStore } from '../index';

describe('Computed Atom Performance', () => {
  bench('chain of 10 computed atoms', () => {
    const store = createStore();
    const atoms = [atom(0)];
    
    for (let i = 0; i < 10; i++) {
      atoms.push(atom((get) => get(atoms[i]) + 1));
    }
    
    store.get(atoms[atoms.length - 1]);
  });

  bench('diamond dependency pattern', () => {
    const store = createStore();
    
    //     root
    //    /    \
    //   a1    a2
    //    \    /
    //     sum
    
    const root = atom(10);
    const a1 = atom((get) => get(root) * 2);
    const a2 = atom((get) => get(root) * 3);
    const sum = atom((get) => get(a1) + get(a2));
    
    store.get(sum);
  });

  bench('100 atoms depending on 1 atom', () => {
    const store = createStore();
    const base = atom(0);
    const dependent = Array.from(
      { length: 100 },
      (_, i) => atom((get) => get(base) + i)
    );
    
    store.set(base, 42);
    dependent.forEach(a => store.get(a));
  });
});
```

### Step 5: Create Memory Benchmarks

**File:** `packages/core/src/__benchmarks__/memory.bench.ts`

```typescript
import { bench, describe } from 'vitest';
import { atom, createStore } from '../index';

describe('Memory Performance', () => {
  bench('memory footprint of 1000 atoms', () => {
    const store = createStore();
    const atoms = Array.from({ length: 1000 }, (_, i) => 
      atom({ id: i, data: `value-${i}` })
    );
    
    atoms.forEach(a => store.get(a));
    
    // Measure memory if possible
    if (global.gc) {
      global.gc();
    }
  });

  bench('cleanup after unsubscribe', () => {
    const store = createStore();
    const atoms = Array.from({ length: 1000 }, () => atom(0));
    
    const unsubscribers = atoms.map(a => 
      store.subscribe(a, () => {})
    );
    
    unsubscribers.forEach(u => u());
  });
});
```

### Step 6: Create Bundle Size Check

**File:** `packages/core/scripts/bundle-size.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

function getSize(file) {
  const content = fs.readFileSync(file);
  const gzipped = gzipSync(content);
  
  return {
    raw: content.length,
    gzip: gzipped.length,
    file: path.basename(file)
  };
}

console.log('Bundle Size Analysis\n');
console.log('─'.repeat(50));

const distFiles = [
  'dist/index.js',
  'dist/index.d.ts',
].filter(f => fs.existsSync(f));

distFiles.forEach(file => {
  const size = getSize(file);
  console.log(`${size.file}:`);
  console.log(`  Raw:  ${(size.raw / 1024).toFixed(2)} KB`);
  console.log(`  Gzip: ${(size.gzip / 1024).toFixed(2)} KB`);
  console.log();
});

// Check against target
const mainBundle = getSize('dist/index.js');
const TARGET_KB = 3;

if (mainBundle.gzip > TARGET_KB * 1024) {
  console.error(`❌ Bundle size exceeds target: ${(mainBundle.gzip/1024).toFixed(2)}KB > ${TARGET_KB}KB`);
  process.exit(1);
} else {
  console.log(`✅ Bundle size OK: ${(mainBundle.gzip/1024).toFixed(2)}KB < ${TARGET_KB}KB`);
}
```

### Step 7: Create Comparison Benchmarks

**File:** `benchmarks/comparison/zustand-vs-nexus.bench.ts`

```typescript
import { bench, describe } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
// import { create } from 'zustand'; // For comparison

describe('Nexus vs Zustand Comparison', () => {
  describe('Nexus State', () => {
    bench('create store + 100 atoms', () => {
      const store = createStore();
      const atoms = Array.from({ length: 100 }, (_, i) => atom(i));
      atoms.forEach(a => store.get(a));
    });

    bench('1000 updates', () => {
      const store = createStore();
      const testAtom = atom(0);
      for (let i = 0; i < 1000; i++) {
        store.set(testAtom, i);
      }
    });
  });

  // Add Zustand benchmarks for comparison
  // describe('Zustand', () => { ... });
});
```

---

## 🧪 Running Benchmarks

### Local Development

```bash
# Run all benchmarks
cd packages/core
npm run bench

# Run specific benchmark
npm run bench -- atom-performance

# Run with detailed output
npm run bench -- --reporter=verbose

# Run with comparison mode
npm run bench -- --compare
```

### CI Integration

**File:** `.github/workflows/benchmark.yml`

```yaml
name: Performance Benchmarks

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run benchmarks
        run: npm run bench
      
      - name: Check bundle size
        run: node packages/core/scripts/bundle-size.js
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: benchmarks/results/
```

---

## 📊 Expected Output

```
Benchmark Results (1000 iterations each):

Atom Performance:
  create 1000 primitive atoms    12.34ms  ±0.5%
  create 1000 computed atoms     18.76ms  ±1.2%
  create atoms with names        14.21ms  ±0.8%

Store Performance:
  get() 1000 atoms               8.45ms   ±0.3%
  set() 1000 atoms               15.67ms  ±0.9%
  subscribe() to 1000 atoms      22.34ms  ±1.5%
  rapid updates on single atom   45.21ms  ±2.1%
  getState() with 1000 atoms     89.12ms  ±3.2%  ⚠️ SLOW

Bundle Size:
  index.js (raw):  12.34 KB
  index.js (gzip): 4.21 KB  ⚠️ EXCEEDS TARGET (3KB)
```

---

## 📚 Context & Background

### Why Performance Matters

1. **User Experience:** Slow state updates = janky UI
2. **Scalability:** Must handle large applications
3. **Competition:** Users compare libraries
4. **Mobile:** Limited resources on mobile devices

### Optimization Opportunities

Based on initial benchmarks, focus on:
- Reducing bundle size (tree-shaking)
- Optimizing subscription notifications
- Caching computed atom results
- Lazy loading DevTools

---

## 🔗 Related Tasks

- **Depends On:** STAB-007 (core stability)
- **Blocks:** STAB-010 (API freeze)
- **Related:** Future optimization tasks

---

## 📊 Definition of Done

- [ ] 15+ benchmarks implemented
- [ ] Baseline metrics documented
- [ ] Bundle size check automated
- [ ] CI integration working
- [ ] Performance report generated
- [ ] Comparison with ≥1 competitor
- [ ] Optimization plan created

---

## 🚀 Implementation Checklist

```bash
# 1. Create benchmark directory
mkdir -p packages/core/src/__benchmarks__

# 2. Create benchmark files
# (Use templates above)

# 3. Add bench script to package.json
# "bench": "vitest bench"

# 4. Run initial benchmarks
cd packages/core
npm run bench

# 5. Document results
npm run bench > benchmarks/baseline-results.txt

# 6. Create bundle size script
node scripts/bundle-size.js

# 7. Commit
git add packages/core/src/__benchmarks__
git add packages/core/scripts/bundle-size.js
git commit -m "perf: establish performance benchmark suite

- Add atom creation benchmarks
- Add store operation benchmarks
- Add computed atom benchmarks
- Add memory benchmarks
- Add bundle size check
- Document baseline metrics

Baseline: 1000 atoms in 120ms (target: <50ms)
Bundle: 4.2KB (target: <3KB)

Resolves: STAB-009"
```

---

## 📝 Notes for AI Agent

### Benchmark Best Practices

1. **Warmup:** Run operations once before benchmarking
2. **Iterations:** Use sufficient iterations for statistical significance
3. **Cleanup:** Avoid memory leaks affecting results
4. **Consistency:** Use same environment for comparisons

### Vitest Bench API

```typescript
// Basic benchmark
bench('my benchmark', () => {
  // code to benchmark
});

// With setup/teardown
bench('with lifecycle', () => {
  // benchmark code
}, {
  setup() {
    // runs before each iteration
  },
  teardown() {
    // runs after each iteration
  }
});

// Compare multiple approaches
bench.skip('skip this one', () => {});
bench.only('run only this', () => {});
```

---

**Created:** 2026-02-23  
**Estimated Completion:** 2026-02-25  
**Actual Completion:** TBD
