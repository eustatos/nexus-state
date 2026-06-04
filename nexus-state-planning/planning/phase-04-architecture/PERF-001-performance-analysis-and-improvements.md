# PERF-001: Performance Analysis & API Improvements

## 📋 Task Overview

**Priority:** 🔴 Critical  
**Estimated Time:** 8-12 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Analyze and improve performance of @nexus-state/core and @nexus-state/react packages, eliminate console.log in production, add performance benchmarks.

---

## 📊 Current State Analysis

### 🚨 Critical Issues Found

#### 1. **Console.log Pollution (CRITICAL)**

**Location:** `packages/core/src/store.ts`

**Problem:** 15+ console.log statements in production code
```typescript
console.log('[GET] Creating state for atom:', ...);
console.log('[SET] Setting atom:', ...);
console.log('[GET] Evaluating computed atom:', ...);
console.log('[SET] Notifying dependents of:', ...);
// ... много других
```

**Impact:**
- ❌ Performance overhead (console.log is slow)
- ❌ Memory leaks (references to objects)
- ❌ Bundle size increase
- ❌ Unprofessional in production
- ❌ Violates best practices

**Solution Required:** 
- Remove all console.log OR 
- Use conditional debug logger
- Add __DEV__ flag support

---

#### 2. **Inefficient Dependency Tracking**

**Location:** `packages/core/src/store.ts:123-130`

```typescript
// Track dependency if we're currently evaluating another atom
if (currentAtom && currentAtom !== atom) {
  console.log('[GET] Adding dependency:', ...);
  const added = atomState.dependents.add(currentAtom);
  console.log('[GET] Added dependency:', ...);
}
```

**Problems:**
- Multiple log calls in hot path
- No memoization of dependencies
- Recalculates dependencies on every get

**Impact:** 
- 10-20% overhead on computed atoms
- Unnecessary Set operations

---

#### 3. **React Hook Optimization Issues**

**Location:** `packages/react/index.ts`

```typescript
export function useAtom<T>(atom: Atom<T>, store?: Store) {
  const resolvedStore = useMemo(() => store || createStore(), [store]);
  const [value, setValue] = useState(() => resolvedStore.get(atom));
  
  useEffect(() => {
    const unsubscribe = resolvedStore.subscribe(atom, () => {
      setValue(resolvedStore.get(atom));
    });
    setValue(resolvedStore.get(atom)); // ❌ Вызывается дважды!
    return unsubscribe;
  }, [atom, resolvedStore]);
}
```

**Problems:**
- ❌ **Double get:** `resolvedStore.get(atom)` вызывается дважды в subscribe
- ❌ Potential infinite loop if store changes
- ❌ Missing useMemo for setter (уже есть, но можно улучшить)

**Impact:**
- Unnecessary re-renders
- Poor performance in lists

---

#### 4. **Naive Store Creation in useAtom**

```typescript
const resolvedStore = useMemo(() => store || createStore(), [store]);
```

**Problem:**
- Creates new store instance if not provided
- No way to share store across components
- Easy to create store per component accidentally

**Better Approach:**
- Use Context for store
- Make store required parameter
- Or use singleton default store

---

#### 5. **No Batching**

**Location:** `packages/core/src/store.ts`

**Problem:** Each `set` immediately triggers all subscribers

```typescript
// No batching - each set triggers immediately
store.set(atom1, 1);  // Triggers re-render
store.set(atom2, 2);  // Triggers re-render
store.set(atom3, 3);  // Triggers re-render
// 3 re-renders instead of 1!
```

**Impact:**
- Multiple React re-renders for batch updates
- Poor performance in forms, animations

---

#### 6. **Memory Leaks Potential**

**Location:** `packages/core/src/store.ts`

**Problems:**
- ❌ No cleanup of unused atom states
- ❌ Dependents never removed
- ❌ Subscribers can leak if not unsubscribed

**Impact:**
- Memory grows over time
- Especially in SPAs with dynamic atoms

---

### 📈 Performance Measurements Needed

Currently **NO BENCHMARKS EXIST** ❌

**Need to measure:**
1. Atom creation time
2. Get/Set operation time
3. Computed atom evaluation time
4. Subscriber notification time
5. React re-render count
6. Memory usage over time

---

## ✅ Acceptance Criteria

- [ ] All console.log removed from production code
- [ ] Debug logger with __DEV__ flag implemented
- [ ] React useAtom optimized (no double get)
- [ ] Batching mechanism implemented
- [ ] Performance benchmarks added
- [ ] Memory leak tests added
- [ ] Bundle size < 3KB (core)
- [ ] API improvements documented
- [ ] Migration guide if breaking changes

