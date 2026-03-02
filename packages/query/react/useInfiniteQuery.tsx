import { useEffect, useCallback, useRef } from 'react';
import { useAtomValue, useStore } from '@nexus-state/react';
import { createInfiniteQuery } from '../src/infinite-query';
import type {
  InfiniteQueryOptions,
  InfiniteQueryResult,
} from './types';

/**
 * Hook for infinite scrolling and pagination
 *
 * @example
 * ```tsx
 * interface Post {
 *   id: number;
 *   title: string;
 * }
 *
 * interface PostsResponse {
 *   posts: Post[];
 *   nextCursor?: number;
 * }
 *
 * function PostList() {
 *   const {
 *     data,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteQuery<PostsResponse, Error, number>({
 *     queryKey: 'posts',
 *     queryFn: async ({ pageParam }) => {
 *       const response = await fetch(`/api/posts?cursor=${pageParam}`);
 *       return response.json();
 *     },
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *   });
 *
 *   return (
 *     <div>
 *       {data?.pages.map((page) =>
 *         page.posts.map((post) => (
 *           <div key={post.id}>{post.title}</div>
 *         ))
 *       )}
 *       {hasNextPage && (
 *         <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
 *           {isFetchingNextPage ? 'Loading...' : 'Load More'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @param options - Infinite query options including query key, function, and pagination config
 * @returns Query result with pages data and pagination methods
 */
export function useInfiniteQuery<
  TData = unknown,
  TError = Error,
  TPageParam = unknown,
>(
  options: InfiniteQueryOptions<TData, TError, TPageParam>
): InfiniteQueryResult<TData, TError> {
  const store = useStore();
  const optionsRef = useRef(options);

  // Keep options ref updated
  optionsRef.current = options;

  // Create query instance (stable across renders)
  const queryRef = useRef(
    createInfiniteQuery<TData, TError, TPageParam>(store, options)
  );

  // Recreate query if queryKey changes
  const prevQueryKeyRef = useRef(options.queryKey);
  if (
    JSON.stringify(prevQueryKeyRef.current) !== JSON.stringify(options.queryKey)
  ) {
    prevQueryKeyRef.current = options.queryKey;
    queryRef.current = createInfiniteQuery<TData, TError, TPageParam>(
      store,
      options
    );
  }

  const query = queryRef.current;
  const state = useAtomValue(query.stateAtom);

  // Initial fetch
  useEffect(() => {
    const enabled = optionsRef.current.enabled ?? true;
    if (enabled && state.status === 'idle') {
      query.fetchInitialPage();
    }
  }, [query, state.status]);

  // Stable callbacks
  const fetchNextPage = useCallback(async () => {
    await query.fetchNextPage();
  }, [query]);

  const fetchPreviousPage = useCallback(async () => {
    await query.fetchPreviousPage();
  }, [query]);

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const remove = useCallback(() => {
    query.remove();
  }, [query]);

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    isError: state.isError,
    isSuccess: state.isSuccess,
    isFetching: state.isFetching,
    isFetchingNextPage: state.isFetchingNextPage,
    isFetchingPreviousPage: state.isFetchingPreviousPage,
    hasNextPage: query.hasNextPage(),
    hasPreviousPage: query.hasPreviousPage(),
    fetchNextPage,
    fetchPreviousPage,
    refetch,
    remove,
  };
}
