# ECO-003: Implement Query Deduplication

## 📋 Task Overview

**Priority:** 🟡 High  
**Estimated Time:** 2-3 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  
**Depends On:** ECO-002

---

## 🎯 Objective

Implement query deduplication to prevent multiple concurrent requests for the same query key.

---

## 📦 Affected Components

**Package:** `@nexus-state/query`  
**Files to modify:**

- `packages/query/src/query.ts`
- `packages/query/src/types.ts`
- `packages/query/src/__tests__/deduplication.test.ts` (new)

---

## 🔍 Current State Analysis

**Problem:**
If `useQuery` is called multiple times with the same `queryKey` before the first request completes, multiple identical network requests will be made.

**Example:**

```typescript
// Component A
useQuery(store, { queryKey: 'user', queryFn: fetchUser });

// Component B (rendered at same time)
useQuery(store, { queryKey: 'user', queryFn: fetchUser });

// Result: 2 identical requests to fetch user data
```

**Expected Behavior:**
Only ONE request should be made, and both components should share the result.

---

## ✅ Acceptance Criteria

- [ ] Only one request per query key at a time
- [ ] Multiple subscribers share the same promise
- [ ] Request tracking per query key
- [ ] Proper cleanup after request completes
- [ ] TypeScript strict mode compliance
- [ ] SPR: separate deduplication logic
- [ ] Tests coverage ≥95%
- [ ] No race conditions

---

## 📝 Implementation Steps

### Step 1: Add types for request tracking

**File:** `packages/query/src/types.ts`

Add to existing types:

```typescript
/**
 * In-flight request tracker
 */
export interface RequestTracker {
  /**
   * Get active request promise for query key
   */
  get<TData>(queryKey: string): Promise<TData> | undefined;

  /**
   * Track new request for query key
   */
  set<TData>(queryKey: string, promise: Promise<TData>): void;

  /**
   * Remove tracked request for query key
   */
  remove(queryKey: string): void;

  /**
   * Clear all tracked requests
   */
  clear(): void;

  /**
   * Check if request is in-flight
   */
  has(queryKey: string): boolean;
}
```

### Step 2: Implement request tracker

**File:** `packages/query/src/request-tracker.ts`

```typescript
import type { RequestTracker } from './types';

/**
 * Create a request tracker for deduplication
 */
export function createRequestTracker(): RequestTracker {
  const requests = new Map<string, Promise<unknown>>();

  const get = <TData>(queryKey: string): Promise<TData> | undefined => {
    return requests.get(queryKey) as Promise<TData> | undefined;
  };

  const set = <TData>(queryKey: string, promise: Promise<TData>): void => {
    requests.set(queryKey, promise);

    // Auto-cleanup when promise settles
    promise
      .then(() => requests.delete(queryKey))
      .catch(() => requests.delete(queryKey));
  };

  const remove = (queryKey: string): void => {
    requests.delete(queryKey);
  };

  const clear = (): void => {
    requests.clear();
  };

  const has = (queryKey: string): boolean => {
    return requests.has(queryKey);
  };

  return {
    get,
    set,
    remove,
    clear,
    has,
  };
}
```

### Step 3: Integrate request tracker into query system

**File:** `packages/query/src/query.ts`

Update with request tracking:

