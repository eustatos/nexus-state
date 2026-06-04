# ECO-014: Implement useInfiniteQuery for Pagination

**Status:** 🔵 Not Started
**Priority:** 🔴 High
**Estimated Time:** 4-5 hours
**Dependencies:** ECO-006 (React hooks)
**Package:** @nexus-state/query

---

## 📋 Overview

Implement `useInfiniteQuery` hook for infinite scrolling and cursor-based pagination, similar to TanStack Query's infinite queries.

**Key Goals:**
- Cursor-based pagination support
- Offset-based pagination support
- Bi-directional scrolling (load more / load previous)
- Automatic page deduplication
- TypeScript support with proper inference

---

## 🎯 Objectives

### Must Have
- [ ] `useInfiniteQuery` hook
- [ ] Cursor-based pagination
- [ ] Offset-based pagination
- [ ] `fetchNextPage()` / `fetchPreviousPage()`
- [ ] `hasNextPage` / `hasPreviousPage` indicators
- [ ] Flat data structure with `pages` array
- [ ] Page param tracking

### Should Have
- [ ] `isFetchingNextPage` / `isFetchingPreviousPage` states
- [ ] Page deduplication
- [ ] Prefetch next page
- [ ] Refetch all pages
- [ ] Remove specific pages

### Nice to Have
- [ ] Bi-directional infinite scroll
- [ ] Window scrolling integration
- [ ] Intersection Observer helper
- [ ] Suspense support for infinite queries

---

## 🏗️ Implementation Plan

### Step 1: Define Infinite Query Types (45 min)

**File:** `packages/query/react/types.ts`

```typescript
export interface InfiniteQueryPageParam {
  pageParam: unknown;
}

export interface InfiniteQueryOptions<TData, TError, TPageParam = unknown> {
  queryKey: string | readonly unknown[];
  queryFn: (context: { pageParam: TPageParam }) => Promise<TData>;
  initialPageParam: TPageParam;
  getNextPageParam: (lastPage: TData, allPages: TData[]) => TPageParam | undefined;
  getPreviousPageParam?: (firstPage: TData, allPages: TData[]) => TPageParam | undefined;
  staleTime?: number;
  enabled?: boolean;
  retry?: number | boolean;
  onSuccess?: (data: InfiniteData<TData>) => void;
  onError?: (error: TError) => void;
}

export interface InfiniteData<TData> {
  pages: TData[];
  pageParams: unknown[];
}

export interface InfiniteQueryResult<TData, TError> {
  data: InfiniteData<TData> | undefined;
  error: TError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  refetch: () => Promise<void>;
  remove: () => void;
}
```

### Step 2: Implement Core Infinite Query Logic (2 hours)

**File:** `packages/query/src/infinite-query.ts`