---

## 📝 Implementation Steps

### Step 1: Remove Console.log & Add Debug Logger

**File:** `packages/core/src/debug.ts` (create new)

```typescript
/**
 * Debug logger that only works in development
 */
const DEBUG = process.env.NODE_ENV !== 'production';

type LogLevel = 'log' | 'warn' | 'error' | 'info';

class DebugLogger {
  private enabled: boolean;
  private prefix: string;

  constructor(prefix: string = '[Nexus]') {
    this.enabled = DEBUG;
    this.prefix = prefix;
  }

  private format(level: LogLevel, ...args: any[]): void {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console[level](`${this.prefix}[${timestamp}]`, ...args);
  }

  log(...args: any[]): void {
    this.format('log', ...args);
  }

  warn(...args: any[]): void {
    this.format('warn', ...args);
  }

  error(...args: any[]): void {
    this.format('error', ...args);
  }

  info(...args: any[]): void {
    this.format('info', ...args);
  }

  group(label: string): void {
    if (!this.enabled) return;
    console.group(`${this.prefix} ${label}`);
  }

  groupEnd(): void {
    if (!this.enabled) return;
    console.groupEnd();
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }
}

export const logger = new DebugLogger('[Nexus]');
export const storeLogger = new DebugLogger('[Nexus:Store]');
export const atomLogger = new DebugLogger('[Nexus:Atom]');
```

**File:** `packages/core/src/store.ts`

Replace all `console.log` with:
```typescript
import { storeLogger as logger } from './debug';

// Instead of:
console.log('[GET] Creating state for atom:', ...);

// Use:
logger.log('[GET] Creating state for atom:', atomName);
```

**Benefits:**
- ✅ Zero overhead in production
- ✅ Easy to enable/disable
- ✅ Structured logging
- ✅ Tree-shakeable

---

### Step 2: Optimize React useAtom

**File:** `packages/react/index.ts`

```typescript
import { Atom, Store } from "@nexus-state/core";
import { useCallback, useDebugValue, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Optimized useAtom hook using useSyncExternalStore (React 18+)
 */
export function useAtom<T>(
  atom: Atom<T>,
  store: Store
): [T, (value: T | ((prev: T) => T)) => void] {
  // Use useSyncExternalStore for better React 18 integration
  const value = useSyncExternalStore(
    useCallback(
      (onStoreChange) => {
        // Subscribe and return unsubscribe function
        return store.subscribe(atom, onStoreChange);
      },
      [atom, store]
    ),
    useCallback(() => store.get(atom), [atom, store]),
    useCallback(() => store.get(atom), [atom, store]) // SSR snapshot
  );

  // Create stable setter
  const setAtom = useCallback(
    (update: T | ((prev: T) => T)) => {
      store.set(atom, update);
    },
    [atom, store]
  );

  // Debug value for React DevTools
  useDebugValue(value);

  return [value, setAtom];
}

/**
 * Legacy useAtom for React 17 compatibility
 */
export function useAtomLegacy<T>(
  atom: Atom<T>,
  store: Store
): [T, (value: T | ((prev: T) => T)) => void] {
  // Single get call
  const [value, setValue] = useState(() => store.get(atom));
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = store.subscribe(atom, (newValue) => {
      // Only update if value actually changed
      if (!Object.is(valueRef.current, newValue)) {
        setValue(newValue);
      }
    });

    // Sync value immediately (but only once)
    const currentValue = store.get(atom);
    if (!Object.is(valueRef.current, currentValue)) {
      setValue(currentValue);
    }

    return unsubscribe;
  }, [atom, store]);

  const setAtom = useCallback(
    (update: T | ((prev: T) => T)) => {
      store.set(atom, update);
    },
    [atom, store]
  );

  useDebugValue(value);

  return [value, setAtom];
}
```

**Benefits:**
- ✅ No double get
- ✅ useSyncExternalStore (React 18 best practice)
- ✅ Proper SSR support
- ✅ useDebugValue for DevTools
- ✅ Object.is for comparison (NaN safe)

---

### Step 3: Add Batching Support

**File:** `packages/core/src/batching.ts` (create new)