```typescript
import { createRequestTracker } from './request-tracker';
import type { RequestTracker } from './types';

// Global request tracker
let globalRequestTracker: RequestTracker | null = null;

/**
 * Get or create global request tracker
 */
function getRequestTracker(): RequestTracker {
  if (!globalRequestTracker) {
    globalRequestTracker = createRequestTracker();
  }
  return globalRequestTracker;
}

/**
 * Set custom request tracker
 */
export function setRequestTracker(tracker: RequestTracker): void {
  globalRequestTracker = tracker;
}

/**
 * Execute query with deduplication
 */
export async function executeQuery<TData, TError>(
  store: Store,
  queryAtom: QueryAtom<TData, TError>,
  retryCount: number = 0,
  force: boolean = false
): Promise<void> {
  const { options } = queryAtom;
  const requestTracker = getRequestTracker();
  const queryKey = queryAtom.queryKey;

  // Check if enabled (unless forced)
  if (options.enabled === false && !force) {
    return;
  }

  // Check for in-flight request (deduplication)
  const existingRequest = requestTracker.get<TData>(queryKey);
  if (existingRequest && !force) {
    // Wait for existing request to complete
    try {
      const data = await existingRequest;

      // Update state with result from deduplicated request
      const currentState = store.get(queryAtom);
      if (currentState.status !== 'success') {
        store.set(queryAtom, {
          status: 'success',
          data,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
          isIdle: false,
          isFetching: false,
          dataUpdatedAt: Date.now(),
          errorUpdatedAt: 0,
          failureCount: 0,
        });
      }

      return;
    } catch (error) {
      // Error will be handled by the original request
      return;
    }
  }

  // Set loading state
  const currentState = store.get(queryAtom);
  store.set(queryAtom, {
    ...currentState,
    status: currentState.data ? 'success' : 'loading',
    isLoading: currentState.data === undefined,
    isFetching: true,
    isIdle: false,
  });

  // Create and track new request
  const requestPromise = options.queryFn();

  // Only track if not a retry
  if (retryCount === 0) {
    requestTracker.set(queryKey, requestPromise);
  }

  try {
    // Execute query function
    const data = await requestPromise;

    // Set success state
    store.set(queryAtom, {
      status: 'success',
      data,
      error: null,
      isLoading: false,
      isSuccess: true,
      isError: false,
      isIdle: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
    });

    // Call success callback
    if (options.onSuccess) {
      options.onSuccess(data);
    }

    // Call settled callback
    if (options.onSettled) {
      options.onSettled(data, null);
    }
  } catch (error) {
    const typedError = error as TError;
    const newFailureCount = retryCount + 1;

    // Determine if should retry
    const maxRetries =
      typeof options.retry === 'number'
        ? options.retry
        : options.retry === false
          ? 0
          : 3;

    const shouldRetry = newFailureCount <= maxRetries;

    if (shouldRetry) {
      // Calculate retry delay
      const retryDelay =
        typeof options.retryDelay === 'function'
          ? options.retryDelay(retryCount)
          : (options.retryDelay ?? Math.min(1000 * 2 ** retryCount, 30000));

      // Wait and retry
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return executeQuery(store, queryAtom, newFailureCount, force);
    }

    // Set error state
    store.set(queryAtom, {
      status: 'error',
      data: currentState.data,
      error: typedError,
      isLoading: false,
      isSuccess: false,
      isError: true,
      isIdle: false,
      isFetching: false,
      dataUpdatedAt: currentState.dataUpdatedAt,
      errorUpdatedAt: Date.now(),
      failureCount: newFailureCount,
    });

    // Call error callback
    if (options.onError) {
      options.onError(typedError);
    }

    // Call settled callback
    if (options.onSettled) {
      options.onSettled(undefined, typedError);
    }
  }
}
```

### Step 4: Create deduplication tests

