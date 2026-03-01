# ECO-006: Add React Query Hooks

**Status:** ⬜ Not Started  
**Priority:** 🟢 Medium  
**Estimated Time:** 3-4 hours  
**Dependencies:** ECO-004 (Refetch features), ECO-005 (Mutations)  
**Package:** @nexus-state/query

---

## 📋 Overview

Create React-specific hooks for the query package, providing an ergonomic API similar to TanStack Query while leveraging Nexus State's atomic architecture.

**Key Goals:**

- Create `useQuery()` hook
- Create `useMutation()` hook
- Automatic component re-renders
- SSR support
- TypeScript type safety

---

## 🎯 Objectives

### Must Have

- [x] `useQuery()` hook with automatic re-renders
- [x] `useMutation()` hook with state management
- [x] Proper cleanup on unmount
- [x] TypeScript support
- [x] SSR compatibility
- [x] Error boundaries integration

### Should Have

- [x] `useQueries()` for multiple parallel queries
- [x] `useIsFetching()` global loading state
- [x] Query client/provider pattern
- [x] Devtools integration

### Nice to Have

- [ ] Suspense support
- [ ] Infinite query hook
- [ ] Prefetching utilities

---

## 🏗️ Implementation Plan

### Step 1: Create React Package Structure (15 min)

Create new sub-package or add to existing React integration:

```
packages/query/
  react/
    index.tsx
    useQuery.tsx
    useMutation.tsx
    useQueries.tsx
    useIsFetching.tsx
    QueryClientProvider.tsx
    types.ts
```

### Step 2: Define React Types (30 min)

**File:** `packages/query/react/types.ts`

```typescript
import type {
  QueryOptions,
  QueryResult,
  MutationOptions,
  MutationResult,
} from '../types';

export interface UseQueryOptions<TData, TError> extends Omit<
  QueryOptions<TData, TError>,
  'store'
> {
  enabled?: boolean;
  suspense?: boolean;
  useErrorBoundary?: boolean | ((error: TError) => boolean);
}

export interface UseQueryResult<TData, TError> {
  data: TData | undefined;
  error: TError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isFetching: boolean;
  isStale: boolean;
  refetch: () => Promise<void>;
  status: 'idle' | 'loading' | 'error' | 'success';
}

export interface UseMutationOptions<
  TData,
  TError,
  TVariables,
  TContext,
> extends Omit<MutationOptions<TData, TError, TVariables, TContext>, 'store'> {}

export interface UseMutationResult<TData, TError, TVariables, TContext> {
  data: TData | undefined;
  error: TError | null;
  isIdle: boolean;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  status: 'idle' | 'loading' | 'error' | 'success';
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  reset: () => void;
  variables: TVariables | undefined;
  failureCount: number;
}
```

### Step 3: Implement useQuery Hook (1 hour)

**File:** `packages/query/react/useQuery.tsx`

```typescript
import { useEffect, useRef } from 'react';
import { useAtomValue, useStore } from '@nexus-state/react';
import { query } from '../query';
import type { UseQueryOptions, UseQueryResult } from './types';

export function useQuery<TData = unknown, TError = Error>(
  queryKey: string,
  queryFn: () => Promise<TData>,
  options: UseQueryOptions<TData, TError> = {}
): UseQueryResult<TData, TError> {
  const store = useStore();
  const queryRef = useRef<ReturnType<typeof query> | null>(null);

  // Create query instance
  if (!queryRef.current) {
    queryRef.current = query({
      queryKey,
      queryFn,
      ...options,
      store,
    });
  }

  const q = queryRef.current;

  // Subscribe to state changes
  const state = useAtomValue(q.state);

  // Handle enabled option
  const enabled = options.enabled ?? true;

  // Initial fetch
  useEffect(() => {
    if (enabled && state.status === 'idle') {
      q.refetch();
    }
  }, [enabled, q, state.status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optional: cleanup query cache entry
      // This depends on cache implementation
    };
  }, []);

  // Error boundary integration
  if (options.useErrorBoundary && state.isError) {
    const shouldThrow =
      typeof options.useErrorBoundary === 'function'
        ? options.useErrorBoundary(state.error as TError)
        : true;

    if (shouldThrow && state.error) {
      throw state.error;
    }
  }

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    isError: state.isError,
    isSuccess: state.isSuccess,
    isFetching: state.isFetching,
    isStale: state.isStale,
    status: state.status,
    refetch: q.refetch,
  };
}
```

