import { describe, it, expect, vi } from 'vitest';
// Use adapter for renderHook to support React 17/18/19
import { renderHook, waitFor } from '../../src/__tests__/renderHook-adapter';
import { StoreProvider } from '@nexus-state/react';
import { createStore } from '@nexus-state/core';
import { useQueries } from '../useQueries';
import { useIsFetching } from '../useIsFetching';

describe('useQueries', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreProvider store={createStore()}>{children}</StoreProvider>
  );

  it('should execute multiple queries in parallel', async () => {
    const queryFn1 = vi.fn().mockResolvedValue({ data: 'test1' });
    const queryFn2 = vi.fn().mockResolvedValue({ data: 'test2' });

    const { result } = renderHook(
      () =>
        useQueries([
          {
            queryKey: 'test1',
            queryFn: queryFn1,
          },
          {
            queryKey: 'test2',
            queryFn: queryFn2,
          },
        ]),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current[0].isSuccess).toBe(true);
      expect(result.current[1].isSuccess).toBe(true);
    });

    expect(queryFn1).toHaveBeenCalledTimes(1);
    expect(queryFn2).toHaveBeenCalledTimes(1);
    expect(result.current[0].data).toEqual({ data: 'test1' });
    expect(result.current[1].data).toEqual({ data: 'test2' });
  });

  it('should handle mixed success and error states', async () => {
    const error = new Error('Failed');
    const queryFn1 = vi.fn().mockResolvedValue({ data: 'success' });
    const queryFn2 = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(
      () =>
        useQueries([
          {
            queryKey: 'test1',
            queryFn: queryFn1,
          },
          {
            queryKey: 'test2',
            queryFn: queryFn2,
            options: { retry: 0 },
          },
        ]),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current[0].isSuccess).toBe(true);
      expect(result.current[1].isError).toBe(true);
    }, { timeout: 3000 });

    expect(result.current[0].data).toEqual({ data: 'success' });
    expect(result.current[1].error).toBe(error);
  });

  it('should respect individual query options', async () => {
    const queryFn1 = vi.fn().mockResolvedValue({ data: 'test1' });
    const queryFn2 = vi.fn().mockResolvedValue({ data: 'test2' });

    const { result } = renderHook(
      () =>
        useQueries([
          {
            queryKey: 'test1',
            queryFn: queryFn1,
            options: { enabled: false },
          },
          {
            queryKey: 'test2',
            queryFn: queryFn2,
          },
        ]),
      { wrapper }
    );

    // First query should be idle (disabled)
    expect(result.current[0].status).toBe('idle');
    expect(queryFn1).not.toHaveBeenCalled();

    // Second query should be loading
    expect(result.current[1].isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });

    expect(queryFn2).toHaveBeenCalledTimes(1);
  });

  it('should support typed queries', async () => {
    interface User {
      id: number;
      name: string;
    }

    interface Post {
      id: number;
      title: string;
    }

    const userQueryFn = vi.fn().mockResolvedValue({ id: 1, name: 'John' });
    const postQueryFn = vi.fn().mockResolvedValue({ id: 1, title: 'Post' });

    const { result } = renderHook(
      () =>
        useQueries<[User, Post]>([
          {
            queryKey: 'user',
            queryFn: userQueryFn,
          },
          {
            queryKey: 'post',
            queryFn: postQueryFn,
          },
        ]),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current[0].isSuccess).toBe(true);
      expect(result.current[1].isSuccess).toBe(true);
    });

    // Type checking should work
    expect(result.current[0].data?.name).toBe('John');
    expect(result.current[1].data?.title).toBe('Post');
  });

  it('should support array query keys', async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(
      () =>
        useQueries([
          {
            queryKey: ['users', '1'],
            queryFn,
          },
        ]),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current[0].isSuccess).toBe(true);
    });

    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});

describe('useIsFetching', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreProvider store={createStore()}>{children}</StoreProvider>
  );

  it('should return number of fetching queries', () => {
    const { result } = renderHook(() => useIsFetching(), { wrapper });

    // Initial value should be 0 (no queries fetching)
    expect(result.current).toBe(0);
  });

  it('should accept queryKey filter option', () => {
    const { result } = renderHook(
      () =>
        useIsFetching({
          queryKey: 'users',
        }),
      { wrapper }
    );

    expect(result.current).toBe(0);
  });

  it('should return 0 when no queries are fetching', async () => {
    const { result } = renderHook(() => useIsFetching(), { wrapper });

    expect(result.current).toBe(0);
  });
});
