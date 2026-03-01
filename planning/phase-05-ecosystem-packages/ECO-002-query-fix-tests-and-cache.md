# ECO-002: Fix Query Package Tests and Add Cache Management

## 📋 Task Overview

**Priority:** 🔴 Critical  
**Estimated Time:** 2-3 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  
**Depends On:** ECO-001

---

## 🎯 Objective

Fix the failing `executeQuery` test and implement basic cache/stale time management for the query package.

---

## 📦 Affected Components

**Package:** `@nexus-state/query`  
**Files to modify:**

- `packages/query/src/query.ts`
- `packages/query/src/__tests__/query.test.ts`
- `packages/query/src/cache.ts` (new)
- `packages/query/src/types.ts`

---

## 🔍 Current State Analysis

**Test Failure:**

```
FAIL  src/__tests__/query.test.ts > executeQuery > should execute query manually
AssertionError: expected "spy" to be called 1 times, but got 0 times
```

**Root Cause:** When `enabled: false`, `executeQuery` returns early without calling `queryFn`

**Missing Features:**

- ❌ Cache time management
- ❌ Stale time tracking
- ❌ Query cache storage

---

## ✅ Acceptance Criteria

- [ ] All tests passing (19/19)
- [ ] `executeQuery` test fixed
- [ ] Cache manager implemented
- [ ] Stale time tracking working
- [ ] Cache time (garbage collection) working
- [ ] TypeScript strict mode compliance (`strict: true`)
- [ ] No `any` types (use proper generics)
- [ ] SPR principle: Single Purpose per function
- [ ] Tests coverage ≥95%

---

## 📝 Implementation Steps

### Step 1: Fix executeQuery test

**File:** `packages/query/src/__tests__/query.test.ts`

The test expects `queryFn` to be called even when `enabled: false`. This is incorrect behavior. Fix the test:

```typescript
it('should execute query manually even when enabled: false', async () => {
  const queryFn = vi.fn(async () => 'data');
  const options = {
    queryKey: 'test',
    queryFn,
    enabled: false,
  };

  const queryAtom = createQuery(store, options);

  // Initial state should be idle
  expect(store.get(queryAtom).status).toBe('idle');

  // Execute manually with force flag
  await executeQuery(store, queryAtom, 0, true); // Add force parameter

  expect(queryFn).toHaveBeenCalledTimes(1);
  expect(store.get(queryAtom).status).toBe('success');
});
```

### Step 2: Update executeQuery signature

**File:** `packages/query/src/query.ts`

```typescript
/**
 * Execute query
 * @param store - Store instance
 * @param queryAtom - Query atom to execute
 * @param retryCount - Current retry attempt (internal)
 * @param force - Force execution even if disabled
 */
export async function executeQuery<TData, TError>(
  store: Store,
  queryAtom: QueryAtom<TData, TError>,
  retryCount: number = 0,
  force: boolean = false
): Promise<void> {
  const { options } = queryAtom;

  // Check if enabled (unless forced)
  if (options.enabled === false && !force) {
    return;
  }

  // ... rest of implementation
}
```

### Step 3: Create cache manager types

**File:** `packages/query/src/types.ts`

Add to existing types:

```typescript
/**
 * Cache entry metadata
 */
export interface CacheEntry<TData = unknown> {
  data: TData;
  dataUpdatedAt: number;
  isStale: boolean;
}

/**
 * Query cache options
 */
export interface QueryCacheOptions {
  /**
   * Default stale time in ms
   * @default 0
   */
  defaultStaleTime?: number;

  /**
   * Default cache time in ms
   * @default 5 * 60 * 1000 (5 minutes)
   */
  defaultCacheTime?: number;

  /**
   * Garbage collection interval in ms
   * @default 60 * 1000 (1 minute)
   */
  gcInterval?: number;
}

/**
 * Query cache interface
 */
export interface QueryCache {
  /**
   * Get cached data for query key
   */
  get<TData>(queryKey: string): CacheEntry<TData> | undefined;

  /**
   * Set cached data for query key
   */
  set<TData>(queryKey: string, data: TData, staleTime?: number): void;

  /**
   * Remove cached data for query key
   */
  remove(queryKey: string): void;

  /**
   * Clear all cached data
   */
  clear(): void;

  /**
   * Check if data is stale
   */
  isStale(queryKey: string): boolean;

  /**
   * Run garbage collection
   */
  gc(): void;

  /**
   * Dispose cache and stop GC
   */
  dispose(): void;
}
```

### Step 4: Implement cache manager

**File:** `packages/query/src/cache.ts`