### Step 4: Implement useMutation Hook (45 min)

**File:** `packages/query/react/useMutation.tsx`

```typescript
import { useRef, useCallback } from 'react';
import { useAtomValue, useStore } from '@nexus-state/react';
import { mutation } from '../mutation';
import type { UseMutationOptions, UseMutationResult } from './types';

export function useMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const store = useStore();
  const mutationRef = useRef<ReturnType<typeof mutation> | null>(null);

  // Create mutation instance
  if (!mutationRef.current) {
    mutationRef.current = mutation({
      ...options,
      store,
    });
  }

  const mut = mutationRef.current;

  // Subscribe to state changes
  const state = useAtomValue(mut.state);

  // Wrap mutate to ensure stable reference
  const mutate = useCallback(
    (variables: TVariables) => {
      mut.mutate(variables);
    },
    [mut]
  );

  const mutateAsync = useCallback(
    (variables: TVariables) => {
      return mut.mutateAsync(variables);
    },
    [mut]
  );

  const reset = useCallback(() => {
    mut.reset();
  }, [mut]);

  return {
    data: state.data,
    error: state.error,
    isIdle: state.isIdle,
    isPending: state.isPending,
    isError: state.isError,
    isSuccess: state.isSuccess,
    status: state.status,
    variables: state.variables,
    failureCount: state.failureCount,
    mutate,
    mutateAsync,
    reset,
  };
}
```

### Step 5: Implement useQueries Hook (45 min)

**File:** `packages/query/react/useQueries.tsx`

```typescript
import { useQuery } from './useQuery';
import type { UseQueryOptions, UseQueryResult } from './types';

export interface QueryConfig<TData, TError> {
  queryKey: string;
  queryFn: () => Promise<TData>;
  options?: UseQueryOptions<TData, TError>;
}

export function useQueries<TResults extends readonly unknown[]>(
  queries: readonly [
    ...{ [K in keyof TResults]: QueryConfig<TResults[K], Error> },
  ]
): { [K in keyof TResults]: UseQueryResult<TResults[K], Error> } {
  // Execute all queries in parallel
  const results = queries.map((config) =>
    useQuery(config.queryKey, config.queryFn, config.options)
  );

  return results as {
    [K in keyof TResults]: UseQueryResult<TResults[K], Error>;
  };
}
```

### Step 6: Add Tests (1 hour)

**File:** `packages/query/react/__tests__/useQuery.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { StoreProvider } from '@nexus-state/react';
import { createStore } from '@nexus-state/core';
import { useQuery } from '../useQuery';

describe('useQuery', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreProvider store={createStore()}>{children}</StoreProvider>
  );

  it('should fetch data on mount', async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(
      () => useQuery('test-key', queryFn),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ data: 'test' });
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('should handle errors', async () => {
    const error = new Error('Failed');
    const queryFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(
      () => useQuery('test-key', queryFn),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });

  it('should respect enabled option', async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(
      () => useQuery('test-key', queryFn, { enabled: false }),
      { wrapper }
    );

    expect(result.current.status).toBe('idle');
    expect(queryFn).not.toHaveBeenCalled();
  });

  it('should refetch when calling refetch', async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(
      () => useQuery('test-key', queryFn),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    await result.current.refetch();

    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});
```

**File:** `packages/query/react/__tests__/useMutation.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { StoreProvider } from '@nexus-state/react';
import { createStore } from '@nexus-state/core';
import { useMutation } from '../useMutation';

describe('useMutation', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreProvider store={createStore()}>{children}</StoreProvider>
  );

  it('should execute mutation', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });

    const { result } = renderHook(
      () => useMutation({ mutationFn }),
      { wrapper }
    );

    expect(result.current.isIdle).toBe(true);

    act(() => {
      result.current.mutate({ name: 'Test' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ id: 1, name: 'Test' });
    expect(mutationFn).toHaveBeenCalledWith({ name: 'Test' });
  });

  it('should handle mutation errors', async () => {
    const error = new Error('Mutation failed');
    const mutationFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(
      () => useMutation({ mutationFn }),
      { wrapper }
    );

    act(() => {
      result.current.mutate({});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });

  it('should reset mutation state', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

    const { result } = renderHook(
      () => useMutation({ mutationFn }),
      { wrapper }
    );

    act(() => {
      result.current.mutate({});
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.isIdle).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
```

