import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { StoreProvider } from '@nexus-state/react';
import { createStore } from '@nexus-state/core';
import { useQuery } from '../useQuery';
import { clearQueryCache } from '../../src/query';

describe('useQuery', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreProvider store={createStore()}>{children}</StoreProvider>
  );

  beforeEach(() => {
    clearQueryCache();
  });

  it('should fetch data on mount', async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(() => useQuery('test-key', queryFn), {
      wrapper,
    });

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

    const { result } = renderHook(() => useQuery('test-key', queryFn, { retry: 0 }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    }, { timeout: 2000 });

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

    const { result } = renderHook(() => useQuery('test-key', queryFn), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('should return stale status', async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(
      () =>
        useQuery('test-key', queryFn, {
          staleTime: 0,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // After success, data should be stale immediately with staleTime: 0
    expect(result.current.isStale).toBe(true);
  });

  it('should use initial data', async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: 'fetched' });

    const { result } = renderHook(
      () =>
        useQuery('test-key', queryFn, {
          initialData: { data: 'initial' },
          retry: 0,
        }),
      { wrapper }
    );

    // Should start with initial data and success status
    expect(result.current.data).toEqual({ data: 'initial' });
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isIdle).toBe(false);
  });

  it('should retry on failure', async () => {
    const error = new Error('Failed');
    const queryFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(
      () =>
        useQuery('test-key', queryFn, {
          retry: 2,
          retryDelay: 10,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should have retried 2 times (total 3 attempts)
    expect(queryFn).toHaveBeenCalledTimes(3);
  });

  it('should call onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const queryFn = vi.fn().mockResolvedValue({ data: 'test' });

    renderHook(
      () =>
        useQuery('test-key', queryFn, {
          onSuccess,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith({ data: 'test' });
    });
  });

  it('should call onError callback', async () => {
    const onError = vi.fn();
    const error = new Error('Failed');
    const queryFn = vi.fn().mockRejectedValue(error);

    renderHook(
      () =>
        useQuery('test-key', queryFn, {
          onError,
          retry: 0,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error);
    }, { timeout: 2000 });
  });

  it('should use custom query key array', async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(
      () => useQuery(['users', '1'], queryFn),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});
