import { useCallback, useEffect, useRef } from 'react';
import { getPrefetchManager } from '../src/prefetch/prefetch-manager';
import type { PrefetchOptions } from '../src/prefetch/types';

/**
 * Hook for programmatic prefetching
 *
 * @example
 * ```tsx
 * function UserList() {
 *   const prefetchUser = usePrefetch();
 *
 *   return (
 *     <div>
 *       {users.map(user => (
 *         <div
 *           key={user.id}
 *           onMouseEnter={() => prefetchUser({
 *             queryKey: `user-${user.id}`,
 *             queryFn: () => fetchUser(user.id),
 *           })}
 *         >
 *           {user.name}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrefetch() {
  const manager = getPrefetchManager();

  return useCallback(
    async (options: PrefetchOptions) => {
      await manager.prefetch(options);
    },
    [manager]
  );
}

/**
 * Hook for hover-based prefetching with delay and cancellation
 *
 * @example
 * ```tsx
 * function UserLink({ userId }) {
 *   const { onMouseEnter, onMouseLeave } = usePrefetchOnHover({
 *     queryKey: `user-${userId}`,
 *     queryFn: () => fetchUser(userId),
 *     delay: 200,
 *   });
 *
 *   return (
 *     <a {...{ onMouseEnter, onMouseLeave }}>
 *       View User
 *     </a>
 *   );
 * }
 * ```
 *
 * @param options - Prefetch options with optional delay
 * @returns Mouse event handlers
 */
export function usePrefetchOnHover(
  options: PrefetchOptions & { delay?: number }
) {
  const manager = getPrefetchManager();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const onMouseEnter = useCallback(() => {
    const delay = optionsRef.current.delay ?? 150;

    timerRef.current = setTimeout(() => {
      manager.prefetch(optionsRef.current);
    }, delay);
  }, [manager]);

  const onMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    manager.cancel(optionsRef.current.queryKey);
  }, [manager]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { onMouseEnter, onMouseLeave };
}

/**
 * Hook for viewport-based prefetching using Intersection Observer
 *
 * @example
 * ```tsx
 * function LazyImage({ imageId }) {
 *   const ref = usePrefetchOnViewport({
 *     queryKey: `image-${imageId}`,
 *     queryFn: () => fetchImage(imageId),
 *     threshold: 0.5, // Prefetch when 50% visible
 *   });
 *
 *   return <div ref={ref}><img src={...} /></div>;
 * }
 * ```
 *
 * @param options - Prefetch options with optional threshold
 * @returns Ref to attach to the element
 */
export function usePrefetchOnViewport<T extends HTMLElement = HTMLDivElement>(
  options: PrefetchOptions & { threshold?: number }
) {
  const manager = getPrefetchManager();
  const elementRef = useRef<T>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            manager.prefetch(optionsRef.current);
            observer.disconnect();
          }
        });
      },
      { threshold: optionsRef.current.threshold ?? 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [manager]);

  return elementRef;
}

/**
 * Hook for idle-based prefetching using requestIdleCallback
 *
 * @example
 * ```tsx
 * function Page() {
 *   usePrefetchOnIdle([
 *     {
 *       queryKey: 'user',
 *       queryFn: fetchUser,
 *     },
 *     {
 *       queryKey: 'posts',
 *       queryFn: fetchPosts,
 *     },
 *   ]);
 *
 *   return <div>...</div>;
 * }
 * ```
 *
 * @param queries - Array of prefetch options to execute when idle
 */
export function usePrefetchOnIdle(queries: PrefetchOptions[]) {
  const manager = getPrefetchManager();
  const queriesRef = useRef(queries);
  queriesRef.current = queries;

  useEffect(() => {
    // Fallback for browsers without requestIdleCallback
    const requestIdleCallback =
      (window as any).requestIdleCallback ||
      ((cb: () => void) => setTimeout(cb, 1));

    const cancelIdleCallback =
      (window as any).cancelIdleCallback || clearTimeout;

    const handle = requestIdleCallback(() => {
      queriesRef.current.forEach((options) => {
        manager.prefetch(options);
      });
    });

    return () => {
      cancelIdleCallback(handle);
    };
  }, [manager]);
}

/**
 * Hook for focus-based prefetching
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const { onFocus } = usePrefetchOnFocus({
 *     queryKey: 'search-results',
 *     queryFn: fetchSearchResults,
 *     delay: 100,
 *   });
 *
 *   return <input onFocus={onFocus} />;
 * }
 * ```
 *
 * @param options - Prefetch options with optional delay
 * @returns Focus event handler
 */
export function usePrefetchOnFocus(
  options: PrefetchOptions & { delay?: number }
) {
  const manager = getPrefetchManager();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const onFocus = useCallback(() => {
    const delay = optionsRef.current.delay ?? 0;

    timerRef.current = setTimeout(() => {
      manager.prefetch(optionsRef.current);
    }, delay);
  }, [manager]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { onFocus };
}