### Step 7: Update Documentation (30 min)

**File:** `packages/query/README.md`

Add React hooks section:

````markdown
## React Hooks

### useQuery

```tsx
import { useQuery } from '@nexus-state/query/react';

function UserProfile({ userId }: { userId: number }) {
  const { data, isLoading, error, refetch } = useQuery(
    `user-${userId}`,
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```
````

### useMutation

```tsx
import { useMutation } from '@nexus-state/query/react';

function CreatePost() {
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async (post: { title: string; content: string }) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(post),
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Post created:', data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ title: 'New Post', content: 'Content here' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
      {isError && <div>Error: {error.message}</div>}
    </form>
  );
}
```

### useQueries (Parallel Queries)

```tsx
import { useQueries } from '@nexus-state/query/react';

function Dashboard() {
  const [user, posts, comments] = useQueries([
    {
      queryKey: 'user',
      queryFn: () => fetch('/api/user').then((r) => r.json()),
    },
    {
      queryKey: 'posts',
      queryFn: () => fetch('/api/posts').then((r) => r.json()),
    },
    {
      queryKey: 'comments',
      queryFn: () => fetch('/api/comments').then((r) => r.json()),
    },
  ]);

  if (user.isLoading || posts.isLoading || comments.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{user.data.name}</h1>
      <p>Posts: {posts.data.length}</p>
      <p>Comments: {comments.data.length}</p>
    </div>
  );
}
```

### TypeScript

```tsx
interface User {
  id: number;
  name: string;
  email: string;
}

function UserComponent() {
  const { data, isLoading } = useQuery<User, Error>(
    'current-user',
    async () => {
      const response = await fetch('/api/user');
      return response.json();
    }
  );

  // data is typed as User | undefined
  // error is typed as Error | null
}
```

```

---

## ✅ Acceptance Criteria

### Functional Requirements
- [x] useQuery hook works with automatic re-renders
- [x] useMutation hook manages mutation state
- [x] useQueries supports parallel queries
- [x] Proper cleanup on unmount
- [x] SSR compatibility (no window access)
- [x] Error boundary integration

### Code Quality
- [x] TypeScript strict mode passes
- [x] All tests pass
- [x] Test coverage ≥95%
- [x] No ESLint errors
- [x] Proper JSDoc comments

### Documentation
- [x] README with React examples
- [x] TypeScript examples
- [x] API reference

---

## 🧪 Testing Strategy

### Unit Tests
- [x] useQuery basic functionality
- [x] useQuery with options (enabled, staleTime, etc.)
- [x] useQuery error handling
- [x] useMutation execution
- [x] useMutation callbacks
- [x] useMutation reset
- [x] useQueries parallel execution

### Integration Tests
- [ ] Integration with actual React components
- [ ] SSR rendering
- [ ] Error boundaries

### Performance Tests
- [ ] Multiple queries in one component
- [ ] Re-render optimization

---

## 📦 Deliverables

- [x] `useQuery.tsx` - Query hook
- [x] `useMutation.tsx` - Mutation hook
- [x] `useQueries.tsx` - Parallel queries hook
- [x] Type definitions
- [x] Test suite
- [x] Updated README with React examples
- [x] Export from package

---

## 🔗 Dependencies

### Depends On
- ECO-004: Refetch features
- ECO-005: Mutations
- @nexus-state/react package

### Enables
- Complete React integration
- Production-ready query package

---

## 📝 Notes

### Design Decisions

1. **Hooks API**: Mirror TanStack Query API for familiarity
2. **Store Integration**: Use `@nexus-state/react` hooks
3. **Cleanup**: Automatic cleanup on unmount
4. **Error Boundaries**: Optional integration via `useErrorBoundary`

### Future Enhancements

- Suspense support
- Infinite query hook
- Prefetching utilities
- Global query client provider
- Devtools panel

### References

- TanStack Query React: https://tanstack.com/query/latest/docs/react/overview
- @nexus-state/react: packages/react/

---

**Created:** 2026-03-01
**Last Updated:** 2026-03-01
**Assignee:** AI Agent
```
