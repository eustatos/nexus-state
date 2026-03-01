# ECO-013: Implement Full Suspense Support for @nexus-state/query

**Status:** 🔵 Not Started
**Priority:** 🔴 High
**Estimated Time:** 3-4 hours
**Dependencies:** ECO-006 (React hooks)
**Package:** @nexus-state/query

---

## 📋 Overview

Implement complete React Suspense support for `@nexus-state/query`, enabling declarative loading states and improved server-side rendering compatibility.

**Key Goals:**
- Full Suspense integration for `useQuery`
- SSR-compatible data fetching
- Error boundary integration
- Prefetching utilities
- TypeScript support

---

## 🎯 Objectives

### Must Have
- [ ] Full Suspense support in `useQuery`
- [ ] Proper promise throwing for Suspense
- [ ] Error boundary integration
- [ ] SSR hydration support
- [ ] Query prefetching utilities
- [ ] Cache preloading

### Should Have
- [ ] `useSuspenseQuery` hook variant
- [ ] Parallel queries with Suspense
- [ ] Streaming SSR support
- [ ] Suspense-compatible mutations

### Nice to Have
- [ ] `useSuspenseInfiniteQuery` (future)
- [ ] Suspense boundaries optimization
- [ ] Automatic prefetching

---

## 🏗️ Implementation Plan

### Step 1: Define Suspense Types (30 min)

**File:** `packages/query/react/types.ts`

```typescript
export interface SuspenseQueryOptions<TData, TError> 
  extends Omit<UseQueryOptions<TData, TError>, 'suspense'> {
  // Suspense is always enabled
}

export interface SuspenseQueryResult<TData, TError> {
  data: TData; // Never undefined in Suspense mode
  error: null; // Errors thrown to boundary
  isLoading: false; // Always false (suspends instead)
  isSuccess: true; // Always true when rendered
  isFetching: boolean;
  isStale: boolean;
  refetch: () => Promise<void>;
  remove: () => void;
}

export interface QueryCacheEntry<TData> {
  data: TData;
  promise?: Promise<TData>;
  error?: Error;
  dataUpdatedAt: number;
}

export interface PrefetchOptions {
  queryKey: string | readonly unknown[];
  queryFn: () => Promise<unknown>;
  staleTime?: number;
  force?: boolean; // Force refetch even if cached
}
```

### Step 2: Implement Suspense Cache (1 hour)

**File:** `packages/query/src/suspense-cache.ts`

