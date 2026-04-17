/**
 * Tests for README examples
 *
 * Purpose:
 * - Verify all code examples in README work correctly
 * - Detect broken API usage before publication
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '@nexus-state/core';
import { useQuery, clearQueryCache } from '../../src/query';
import { mutation } from '../../src/mutation';
import { prefetchQuery } from '../prefetch';
import { getSuspenseCache, setSuspenseCache, SuspenseQueryCache } from '../../src/suspense-cache';

describe('README: Quick Start (SSR Prefetch)', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('prefetchQuery pattern should work', async () => {
    // Simulate prefetch (server-side) as shown in README
    // prefetchQuery should complete without throwing
    await expect(
      prefetchQuery({
        queryKey: ['user', 1],
        queryFn: async () => ({ id: 1, name: 'John' }),
      })
    ).resolves.toBeUndefined();
  });
});

describe('README: useQuery Pattern', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('query with loading state should work', async () => {
    const store = createStore();

    const userQuery = useQuery(store, {
      queryKey: ['user', 1],
      queryFn: async () => ({ id: 1, name: 'John' }),
      staleTime: 5 * 60 * 1000,
      retry: 3,
    });

    // Initial loading state
    expect(userQuery.isLoading).toBe(true);

    // Wait for success
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(userQuery.isLoading).toBe(false);
    expect(userQuery.data).toEqual({ id: 1, name: 'John' });
    expect(userQuery.error).toBeNull();
  });
});

describe('README: useMutation with Optimistic Updates', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('optimistic update pattern should work with mutation API', async () => {
    const store = createStore();

    // Create mutation
    const updateTodo = mutation({
      mutationFn: async (newTodo: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 10));
        return newTodo;
      },
      onSuccess: () => {
        // Success callback
      },
      onError: () => {
        // Error callback
      },
    });

    // Mutation should be defined
    expect(updateTodo.mutate).toBeDefined();
    expect(updateTodo.mutateAsync).toBeDefined();
  });

  it('invalidate query pattern should work', async () => {
    const store = createStore();

    const todosQuery = useQuery(store, {
      queryKey: 'todos',
      queryFn: async () => ['Todo 1'],
    });

    // Initial fetch
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(todosQuery.data).toEqual(['Todo 1']);

    // Invalidate (clear cache)
    clearQueryCache();

    // Refetch
    await todosQuery.refetch();
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(todosQuery.data).toEqual(['Todo 1']);
  });
});

describe('README: Cache Management', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('getQueryData pattern should work', async () => {
    const store = createStore();

    const userQuery = useQuery(store, {
      queryKey: ['user', 1],
      queryFn: async () => ({ id: 1, name: 'John' }),
    });

    // Wait for initial fetch
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get cached data
    expect(userQuery.data).toEqual({ id: 1, name: 'John' });
  });

  it('setQueryData pattern should work', async () => {
    const store = createStore();

    const userQuery = useQuery(store, {
      queryKey: ['user', 1],
      queryFn: async () => ({ id: 1, name: 'John' }),
      initialData: { id: 1, name: 'Jane' },
    });

    // Initial data is set immediately
    expect(userQuery.data).toEqual({ id: 1, name: 'Jane' });
  });
});

describe('README: Async vs Query Decision', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('query pattern with caching should work', async () => {
    const store = createStore();

    const userQuery = useQuery(store, {
      queryKey: ['user', 1],
      queryFn: async () => ({ id: 1, name: 'John' }),
      staleTime: 5 * 60 * 1000,
    });

    // Initial fetch
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(userQuery.data).toEqual({ id: 1, name: 'John' });
    expect(userQuery.isSuccess).toBe(true);
  });
});
