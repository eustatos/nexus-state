# ECO-016: Implement Advanced Prefetching for @nexus-state/query

**Status:** 🔵 Not Started
**Priority:** 🟡 Medium
**Estimated Time:** 3-4 hours
**Dependencies:** ECO-006 (React hooks), ECO-013 (Suspense)
**Package:** @nexus-state/query

---

## 📋 Overview

Implement comprehensive prefetching utilities for `@nexus-state/query` to enable proactive data loading, route prefetching, and improved perceived performance.

**Key Goals:**
- Programmatic prefetch API
- Route-based prefetching
- Hover/focus prefetching
- Prefetch strategies (on mount, on idle, on viewport)
- TypeScript support

---

## 🎯 Objectives

### Must Have
- [ ] `prefetchQuery()` API
- [ ] `queryClient.prefetchQuery()` method
- [ ] Prefetch on hover utility
- [ ] Prefetch on viewport (Intersection Observer)
- [ ] Prefetch cancellation
- [ ] Cache integration

### Should Have
- [ ] `usePrefetch()` hook
- [ ] Link-based prefetching
- [ ] Prefetch on idle (requestIdleCallback)
- [ ] Prefetch priority levels
- [ ] Batch prefetch utilities

### Nice to Have
- [ ] Route-based auto prefetch
- [ ] Predictive prefetching (ML-based)
- [ ] Prefetch analytics
- [ ] Prefetch budget limits

---

## 🏗️ Implementation Plan

### Step 1: Define Prefetch Types (30 min)

**File:** `packages/query/src/prefetch/types.ts`

```typescript
export interface PrefetchOptions {
  queryKey: string | readonly unknown[];
  queryFn: () => Promise<unknown>;
  staleTime?: number;
  force?: boolean; // Force refetch even if cached
  priority?: 'high' | 'normal' | 'low';
  timeout?: number; // Abort after timeout
}

export interface PrefetchTrigger {
  type: 'hover' | 'focus' | 'viewport' | 'idle' | 'manual';
  delay?: number; // Delay before prefetch
  threshold?: number; // For viewport (0-1)
}

export interface PrefetchResult {
  queryKey: string;
  status: 'pending' | 'success' | 'error' | 'cancelled';
  startedAt: number;
  endedAt?: number;
}

export interface PrefetchManager {
  prefetch(options: PrefetchOptions): Promise<void>;
  cancel(queryKey: string | readonly unknown[]): void;
  cancelAll(): void;
  getPrefetchStatus(queryKey: string | readonly unknown[]): PrefetchResult | null;
}
```

### Step 2: Implement Prefetch Manager (1.5 hours)

**File:** `packages/query/src/prefetch/prefetch-manager.ts`

```typescript
import { getQueryCache } from '../query';
import type { PrefetchOptions, PrefetchResult, PrefetchManager } from './types';

export function createPrefetchManager(): PrefetchManager {
  const cache = getQueryCache();
  const abortControllers = new Map<string, AbortController>();
  const prefetchResults = new Map<string, PrefetchResult>();

  const serializeKey = (queryKey: string | readonly unknown[]): string => {
    return typeof queryKey === 'string' ? queryKey : JSON.stringify(queryKey);
  };

  const prefetch = async (options: PrefetchOptions): Promise<void> => {
    const queryKey = serializeKey(options.queryKey);
    const staleTime = options.staleTime ?? 0;

    // Check if already cached and fresh
    if (!options.force && !cache.isStale(queryKey)) {
      return;
    }

    // Cancel existing prefetch for same key
    cancel(options.queryKey);

    // Create abort controller
    const controller = new AbortController();
    abortControllers.set(queryKey, controller);

    // Track prefetch
    const result: PrefetchResult = {
      queryKey,
      status: 'pending',
      startedAt: Date.now(),
    };
    prefetchResults.set(queryKey, result);

    try {
      // Execute with timeout
      const fetchPromise = options.queryFn();
      const timeoutPromise = options.timeout
        ? new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Prefetch timeout')), options.timeout)
          )
        : null;

      const data = timeoutPromise
        ? await Promise.race([fetchPromise, timeoutPromise])
        : await fetchPromise;

      // Check if cancelled
      if (controller.signal.aborted) {
        result.status = 'cancelled';
        return;
      }

      // Update cache
      cache.set(queryKey, data, staleTime);

      // Update result
      result.status = 'success';
      result.endedAt = Date.now();
    } catch (error) {
      if (controller.signal.aborted) {
        result.status = 'cancelled';
      } else {
        result.status = 'error';
        result.endedAt = Date.now();
        console.error('Prefetch error:', error);
      }
    } finally {
      abortControllers.delete(queryKey);
    }
  };

  const cancel = (queryKey: string | readonly unknown[]): void => {
    const key = serializeKey(queryKey);
    const controller = abortControllers.get(key);
    if (controller) {
      controller.abort();
      abortControllers.delete(key);
    }
  };

  const cancelAll = (): void => {
    abortControllers.forEach((controller) => controller.abort());
    abortControllers.clear();
  };

  const getPrefetchStatus = (
    queryKey: string | readonly unknown[]
  ): PrefetchResult | null => {
    const key = serializeKey(queryKey);
    return prefetchResults.get(key) ?? null;
  };

  return {
    prefetch,
    cancel,
    cancelAll,
    getPrefetchStatus,
  };
}

// Global instance
let globalPrefetchManager: PrefetchManager | null = null;

export function getPrefetchManager(): PrefetchManager {
  if (!globalPrefetchManager) {
    globalPrefetchManager = createPrefetchManager();
  }
  return globalPrefetchManager;
}
```

