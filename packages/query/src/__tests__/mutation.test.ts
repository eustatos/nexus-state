import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { mutation } from '../mutation';

describe('mutation()', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('Basic Mutation', () => {
    it('should execute mutation successfully', async () => {
      const mutationFn = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });

      const mut = mutation({
        mutationFn,
        store,
      });

      const result = await mut.mutateAsync({ name: 'Test' });

      expect(result).toEqual({ id: 1, name: 'Test' });
      expect(mutationFn).toHaveBeenCalledWith({ name: 'Test' });

      const state = store.get(mut.state);
      expect(state.status).toBe('success');
      expect(state.data).toEqual({ id: 1, name: 'Test' });
      expect(state.isSuccess).toBe(true);
    });

    it('should handle mutation error', async () => {
      const error = new Error('Mutation failed');
      const mutationFn = vi.fn().mockRejectedValue(error);

      const mut = mutation({
        mutationFn,
        store,
      });

      await expect(mut.mutateAsync({})).rejects.toThrow('Mutation failed');

      const state = store.get(mut.state);
      expect(state.status).toBe('error');
      expect(state.error).toBe(error);
      expect(state.isError).toBe(true);
      expect(state.failureCount).toBe(1);
    });

    it('should track loading state', async () => {
      const mutationFn = vi.fn(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: 1 }), 10))
      );

      const mut = mutation({
        mutationFn,
        store,
      });

      const promise = mut.mutateAsync({});

      const loadingState = store.get(mut.state);
      expect(loadingState.status).toBe('loading');
      expect(loadingState.isPending).toBe(true);

      await promise;

      const successState = store.get(mut.state);
      expect(successState.status).toBe('success');
      expect(successState.isPending).toBe(false);
    });

    it('should start in idle state', () => {
      const mut = mutation({
        mutationFn: vi.fn(),
        store,
      });

      const state = store.get(mut.state);
      expect(state.status).toBe('idle');
      expect(state.isIdle).toBe(true);
      expect(state.isPending).toBe(false);
    });
  });

  describe('Callbacks', () => {
    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn();
      const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

      const mut = mutation({
        mutationFn,
        onSuccess,
        store,
      });

      await mut.mutateAsync({ name: 'Test' });

      expect(onSuccess).toHaveBeenCalledWith({ id: 1 }, { name: 'Test' }, undefined);
    });

    it('should call onError callback', async () => {
      const error = new Error('Failed');
      const onError = vi.fn();
      const mutationFn = vi.fn().mockRejectedValue(error);

      const mut = mutation({
        mutationFn,
        onError,
        store,
      });

      await expect(mut.mutateAsync({})).rejects.toThrow();

      expect(onError).toHaveBeenCalledWith(error, {}, undefined);
    });

    it('should call onSettled callback on success', async () => {
      const onSettled = vi.fn();
      const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

      const mut = mutation({
        mutationFn,
        onSettled,
        store,
      });

      await mut.mutateAsync({});

      expect(onSettled).toHaveBeenCalledWith({ id: 1 }, null, {}, undefined);
    });

    it('should call onSettled callback on error', async () => {
      const error = new Error('Failed');
      const onSettled = vi.fn();
      const mutationFn = vi.fn().mockRejectedValue(error);

      const mut = mutation({
        mutationFn,
        onSettled,
        store,
      });

      await expect(mut.mutateAsync({})).rejects.toThrow();

      expect(onSettled).toHaveBeenCalledWith(undefined, error, {}, undefined);
    });
  });

  describe('Optimistic Updates', () => {
    it('should call onMutate for optimistic updates', async () => {
      const onMutate = vi.fn().mockResolvedValue({ previousData: 'old' });
      const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

      const mut = mutation({
        mutationFn,
        onMutate,
        store,
      });

      await mut.mutateAsync({ name: 'Test' });

      expect(onMutate).toHaveBeenCalledWith({ name: 'Test' });
    });

    it('should pass context to callbacks', async () => {
      const context = { previousData: 'old' };
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onSettled = vi.fn();

      const mut = mutation({
        mutationFn: vi.fn().mockResolvedValue({ id: 1 }),
        onMutate: vi.fn().mockResolvedValue(context),
        onSuccess,
        onError,
        onSettled,
        store,
      });

      await mut.mutateAsync({});

      expect(onSuccess).toHaveBeenCalledWith({ id: 1 }, {}, context);
      expect(onSettled).toHaveBeenCalledWith({ id: 1 }, null, {}, context);
    });

    it('should pass context to onError callback', async () => {
      const error = new Error('Failed');
      const context = { previousData: 'old' };
      const onError = vi.fn();
      const onSettled = vi.fn();

      const mut = mutation({
        mutationFn: vi.fn().mockRejectedValue(error),
        onMutate: vi.fn().mockResolvedValue(context),
        onError,
        onSettled,
        store,
      });

      await expect(mut.mutateAsync({})).rejects.toThrow();

      expect(onError).toHaveBeenCalledWith(error, {}, context);
      expect(onSettled).toHaveBeenCalledWith(undefined, error, {}, context);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on failure', async () => {
      const mutationFn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue({ id: 1 });

      const mut = mutation({
        mutationFn,
        retry: 3,
        retryDelay: 10,
        store,
      });

      const result = await mut.mutateAsync({});

      expect(result).toEqual({ id: 1 });
      expect(mutationFn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const error = new Error('Fail');
      const mutationFn = vi.fn().mockRejectedValue(error);

      const mut = mutation({
        mutationFn,
        retry: 2,
        retryDelay: 10,
        store,
      });

      await expect(mut.mutateAsync({})).rejects.toThrow('Fail');
      expect(mutationFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use custom retry delay function', async () => {
      const mutationFn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue({ id: 1 });

      const retryDelay = vi.fn((count: number) => count * 100);

      const mut = mutation({
        mutationFn,
        retry: 2,
        retryDelay,
        store,
      });

      await mut.mutateAsync({});

      expect(retryDelay).toHaveBeenCalledWith(1);
    });

    it('should respect retry: false', async () => {
      const error = new Error('Fail');
      const mutationFn = vi.fn().mockRejectedValue(error);

      const mut = mutation({
        mutationFn,
        retry: false,
        store,
      });

      await expect(mut.mutateAsync({})).rejects.toThrow();
      expect(mutationFn).toHaveBeenCalledTimes(1);
    });

    it('should respect retry: true (default 3 retries)', async () => {
      const error = new Error('Fail');
      const mutationFn = vi.fn().mockRejectedValue(error);

      const mut = mutation({
        mutationFn,
        retry: true,
        retryDelay: 10,
        store,
      });

      await expect(mut.mutateAsync({})).rejects.toThrow();
      expect(mutationFn).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });

  describe('Reset', () => {
    it('should reset mutation state', async () => {
      const mut = mutation({
        mutationFn: vi.fn().mockResolvedValue({ id: 1 }),
        store,
      });

      await mut.mutateAsync({});

      const successState = store.get(mut.state);
      expect(successState.status).toBe('success');

      mut.reset();

      const resetState = store.get(mut.state);
      expect(resetState.status).toBe('idle');
      expect(resetState.data).toBeUndefined();
      expect(resetState.error).toBeNull();
    });

    it('should reset after error', async () => {
      const error = new Error('Fail');
      const mutationFn = vi.fn().mockRejectedValue(error);

      const mut = mutation({
        mutationFn,
        store,
      });

      await expect(mut.mutateAsync({})).rejects.toThrow();

      const errorState = store.get(mut.state);
      expect(errorState.status).toBe('error');

      mut.reset();

      const resetState = store.get(mut.state);
      expect(resetState.status).toBe('idle');
      expect(resetState.error).toBeNull();
    });
  });

  describe('Fire and Forget', () => {
    it('should execute mutation without await', async () => {
      return new Promise<void>((resolve) => {
        const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

        const mut = mutation({
          mutationFn,
          onSuccess: () => {
            expect(mutationFn).toHaveBeenCalled();
            resolve();
          },
          store,
        });

        mut.mutate({});
      });
    });

    it('should handle error in fire and forget', async () => {
      return new Promise<void>((resolve) => {
        const error = new Error('Fail');
        const mutationFn = vi.fn().mockRejectedValue(error);

        const mut = mutation({
          mutationFn,
          onError: (err) => {
            expect(err).toEqual(error);
            resolve();
          },
          store,
        });

        mut.mutate({});
      });
    });
  });

  describe('Variables Tracking', () => {
    it('should track variables in state', async () => {
      const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

      const mut = mutation({
        mutationFn,
        store,
      });

      const variables = { name: 'Test', value: 123 };
      await mut.mutateAsync(variables);

      const state = store.get(mut.state);
      expect(state.variables).toEqual(variables);
    });
  });

  describe('Query Invalidation', () => {
    it('should log invalidate queries', async () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

      const mut = mutation({
        mutationFn,
        invalidateQueries: ['posts', 'users'],
        store,
      });

      await mut.mutateAsync({});

      expect(consoleSpy).toHaveBeenCalledWith('Invalidating query: posts');
      expect(consoleSpy).toHaveBeenCalledWith('Invalidating query: users');

      consoleSpy.mockRestore();
    });

    it('should log refetch queries', async () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

      const mut = mutation({
        mutationFn,
        refetchQueries: ['posts'],
        store,
      });

      await mut.mutateAsync({});

      expect(consoleSpy).toHaveBeenCalledWith('Refetching query: posts');

      consoleSpy.mockRestore();
    });
  });

  describe('Default Store', () => {
    it('should create default store if not provided', async () => {
      const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

      const mut = mutation({
        mutationFn,
      });

      const result = await mut.mutateAsync({});
      expect(result).toEqual({ id: 1 });

      const state = store.get(mut.state);
      expect(state.status).toBe('idle'); // Different store instance
    });
  });
});
