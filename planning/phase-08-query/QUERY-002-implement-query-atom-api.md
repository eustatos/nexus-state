# QUERY-002: Implement Query Atom API

## 📋 Task Overview

**Priority:** 🔴 High  
**Estimated Time:** 8 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  

---

## 🎯 Objective

Implement the core Query Atom API that creates atoms for managing async data fetching state.

---

## 📦 Affected Components

**Package:** `@nexus-state/query`  
**Files:**
- `packages/query/src/queryAtom.ts` (NEW)
- `packages/query/src/types.ts` (NEW)
- `packages/query/src/index.ts` (UPDATE)

---

## 🔍 Current State Analysis

```bash
# Check current state
ls -la packages/query/src/
```

**Findings:**
- Current behavior: Only base index.ts exists from QUERY-001
- Issues: No query atom implementation, no type definitions
- Root cause: Query atom API not yet implemented

---

## ✅ Acceptance Criteria

- [ ] `queryAtom()` function creates atoms with query state
- [ ] QueryState type includes: data, error, status, isFetching, isLoading, timestamps
- [ ] QueryOptions supports: key, fetcher, staleTime, cacheTime, retry
- [ ] Status transitions: idle → loading → success/error
- [ ] All types properly exported
- [ ] Basic tests written (≥10 test cases)
- [ ] TypeScript strict mode compliant

---

## 📝 Implementation Steps

### Step 1: Create Type Definitions

**What:** Define all TypeScript types for query atoms

**How:**
```typescript
// src/types.ts

export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

export type QueryState<Data> = {
  data: Data | undefined;
  error: Error | undefined;
  status: QueryStatus;
  isFetching: boolean;
  isLoading: boolean; // loading AND no data
  dataUpdatedAt: number;
  errorUpdatedAt: number;
};

export type QueryKey = string | readonly unknown[];

export type QueryFunction<T> = (context: {
  queryKey: QueryKey;
  signal?: AbortSignal;
}) => Promise<T>;

export type QueryOptions<T> = {
  key: QueryKey;
  fetcher: QueryFunction<T>;
  staleTime?: number;      // Data considered fresh
  cacheTime?: number;      // Data kept in cache
  retry?: number | ((failureCount: number, error: Error) => boolean);
  retryDelay?: number | ((attemptIndex: number) => number);
  enabled?: boolean;
  initialData?: T;
};

export type QueryAtom<Data> = Atom<QueryState<Data>> & {
  queryKey: QueryKey;
  options: QueryOptions<Data>;
};
```

**Validation:**
```bash
cd packages/query
pnpm run build
```

### Step 2: Implement Query Atom Factory

**What:** Create the main `queryAtom()` function

**How:**
```typescript
// src/queryAtom.ts
import { atom, Atom, Store } from '@nexus-state/core';
import type { QueryAtom, QueryOptions, QueryState } from './types';

export function queryAtom<T>(options: QueryOptions<T>): QueryAtom<T> {
  const { key, fetcher, staleTime = 5 * 60 * 1000, cacheTime = 10 * 60 * 1000 } = options;

  // Create atom with initial state
  const initialState: QueryState<T> = {
    data: options.initialData,
    error: undefined,
    status: 'idle',
    isFetching: false,
    isLoading: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
  };

  const stateAtom = atom<QueryState<T>>(initialState);

  // Create fetch function
  const fetchFunction = async (store: Store): Promise<void> => {
    const currentState = store.get(stateAtom);
    
    // Don't fetch if already fetching
    if (currentState.isFetching) return;

    // Set loading state
    store.set(stateAtom, {
      ...currentState,
      status: 'loading',
      isFetching: true,
      isLoading: !currentState.data,
    });

    try {
      // Execute fetcher
      const data = await fetcher({ queryKey: key });

      // Set success state
      store.set(stateAtom, {
        data,
        error: undefined,
        status: 'success',
        isFetching: false,
        isLoading: false,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: currentState.errorUpdatedAt,
      });
    } catch (error) {
      // Set error state
      store.set(stateAtom, {
        data: currentState.data,
        error: error instanceof Error ? error : new Error(String(error)),
        status: 'error',
        isFetching: false,
        isLoading: false,
        dataUpdatedAt: currentState.dataUpdatedAt,
        errorUpdatedAt: Date.now(),
      });
    }
  };

  // Attach fetch function to atom
  (stateAtom as any).fetch = fetchFunction;
  (stateAtom as any).queryKey = key;
  (stateAtom as any).options = options;

  return stateAtom as QueryAtom<T>;
}
```

**Validation:**
```bash
pnpm run build
```

### Step 3: Update Exports

**What:** Export new types and functions

**How:**
```typescript
// src/index.ts
export { queryAtom } from './queryAtom';
export type {
  QueryAtom,
  QueryState,
  QueryOptions,
  QueryKey,
  QueryFunction,
  QueryStatus
} from './types';
```

**Validation:**
```bash
pnpm run build
```

### Step 4: Write Basic Tests

**What:** Create test suite for query atom