### Step 3: Implement Prefetch Hooks (1.5 hours)

**File:** `packages/query/react/usePrefetch.tsx`

```typescript
import { useCallback, useEffect, useRef } from 'react';
import { getPrefetchManager } from '../src/prefetch/prefetch-manager';
import type { PrefetchOptions, PrefetchTrigger } from '../src/prefetch/types';

/**
 * Hook for programmatic prefetching
 * 
 * @example
 * ```tsx
 * function UserList() {
 *   const prefetchUser = usePrefetch();
 * 
 *   return (
 *     <div>
 *       {users.map(user => (
 *         <div
 *           key={user.id}
 *           onMouseEnter={() => prefetchUser({
 *             queryKey: `user-${user.id}`,
 *             queryFn: () => fetchUser(user.id),
 *           })}
 *         >
 *           {user.name}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrefetch() {
  const manager = getPrefetchManager();

  return useCallback(
    async (options: PrefetchOptions) => {
      await manager.prefetch(options);
    },
    [manager]
  );
}

/**
 * Hook for hover-based prefetching
 * 
 * @example
 * ```tsx
 * function UserLink({ userId }) {
 *   const { onMouseEnter, onMouseLeave } = usePrefetchOnHover({
 *     queryKey: `user-${userId}`,
 *     queryFn: () => fetchUser(userId),
 *     delay: 200,
 *   });
 * 
 *   return (
 *     <a {...{ onMouseEnter, onMouseLeave }}>
 *       View User
 *     </a>
 *   );
 * }
 * ```
 */
export function usePrefetchOnHover(options: PrefetchOptions & { delay?: number }) {
  const manager = getPrefetchManager();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const onMouseEnter = useCallback(() => {
    const delay = options.delay ?? 150;

    timerRef.current = setTimeout(() => {
      manager.prefetch(options);
    }, delay);
  }, [manager, options]);

  const onMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      manager.cancel(options.queryKey);
    }
  }, [manager, options.queryKey]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { onMouseEnter, onMouseLeave };
}

/**
 * Hook for viewport-based prefetching (Intersection Observer)
 * 
 * @example
 * ```tsx
 * function LazyImage({ imageId }) {
 *   const ref = usePrefetchOnViewport({
 *     queryKey: `image-${imageId}`,
 *     queryFn: () => fetchImage(imageId),
 *     threshold: 0.5, // Prefetch when 50% visible
 *   });
 * 
 *   return <div ref={ref}><img src={...} /></div>;
 * }
 * ```
 */
export function usePrefetchOnViewport<T extends HTMLElement = HTMLDivElement>(
  options: PrefetchOptions & { threshold?: number }
) {
  const manager = getPrefetchManager();
  const ref = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            manager.prefetch(options);
            observerRef.current?.disconnect();
          }
        });
      },
      { threshold: options.threshold ?? 0.1 }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [manager, options]);

  return ref;
}