```typescript
import { atom, Store } from '@nexus-state/core';
import type { InfiniteData, InfiniteQueryOptions } from '../react/types';

interface InfiniteQueryState<TData, TError> {
  data: InfiniteData<TData> | undefined;
  error: TError | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
}

function createInitialState<TData, TError>(): InfiniteQueryState<TData, TError> {
  return {
    data: undefined,
    error: null,
    status: 'idle',
    isLoading: false,
    isSuccess: false,
    isError: false,
    isFetching: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
  };
}

export function createInfiniteQuery<TData, TError, TPageParam>(
  store: Store,
  options: InfiniteQueryOptions<TData, TError, TPageParam>
) {
  const queryKey = typeof options.queryKey === 'string'
    ? options.queryKey
    : JSON.stringify(options.queryKey);

  const stateAtom = atom<InfiniteQueryState<TData, TError>>(
    createInitialState(),
    `infinite-query:${queryKey}`
  );

  // Update state helper
  const updateState = (updates: Partial<InfiniteQueryState<TData, TError>>) => {
    store.set(stateAtom, (prev) => {
      const next = { ...prev, ...updates };
      next.isLoading = next.status === 'loading' && !prev.data;
      next.isSuccess = next.status === 'success';
      next.isError = next.status === 'error';
      return next;
    });
  };

  // Fetch initial page
  const fetchInitialPage = async (): Promise<void> => {
    updateState({
      status: 'loading',
      isFetching: true,
      error: null,
    });

    try {
      const firstPage = await options.queryFn({
        pageParam: options.initialPageParam,
      });

      updateState({
        status: 'success',
        data: {
          pages: [firstPage],
          pageParams: [options.initialPageParam],
        },
        isFetching: false,
      });

      options.onSuccess?.({
        pages: [firstPage],
        pageParams: [options.initialPageParam],
      });
    } catch (error) {
      updateState({
        status: 'error',
        error: error as TError,
        isFetching: false,
      });

      options.onError?.(error as TError);
    }
  };

  // Fetch next page
  const fetchNextPage = async (): Promise<void> => {
    const currentState = store.get(stateAtom);
    const { data } = currentState;

    if (!data || data.pages.length === 0) {
      await fetchInitialPage();
      return;
    }

    // Get next page param
    const nextPageParam = options.getNextPageParam(
      data.pages[data.pages.length - 1],
      data.pages
    );

    if (nextPageParam === undefined) {
      // No more pages
      return;
    }

    updateState({
      isFetchingNextPage: true,
      isFetching: true,
    });

    try {
      const nextPage = await options.queryFn({
        pageParam: nextPageParam,
      });

      updateState({
        data: {
          pages: [...data.pages, nextPage],
          pageParams: [...data.pageParams, nextPageParam],
        },
        isFetchingNextPage: false,
        isFetching: false,
      });
    } catch (error) {
      updateState({
        error: error as TError,
        isFetchingNextPage: false,
        isFetching: false,
      });

      options.onError?.(error as TError);
      throw error;
    }
  };

  // Fetch previous page
  const fetchPreviousPage = async (): Promise<void> => {
    const currentState = store.get(stateAtom);
    const { data } = currentState;

    if (!data || !options.getPreviousPageParam) {
      return;
    }

    // Get previous page param
    const previousPageParam = options.getPreviousPageParam(
      data.pages[0],
      data.pages
    );

    if (previousPageParam === undefined) {
      // No more pages
      return;
    }

    updateState({
      isFetchingPreviousPage: true,
      isFetching: true,
    });

    try {
      const previousPage = await options.queryFn({
        pageParam: previousPageParam,
      });

      updateState({
        data: {
          pages: [previousPage, ...data.pages],
          pageParams: [previousPageParam, ...data.pageParams],
        },
        isFetchingPreviousPage: false,
        isFetching: false,
      });
    } catch (error) {
      updateState({
        error: error as TError,
        isFetchingPreviousPage: false,
        isFetching: false,
      });

      options.onError?.(error as TError);
      throw error;
    }
  };

  // Refetch all pages
  const refetch = async (): Promise<void> => {
    const currentState = store.get(stateAtom);
    const { data } = currentState;

    if (!data) {
      await fetchInitialPage();
      return;
    }

    updateState({
      isFetching: true,
    });

    try {
      const newPages: TData[] = [];

      // Refetch all existing pages
      for (const pageParam of data.pageParams) {
        const page = await options.queryFn({ pageParam: pageParam as TPageParam });
        newPages.push(page);
      }

      updateState({
        data: {
          pages: newPages,
          pageParams: data.pageParams,
        },
        isFetching: false,
      });
    } catch (error) {
      updateState({
        error: error as TError,
        isFetching: false,
      });

      options.onError?.(error as TError);
      throw error;
    }
  };

  // Remove query
  const remove = (): void => {
    updateState(createInitialState());
  };

  // Check if there's a next page
  const hasNextPage = (): boolean => {
    const { data } = store.get(stateAtom);
    if (!data || data.pages.length === 0) return false;

    const nextPageParam = options.getNextPageParam(
      data.pages[data.pages.length - 1],
      data.pages
    );

    return nextPageParam !== undefined;
  };

  // Check if there's a previous page
  const hasPreviousPage = (): boolean => {
    const { data } = store.get(stateAtom);
    if (!data || !options.getPreviousPageParam) return false;

    const previousPageParam = options.getPreviousPageParam(
      data.pages[0],
      data.pages
    );

    return previousPageParam !== undefined;
  };

  return {
    stateAtom,
    fetchInitialPage,
    fetchNextPage,
    fetchPreviousPage,
    refetch,
    remove,
    hasNextPage,
    hasPreviousPage,
  };
}
```

### Step 3: Implement useInfiniteQuery Hook (1.5 hours)

**File:** `packages/query/react/useInfiniteQuery.tsx`

