import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { StoreProvider } from '@nexus-state/react';
import { createStore } from '@nexus-state/core';
import { useInfiniteQuery } from '../useInfiniteQuery';
import { clearQueryCache } from '../../src/query';

interface Page {
  items: string[];
  nextCursor?: number;
  previousCursor?: number;
}

describe('useInfiniteQuery', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreProvider store={createStore()}>{children}</StoreProvider>
  );

  beforeEach(() => {
    clearQueryCache();
    vi.clearAllMocks();
  });

  it('should fetch initial page', async () => {
    const queryFn = vi.fn().mockImplementation(async ({ pageParam }) => ({
      items: [`item-${pageParam}-1`, `item-${pageParam}-2`],
      nextCursor: (pageParam as number) + 1,
    }));

    const { result } = renderHook(
      () =>
        useInfiniteQuery<Page, Error, number>({
          queryKey: 'infinite-test',
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.data?.pages[0].items).toEqual([
      'item-0-1',
      'item-0-2',
    ]);
    expect(result.current.hasNextPage).toBe(true);
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('should fetch next page', async () => {
    const queryFn = vi.fn().mockImplementation(async ({ pageParam }) => ({
      items: [`item-${pageParam}-1`, `item-${pageParam}-2`],
      nextCursor: (pageParam as number) < 2 ? (pageParam as number) + 1 : undefined,
    }));

    const { result } = renderHook(
      () =>
        useInfiniteQuery<Page, Error, number>({
          queryKey: 'infinite-next',
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Fetch next page
    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
    });

    expect(result.current.data?.pages[1].items).toEqual([
      'item-1-1',
      'item-1-2',
    ]);
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('should indicate no more pages', async () => {
    const queryFn = vi.fn().mockImplementation(async ({ pageParam }) => ({
      items: [`item-${pageParam}`],
      nextCursor: undefined, // No more pages
    }));

    const { result } = renderHook(
      () =>
        useInfiniteQuery<Page, Error, number>({
          queryKey: 'infinite-end',
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it('should track isFetchingNextPage', async () => {
    const queryFn = vi.fn().mockImplementation(async ({ pageParam }) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        items: [`item-${pageParam}`],
        nextCursor: (pageParam as number) + 1,
      };
    });

    const { result } = renderHook(
      () =>
        useInfiniteQuery<Page, Error, number>({
          queryKey: 'infinite-fetching',
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Start fetching next page
    act(() => {
      result.current.fetchNextPage();
    });

    // Check isFetchingNextPage is true during fetch
    await waitFor(() => {
      expect(result.current.isFetchingNextPage).toBe(true);
    });

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.isFetchingNextPage).toBe(false);
    });
  });

  it('should support offset-based pagination', async () => {
    const queryFn = vi.fn().mockImplementation(async ({ pageParam }) => {
      const offset = pageParam as number;
      const limit = 10;

      return {
        items: Array.from({ length: limit }, (_, i) => `item-${offset + i}`),
        hasMore: offset + limit < 25,
      };
    });

    const { result } = renderHook(
      () =>
        useInfiniteQuery({
          queryKey: 'infinite-offset',
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.hasMore) return undefined;
            return allPages.length * 10;
          },
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.data?.pages[0].items).toHaveLength(10);
  });

  it('should refetch all pages', async () => {
    const queryFn = vi.fn().mockImplementation(async ({ pageParam }) => ({
      items: [`item-${pageParam}-${Date.now()}`],
      nextCursor: (pageParam as number) + 1,
    }));

    const { result } = renderHook(
      () =>
        useInfiniteQuery<Page, Error, number>({
          queryKey: 'infinite-refetch',
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Fetch next page
    await act(async () => {
      await result.current.fetchNextPage();
    });

    const callCountBefore = queryFn.mock.calls.length;

    // Refetch all
    await act(async () => {
      await result.current.refetch();
    });

    // Should refetch both pages
    expect(queryFn.mock.calls.length).toBe(callCountBefore + 2);
  });

  it('should fetch previous page', async () => {
    const queryFn = vi.fn().mockImplementation(async ({ pageParam }) => {
      const param = pageParam as number;
      return {
        items: [`item-${param}`],
        nextCursor: param < 2 ? param + 1 : undefined,
        previousCursor: param > 0 ? param - 1 : undefined,
      };
    });

    const { result } = renderHook(
      () =>
        useInfiniteQuery<Page, Error, number>({
          queryKey: 'infinite-previous',
          queryFn,
          initialPageParam: 1,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
          getPreviousPageParam: (firstPage) => firstPage.previousCursor,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Fetch previous page
    await act(async () => {
      await result.current.fetchPreviousPage();
    });

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
    });

    // Previous page should be first
    expect(result.current.data?.pages[0].items).toEqual(['item-0']);
    expect(result.current.data?.pages[1].items).toEqual(['item-1']);
  });

  it('should track hasPreviousPage', async () => {
    const queryFn = vi.fn().mockImplementation(async ({ pageParam }) => ({
      items: [`item-${pageParam}`],
      previousCursor: (pageParam as number) > 0 ? (pageParam as number) - 1 : undefined,
    }));

    const { result } = renderHook(
      () =>
        useInfiniteQuery<Page, Error, number>({
          queryKey: 'infinite-has-prev',
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
          getPreviousPageParam: (firstPage) => firstPage.previousCursor,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // No previous page from initial param 0
    expect(result.current.hasPreviousPage).toBe(false);
  });

  it('should handle errors', async () => {
    const error = new Error('Fetch failed');
    const queryFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(
      () =>
        useInfiniteQuery<Page, Error, number>({
          queryKey: 'infinite-error',
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });

  it('should respect enabled option', async () => {
    const queryFn = vi.fn().mockResolvedValue({
      items: ['item-0'],
      nextCursor: 1,
    });

    const { result } = renderHook(
      () =>
        useInfiniteQuery<Page, Error, number>({
          queryKey: 'infinite-enabled',
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
          enabled: false,
        }),
      { wrapper }
    );

    // Should not fetch initially
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(queryFn).not.toHaveBeenCalled();
  });

  it('should remove query from cache', async () => {
    const queryFn = vi.fn().mockResolvedValue({
      items: ['item-0'],
      nextCursor: 1,
    });

    const { result } = renderHook(
      () =>
        useInfiniteQuery<Page, Error, number>({
          queryKey: 'infinite-remove',
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Remove query
    act(() => {
      result.current.remove();
    });

    // State should be reset
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
  });

  it('should track isFetching state', async () => {
    const queryFn = vi.fn().mockImplementation(async ({ pageParam }) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        items: [`item-${pageParam}`],
        nextCursor: (pageParam as number) + 1,
      };
    });

    const { result } = renderHook(
      () =>
        useInfiniteQuery<Page, Error, number>({
          queryKey: 'infinite-is-fetching',
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        }),
      { wrapper }
    );

    // Should be fetching initially
    await waitFor(() => {
      expect(result.current.isFetching).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });
  });

  it('should handle array query keys', async () => {
    const queryFn = vi.fn().mockResolvedValue({
      items: ['item-0'],
      nextCursor: 1,
    });

    const { result } = renderHook(
      () =>
        useInfiniteQuery<Page, Error, number>({
          queryKey: ['posts', { userId: 1, status: 'active' }],
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(queryFn).toHaveBeenCalled();
  });

  it('should call onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const queryFn = vi.fn().mockResolvedValue({
      items: ['item-0'],
      nextCursor: 1,
    });

    const { result } = renderHook(
      () =>
        useInfiniteQuery<Page, Error, number>({
          queryKey: 'infinite-success',
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
          onSuccess,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith({
      pages: [{ items: ['item-0'], nextCursor: 1 }],
      pageParams: [0],
    });
  });

  it('should call onError callback', async () => {
    const onError = vi.fn();
    const error = new Error('Fetch failed');
    const queryFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(
      () =>
        useInfiniteQuery<Page, Error, number>({
          queryKey: 'infinite-error-callback',
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
          onError,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith(error);
  });
});