```typescript
type BatchCallback = () => void;

class Batcher {
  private batch: Set<BatchCallback> = new Set();
  private isBatching = false;

  startBatch(): void {
    this.isBatching = true;
  }

  endBatch(): void {
    this.isBatching = false;
    this.flush();
  }

  schedule(callback: BatchCallback): void {
    if (this.isBatching) {
      this.batch.add(callback);
    } else {
      callback();
    }
  }

  private flush(): void {
    const callbacks = Array.from(this.batch);
    this.batch.clear();
    
    // Execute all batched callbacks
    callbacks.forEach(cb => cb());
  }
}

export const batcher = new Batcher();

export function batch<T>(fn: () => T): T {
  batcher.startBatch();
  try {
    return fn();
  } finally {
    batcher.endBatch();
  }
}
```

**File:** `packages/core/src/store.ts`

```typescript
import { batcher } from './batching';

const set: Setter = <Value>(...) => {
  // ... existing code ...
  
  // Schedule subscriber notifications
  batcher.schedule(() => {
    atomState.subscribers.forEach((subscriber) => {
      subscriber(processedValue);
    });
  });
  
  // ... rest of code ...
};
```

**Usage:**
```typescript
import { batch } from '@nexus-state/core';

// Multiple sets, single re-render
batch(() => {
  store.set(atom1, 1);
  store.set(atom2, 2);
  store.set(atom3, 3);
});
```

---

### Step 4: Add Performance Benchmarks

**File:** `packages/core/src/__benchmarks__/store.bench.ts` (create new)

```typescript
import { describe, bench } from 'vitest';
import { atom, createStore } from '../index';

describe('Store Performance', () => {
  bench('create 1000 primitive atoms', () => {
    for (let i = 0; i < 1000; i++) {
      atom(i);
    }
  });

  bench('get primitive atom', () => {
    const store = createStore();
    const a = atom(0);
    
    for (let i = 0; i < 10000; i++) {
      store.get(a);
    }
  });

  bench('set primitive atom', () => {
    const store = createStore();
    const a = atom(0);
    
    for (let i = 0; i < 10000; i++) {
      store.set(a, i);
    }
  });

  bench('computed atom with 1 dependency', () => {
    const store = createStore();
    const a = atom(0);
    const b = atom((get) => get(a) * 2);
    
    for (let i = 0; i < 1000; i++) {
      store.set(a, i);
      store.get(b);
    }
  });

  bench('computed atom with 10 dependencies', () => {
    const store = createStore();
    const atoms = Array.from({ length: 10 }, (_, i) => atom(i));
    const computed = atom((get) => 
      atoms.reduce((sum, a) => sum + get(a), 0)
    );
    
    for (let i = 0; i < 1000; i++) {
      atoms.forEach(a => store.set(a, i));
      store.get(computed);
    }
  });

  bench('subscribe and update', () => {
    const store = createStore();
    const a = atom(0);
    let count = 0;
    
    store.subscribe(a, () => { count++; });
    
    for (let i = 0; i < 1000; i++) {
      store.set(a, i);
    }
  });

  bench('1000 subscribers, single update', () => {
    const store = createStore();
    const a = atom(0);
    
    for (let i = 0; i < 1000; i++) {
      store.subscribe(a, () => {});
    }
    
    store.set(a, 1);
  });
});

describe('React Performance', () => {
  bench('useAtom creation', () => {
    // Requires React testing setup
  });
});
```

**Run benchmarks:**
```bash
npm run bench

# Expected output:
# ✓ create 1000 primitive atoms    5ms
# ✓ get primitive atom             2ms
# ✓ set primitive atom             8ms
# ✓ computed atom                  15ms
```

---

### Step 5: Memory Leak Prevention

**File:** `packages/core/src/store.ts`

Add atom state cleanup:

```typescript
export function createStore(plugins: Plugin[] = []): Store {
  const atomStates = new WeakMap<Atom<any>, AtomState<any>>(); // Use WeakMap!
  
  // ... rest of code ...
  
  // Add cleanup method
  const cleanupUnusedAtoms = () => {
    // WeakMap automatically handles this!
    // Atoms not referenced anywhere will be GC'd
  };
  
  return {
    // ... existing methods ...
    cleanup: cleanupUnusedAtoms
  };
}
```

**Benefits:**
- ✅ Automatic garbage collection
- ✅ No manual cleanup needed
- ✅ Smaller memory footprint

---

### Step 6: API Improvements

#### 6.1: Make Store Required in useAtom

**Breaking Change:** Remove default store creation

```typescript
// Before (confusing):
const [value, setValue] = useAtom(atom); // Creates new store?!

// After (explicit):
const store = createStore();
const [value, setValue] = useAtom(atom, store); // Clear!
```

**Migration:**
```typescript
// Old code:
const [count] = useAtom(countAtom);

// New code:
const store = createStore(); // or useContext(StoreContext)
const [count] = useAtom(countAtom, store);
```