```typescript
import { QueryCache, QueryCacheOptions, CacheEntry } from './types';

const DEFAULT_STALE_TIME = 0;
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_GC_INTERVAL = 60 * 1000; // 1 minute

interface CacheRecord<TData = unknown> {
  entry: CacheEntry<TData>;
  cacheTime: number;
  lastAccessedAt: number;
}

/**
 * Create a query cache
 */
export function createQueryCache(options: QueryCacheOptions = {}): QueryCache {
  const {
    defaultStaleTime = DEFAULT_STALE_TIME,
    defaultCacheTime = DEFAULT_CACHE_TIME,
    gcInterval = DEFAULT_GC_INTERVAL,
  } = options;

  const cache = new Map<string, CacheRecord>();
  let gcTimer: ReturnType<typeof setInterval> | null = null;

  // Start garbage collection
  const startGC = (): void => {
    if (gcTimer) return;

    gcTimer = setInterval(() => {
      gc();
    }, gcInterval);
  };

  // Stop garbage collection
  const stopGC = (): void => {
    if (gcTimer) {
      clearInterval(gcTimer);
      gcTimer = null;
    }
  };

  // Garbage collection
  const gc = (): void => {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, record] of cache.entries()) {
      const timeSinceLastAccess = now - record.lastAccessedAt;
      if (timeSinceLastAccess > record.cacheTime) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => cache.delete(key));
  };

  // Check if data is stale
  const isStale = (queryKey: string): boolean => {
    const record = cache.get(queryKey);
    if (!record) return true;

    return record.entry.isStale;
  };

  // Get cached entry
  const get = <TData>(queryKey: string): CacheEntry<TData> | undefined => {
    const record = cache.get(queryKey) as CacheRecord<TData> | undefined;
    if (!record) return undefined;

    // Update last accessed time
    record.lastAccessedAt = Date.now();

    return record.entry;
  };

  // Set cached entry
  const set = <TData>(
    queryKey: string,
    data: TData,
    staleTime: number = defaultStaleTime
  ): void => {
    const now = Date.now();

    cache.set(queryKey, {
      entry: {
        data,
        dataUpdatedAt: now,
        isStale: staleTime === 0,
      },
      cacheTime: defaultCacheTime,
      lastAccessedAt: now,
    });

    // Update stale status after staleTime
    if (staleTime > 0) {
      setTimeout(() => {
        const record = cache.get(queryKey);
        if (record) {
          record.entry.isStale = true;
        }
      }, staleTime);
    }
  };

  // Remove entry
  const remove = (queryKey: string): void => {
    cache.delete(queryKey);
  };

  // Clear all
  const clear = (): void => {
    cache.clear();
  };

  // Dispose
  const dispose = (): void => {
    stopGC();
    cache.clear();
  };

  // Start GC on creation
  startGC();

  return {
    get,
    set,
    remove,
    clear,
    isStale,
    gc,
    dispose,
  };
}
```

### Step 5: Integrate cache into query system

**File:** `packages/query/src/query.ts`

Add cache support:

```typescript
import { createQueryCache } from './cache';
import type { QueryCache } from './types';

// Global cache instance
let globalCache: QueryCache | null = null;

/**
 * Get or create global query cache
 */
function getQueryCache(): QueryCache {
  if (!globalCache) {
    globalCache = createQueryCache();
  }
  return globalCache;
}

/**
 * Set custom query cache
 */
export function setQueryCache(cache: QueryCache): void {
  if (globalCache) {
    globalCache.dispose();
  }
  globalCache = cache;
}

/**
 * Clear query cache
 */
export function clearQueryCache(): void {
  getQueryCache().clear();
}

// Update useQuery to use cache:
export function useQuery<TData = unknown, TError = Error>(
  store: Store,
  options: QueryOptions<TData, TError>
): QueryResult<TData, TError> {
  const cache = getQueryCache();
  const queryKey = serializeQueryKey(options.queryKey);

  // Check cache first
  const cachedEntry = cache.get<TData>(queryKey);

  // Create or get query atom
  let queryAtom = createQuery(store, options);

  // Use cached data if available and not stale
  if (cachedEntry && !cache.isStale(queryKey)) {
    store.set(queryAtom, {
      ...store.get(queryAtom),
      data: cachedEntry.data,
      dataUpdatedAt: cachedEntry.dataUpdatedAt,
      status: 'success',
      isSuccess: true,
      isIdle: false,
    });
  }

  // Execute query if no data or stale
  const currentState = store.get(queryAtom);
  const shouldFetch =
    (currentState.status === 'idle' || cache.isStale(queryKey)) &&
    options.enabled !== false;

  if (shouldFetch) {
    executeQuery(store, queryAtom).then(() => {
      // Update cache on success
      const newState = store.get(queryAtom);
      if (newState.status === 'success' && newState.data !== undefined) {
        cache.set(queryKey, newState.data, options.staleTime);
      }
    });
  }

  // Helper to get current state from store
  const getState = (): QueryState<TData, TError> => store.get(queryAtom);

  // Create result object with getters
  const result: QueryResult<TData, TError> = {
    get status() {
      return getState().status;
    },
    get data() {
      return getState().data;
    },
    get error() {
      return getState().error;
    },
    get isLoading() {
      return getState().isLoading;
    },
    get isSuccess() {
      return getState().isSuccess;
    },
    get isError() {
      return getState().isError;
    },
    get isIdle() {
      return getState().isIdle;
    },
    get isFetching() {
      return getState().isFetching;
    },
    get dataUpdatedAt() {
      return getState().dataUpdatedAt;
    },
    get errorUpdatedAt() {
      return getState().errorUpdatedAt;
    },
    get failureCount() {
      return getState().failureCount;
    },

    refetch: async () => {
      await executeQuery(store, queryAtom, 0, true);
      const state = store.get(queryAtom);
      if (state.status === 'success' && state.data !== undefined) {
        cache.set(queryKey, state.data, options.staleTime);
      }
    },

    remove: () => {
      cache.remove(queryKey);
      store.set(queryAtom, createInitialState(options));
    },
  };

  return result;
}
```

