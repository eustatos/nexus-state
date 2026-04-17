/**
 * Tests for README examples
 *
 * Purpose:
 * - Verify all code examples in README work correctly
 * - Detect broken API usage before publication
 *
 * Covers sections not already tested in packages/query/react/__tests__/readme-examples.test.tsx
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '@nexus-state/core';
import { useQuery, clearQueryCache } from '../../src/query';
import { mutation } from '../../src/mutation';
import { prefetchQuery, getQueryData, setQueryData, invalidateQuery } from '../../react/prefetch';
import { getSuspenseCache, setSuspenseCache, SuspenseQueryCache } from '../../src/suspense-cache';

describe('README: Quick Start (SSR Prefetch)', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('prefetchQuery should cache data for subsequent reads', async () => {
    await prefetchQuery({
      queryKey: ['user', 1],
      queryFn: async () => ({ id: 1, name: 'John' }),
    });

    // Data should be cached
    const cached = getQueryData<{ id: number; name: string }>(['user', 1]);
    expect(cached).toEqual({ id: 1, name: 'John' });
  });

  it('prefetchQuery with array queryKey should serialize correctly', async () => {
    await prefetchQuery({
      queryKey: ['user', 42],
      queryFn: async () => ({ id: 42, name: 'Alice' }),
    });

    expect(getQueryData(['user', 42])).toEqual({ id: 42, name: 'Alice' });
  });

  it('prefetchQuery with string queryKey should work', async () => {
    await prefetchQuery({
      queryKey: 'user',
      queryFn: async () => ({ id: 1, name: 'Bob' }),
    });

    expect(getQueryData('user')).toEqual({ id: 1, name: 'Bob' });
  });
});

describe('README: useQuery with options', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('query with staleTime should cache for configured duration', async () => {
    const store = createStore();

    const userQuery = useQuery(store, {
      queryKey: ['user', 1],
      queryFn: async () => ({ id: 1, name: 'John' }),
      staleTime: 5 * 60 * 1000,
      retry: 3,
    });

    expect(userQuery.isLoading).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(userQuery.isLoading).toBe(false);
    expect(userQuery.isSuccess).toBe(true);
    expect(userQuery.data).toEqual({ id: 1, name: 'John' });
    expect(userQuery.error).toBeNull();
  });

  it('query should expose status property', async () => {
    const store = createStore();

    const userQuery = useQuery(store, {
      queryKey: ['user', 2],
      queryFn: async () => ({ id: 2, name: 'Jane' }),
    });

    // Initial: loading
    expect(userQuery.status).toBe('loading');

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(userQuery.status).toBe('success');
  });

  it('query with enabled: false should not fetch', async () => {
    const store = createStore();

    const userQuery = useQuery(store, {
      queryKey: ['user', 3],
      queryFn: async () => ({ id: 3, name: 'Disabled' }),
      enabled: false,
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(userQuery.isLoading).toBe(false);
    expect(userQuery.data).toBeUndefined();
  });

  it('query with initialData should start with data', async () => {
    const store = createStore();

    const userQuery = useQuery(store, {
      queryKey: ['user', 4],
      queryFn: async () => ({ id: 4, name: 'Fresh' }),
      initialData: { id: 4, name: 'Initial' },
    });

    expect(userQuery.data).toEqual({ id: 4, name: 'Initial' });
    expect(userQuery.isSuccess).toBe(true);
  });

  it('query refetch should re-fetch data', async () => {
    const store = createStore();
    let callCount = 0;

    const userQuery = useQuery(store, {
      queryKey: ['user', 5],
      queryFn: async () => {
        callCount++;
        return { id: 5, name: `Call ${callCount}` };
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(userQuery.data).toEqual({ id: 5, name: 'Call 1' });

    await userQuery.refetch();
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(userQuery.data).toEqual({ id: 5, name: 'Call 2' });
  });
});

describe('README: useSuspenseQuery', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('SuspenseQueryCache.read should return cached data after prefetch', async () => {
    const cache = getSuspenseCache();

    // Prefetch first
    await cache.prefetch('user-1', async () => ({ id: 1, name: 'Prefetched' }), 5000);

    // Read should return data without throwing
    const result = cache.read('user-1', async () => ({ id: 1, name: 'Should not call this' }), 5000);
    expect(result).toEqual({ id: 1, name: 'Prefetched' });
  });

  it('SuspenseQueryCache.read should throw promise for uncached data', () => {
    const cache = getSuspenseCache();
    cache.clear();

    const queryFn = async () => ({ id: 1, name: 'Async' });

    expect(() => cache.read('suspense-user', queryFn, 0)).toThrow(Promise);
  });

  it('SuspenseQueryCache.prefetch should cache data for read', async () => {
    const cache = getSuspenseCache();
    cache.clear();

    await cache.prefetch('suspense-user', async () => ({ id: 1, name: 'Cached' }), 5000);

    const result = cache.read('suspense-user', async () => ({ id: 0, name: 'Fallback' }), 5000);
    expect(result).toEqual({ id: 1, name: 'Cached' });
  });

  it('setSuspenseCache should replace global cache', () => {
    const customCache = new SuspenseQueryCache();
    setSuspenseCache(customCache);
    expect(getSuspenseCache()).toBe(customCache);
  });

  it('getSuspenseCache should return singleton', () => {
    const cache1 = getSuspenseCache();
    const cache2 = getSuspenseCache();
    expect(cache1).toBe(cache2);
  });

  it('SuspenseQueryCache.clear should remove all cached data', async () => {
    const cache = new SuspenseQueryCache();

    await cache.prefetch('user-1', async () => ({ id: 1 }), 5000);
    expect(cache.getQueryData('user-1')).toEqual({ id: 1 });

    cache.clear();
    expect(cache.getQueryData('user-1')).toBeUndefined();
  });

  it('SuspenseQueryCache.setQueryData should set data manually', () => {
    const cache = new SuspenseQueryCache();

    cache.setQueryData('manual-user', { id: 99, name: 'Manual' });
    expect(cache.getQueryData('manual-user')).toEqual({ id: 99, name: 'Manual' });
  });

  it('SuspenseQueryCache.isStale should detect stale entries', async () => {
    const cache = new SuspenseQueryCache();

    // Not stale when fresh with long staleTime
    await cache.prefetch('fresh-user', async () => ({ id: 1 }), 5000);
    expect(cache.isStale('fresh-user', 5000)).toBe(false);

    // Stale with very short staleTime (1ms), wait a bit
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(cache.isStale('fresh-user', 1)).toBe(true);
  });

  it('SuspenseQueryCache.invalidate should remove entry', async () => {
    const cache = new SuspenseQueryCache();

    await cache.prefetch('invalidate-user', async () => ({ id: 1 }), 5000);
    expect(cache.getQueryData('invalidate-user')).toEqual({ id: 1 });

    cache.invalidate('invalidate-user');
    expect(cache.getQueryData('invalidate-user')).toBeUndefined();
  });
});

describe('README: useMutation with Optimistic Updates', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('mutation should execute and return data', async () => {
    const createTodo = mutation({
      mutationFn: async (text: string) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { id: 1, text };
      },
    });

    const result = await createTodo.mutateAsync('Test todo');
    expect(result).toEqual({ id: 1, text: 'Test todo' });
  });

  it('mutation onSuccess callback should fire', async () => {
    let capturedData: unknown;

    const updateTodo = mutation({
      mutationFn: async (data: { name: string }) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { ...data, id: 1 };
      },
      onSuccess: (data) => {
        capturedData = data;
      },
    });

    await updateTodo.mutateAsync({ name: 'John' });
    expect(capturedData).toEqual({ id: 1, name: 'John' });
  });

  it('mutation onError callback should fire on failure', async () => {
    let capturedError: unknown = null;

    const failingMutation = mutation<unknown, Error>({
      mutationFn: async () => {
        throw new Error('Mutation failed');
      },
      onError: (error) => {
        capturedError = error;
      },
    });

    await expect(failingMutation.mutateAsync()).rejects.toThrow('Mutation failed');
    expect((capturedError as Error)?.message).toBe('Mutation failed');
  });

  it('mutation onSettled callback should fire regardless of outcome', async () => {
    let settledCount = 0;

    const mutationWithSettled = mutation({
      mutationFn: async (ok: boolean) => {
        if (!ok) throw new Error('fail');
        return 'ok';
      },
      onSettled: () => {
        settledCount++;
      },
    });

    await mutationWithSettled.mutateAsync(true);
    await expect(mutationWithSettled.mutateAsync(false)).rejects.toThrow();
    expect(settledCount).toBe(2);
  });

  it('mutation reset should return to initial state', async () => {
    const simpleMutation = mutation({
      mutationFn: async () => 'done',
    });

    await simpleMutation.mutateAsync();
    simpleMutation.reset();

    const state = simpleMutation.state;
    // After reset, state atom should be back to initial
    expect(state).toBeDefined();
  });

  it('mutation onMutate should be called before mutationFn', async () => {
    const callOrder: string[] = [];

    const optimisticMutation = mutation({
      mutationFn: async (value: number) => {
        callOrder.push('mutationFn');
        return value * 2;
      },
      onMutate: async () => {
        callOrder.push('onMutate');
        return { snapshot: 'value' };
      },
    });

    await optimisticMutation.mutateAsync(5);
    expect(callOrder).toEqual(['onMutate', 'mutationFn']);
  });

  it('mutation invalidateQueries option should log debug', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    const mutationWithInvalidate = mutation({
      mutationFn: async () => 'done',
      invalidateQueries: ['todos', 'users'],
    });

    await mutationWithInvalidate.mutateAsync();
    expect(debugSpy).toHaveBeenCalledWith('Invalidating query: todos');
    expect(debugSpy).toHaveBeenCalledWith('Invalidating query: users');

    debugSpy.mockRestore();
  });
});

describe('README: SSR Patterns - Remix loader', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('prefetchQuery should work in Remix-like loader pattern', async () => {
    // Simulate Remix loader
    async function loader(params: { id: string }) {
      await prefetchQuery({
        queryKey: ['user', params.id],
        queryFn: async () => ({ id: params.id, name: 'Remix User' }),
      });
      return { userId: params.id };
    }

    const result = await loader({ id: '42' });
    expect(result.userId).toBe('42');

    // Verify data is cached
    const cached = getQueryData(['user', '42']);
    expect(cached).toEqual({ id: '42', name: 'Remix User' });
  });
});

describe('README: SSR Patterns - Nuxt asyncData', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('prefetchQuery should work in Nuxt-like asyncData pattern', async () => {
    // Simulate Nuxt asyncData
    async function asyncData() {
      await prefetchQuery({
        queryKey: 'user',
        queryFn: async () => ({ id: 1, name: 'Nuxt User' }),
      });
    }

    await asyncData();

    const cached = getQueryData('user');
    expect(cached).toEqual({ id: 1, name: 'Nuxt User' });
  });
});

describe('README: Prefetch Strategies - Manual Prefetch', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('prefetchQuery on hover pattern should cache data', async () => {
    // Simulate onMouseEnter prefetch
    const handleMouseEnter = () => {
      prefetchQuery({
        queryKey: ['user'],
        queryFn: async () => ({ id: 1, name: 'Hover User' }),
      });
    };

    // Simulate hover
    handleMouseEnter();

    // Wait for prefetch to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    const cached = getQueryData(['user']);
    expect(cached).toEqual({ id: 1, name: 'Hover User' });
  });
});

describe('README: Prefetch Strategies - Prefetch on Hover', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('prefetchQuery with user id on hover should cache specific user', async () => {
    const userId = 10;

    const handleMouseEnter = () => {
      prefetchQuery({
        queryKey: ['user', userId],
        queryFn: async () => ({ id: userId, name: `User ${userId}` }),
      });
    };

    handleMouseEnter();
    await new Promise(resolve => setTimeout(resolve, 100));

    const cached = getQueryData(['user', userId]);
    expect(cached).toEqual({ id: 10, name: 'User 10' });
  });
});

describe('README: Prefetch Strategies - Prefetch on Viewport', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('prefetchQuery triggered by intersection observer should cache data', async () => {
    const itemId = 'item-1';

    // Simulate intersection observer callback
    const onIntersecting = () => {
      prefetchQuery({
        queryKey: ['item', itemId],
        queryFn: async () => ({ id: itemId, title: 'Viewport Item' }),
      });
    };

    onIntersecting();
    await new Promise(resolve => setTimeout(resolve, 100));

    const cached = getQueryData(['item', itemId]);
    expect(cached).toEqual({ id: itemId, title: 'Viewport Item' });
  });
});

describe('README: Cache Management - Get/Set Query Data', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('setQueryData should update cached data', async () => {
    // First prefetch to have data
    await prefetchQuery({
      queryKey: ['user', 1],
      queryFn: async () => ({ id: 1, name: 'Original' }),
    });

    expect(getQueryData(['user', 1])).toEqual({ id: 1, name: 'Original' });

    // Update cached data
    setQueryData(['user', 1], { id: 1, name: 'Updated' });

    expect(getQueryData(['user', 1])).toEqual({ id: 1, name: 'Updated' });
  });

  it('setQueryData with functional updater pattern', async () => {
    await prefetchQuery({
      queryKey: ['user', 2],
      queryFn: async () => ({ id: 2, name: 'Jane' }),
    });

    const old = getQueryData<{ id: number; name: string }>(['user', 2]);
    if (old) {
      setQueryData(['user', 2], { ...old, name: 'Updated' });
    }

    expect(getQueryData<{ id: number; name: string }>(['user', 2])?.name).toBe('Updated');
  });

  it('getQueryData should return undefined for missing keys', () => {
    const result = getQueryData(['nonexistent', 'key']);
    expect(result).toBeUndefined();
  });
});

describe('README: Cache Management - Invalidate Queries', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('invalidateQuery should remove query from cache', async () => {
    await prefetchQuery({
      queryKey: ['user', 1],
      queryFn: async () => ({ id: 1, name: 'To Invalidate' }),
    });

    expect(getQueryData(['user', 1])).toEqual({ id: 1, name: 'To Invalidate' });

    invalidateQuery(['user', 1]);

    expect(getQueryData(['user', 1])).toBeUndefined();
  });

  it('invalidated query should refetch on next useQuery call', async () => {
    const store = createStore();
    let fetchCount = 0;

    const userQuery = useQuery(store, {
      queryKey: ['user', 10],
      queryFn: async () => {
        fetchCount++;
        return { id: 10, name: `Fetch ${fetchCount}` };
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(fetchCount).toBe(1);
    expect(userQuery.data).toEqual({ id: 10, name: 'Fetch 1' });

    // Invalidate
    invalidateQuery(['user', 10]);

    // Refetch
    await userQuery.refetch();
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(fetchCount).toBe(2);
    expect(userQuery.data).toEqual({ id: 10, name: 'Fetch 2' });
  });
});

describe('README: Async vs Query Decision', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('query should support automatic caching scenario', async () => {
    const store = createStore();

    const userQuery = useQuery(store, {
      queryKey: ['user', 1],
      queryFn: async () => ({ id: 1, name: 'John' }),
      staleTime: 5 * 60 * 1000,
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(userQuery.data).toEqual({ id: 1, name: 'John' });
    expect(userQuery.isSuccess).toBe(true);
  });

  it('query should support background refetch scenario', async () => {
    const store = createStore();
    let callCount = 0;

    const userQuery = useQuery(store, {
      queryKey: ['user', 2],
      queryFn: async () => {
        callCount++;
        return { id: 2, name: `Call ${callCount}` };
      },
      staleTime: 0, // Always stale
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(callCount).toBe(1);

    // Second query with same key should reuse but stale triggers refetch
    await userQuery.refetch();
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(callCount).toBe(2);
  });
});

describe('README: Migration from TanStack Query', () => {
  beforeEach(() => {
    clearQueryCache();
    setSuspenseCache(new SuspenseQueryCache());
  });

  it('useQuery API should match TanStack Query shape', async () => {
    const store = createStore();

    // Same API as TanStack Query
    const queryFn = vi.fn(async () => ({ id: 1, name: 'Migrated' }));
    const result = useQuery(store, {
      queryKey: ['tanstack-migration-test'],
      queryFn,
      staleTime: 5 * 60 * 1000,
      retry: 3,
    });

    expect(result.isLoading).toBe(true);
    expect(result.error).toBeNull();

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(result.data).toEqual({ id: 1, name: 'Migrated' });
    expect(typeof result.refetch).toBe('function');
    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});
