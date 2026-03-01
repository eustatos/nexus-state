# ECO-004: Implement Query Refetch Features

## 📋 Task Overview

**Priority:** 🟡 High  
**Estimated Time:** 3-4 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  
**Depends On:** ECO-003

---

## 🎯 Objective

Implement automatic refetching features: window focus refetch, network reconnect refetch, and interval refetch.

---

## 📦 Affected Components

**Package:** `@nexus-state/query`  
**Files to modify:**

- `packages/query/src/refetch-manager.ts` (new)
- `packages/query/src/query.ts`
- `packages/query/src/types.ts`
- `packages/query/src/__tests__/refetch.test.ts` (new)

---

## 🔍 Current State Analysis

**Missing Features:**

- ❌ Refetch on window focus
- ❌ Refetch on network reconnect
- ❌ Interval-based refetching

**TanStack Query Behavior:**

- Window focus → refetch stale queries
- Network reconnect → refetch failed queries
- Interval → refetch on timer

---

## ✅ Acceptance Criteria

- [ ] Window focus refetch working
- [ ] Network reconnect refetch working
- [ ] Interval refetch working
- [ ] Proper event listener cleanup
- [ ] TypeScript strict compliance
- [ ] SPR: separate refetch management
- [ ] Tests coverage ≥95%
- [ ] Works in browser and Node.js (SSR safe)

---

## 📝 Implementation Steps

### Step 1: Add refetch types

**File:** `packages/query/src/types.ts`

```typescript
/**
 * Refetch listener callback
 */
export type RefetchListener = (queryKey: string) => void;

/**
 * Refetch manager for handling automatic refetches
 */
export interface RefetchManager {
  /**
   * Register query for refetch events
   */
  register(queryKey: string, listener: RefetchListener): () => void;

  /**
   * Unregister query from refetch events
   */
  unregister(queryKey: string): void;

  /**
   * Trigger refetch for all registered queries
   */
  refetchAll(): void;

  /**
   * Dispose and cleanup all listeners
   */
  dispose(): void;
}

/**
 * Refetch manager options
 */
export interface RefetchManagerOptions {
  /**
   * Enable window focus refetching
   * @default true
   */
  refetchOnWindowFocus?: boolean;

  /**
   * Enable network reconnect refetching
   * @default true
   */
  refetchOnReconnect?: boolean;

  /**
   * Window focus event throttle time in ms
   * @default 1000
   */
  focusThrottleMs?: number;
}
```

### Step 2: Implement refetch manager

**File:** `packages/query/src/refetch-manager.ts`

```typescript
import type {
  RefetchManager,
  RefetchManagerOptions,
  RefetchListener,
} from './types';

const DEFAULT_FOCUS_THROTTLE_MS = 1000;

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Create a refetch manager
 */
export function createRefetchManager(
  options: RefetchManagerOptions = {}
): RefetchManager {
  const {
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    focusThrottleMs = DEFAULT_FOCUS_THROTTLE_MS,
  } = options;

  const listeners = new Map<string, RefetchListener>();
  let lastFocusTime = 0;
  let isOnline = isBrowser() ? navigator.onLine : true;

  // Event handlers
  const handleWindowFocus = (): void => {
    if (!refetchOnWindowFocus) return;

    const now = Date.now();
    if (now - lastFocusTime < focusThrottleMs) {
      return; // Throttle
    }

    lastFocusTime = now;
    refetchAll();
  };

  const handleVisibilityChange = (): void => {
    if (!refetchOnWindowFocus) return;

    if (document.visibilityState === 'visible') {
      handleWindowFocus();
    }
  };

  const handleOnline = (): void => {
    if (!refetchOnReconnect) return;

    const wasOffline = !isOnline;
    isOnline = true;

    if (wasOffline) {
      refetchAll();
    }
  };

  const handleOffline = (): void => {
    isOnline = false;
  };

  // Setup event listeners (browser only)
  if (isBrowser()) {
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  // Register query for refetch
  const register = (
    queryKey: string,
    listener: RefetchListener
  ): (() => void) => {
    listeners.set(queryKey, listener);

    // Return unregister function
    return () => {
      listeners.delete(queryKey);
    };
  };

  // Unregister query
  const unregister = (queryKey: string): void => {
    listeners.delete(queryKey);
  };

  // Trigger refetch for all
  const refetchAll = (): void => {
    for (const [queryKey, listener] of listeners.entries()) {
      listener(queryKey);
    }
  };

  // Dispose and cleanup
  const dispose = (): void => {
    if (isBrowser()) {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }

    listeners.clear();
  };

  return {
    register,
    unregister,
    refetchAll,
    dispose,
  };
}

/**
 * Create interval refetch manager
 */
export function createIntervalRefetch(
  callback: () => void,
  intervalMs: number
): () => void {
  const timerId = setInterval(callback, intervalMs);

  // Return cleanup function
  return () => {
    clearInterval(timerId);
  };
}
```