/**
 * Hook for idle-based prefetching (requestIdleCallback)
 * 
 * @example
 * ```tsx
 * function Page() {
 *   usePrefetchOnIdle([
 *     {
 *       queryKey: 'user',
 *       queryFn: fetchUser,
 *     },
 *     {
 *       queryKey: 'posts',
 *       queryFn: fetchPosts,
 *     },
 *   ]);
 * 
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePrefetchOnIdle(queries: PrefetchOptions[]) {
  const manager = getPrefetchManager();

  useEffect(() => {
    const requestIdleCallback =
      (window as any).requestIdleCallback ||
      ((cb: () => void) => setTimeout(cb, 1));

    const handle = requestIdleCallback(() => {
      queries.forEach((options) => {
        manager.prefetch(options);
      });
    });

    return () => {
      const cancelIdleCallback =
        (window as any).cancelIdleCallback || clearTimeout;
      cancelIdleCallback(handle);
    };
  }, [manager, queries]);
}
```

### Step 4: Implement Prefetch Link Component (45 min)

**File:** `packages/query/react/PrefetchLink.tsx`

```tsx
import React, { useCallback } from 'react';
import { usePrefetchOnHover } from './usePrefetch';
import type { PrefetchOptions } from '../src/prefetch/types';

export interface PrefetchLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  prefetch?: PrefetchOptions;
  prefetchDelay?: number;
}

/**
 * Link component with automatic prefetching on hover
 * 
 * @example
 * ```tsx
 * <PrefetchLink
 *   href="/users/1"
 *   prefetch={{
 *     queryKey: 'user-1',
 *     queryFn: () => fetchUser(1),
 *   }}
 *   prefetchDelay={200}
 * >
 *   View User
 * </PrefetchLink>
 * ```
 */
export function PrefetchLink({
  prefetch,
  prefetchDelay,
  children,
  ...props
}: PrefetchLinkProps) {
  const { onMouseEnter, onMouseLeave } = usePrefetchOnHover({
    ...prefetch!,
    delay: prefetchDelay,
  });

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (prefetch) {
        onMouseEnter();
      }
      props.onMouseEnter?.(e);
    },
    [prefetch, onMouseEnter, props]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (prefetch) {
        onMouseLeave();
      }
      props.onMouseLeave?.(e);
    },
    [prefetch, onMouseLeave, props]
  );

  return (
    <a {...props} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
    </a>
  );
}
```

### Step 5: Add Tests (1 hour)

**File:** `packages/query/src/prefetch/__tests__/prefetch-manager.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrefetchManager } from '../prefetch-manager';
import { setQueryCache, createQueryCache } from '../../cache';