**How:**
```typescript
// src/__tests__/queryAtom.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { queryAtom } from '../queryAtom';
import type { QueryState } from '../types';

describe('queryAtom', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should create query atom with idle status', () => {
    const query = queryAtom({
      key: 'test',
      fetcher: async () => 'data',
    });

    const state = store.get(query);
    expect(state.status).toBe('idle');
    expect(state.data).toBeUndefined();
    expect(state.isFetching).toBe(false);
  });

  it('should transition to loading state on fetch', async () => {
    const query = queryAtom({
      key: 'test',
      fetcher: async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'data';
      },
    });

    // Start fetch (don't await yet)
    const fetchPromise = (query as any).fetch(store);

    // Check loading state
    const loadingState = store.get(query);
    expect(loadingState.status).toBe('loading');
    expect(loadingState.isFetching).toBe(true);
    expect(loadingState.isLoading).toBe(true);

    await fetchPromise;
  });

  it('should transition to success state after fetch', async () => {
    const query = queryAtom({
      key: 'test',
      fetcher: async () => 'test data',
    });

    await (query as any).fetch(store);

    const state = store.get(query);
    expect(state.status).toBe('success');
    expect(state.data).toBe('test data');
    expect(state.error).toBeUndefined();
    expect(state.isFetching).toBe(false);
  });

  it('should transition to error state on failure', async () => {
    const query = queryAtom({
      key: 'test',
      fetcher: async () => {
        throw new Error('Fetch failed');
      },
    });

    await (query as any).fetch(store);

    const state = store.get(query);
    expect(state.status).toBe('error');
    expect(state.error).toBeInstanceOf(Error);
    expect(state.error?.message).toBe('Fetch failed');
  });

  it('should use initialData if provided', () => {
    const query = queryAtom({
      key: 'test',
      fetcher: async () => 'new data',
      initialData: 'initial',
    });

    const state = store.get(query);
    expect(state.data).toBe('initial');
    expect(state.status).toBe('idle');
  });
});
```

**Validation:**
```bash
pnpm run test
```

---

## 🧪 Validation Commands

```bash
# Run tests
cd packages/query
pnpm run test

# Check coverage
pnpm run test:coverage

# Build
pnpm run build

# Lint
pnpm run lint
```

**Expected Output:**
```
✓ All tests passing (10+ tests)
✓ Coverage: >80%
✓ Build successful
✓ ESLint passing
```

---

## 📚 Context & Background

### Why This Matters

Query Atom is the core API that users will interact with. It must:
- Provide a simple, intuitive API
- Handle all query lifecycle states correctly
- Integrate seamlessly with Nexus State atoms
- Support TypeScript for type safety

### Technical Context

Based on ARCHITECTURE.md:
- Query atoms hold `QueryState<Data>` with status tracking
- Status transitions: idle → loading → success/error
- Each query has metadata (key, fetcher, timestamps)
- Atoms are the foundation for caching and deduplication

### Related Documentation

- [ARCHITECTURE.md - Query Atom](../../packages/query/ARCHITECTURE.md#query-atom)
- [ARCHITECTURE.md - Query Lifecycle](../../packages/query/ARCHITECTURE.md#query-lifecycle)

---

## 🔗 Related Tasks

- **Depends On:** QUERY-001 (base package structure)
- **Blocks:** QUERY-003 (Cache), QUERY-004 (Deduplication), QUERY-005 (Background Refetch)
- **Related:** QUERY-008 (TypeScript types enhancement)

---

## 📊 Definition of Done

- [ ] Query atom factory implemented
- [ ] All types defined and exported
- [ ] Status transitions working correctly
- [ ] Tests written (≥10 test cases)
- [ ] TypeScript strict mode compliant
- [ ] Documentation updated
- [ ] CI passing
- [ ] Task marked complete

---

## 🚀 Implementation Checklist

```bash
# 1. Create branch
git checkout -b feature/QUERY-002

# 2. Implement types
# Create src/types.ts

# 3. Implement queryAtom
# Create src/queryAtom.ts

# 4. Update exports
# Update src/index.ts

# 5. Write tests
# Create src/__tests__/queryAtom.test.ts

# 6. Run tests
pnpm run test

# 7. Commit
git add .
git commit -m "feat(query): implement query atom API

- Add QueryState, QueryOptions, QueryKey types
- Implement queryAtom() factory function
- Support status transitions (idle → loading → success/error)
- Add comprehensive test suite

Resolves: QUERY-002"

# 8. Push
git push origin feature/QUERY-002
```

---

## 📝 Notes for AI Agent

### Key Considerations

- Keep API simple and intuitive
- Ensure proper status transitions
- Handle edge cases (concurrent fetches, errors)
- Maintain compatibility with @nexus-state/core

### Edge Cases

- Multiple concurrent fetches for same query
- Fetch cancelled before completion
- Error handling (Error vs string vs unknown)
- initialData provided vs undefined

### Code Style

```typescript
// Use descriptive type names
type QueryState<Data> = { ... };

// Export both values and types
export { queryAtom };
export type { QueryAtom };
```

---

## 🐛 Known Issues / Blockers

- [ ] No known issues

---

## 📈 Progress Tracking

**Started:** TBD  
**Last Updated:** 2026-02-28  
**Completed:** TBD  

**Time Spent:** 0 hours (vs estimated 8 hours)

---

**Created:** 2026-02-28  
**Estimated Completion:** 2026-03-02  
**Actual Completion:** TBD