### Step 3: Integrate refetch manager into query system

**File:** `packages/query/src/query.ts`

Add refetch management:

```typescript
import { createRefetchManager, createIntervalRefetch } from './refetch-manager';
import type { RefetchManager } from './types';

// Global refetch manager
let globalRefetchManager: RefetchManager | null = null;

/**
 * Get or create global refetch manager
 */
function getRefetchManager(): RefetchManager {
  if (!globalRefetchManager) {
    globalRefetchManager = createRefetchManager();
  }
  return globalRefetchManager;
}

/**
 * Set custom refetch manager
 */
export function setRefetchManager(manager: RefetchManager): void {
  if (globalRefetchManager) {
    globalRefetchManager.dispose();
  }
  globalRefetchManager = manager;
}

// Update useQuery to support refetch features:
export function useQuery<TData = unknown, TError = Error>(
  store: Store,
  options: QueryOptions<TData, TError>
): QueryResult<TData, TError> {
  const cache = getQueryCache();
  const requestTracker = getRequestTracker();
  const refetchManager = getRefetchManager();
  const queryKey = serializeQueryKey(options.queryKey);

  // ... existing cache and query atom logic ...

  // Setup automatic refetching
  let intervalCleanup: (() => void) | null = null;
  let focusCleanup: (() => void) | null = null;

  // Window focus / reconnect refetch
  if (
    options.refetchOnWindowFocus !== false ||
    options.refetchOnReconnect !== false
  ) {
    focusCleanup = refetchManager.register(queryKey, () => {
      // Only refetch if data is stale
      if (cache.isStale(queryKey)) {
        executeQuery(store, queryAtom, 0, true).then(() => {
          const state = store.get(queryAtom);
          if (state.status === 'success' && state.data !== undefined) {
            cache.set(queryKey, state.data, options.staleTime);
          }
        });
      }
    });
  }

  // Interval refetch
  if (options.refetchInterval && options.refetchInterval > 0) {
    intervalCleanup = createIntervalRefetch(() => {
      executeQuery(store, queryAtom, 0, true).then(() => {
        const state = store.get(queryAtom);
        if (state.status === 'success' && state.data !== undefined) {
          cache.set(queryKey, state.data, options.staleTime);
        }
      });
    }, options.refetchInterval);
  }

  // ... existing result creation ...

  // Enhanced remove to cleanup subscriptions
  const originalRemove = result.remove;
  result.remove = () => {
    if (focusCleanup) focusCleanup();
    if (intervalCleanup) intervalCleanup();
    originalRemove();
  };

  return result;
}
```

### Step 4: Create refetch tests