```typescript
import type { QueryCacheEntry } from '../react/types';

/**
 * Enhanced cache for Suspense support
 */
export class SuspenseQueryCache {
  private cache = new Map<string, QueryCacheEntry<unknown>>();
  private promises = new Map<string, Promise<unknown>>();

  /**
   * Get cached data or throw promise for Suspense
   */
  public read<TData>(
    queryKey: string,
    queryFn: () => Promise<TData>,
    staleTime: number = 0
  ): TData {
    const cached = this.cache.get(queryKey) as QueryCacheEntry<TData> | undefined;

    // Check if data is fresh
    if (cached && !this.isStale(queryKey, staleTime)) {
      // Data is available and fresh
      if (cached.error) {
        throw cached.error;
      }
      return cached.data;
    }

    // Check for in-flight promise
    const existingPromise = this.promises.get(queryKey) as Promise<TData> | undefined;
    if (existingPromise) {
      // Throw existing promise for Suspense
      throw existingPromise;
    }

    // Start new fetch
    const promise = queryFn()
      .then((data) => {
        // Update cache
        this.cache.set(queryKey, {
          data,
          dataUpdatedAt: Date.now(),
        });
        this.promises.delete(queryKey);
        return data;
      })
      .catch((error) => {
        // Store error in cache
        this.cache.set(queryKey, {
          data: cached?.data as TData,
          error,
          dataUpdatedAt: cached?.dataUpdatedAt ?? 0,
        });
        this.promises.delete(queryKey);
        throw error;
      });

    this.promises.set(queryKey, promise);

    // Throw promise for Suspense
    throw promise;
  }

  /**
   * Prefetch query data
   */
  public async prefetch<TData>(
    queryKey: string,
    queryFn: () => Promise<TData>,
    staleTime: number = 0
  ): Promise<void> {
    const cached = this.cache.get(queryKey) as QueryCacheEntry<TData> | undefined;

    // Skip if fresh data exists
    if (cached && !this.isStale(queryKey, staleTime)) {
      return;
    }

    // Execute fetch
    try {
      const data = await queryFn();
      this.cache.set(queryKey, {
        data,
        dataUpdatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Prefetch error:', error);
      // Don't throw - prefetch failures are non-fatal
    }
  }

  /**
   * Check if data is stale
   */
  private isStale(queryKey: string, staleTime: number): boolean {
    const cached = this.cache.get(queryKey);
    if (!cached) return true;

    const age = Date.now() - cached.dataUpdatedAt;
    return age > staleTime;
  }

  /**
   * Invalidate query
   */
  public invalidate(queryKey: string): void {
    this.cache.delete(queryKey);
    this.promises.delete(queryKey);
  }

  /**
   * Set query data manually
   */
  public setQueryData<TData>(queryKey: string, data: TData): void {
    this.cache.set(queryKey, {
      data,
      dataUpdatedAt: Date.now(),
    });
  }

  /**
   * Get query data without suspending
   */
  public getQueryData<TData>(queryKey: string): TData | undefined {
    const cached = this.cache.get(queryKey) as QueryCacheEntry<TData> | undefined;
    return cached?.data;
  }

  /**
   * Clear all cache
   */
  public clear(): void {
    this.cache.clear();
    this.promises.clear();
  }
}

// Global Suspense cache instance
let globalSuspenseCache: SuspenseQueryCache | null = null;

export function getSuspenseCache(): SuspenseQueryCache {
  if (!globalSuspenseCache) {
    globalSuspenseCache = new SuspenseQueryCache();
  }
  return globalSuspenseCache;
}

export function setSuspenseCache(cache: SuspenseQueryCache): void {
  globalSuspenseCache = cache;
}
```

### Step 3: Implement useSuspenseQuery Hook (1 hour)

**File:** `packages/query/react/useSuspenseQuery.tsx`

```typescript
import { useCallback, useRef } from 'react';
import { useStore } from '@nexus-state/react';
import { getSuspenseCache } from '../src/suspense-cache';
import type { SuspenseQueryOptions, SuspenseQueryResult } from './types';

/**
 * Hook for fetching data with React Suspense
 * 
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: number }) {
 *   const { data } = useSuspenseQuery(
 *     `user-${userId}`,
 *     async () => {
 *       const response = await fetch(`/api/users/${userId}`);
 *       return response.json();
 *     }
 *   );
 * 
 *   return <div>{data.name}</div>; // No loading check needed
 * }
 * 
 * // Wrap with Suspense
 * <Suspense fallback={<Loading />}>
 *   <UserProfile userId={1} />
 * </Suspense>
 * ```
 */
