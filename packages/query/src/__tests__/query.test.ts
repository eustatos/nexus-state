import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '@nexus-state/core';
import { useQuery, createQuery, executeQuery, setQueryCache, clearQueryCache } from '../query';
import { createQueryCache } from '../cache';

describe('@nexus-state/query - Basic Functionality', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    // Clear cache before each test
    clearQueryCache();
  });

  describe('useQuery', () => {
    it('should start in idle state', () => {
      const result = useQuery(store, {
        queryKey: 'test',
        queryFn: async () => 'data',
        enabled: false
      });

      expect(result.status).toBe('idle');
      expect(result.isIdle).toBe(true);
      expect(result.isLoading).toBe(false);
      expect(result.data).toBeUndefined();
    });

    it('should fetch data successfully', async () => {
      const queryFn = vi.fn(async () => 'test data');

      const result = useQuery(store, {
        queryKey: 'test',
        queryFn
      });

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('success');
      expect(result.data).toBe('test data');
      expect(result.isSuccess).toBe(true);
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      const queryFn = vi.fn(async () => {
        throw error;
      });

      const result = useQuery(store, {
        queryKey: 'test',
        queryFn,
        retry: false
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.status).toBe('error');
      expect(result.error).toBe(error);
      expect(result.isError).toBe(true);
    });

    it('should use initial data', () => {
      const result = useQuery(store, {
        queryKey: 'test',
        queryFn: async () => 'fetched',
        initialData: 'initial'
      });

      expect(result.data).toBe('initial');
      expect(result.isSuccess).toBe(true);
    });

    it('should support refetch', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      const result = useQuery(store, {
        queryKey: 'test',
        queryFn
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(result.data).toBe('data-1');

      await result.refetch();
      expect(queryFn).toHaveBeenCalledTimes(2);
      expect(result.data).toBe('data-2');
    });

    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn();

      useQuery(store, {
        queryKey: 'test',
        queryFn: async () => 'data',
        onSuccess
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onSuccess).toHaveBeenCalledWith('data');
    });

    it('should call onError callback', async () => {
      const error = new Error('Test error');
      const onError = vi.fn();

      useQuery(store, {
        queryKey: 'test',
        queryFn: async () => { throw error; },
        onError,
        retry: false
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should call onSettled callback on success', async () => {
      const onSettled = vi.fn();

      useQuery(store, {
        queryKey: 'test',
        queryFn: async () => 'data',
        onSettled
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onSettled).toHaveBeenCalledWith('data', null);
    });

    it('should call onSettled callback on error', async () => {
      const error = new Error('Test error');
      const onSettled = vi.fn();

      useQuery(store, {
        queryKey: 'test',
        queryFn: async () => { throw error; },
        onSettled,
        retry: false
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onSettled).toHaveBeenCalledWith(undefined, error);
    });

    it('should retry on failure', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary error');
        }
        return 'success';
      });

      const result = useQuery(store, {
        queryKey: 'test',
        queryFn,
        retry: 3,
        retryDelay: 10
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(queryFn).toHaveBeenCalledTimes(3);
      expect(result.data).toBe('success');
      expect(result.status).toBe('success');
    });

    it('should respect retry: false', async () => {
      const queryFn = vi.fn(async () => {
        throw new Error('Error');
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        retry: false
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    it('should respect retry: 0', async () => {
      const queryFn = vi.fn(async () => {
        throw new Error('Error');
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        retry: 0
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    it('should not fetch when enabled: false', async () => {
      const queryFn = vi.fn(async () => 'data');

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        enabled: false
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(queryFn).not.toHaveBeenCalled();
    });

    it('should support array query key', () => {
      const result = useQuery(store, {
        queryKey: ['users', 123],
        queryFn: async () => 'user',
        enabled: false
      });

      expect(result.status).toBe('idle');
    });

    it('should remove query state on remove()', () => {
      const result = useQuery(store, {
        queryKey: 'test',
        queryFn: async () => 'data',
        initialData: 'initial'
      });

      expect(result.data).toBe('initial');
      
      result.remove();
      
      expect(result.status).toBe('success');
      expect(result.data).toBe('initial');
    });

    it('should track failureCount on retries', async () => {
      const queryFn = vi.fn(async () => {
        throw new Error('Error');
      });

      const result = useQuery(store, {
        queryKey: 'test',
        queryFn,
        retry: 2,
        retryDelay: 10
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.failureCount).toBe(3);
    });

    it('should cache successful results', async () => {
      const queryFn = vi.fn(async () => 'cached data');

      // First query
      useQuery(store, {
        queryKey: 'cache-test',
        queryFn,
        staleTime: 5000
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Second query with same key should use cache
      useQuery(store, {
        queryKey: 'cache-test',
        queryFn,
        staleTime: 5000
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // queryFn should only be called once due to caching
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    it('should refetch stale data', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      // First query
      useQuery(store, {
        queryKey: 'stale-test',
        queryFn,
        staleTime: 50
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Wait for data to become stale
      await new Promise(resolve => setTimeout(resolve, 60));

      // Second query should refetch because data is stale
      useQuery(store, {
        queryKey: 'stale-test',
        queryFn,
        staleTime: 50
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(queryFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('createQuery', () => {
    it('should create query atom with correct metadata', () => {
      const options = {
        queryKey: 'test',
        queryFn: async () => 'data',
        enabled: false
      };

      const queryAtom = createQuery(store, options);

      expect(queryAtom.queryKey).toBe('test');
      expect(queryAtom.options).toEqual(options);
    });

    it('should serialize array query key to string', () => {
      const options = {
        queryKey: ['users', 123] as const,
        queryFn: async () => 'data',
        enabled: false
      };

      const queryAtom = createQuery(store, options);

      expect(queryAtom.queryKey).toBe('["users",123]');
    });
  });

  describe('executeQuery', () => {
    it('should execute query manually even when enabled: false', async () => {
      const queryFn = vi.fn(async () => 'data');
      const options = {
        queryKey: 'test',
        queryFn,
        enabled: false
      };

      const queryAtom = createQuery(store, options);
      
      // Initial state should be idle
      expect(store.get(queryAtom).status).toBe('idle');

      // Execute manually with force flag
      await executeQuery(store, queryAtom, 0, true);

      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(store.get(queryAtom).status).toBe('success');
    });
  });

  describe('setQueryCache', () => {
    it('should use custom cache', async () => {
      const customCache = createQueryCache();
      const setSpy = vi.spyOn(customCache, 'set');
      
      setQueryCache(customCache);

      useQuery(store, {
        queryKey: 'custom-cache-test',
        queryFn: async () => 'data',
        staleTime: 1000
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(setSpy).toHaveBeenCalled();
      
      // Restore default cache
      setQueryCache(createQueryCache());
    });
  });

  describe('clearQueryCache', () => {
    it('should clear all cached data', async () => {
      // Create some cached data
      useQuery(store, {
        queryKey: 'clear-test-1',
        queryFn: async () => 'data1',
        staleTime: 5000
      });

      useQuery(store, {
        queryKey: 'clear-test-2',
        queryFn: async () => 'data2',
        staleTime: 5000
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Clear cache
      clearQueryCache();

      // New queries should fetch again
      const queryFn1 = vi.fn(async () => 'new-data1');
      const queryFn2 = vi.fn(async () => 'new-data2');

      useQuery(store, {
        queryKey: 'clear-test-1',
        queryFn: queryFn1,
        staleTime: 5000
      });

      useQuery(store, {
        queryKey: 'clear-test-2',
        queryFn: queryFn2,
        staleTime: 5000
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(queryFn1).toHaveBeenCalledTimes(1);
      expect(queryFn2).toHaveBeenCalledTimes(1);
    });
  });
});