**File:** `packages/query/src/__tests__/refetch.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createStore } from '@nexus-state/core';
import { useQuery, clearQueryCache, setRefetchManager } from '../query';
import { createRefetchManager } from '../refetch-manager';

describe('Query Refetch Features', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    clearQueryCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Window Focus Refetch', () => {
    it('should refetch on window focus if data is stale', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      const result = useQuery(store, {
        queryKey: 'test',
        queryFn,
        staleTime: 1000,
        refetchOnWindowFocus: true,
      });

      // Initial fetch
      await vi.runAllTimersAsync();
      expect(callCount).toBe(1);

      // Mark as stale
      vi.advanceTimersByTime(1100);

      // Trigger window focus
      window.dispatchEvent(new Event('focus'));
      await vi.runAllTimersAsync();

      expect(callCount).toBe(2);
    });

    it('should NOT refetch on window focus if data is fresh', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        staleTime: 10000,
        refetchOnWindowFocus: true,
      });

      await vi.runAllTimersAsync();
      expect(callCount).toBe(1);

      // Trigger window focus (data still fresh)
      window.dispatchEvent(new Event('focus'));
      await vi.runAllTimersAsync();

      expect(callCount).toBe(1); // No refetch
    });

    it('should throttle window focus events', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        staleTime: 0, // Always stale
        refetchOnWindowFocus: true,
      });

      await vi.runAllTimersAsync();

      // Rapid focus events
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('focus'));

      await vi.runAllTimersAsync();

      // Should only refetch once due to throttling
      expect(callCount).toBe(2);
    });

    it('should refetch on visibility change', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        staleTime: 0,
        refetchOnWindowFocus: true,
      });

      await vi.runAllTimersAsync();

      // Change visibility to visible
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));
      await vi.runAllTimersAsync();

      expect(callCount).toBe(2);
    });
  });

  describe('Network Reconnect Refetch', () => {
    it('should refetch when network reconnects', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        refetchOnReconnect: true,
      });

      await vi.runAllTimersAsync();
      expect(callCount).toBe(1);

      // Simulate offline
      window.dispatchEvent(new Event('offline'));

      // Simulate online
      window.dispatchEvent(new Event('online'));
      await vi.runAllTimersAsync();

      expect(callCount).toBe(2);
    });

    it('should NOT refetch if already online', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        refetchOnReconnect: true,
      });

      await vi.runAllTimersAsync();

      // Trigger online event (but was already online)
      window.dispatchEvent(new Event('online'));
      await vi.runAllTimersAsync();

      expect(callCount).toBe(1); // No refetch
    });
  });

  describe('Interval Refetch', () => {
    it('should refetch at specified interval', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        refetchInterval: 5000,
      });

      await vi.runAllTimersAsync();
      expect(callCount).toBe(1);

      // Advance by interval
      vi.advanceTimersByTime(5000);
      await vi.runAllTimersAsync();
      expect(callCount).toBe(2);

      // Advance again
      vi.advanceTimersByTime(5000);
      await vi.runAllTimersAsync();
      expect(callCount).toBe(3);
    });

    it('should NOT refetch when interval is false', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        refetchInterval: false,
      });

      await vi.runAllTimersAsync();

      vi.advanceTimersByTime(10000);
      await vi.runAllTimersAsync();

      expect(callCount).toBe(1); // Only initial fetch
    });

    it('should cleanup interval on remove', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      const result = useQuery(store, {
        queryKey: 'test',
        queryFn,
        refetchInterval: 5000,
      });

      await vi.runAllTimersAsync();
      expect(callCount).toBe(1);

      // Remove query
      result.remove();

      // Advance time
      vi.advanceTimersByTime(10000);
      await vi.runAllTimersAsync();

      expect(callCount).toBe(1); // No more refetches
    });
  });

  describe('Refetch Manager', () => {
    it('should support custom refetch manager', () => {
      const customManager = createRefetchManager({
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      });

      setRefetchManager(customManager);

      // Custom manager should be used
      expect(customManager).toBeDefined();
    });
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
  setRefetchManager,
} from './query';

export { createQueryCache } from './cache';
export { createRequestTracker } from './request-tracker';
export { createRefetchManager, createIntervalRefetch } from './refetch-manager';

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
  RefetchManager,
  RefetchManagerOptions,
  RefetchListener,
} from './types';
```

---

## 🧪 Validation Commands

```bash
cd packages/query

# Run tests
pnpm test

# Run refetch tests specifically
pnpm test refetch

# Coverage
pnpm test:coverage
```

---

## 📚 Best Practices to Follow

### TypeScript Strict Mode

- ✅ Proper event listener typing
- ✅ Browser API type safety
- ✅ SSR-safe checks (`typeof window`)

### SPR (Single Purpose Responsibility)

- ✅ `createRefetchManager()` - manages refetch events
- ✅ `createIntervalRefetch()` - handles interval
- ✅ Separate concerns: events vs query execution

### Browser Compatibility

- ✅ SSR-safe (check for `window`)
- ✅ Proper cleanup of event listeners
- ✅ No memory leaks

### Performance

- ✅ Throttle window focus events
- ✅ Only refetch stale data
- ✅ Efficient event listener management

---

## 🔗 Related Tasks

- **Depends On:** ECO-003
- **Blocks:** ECO-008 (mutations)
- **Related:** ECO-009 (React hooks)

---

## 📊 Definition of Done

- [ ] Window focus refetch working
- [ ] Network reconnect working
- [ ] Interval refetch working
- [ ] Event listener cleanup working
- [ ] SSR-safe implementation
- [ ] All tests passing (≥8 new tests)
- [ ] TypeScript strict compliance
- [ ] Coverage ≥95%

---

**Created:** 2026-03-01  
**Estimated Completion:** 3-4 hours