export function useSuspenseQuery<TData = unknown, TError = Error>(
  queryKey: string | readonly unknown[],
  queryFn: () => Promise<TData>,
  options: SuspenseQueryOptions<TData, TError> = {}
): SuspenseQueryResult<TData, TError> {
  const store = useStore();
  const cache = getSuspenseCache();
  const queryFnRef = useRef(queryFn);

  // Keep queryFn ref updated
  queryFnRef.current = queryFn;

  // Serialize query key
  const stringQueryKey = typeof queryKey === 'string' 
    ? queryKey 
    : JSON.stringify(queryKey);

  // Read from cache (will throw promise or error)
  const data = cache.read<TData>(
    stringQueryKey,
    queryFnRef.current,
    options.staleTime ?? 0
  );

  // Create stable refetch function
  const refetch = useCallback(async () => {
    cache.invalidate(stringQueryKey);
    await cache.prefetch(stringQueryKey, queryFnRef.current, options.staleTime);
  }, [cache, stringQueryKey, options.staleTime]);

  const remove = useCallback(() => {
    cache.invalidate(stringQueryKey);
  }, [cache, stringQueryKey]);

  // Data is guaranteed to exist here (or Suspense threw)
  return {
    data: data as TData,
    error: null,
    isLoading: false,
    isSuccess: true,
    isFetching: false, // TODO: Track background refetch
    isStale: false,    // TODO: Implement stale check
    refetch,
    remove,
  };
}
```

### Step 4: Update useQuery with Suspense Option (45 min)

**File:** `packages/query/react/useQuery.tsx`

Update existing hook to support suspense mode:

```typescript
export function useQuery<TData = unknown, TError = Error>(
  queryKey: string | readonly unknown[],
  queryFn: () => Promise<TData>,
  options: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> = {}
): UseQueryResult<TData, TError> {
  // If suspense enabled, delegate to useSuspenseQuery
  if (options.suspense) {
    const result = useSuspenseQuery<TData, TError>(queryKey, queryFn, options);
    return result as UseQueryResult<TData, TError>;
  }

  // ... existing implementation
}
```

### Step 5: Implement Prefetching Utilities (1 hour)

**File:** `packages/query/react/prefetch.ts`

```typescript
import { getSuspenseCache } from '../src/suspense-cache';
import type { PrefetchOptions } from './types';

/**
 * Prefetch query data before component renders
 * 
 * @example
 * ```tsx
 * // In loader or parent component
 * await prefetchQuery({
 *   queryKey: 'user-1',
 *   queryFn: () => fetch('/api/users/1').then(r => r.json()),
 *   staleTime: 5 * 60 * 1000,
 * });
 * 
 * // Later in component - data is already cached
 * function User() {
 *   const { data } = useSuspenseQuery('user-1', fetchUser);
 *   return <div>{data.name}</div>;
 * }
 * ```
 */
export async function prefetchQuery(options: PrefetchOptions): Promise<void> {
  const cache = getSuspenseCache();
  const queryKey = typeof options.queryKey === 'string'
    ? options.queryKey
    : JSON.stringify(options.queryKey);

  if (options.force) {
    cache.invalidate(queryKey);
  }

  await cache.prefetch(queryKey, options.queryFn, options.staleTime);
}

/**
 * Prefetch multiple queries in parallel
 * 
 * @example
 * ```tsx
 * await prefetchQueries([
 *   { queryKey: 'user', queryFn: fetchUser },
 *   { queryKey: 'posts', queryFn: fetchPosts },
 *   { queryKey: 'comments', queryFn: fetchComments },
 * ]);
 * ```
 */
export async function prefetchQueries(
  queries: PrefetchOptions[]
): Promise<void> {
  await Promise.all(queries.map(prefetchQuery));
}

/**
 * Set query data in cache without fetching
 * 
 * @example
 * ```tsx
 * // Optimistic update
 * setQueryData('user-1', { id: 1, name: 'John' });
 * ```
 */
export function setQueryData<TData>(
  queryKey: string | readonly unknown[],
  data: TData
): void {
  const cache = getSuspenseCache();
  const stringKey = typeof queryKey === 'string'
    ? queryKey
    : JSON.stringify(queryKey);

  cache.setQueryData(stringKey, data);
}

/**
 * Get query data from cache without suspending
 * 
 * @example
 * ```tsx
 * const userData = getQueryData<User>('user-1');
 * if (userData) {
 *   console.log(userData.name);
 * }
 * ```
 */
export function getQueryData<TData>(
  queryKey: string | readonly unknown[]
): TData | undefined {
  const cache = getSuspenseCache();
  const stringKey = typeof queryKey === 'string'
    ? queryKey
    : JSON.stringify(queryKey);

  return cache.getQueryData<TData>(stringKey);
}

