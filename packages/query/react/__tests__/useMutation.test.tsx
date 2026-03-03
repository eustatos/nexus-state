import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Use adapter for renderHook to support React 17/18/19
import { renderHook, waitFor, act, cleanup } from '../../src/__tests__/renderHook-adapter';
import { StoreProvider } from '@nexus-state/react';
import { createStore } from '@nexus-state/core';
import { useMutation } from '../useMutation';

describe('useMutation', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreProvider store={createStore()}>{children}</StoreProvider>
  );

  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('should execute mutation', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });

    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn,
        }),
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
      () =>
        useMutation({
          mutationFn,
        }),
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
      () =>
        useMutation({
          mutationFn,
        }),
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

  it('should call onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn,
          onSuccess,
        }),
      { wrapper }
    );

    act(() => {
      result.current.mutate({ name: 'Test' });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith(
        { id: 1 },
        { name: 'Test' },
        undefined
      );
    });
  });

  it('should call onError callback', async () => {
    const onError = vi.fn();
    const error = new Error('Failed');
    const mutationFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn,
          onError,
        }),
      { wrapper }
    );

    act(() => {
      result.current.mutate({});
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error, {}, undefined);
    });
  });

  it('should call onSettled callback', async () => {
    const onSettled = vi.fn();
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn,
          onSettled,
        }),
      { wrapper }
    );

    act(() => {
      result.current.mutate({ name: 'Test' });
    });

    await waitFor(() => {
      expect(onSettled).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onMutate for optimistic updates', async () => {
    const onMutate = vi.fn().mockReturnValue({ previousData: 'old' });
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn,
          onMutate,
        }),
      { wrapper }
    );

    act(() => {
      result.current.mutate({ name: 'New' });
    });

    await waitFor(() => {
      expect(onMutate).toHaveBeenCalledWith({ name: 'New' });
    });
  });

  it('should have stable mutate function reference', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

    const { result, rerender } = renderHook(
      () =>
        useMutation({
          mutationFn,
        }),
      { wrapper }
    );

    const firstMutate = result.current.mutate;

    rerender();

    expect(result.current.mutate).toBe(firstMutate);
  });

  it('should have stable mutateAsync function reference', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

    const { result, rerender } = renderHook(
      () =>
        useMutation({
          mutationFn,
        }),
      { wrapper }
    );

    const firstMutateAsync = result.current.mutateAsync;

    rerender();

    expect(result.current.mutateAsync).toBe(firstMutateAsync);
  });

  it('should track variables during mutation', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn,
        }),
      { wrapper }
    );

    act(() => {
      result.current.mutate({ name: 'Test' });
    });

    await waitFor(() => {
      expect(result.current.variables).toEqual({ name: 'Test' });
    });
  });

  it('should track failure count on retries', async () => {
    const error = new Error('Failed');
    const mutationFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn,
          retry: 2,
          retryDelay: 10,
        }),
      { wrapper }
    );

    act(() => {
      result.current.mutate({});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.failureCount).toBeGreaterThan(0);
  });

  it('should support async mutateAsync', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn,
        }),
      { wrapper }
    );

    let data: unknown;
    await act(async () => {
      data = await result.current.mutateAsync({ name: 'Test' });
    });

    expect(data).toEqual({ id: 1 });
    expect(mutationFn).toHaveBeenCalledWith({ name: 'Test' });
  });
});