describe('PrefetchManager', () => {
  beforeEach(() => {
    setQueryCache(createQueryCache());
  });

  it('should prefetch query', async () => {
    const manager = createPrefetchManager();
    const queryFn = vi.fn(async () => ({ data: 'test' }));

    await manager.prefetch({
      queryKey: 'test',
      queryFn,
    });

    expect(queryFn).toHaveBeenCalledTimes(1);

    const status = manager.getPrefetchStatus('test');
    expect(status?.status).toBe('success');
  });

  it('should skip prefetch if cached and fresh', async () => {
    const manager = createPrefetchManager();
    const queryFn = vi.fn(async () => ({ data: 'test' }));

    // First prefetch
    await manager.prefetch({
      queryKey: 'test',
      queryFn,
      staleTime: 5000,
    });

    // Second prefetch (should be skipped)
    await manager.prefetch({
      queryKey: 'test',
      queryFn,
      staleTime: 5000,
    });

    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('should force prefetch when force: true', async () => {
    const manager = createPrefetchManager();
    const queryFn = vi.fn(async () => ({ data: 'test' }));

    await manager.prefetch({
      queryKey: 'test',
      queryFn,
      staleTime: 5000,
    });

    await manager.prefetch({
      queryKey: 'test',
      queryFn,
      force: true,
    });

    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('should cancel prefetch', async () => {
    const manager = createPrefetchManager();
    const queryFn = vi.fn(
      async () =>
        new Promise((resolve) => setTimeout(() => resolve({ data: 'test' }), 1000))
    );

    const promise = manager.prefetch({
      queryKey: 'test',
      queryFn,
    });

    manager.cancel('test');

    await promise;

    const status = manager.getPrefetchStatus('test');
    expect(status?.status).toBe('cancelled');
  });

  it('should handle prefetch timeout', async () => {
    const manager = createPrefetchManager();
    const queryFn = vi.fn(
      async () =>
        new Promise((resolve) => setTimeout(() => resolve({ data: 'test' }), 2000))
    );

    await manager.prefetch({
      queryKey: 'test',
      queryFn,
      timeout: 100,
    });

    const status = manager.getPrefetchStatus('test');
    expect(status?.status).toBe('error');
  });

  it('should cancel all prefetches', async () => {
    const manager = createPrefetchManager();
    const queryFn = vi.fn(
      async () =>
        new Promise((resolve) => setTimeout(() => resolve({ data: 'test' }), 1000))
    );

    manager.prefetch({ queryKey: 'test-1', queryFn });
    manager.prefetch({ queryKey: 'test-2', queryFn });

    manager.cancelAll();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(manager.getPrefetchStatus('test-1')?.status).toBe('cancelled');
    expect(manager.getPrefetchStatus('test-2')?.status).toBe('cancelled');
  });
});
```

### Step 6: Update Documentation (30 min)

**File:** `packages/query/README.md`

Add prefetching section:

```markdown
## Prefetching

Proactively load data for improved perceived performance.

### Programmatic Prefetch

```tsx
import { usePrefetch } from '@nexus-state/query/react';

function UserList() {
  const prefetchUser = usePrefetch();

  return (
    <div>
      {users.map(user => (
        <div
          key={user.id}
          onMouseEnter={() => prefetchUser({
            queryKey: `user-${user.id}`,
            queryFn: () => fetchUser(user.id),
            staleTime: 5 * 60 * 1000,
          })}
        >
          {user.name}
        </div>
      ))}
    </div>
  );
}
```

### Hover Prefetch

```tsx
import { usePrefetchOnHover } from '@nexus-state/query/react';

function UserLink({ userId }) {
  const { onMouseEnter, onMouseLeave } = usePrefetchOnHover({
    queryKey: `user-${userId}`,
    queryFn: () => fetchUser(userId),
    delay: 200, // Wait 200ms before prefetching
  });

  return (
    <a href={`/users/${userId}`} {...{ onMouseEnter, onMouseLeave }}>
      View Profile
    </a>
  );
}
```

### Prefetch Link

```tsx
import { PrefetchLink } from '@nexus-state/query/react';

<PrefetchLink
  href="/users/1"
  prefetch={{
    queryKey: 'user-1',
    queryFn: () => fetchUser(1),
  }}
  prefetchDelay={150}
>
  View User
</PrefetchLink>
```

### Viewport Prefetch

```tsx
import { usePrefetchOnViewport } from '@nexus-state/query/react';

function LazySection({ sectionId }) {
  const ref = usePrefetchOnViewport({
    queryKey: `section-${sectionId}`,
    queryFn: () => fetchSection(sectionId),
    threshold: 0.5, // Prefetch when 50% visible
  });

  return <div ref={ref}>...</div>;
}
```

### Idle Prefetch

```tsx
import { usePrefetchOnIdle } from '@nexus-state/query/react';

function Page() {
  // Prefetch when browser is idle
  usePrefetchOnIdle([
    {
      queryKey: 'user',
      queryFn: fetchUser,
    },
    {
      queryKey: 'posts',
      queryFn: fetchPosts,
    },
  ]);

  return <div>...</div>;
}
```

### Route Prefetch

```tsx
// In your router
import { getPrefetchManager } from '@nexus-state/query';

router.beforeEach(async (to, from, next) => {
  const manager = getPrefetchManager();
  
  // Prefetch data for next route
  await manager.prefetch({
    queryKey: `page-${to.path}`,
    queryFn: () => fetchPageData(to.path),
  });
  
  next();
});
```
```

---

## ✅ Acceptance Criteria

### Functional Requirements
- [ ] `usePrefetch()` hook works
- [ ] Hover prefetch works
- [ ] Viewport prefetch works
- [ ] Idle prefetch works
- [ ] Prefetch cancellation
- [ ] Cache integration

### Code Quality
- [ ] TypeScript strict mode passes
- [ ] All tests pass
- [ ] Test coverage ≥90%
- [ ] No ESLint errors
- [ ] Proper JSDoc comments

### Documentation
- [ ] README with examples
- [ ] API reference
- [ ] Best practices guide
- [ ] Performance tips

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Prefetch manager
- [ ] Cache integration
- [ ] Cancellation
- [ ] Timeout handling

### Integration Tests
- [ ] Hook behavior
- [ ] Intersection Observer
- [ ] requestIdleCallback

---

## 📦 Deliverables

- [ ] `prefetch/` directory
- [ ] Prefetch hooks
- [ ] `PrefetchLink` component
- [ ] Test suite
- [ ] Updated README
- [ ] Examples

---

## 🔗 Dependencies

### Depends On
- ECO-006: React hooks
- ECO-013: Suspense support (optional)

### Enables
- Faster page loads
- Better perceived performance
- Proactive data loading

---

## 📝 Notes

### Design Decisions

1. **Manager Pattern**: Centralized prefetch management
2. **Cancellation**: AbortController for clean cancellation
3. **Multiple Triggers**: Support various prefetch strategies
4. **Cache Aware**: Respect existing cache

### Future Enhancements

- ML-based predictive prefetching
- Bandwidth-aware prefetching
- Prefetch analytics
- Prefetch budget management

---

**Created:** 2026-03-01
**Last Updated:** 2026-03-01
**Assignee:** TBD