```typescript
import { useEffect, useCallback } from 'react';
import { useAtomValue, useStore } from '@nexus-state/react';
import { createInfiniteQuery } from '../src/infinite-query';
import type { InfiniteQueryOptions, InfiniteQueryResult } from './types';

/**
 * Hook for infinite scrolling and pagination
 * 
 * @example
 * ```tsx
 * interface Post {
 *   id: number;
 *   title: string;
 * }
 * 
 * interface PostsResponse {
 *   posts: Post[];
 *   nextCursor?: number;
 * }
 * 
 * function PostList() {
 *   const {
 *     data,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteQuery<PostsResponse, Error, number>({
 *     queryKey: 'posts',
 *     queryFn: async ({ pageParam }) => {
 *       const response = await fetch(`/api/posts?cursor=${pageParam}`);
 *       return response.json();
 *     },
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *   });
 * 
 *   return (
 *     <div>
 *       {data?.pages.map((page) =>
 *         page.posts.map((post) => (
 *           <div key={post.id}>{post.title}</div>
 *         ))
 *       )}
 *       {hasNextPage && (
 *         <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
 *           {isFetchingNextPage ? 'Loading...' : 'Load More'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInfiniteQuery<TData, TError = Error, TPageParam = unknown>(
  options: InfiniteQueryOptions<TData, TError, TPageParam>
): InfiniteQueryResult<TData, TError> {
  const store = useStore();
  
  const query = createInfiniteQuery<TData, TError, TPageParam>(store, options);
  const state = useAtomValue(query.stateAtom);

  // Initial fetch
  useEffect(() => {
    const enabled = options.enabled ?? true;
    if (enabled && state.status === 'idle') {
      query.fetchInitialPage();
    }
  }, [options.enabled, state.status]);

  // Stable callbacks
  const fetchNextPage = useCallback(async () => {
    await query.fetchNextPage();
  }, [query]);

  const fetchPreviousPage = useCallback(async () => {
    await query.fetchPreviousPage();
  }, [query]);

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const remove = useCallback(() => {
    query.remove();
  }, [query]);

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    isError: state.isError,
    isSuccess: state.isSuccess,
    isFetching: state.isFetching,
    isFetchingNextPage: state.isFetchingNextPage,
    isFetchingPreviousPage: state.isFetchingPreviousPage,
    hasNextPage: query.hasNextPage(),
    hasPreviousPage: query.hasPreviousPage(),
    fetchNextPage,
    fetchPreviousPage,
    refetch,
    remove,
  };
}
```

### Step 4: Add Tests (1.5 hours)

**File:** `packages/query/react/__tests__/useInfiniteQuery.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInfiniteQuery } from '../useInfiniteQuery';

interface Page {
  items: string[];
  nextCursor?: number;
}

describe('useInfiniteQuery', () => {
  it('should fetch initial page', async () => {
    const queryFn = vi.fn(async ({ pageParam }) => ({
      items: [`item-${pageParam}-1`, `item-${pageParam}-2`],
      nextCursor: pageParam + 1,
    }));

    const { result } = renderHook(() =>
      useInfiniteQuery<Page, Error, number>({
        queryKey: 'infinite-test',
        queryFn,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      })
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.data?.pages[0].items).toEqual(['item-0-1', 'item-0-2']);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('should fetch next page', async () => {
    const queryFn = vi.fn(async ({ pageParam }) => ({
      items: [`item-${pageParam}-1`, `item-${pageParam}-2`],
      nextCursor: pageParam < 2 ? pageParam + 1 : undefined,
    }));

    const { result } = renderHook(() =>
      useInfiniteQuery<Page, Error, number>({
        queryKey: 'infinite-next',
        queryFn,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      })
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Fetch next page
    await result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
    });

    expect(result.current.data?.pages[1].items).toEqual(['item-1-1', 'item-1-2']);
  });

  it('should indicate no more pages', async () => {
    const queryFn = vi.fn(async ({ pageParam }) => ({
      items: [`item-${pageParam}`],
      nextCursor: undefined, // No more pages
    }));

    const { result } = renderHook(() =>
      useInfiniteQuery<Page, Error, number>({
        queryKey: 'infinite-end',
        queryFn,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      })
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it('should track isFetchingNextPage', async () => {
    const queryFn = vi.fn(async ({ pageParam }) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        items: [`item-${pageParam}`],
        nextCursor: pageParam + 1,
      };
    });

    const { result } = renderHook(() =>
      useInfiniteQuery<Page, Error, number>({
        queryKey: 'infinite-fetching',
        queryFn,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      })
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Start fetching next page
    result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.isFetchingNextPage).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isFetchingNextPage).toBe(false);
    });
  });

  it('should support offset-based pagination', async () => {
    const queryFn = vi.fn(async ({ pageParam }) => {
      const offset = pageParam as number;
      const limit = 10;
      const total = 25;
      
      return {
        items: Array.from({ length: limit }, (_, i) => `item-${offset + i}`),
        hasMore: offset + limit < total,
      };
    });

    const { result } = renderHook(() =>
      useInfiniteQuery({
        queryKey: 'infinite-offset',
        queryFn,
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
          if (!lastPage.hasMore) return undefined;
          return allPages.length * 10;
        },
      })
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(true);
  });

  it('should refetch all pages', async () => {
    const queryFn = vi.fn(async ({ pageParam }) => ({
      items: [`item-${pageParam}-${Date.now()}`],
      nextCursor: pageParam + 1,
    }));

    const { result } = renderHook(() =>
      useInfiniteQuery<Page, Error, number>({
        queryKey: 'infinite-refetch',
        queryFn,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      })
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Fetch next page
    await result.current.fetchNextPage();

    const callCountBefore = queryFn.mock.calls.length;

    // Refetch all
    await result.current.refetch();

    // Should refetch both pages
    expect(queryFn.mock.calls.length).toBe(callCountBefore + 2);
  });
});
```

### Step 5: Update Documentation (45 min)

**File:** `packages/query/README.md`

Add infinite query section:

```markdown
## Infinite Queries

For infinite scrolling and pagination.

### Cursor-Based Pagination

```tsx
import { useInfiniteQuery } from '@nexus-state/query/react';

interface PostsResponse {
  posts: Post[];
  nextCursor?: string;
}

function PostList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<PostsResponse, Error, string>({
    queryKey: 'posts',
    queryFn: async ({ pageParam }) => {
      const response = await fetch(`/api/posts?cursor=${pageParam}`);
      return response.json();
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      ))}
      
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading more...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Offset-Based Pagination

```tsx
interface PostsResponse {
  posts: Post[];
  total: number;
}

function PostList() {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: 'posts',
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      const limit = 20;
      
      const response = await fetch(
        `/api/posts?offset=${offset}&limit=${limit}`
      );
      return response.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedItems = allPages.reduce((sum, page) => sum + page.posts.length, 0);
      return loadedItems < lastPage.total ? loadedItems : undefined;
    },
  });

  // ... render
}
```

### Infinite Scroll with Intersection Observer

```tsx
function PostList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    // ... options
  });

  const observerRef = useRef<IntersectionObserver>();
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });

    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, fetchNextPage, hasNextPage]);

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map((post, j) => {
            if (i === data.pages.length - 1 && j === page.posts.length - 1) {
              return <div ref={lastElementRef} key={post.id}>{post.title}</div>;
            }
            return <div key={post.id}>{post.title}</div>;
          })}
        </div>
      ))}
    </div>
  );
}
```

### Bi-directional Scrolling

```tsx
const {
  data,
  fetchNextPage,
  fetchPreviousPage,
  hasNextPage,
  hasPreviousPage,
} = useInfiniteQuery({
  queryKey: 'messages',
  queryFn: async ({ pageParam }) => {
    // Fetch page
  },
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage) => firstPage.previousCursor,
});
```
```