/**
 * Invalidate query cache
 * 
 * @example
 * ```tsx
 * // After mutation
 * invalidateQuery('users');
 * ```
 */
export function invalidateQuery(
  queryKey: string | readonly unknown[]
): void {
  const cache = getSuspenseCache();
  const stringKey = typeof queryKey === 'string'
    ? queryKey
    : JSON.stringify(queryKey);

  cache.invalidate(stringKey);
}
```

### Step 6: Add Tests (1.5 hours)

**File:** `packages/query/react/__tests__/useSuspenseQuery.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { QueryClientProvider, createQueryClient } from '../QueryClientProvider';
import { useSuspenseQuery } from '../useSuspenseQuery';
import { prefetchQuery, setQueryData } from '../prefetch';

describe('useSuspenseQuery', () => {
  it('should suspend while loading', async () => {
    const queryFn = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { name: 'John' };
    });

    function User() {
      const { data } = useSuspenseQuery('user', queryFn);
      return <div>Name: {data.name}</div>;
    }

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <User />
      </Suspense>
    );

    // Should show fallback
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for data
    await waitFor(() => {
      expect(screen.getByText('Name: John')).toBeInTheDocument();
    });

    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('should not suspend with cached data', async () => {
    const queryFn = vi.fn(async () => ({ name: 'John' }));

    // Prefetch
    await prefetchQuery({
      queryKey: 'user-cached',
      queryFn,
      staleTime: 5000,
    });

    function User() {
      const { data } = useSuspenseQuery('user-cached', queryFn);
      return <div>Name: {data.name}</div>;
    }

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <User />
      </Suspense>
    );

    // Should render immediately
    expect(screen.getByText('Name: John')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should throw error to boundary', async () => {
    const error = new Error('Fetch failed');
    const queryFn = vi.fn(async () => {
      throw error;
    });

    function User() {
      const { data } = useSuspenseQuery('user-error', queryFn);
      return <div>Name: {data.name}</div>;
    }

    class ErrorBoundary extends React.Component<
      { children: React.ReactNode },
      { hasError: boolean; error: Error | null }
    > {
      state = { hasError: false, error: null };

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
      }

      render() {
        if (this.state.hasError) {
          return <div>Error: {this.state.error?.message}</div>;
        }
        return this.props.children;
      }
    }

    render(
      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <User />
        </Suspense>
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Fetch failed')).toBeInTheDocument();
    });
  });

  it('should refetch on refetch()', async () => {
    let callCount = 0;
    const queryFn = vi.fn(async () => {
      callCount++;
      return { name: `User ${callCount}` };
    });

    function User() {
      const { data, refetch } = useSuspenseQuery('user-refetch', queryFn);
      return (
        <div>
          <div>Name: {data.name}</div>
          <button onClick={refetch}>Refetch</button>
        </div>
      );
    }

    const { getByText } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <User />
      </Suspense>
    );

    await waitFor(() => {
      expect(screen.getByText('Name: User 1')).toBeInTheDocument();
    });

    // Refetch
    getByText('Refetch').click();

    await waitFor(() => {
      expect(screen.getByText('Name: User 2')).toBeInTheDocument();
    });

    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('should use setQueryData', () => {
    const queryFn = vi.fn(async () => ({ name: 'Fetched' }));

    setQueryData('user-set', { name: 'Manual' });

    function User() {
      const { data } = useSuspenseQuery('user-set', queryFn);
      return <div>Name: {data.name}</div>;
    }

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <User />
      </Suspense>
    );

    // Should use manual data
    expect(screen.getByText('Name: Manual')).toBeInTheDocument();
    expect(queryFn).not.toHaveBeenCalled();
  });

  it('should deduplicate concurrent requests', async () => {
    const queryFn = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { name: 'John' };
    });

    function User1() {
      const { data } = useSuspenseQuery('user-dedup', queryFn);
      return <div>User1: {data.name}</div>;
    }

    function User2() {
      const { data } = useSuspenseQuery('user-dedup', queryFn);
      return <div>User2: {data.name}</div>;
    }

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <User1 />
        <User2 />
      </Suspense>
    );

    await waitFor(() => {
      expect(screen.getByText('User1: John')).toBeInTheDocument();
      expect(screen.getByText('User2: John')).toBeInTheDocument();
    });

    // Should only fetch once
    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});
