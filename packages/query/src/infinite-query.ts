import { atom, Store, PrimitiveAtom } from '@nexus-state/core';
import type { InfiniteData, InfiniteQueryOptions } from '../react/types';

/**
 * Internal state for infinite query
 */
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

/**
 * Create initial state for infinite query
 */
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

/**
 * Infinite query object returned from createInfiniteQuery
 */
export interface InfiniteQueryObject<TData, TError, TPageParam> {
  /** Atom containing the query state */
  stateAtom: PrimitiveAtom<InfiniteQueryState<TData, TError>>;
  /** Fetch the initial page */
  fetchInitialPage: () => Promise<void>;
  /** Fetch the next page */
  fetchNextPage: () => Promise<void>;
  /** Fetch the previous page */
  fetchPreviousPage: () => Promise<void>;
  /** Refetch all pages */
  refetch: () => Promise<void>;
  /** Remove the query from cache */
  remove: () => void;
  /** Check if there's a next page */
  hasNextPage: () => boolean;
  /** Check if there's a previous page */
  hasPreviousPage: () => boolean;
}

/**
 * Create an infinite query instance
 * @param store - Nexus State store instance
 * @param options - Infinite query options
 * @returns Infinite query object with methods and state atom
 */
export function createInfiniteQuery<
  TData,
  TError,
  TPageParam,
>(
  store: Store,
  options: InfiniteQueryOptions<TData, TError, TPageParam>
): InfiniteQueryObject<TData, TError, TPageParam> {
  const queryKey =
    typeof options.queryKey === 'string'
      ? options.queryKey
      : JSON.stringify(options.queryKey);

  const stateAtom = atom<InfiniteQueryState<TData, TError>>(
    createInitialState(),
    `infinite-query:${queryKey}`
  );

  /**
   * Update state with partial updates
   */
  const updateState = (
    updates: Partial<InfiniteQueryState<TData, TError>>
  ) => {
    store.set(stateAtom, (prev) => {
      const next: InfiniteQueryState<TData, TError> = { ...prev, ...updates };
      // Derive boolean flags from status
      next.isLoading = next.status === 'loading' && !prev.data;
      next.isSuccess = next.status === 'success';
      next.isError = next.status === 'error';
      return next;
    });
  };

  /**
   * Fetch the initial (first) page
   */
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

      const newData: InfiniteData<TData> = {
        pages: [firstPage],
        pageParams: [options.initialPageParam],
      };

      updateState({
        status: 'success',
        data: newData,
        isFetching: false,
      });

      options.onSuccess?.(newData);
    } catch (error) {
      updateState({
        status: 'error',
        error: error as TError,
        isFetching: false,
      });

      options.onError?.(error as TError);
    }
  };

  /**
   * Fetch the next page
   */
  const fetchNextPage = async (): Promise<void> => {
    const currentState = store.get(stateAtom);
    const { data } = currentState;

    // If no data yet, fetch initial page
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
      // No more pages to fetch
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

  /**
   * Fetch the previous page
   */
  const fetchPreviousPage = async (): Promise<void> => {
    const currentState = store.get(stateAtom);
    const { data } = currentState;

    // If no data or no getPreviousPageParam, nothing to do
    if (!data || !options.getPreviousPageParam) {
      return;
    }

    // Get previous page param
    const previousPageParam = options.getPreviousPageParam(
      data.pages[0],
      data.pages
    );

    if (previousPageParam === undefined) {
      // No more previous pages to fetch
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

  /**
   * Refetch all existing pages
   */
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
        const page = await options.queryFn({
          pageParam: pageParam as TPageParam,
        });
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

  /**
   * Remove the query from cache (reset to initial state)
   */
  const remove = (): void => {
    updateState(createInitialState());
  };

  /**
   * Check if there's a next page available
   */
  const hasNextPage = (): boolean => {
    const { data } = store.get(stateAtom);
    if (!data || data.pages.length === 0) return false;

    const nextPageParam = options.getNextPageParam(
      data.pages[data.pages.length - 1],
      data.pages
    );

    return nextPageParam !== undefined;
  };

  /**
   * Check if there's a previous page available
   */
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