---

## ✅ Acceptance Criteria

### Functional Requirements
- [ ] `useInfiniteQuery` hook working
- [ ] Cursor-based pagination
- [ ] Offset-based pagination
- [ ] `fetchNextPage` / `fetchPreviousPage`
- [ ] `hasNextPage` / `hasPreviousPage`
- [ ] Page tracking
- [ ] Refetch all pages

### Code Quality
- [ ] TypeScript strict mode passes
- [ ] All tests pass
- [ ] Test coverage ≥95%
- [ ] No ESLint errors
- [ ] Proper JSDoc comments

### Documentation
- [ ] README with examples
- [ ] API reference
- [ ] Pagination patterns
- [ ] Infinite scroll example

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Initial page fetch
- [ ] Next/previous page fetch
- [ ] Page param generation
- [ ] Refetch all pages
- [ ] Loading states
- [ ] Error handling

### Integration Tests
- [ ] Cursor pagination
- [ ] Offset pagination
- [ ] Bi-directional scroll
- [ ] Intersection Observer

---

## 📦 Deliverables

- [ ] `infinite-query.ts` - Core logic
- [ ] `useInfiniteQuery.tsx` - React hook
- [ ] Type definitions
- [ ] Test suite
- [ ] Updated README
- [ ] Examples

---

## 🔗 Dependencies

### Depends On
- ECO-006: React hooks

### Enables
- Infinite scrolling UIs
- Efficient large dataset rendering
- Better pagination UX

---

## 📝 Notes

### Design Decisions

1. **Page Structure**: Store as array of pages vs flattened
2. **Param Tracking**: Store page params for refetch
3. **Bi-directional**: Support optional previous page fetch
4. **TypeScript**: Generic page param type for flexibility

### Future Enhancements

- Suspense support for infinite queries
- Virtual scrolling integration
- Automatic prefetch on scroll
- Page removal/garbage collection

---

**Created:** 2026-03-01
**Last Updated:** 2026-03-01
**Assignee:** TBD