```

### Step 7: Update Documentation (30 min)

**File:** `packages/query/README.md`

Add Suspense section:

```markdown
## React Suspense

Use React Suspense for declarative loading states.

### useSuspenseQuery

```tsx
import { Suspense } from 'react';
import { useSuspenseQuery } from '@nexus-state/query/react';

function UserProfile({ userId }: { userId: number }) {
  // No loading state needed - Suspense handles it
  const { data } = useSuspenseQuery(
    `user-${userId}`,
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    }
  );

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
}

// Wrap with Suspense boundary
function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UserProfile userId={1} />
    </Suspense>
  );
}
```

### Prefetching

```tsx
import { prefetchQuery } from '@nexus-state/query/react';

// Prefetch before navigation
async function handleNavigate() {
  await prefetchQuery({
    queryKey: 'user-2',
    queryFn: () => fetch('/api/users/2').then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });
  
  navigate('/users/2');
}
```

### Error Boundaries

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<Loading />}>
        <UserProfile userId={1} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### SSR Support

```tsx
// Server-side prefetch
export async function getServerSideProps() {
  await prefetchQuery({
    queryKey: 'user',
    queryFn: fetchUser,
  });

  return {
    props: {},
  };
}

// Client hydrates from cache
function Page() {
  const { data } = useSuspenseQuery('user', fetchUser);
  return <div>{data.name}</div>;
}
```
```

---

## ✅ Acceptance Criteria

### Functional Requirements
- [ ] `useSuspenseQuery` suspends during loading
- [ ] Errors thrown to Error Boundary
- [ ] Prefetching works correctly
- [ ] Cache deduplication
- [ ] SSR hydration support
- [ ] `setQueryData` / `getQueryData` utilities

### Code Quality
- [ ] TypeScript strict mode passes
- [ ] All tests pass
- [ ] Test coverage ≥95%
- [ ] No ESLint errors
- [ ] Proper JSDoc comments

### Documentation
- [ ] README with Suspense examples
- [ ] Prefetch API reference
- [ ] SSR guide
- [ ] Migration guide

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Suspense behavior
- [ ] Error boundary integration
- [ ] Cache hits/misses
- [ ] Prefetching
- [ ] Deduplication

### Integration Tests
- [ ] Multiple Suspense boundaries
- [ ] Parallel queries
- [ ] SSR scenarios
- [ ] Error recovery

---

## 📦 Deliverables

- [ ] `suspense-cache.ts` - Enhanced cache for Suspense
- [ ] `useSuspenseQuery.tsx` - Suspense query hook
- [ ] `prefetch.ts` - Prefetching utilities
- [ ] Updated `useQuery` with suspense option
- [ ] Type definitions
- [ ] Test suite
- [ ] Updated README
- [ ] SSR examples

---

## 🔗 Dependencies

### Depends On
- ECO-006: React hooks

### Enables
- ECO-014: useInfiniteQuery with Suspense
- Better SSR/SSG support
- Improved DX with declarative loading

---

## 📝 Notes

### Design Decisions

1. **Separate Hook**: `useSuspenseQuery` vs option in `useQuery` for clarity
2. **Cache Strategy**: Separate Suspense cache for promise tracking
3. **Prefetching**: Explicit API for SSR and route prefetching
4. **Error Handling**: Use Error Boundaries (React 18+ pattern)

### Future Enhancements

- Streaming SSR support (React 18+)
- Automatic route-based prefetching
- Suspense list optimization
- Partial hydration

---

**Created:** 2026-03-01
**Last Updated:** 2026-03-01
**Assignee:** TBD