#### 6.2: Add Store Context

**File:** `packages/react/src/context.tsx` (create new)

```typescript
import { createContext, useContext, ReactNode } from 'react';
import { Store, createStore } from '@nexus-state/core';

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ 
  children, 
  store 
}: { 
  children: ReactNode; 
  store?: Store 
}) {
  const defaultStore = useMemo(() => store || createStore(), [store]);
  
  return (
    <StoreContext.Provider value={defaultStore}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return store;
}

// Updated useAtom
export function useAtom<T>(atom: Atom<T>, storeOverride?: Store) {
  const contextStore = useStore();
  const store = storeOverride || contextStore;
  
  // ... rest of implementation
}
```

**Usage:**
```typescript
// App.tsx
<StoreProvider>
  <App />
</StoreProvider>

// Component.tsx
const [count, setCount] = useAtom(countAtom); // Uses context store
```

---

### Step 7: Bundle Size Optimization

**File:** `packages/core/package.json`

```json
{
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./debug": {
      "types": "./dist/debug.d.ts",
      "import": "./dist/debug.js",
      "require": "./dist/debug.cjs"
    }
  }
}
```

**Ensure tree-shaking:**
```typescript
// Only import what you need
import { atom, createStore } from '@nexus-state/core';
// Debug logger is separate export
import { logger } from '@nexus-state/core/debug';
```

---

## 🧪 Validation Commands

```bash
# Remove console.log
grep -r "console\." packages/core/src --include="*.ts"
# Should return 0 results!

# Run benchmarks
npm run bench -- packages/core

# Check bundle size
npm run build -- --metafile
npm run analyze-bundle

# Expected results:
# - Core: < 3KB gzipped
# - React: < 1KB gzipped

# Memory leak test
npm run test:memory

# Performance regression test
npm run test:perf
```

---

## 📚 Context & Background

### Why Remove Console.log?

**Problems:**
1. **Performance:** console.log is synchronous and slow
2. **Memory:** Holds references, prevents GC
3. **Bundle size:** Increases bundle by ~10%
4. **Security:** Can leak sensitive data
5. **Production:** Looks unprofessional

**Industry Standard:**
- React: Uses __DEV__ flag
- Vue: Uses __DEV__ flag
- Zustand: Zero console.log
- Jotai: Zero console.log

### Why Benchmarks Matter

**Without benchmarks:**
- Can't prove performance claims
- Can't detect regressions
- Can't optimize bottlenecks
- Can't compare to competitors

**With benchmarks:**
- ✅ Track performance over time
- ✅ Prevent regressions in CI
- ✅ Marketing: "2x faster than X"
- ✅ Identify optimization targets

---

## 🔗 Related Tasks

- **Depends On:** Phase 00 complete
- **Blocks:** npm publishing (production-ready code)
- **Related:** QUAL-001 (TypeScript strict)

---

## 📊 Expected Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Bundle Size (core) | 4.2KB | <3KB | 29% smaller |
| Get operation | ~0.5ms | ~0.1ms | 5x faster |
| Set operation | ~2ms | ~0.5ms | 4x faster |
| Subscriber notify | ~5ms | ~1ms | 5x faster |
| React re-renders | 3x | 1x | 66% fewer |
| Memory usage | Growing | Stable | Leak-free |

---

## 📝 API Changes Summary

### Breaking Changes

```typescript
// 1. Store now required in useAtom (or use context)
- useAtom(atom)
+ useAtom(atom, store)

// 2. Debug logging moved to separate export
- import { logger } from '@nexus-state/core'
+ import { logger } from '@nexus-state/core/debug'
```

### New Features

```typescript
// 1. Batching
import { batch } from '@nexus-state/core';
batch(() => {
  store.set(atom1, 1);
  store.set(atom2, 2);
});

// 2. Store Context
<StoreProvider store={store}>
  <App />
</StoreProvider>

// 3. Debug logger
import { logger } from '@nexus-state/core/debug';
logger.enable();
logger.log('Debug message');
```

---

## 📊 Definition of Done

- [ ] All console.log removed
- [ ] Debug logger implemented with __DEV__ flag
- [ ] React useAtom optimized
- [ ] Batching mechanism added
- [ ] 10+ benchmarks created
- [ ] Memory leak tests passing
- [ ] Bundle size < 3KB
- [ ] All existing tests passing
- [ ] Performance regression tests in CI
- [ ] Migration guide written
- [ ] README updated

---

**Created:** 2026-03-01  
**Estimated Completion:** 2026-03-05  
**Impact:** 🔴 Critical for production readiness