**File:** `packages/query/src/__tests__/deduplication.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '@nexus-state/core';
import { useQuery, clearQueryCache } from '../query';

describe('Query Deduplication', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    clearQueryCache();
  });

  it('should deduplicate concurrent requests with same query key', async () => {
    let callCount = 0;
    const queryFn = vi.fn(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return `data-${callCount}`;
    });

    // Create two queries with same key at the same time
    const result1 = useQuery(store, {
      queryKey: 'test',
      queryFn,
    });

    const result2 = useQuery(store, {
      queryKey: 'test',
      queryFn,
    });

    // Wait for requests to complete
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should only have called queryFn once
    expect(queryFn).toHaveBeenCalledTimes(1);

    // Both should have same data
    expect(result1.data).toBe('data-1');
    expect(result2.data).toBe('data-1');
  });

  it('should not deduplicate requests with different keys', async () => {
    const queryFn1 = vi.fn(async () => 'data1');
    const queryFn2 = vi.fn(async () => 'data2');

    useQuery(store, { queryKey: 'test1', queryFn: queryFn1 });
    useQuery(store, { queryKey: 'test2', queryFn: queryFn2 });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(queryFn1).toHaveBeenCalledTimes(1);
    expect(queryFn2).toHaveBeenCalledTimes(1);
  });

  it('should allow sequential requests for same key', async () => {
    let callCount = 0;
    const queryFn = vi.fn(async () => {
      callCount++;
      return `data-${callCount}`;
    });

    // First request
    const result1 = useQuery(store, {
      queryKey: 'test',
      queryFn,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(result1.data).toBe('data-1');

    // Second request (after first completes)
    await result1.refetch();

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(result1.data).toBe('data-2');
  });

  it('should handle errors in deduplicated requests', async () => {
    const error = new Error('Test error');
    const queryFn = vi.fn(async () => {
      throw error;
    });

    const result1 = useQuery(store, {
      queryKey: 'test',
      queryFn,
      retry: false,
    });

    const result2 = useQuery(store, {
      queryKey: 'test',
      queryFn,
      retry: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should only call once
    expect(queryFn).toHaveBeenCalledTimes(1);

    // Both should have error
    expect(result1.isError).toBe(true);
    expect(result2.isError).toBe(true);
  });

  it('should not deduplicate when force refetch is used', async () => {
    let callCount = 0;
    const queryFn = vi.fn(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return `data-${callCount}`;
    });

    const result = useQuery(store, {
      queryKey: 'test',
      queryFn,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(callCount).toBe(1);

    // Force refetch while request in progress
    const refetchPromise = result.refetch();

    // Create another query (should use in-flight request)
    useQuery(store, {
      queryKey: 'test',
      queryFn,
    });

    await refetchPromise;
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Refetch should have made new request
    expect(callCount).toBe(2);
  });

  it('should cleanup request tracker after completion', async () => {
    const queryFn = vi.fn(async () => 'data');

    useQuery(store, {
      queryKey: 'test',
      queryFn,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Second request should make new call (tracker cleaned up)
    useQuery(store, {
      queryKey: 'test',
      queryFn,
      enabled: false, // Don't auto-fetch
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    // First call already completed, should be cleaned up
    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});
```

### Step 5: Update exports

**File:** `packages/query/src/index.ts`

```typescript
export {
  useQuery,
  createQuery,
  executeQuery,
  setQueryCache,
  clearQueryCache,
  setRequestTracker,
} from './query';

export { createQueryCache } from './cache';
export { createRequestTracker } from './request-tracker';

export type {
  QueryOptions,
  QueryState,
  QueryResult,
  QueryStatus,
  QueryAtom,
  QueryCache,
  QueryCacheOptions,
  CacheEntry,
  RequestTracker,
} from './types';
```

---

## 🧪 Validation Commands

```bash
cd packages/query

# Run tests
pnpm test

# Expected: All previous tests + 6 new deduplication tests passing

# Check for race conditions
pnpm test -- --reporter=verbose

# Coverage
pnpm test:coverage

# Expected: ≥95%
```

---

## 📚 Best Practices to Follow

### TypeScript Strict Mode

- ✅ Proper Promise typing
- ✅ Generic constraints on RequestTracker
- ✅ No `any` in promise handling

### SPR (Single Purpose Responsibility)

- ✅ `createRequestTracker()` - manages in-flight requests
- ✅ `executeQuery()` - executes with deduplication
- ✅ Separation: tracking vs execution

### Concurrency Safety

- ✅ No race conditions
- ✅ Proper promise chaining
- ✅ Automatic cleanup on settle
- ✅ Handle both success and error paths

### Performance

- ✅ O(1) lookup for in-flight requests
- ✅ Automatic cleanup (no memory leaks)
- ✅ Minimal overhead for deduplication check

---

## 🔗 Related Tasks

- **Depends On:** ECO-002
- **Blocks:** ECO-004 (refetch on focus)
- **Related:** ECO-005 (refetch on reconnect)

---

## 📊 Definition of Done

- [ ] Deduplication working correctly
- [ ] No duplicate requests for same query key
- [ ] Request tracker auto-cleanup working
- [ ] All tests passing (≥6 new tests)
- [ ] No race conditions
- [ ] TypeScript strict compliance
- [ ] Coverage ≥95%
- [ ] Documentation updated

---

**Created:** 2026-03-01  
**Estimated Completion:** 2-3 hours