### Step 6: Add cache tests

**File:** `packages/query/src/__tests__/cache.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createQueryCache } from '../cache';

describe('QueryCache', () => {
  let cache: ReturnType<typeof createQueryCache>;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = createQueryCache({
      defaultStaleTime: 1000,
      defaultCacheTime: 5000,
      gcInterval: 1000,
    });
  });

  afterEach(() => {
    cache.dispose();
    vi.useRealTimers();
  });

  it('should set and get cache entries', () => {
    cache.set('test', 'data');
    const entry = cache.get('test');

    expect(entry?.data).toBe('data');
    expect(entry?.isStale).toBe(false);
  });

  it('should mark data as stale after staleTime', () => {
    cache.set('test', 'data', 1000);
    expect(cache.isStale('test')).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(cache.isStale('test')).toBe(true);
  });

  it('should remove entries', () => {
    cache.set('test', 'data');
    expect(cache.get('test')).toBeDefined();

    cache.remove('test');
    expect(cache.get('test')).toBeUndefined();
  });

  it('should clear all entries', () => {
    cache.set('test1', 'data1');
    cache.set('test2', 'data2');

    cache.clear();

    expect(cache.get('test1')).toBeUndefined();
    expect(cache.get('test2')).toBeUndefined();
  });

  it('should garbage collect old entries', () => {
    cache.set('test', 'data');

    // Advance past cache time
    vi.advanceTimersByTime(6000);

    // Trigger GC
    cache.gc();

    expect(cache.get('test')).toBeUndefined();
  });

  it('should update lastAccessedAt on get', () => {
    cache.set('test', 'data');

    vi.advanceTimersByTime(3000);
    cache.get('test'); // Access

    vi.advanceTimersByTime(3000);
    cache.gc();

    // Should still exist because we accessed it
    expect(cache.get('test')).toBeDefined();
  });
});
```

### Step 7: Update exports

**File:** `packages/query/src/index.ts`

```typescript
export {
  useQuery,
  createQuery,
  executeQuery,
  setQueryCache,
  clearQueryCache,
} from './query';

export { createQueryCache } from './cache';

export type {
  QueryOptions,
  QueryState,
  QueryResult,
  QueryStatus,
  QueryAtom,
  QueryCache,
  QueryCacheOptions,
  CacheEntry,
} from './types';
```

---

## 🧪 Validation Commands

```bash
cd packages/query

# Run tests
pnpm test

# Expected: 19/19 passing + new cache tests

# Type check
pnpm tsc --noEmit

# Coverage
pnpm test:coverage

# Expected: ≥95%
```

---

## 📚 Best Practices to Follow

### TypeScript Strict Mode

- ✅ Use `strict: true` in tsconfig
- ✅ No `any` types - use proper generics
- ✅ Explicit return types on public APIs
- ✅ Proper null/undefined handling

### SPR (Single Purpose Responsibility)

- ✅ Each function does ONE thing
- ✅ `createQueryCache` - creates cache
- ✅ `getQueryCache` - gets/creates global cache
- ✅ `executeQuery` - executes query
- ✅ Separate concerns: cache vs query logic

### Code Quality

- ✅ Descriptive variable names
- ✅ JSDoc comments on public APIs
- ✅ Consistent error handling
- ✅ No side effects in pure functions
- ✅ Immutable state updates

---

## 🔗 Related Tasks

- **Depends On:** ECO-001
- **Blocks:** ECO-003 (query deduplication)
- **Related:** ECO-004 (refetch on focus)

---

## 📊 Definition of Done

- [ ] All 19 original tests passing
- [ ] Cache tests passing (≥8 tests)
- [ ] No TypeScript errors with `strict: true`
- [ ] Coverage ≥95%
- [ ] Cache GC working correctly
- [ ] Stale time tracking working
- [ ] Documentation updated

---

**Created:** 2026-03-01  
**Estimated Completion:** 3 hours
