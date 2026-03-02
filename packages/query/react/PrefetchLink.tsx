import React, { useCallback } from 'react';
import { usePrefetchOnHover } from './usePrefetch';
import type { PrefetchOptions } from '../src/prefetch/types';

/**
 * Props for PrefetchLink component
 */
export interface PrefetchLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Prefetch options */
  prefetch?: PrefetchOptions;

  /** Delay before prefetching (ms) */
  prefetchDelay?: number;
}

/**
 * Link component with automatic prefetching on hover
 *
 * @example
 * ```tsx
 * <PrefetchLink
 *   href="/users/1"
 *   prefetch={{
 *     queryKey: 'user-1',
 *     queryFn: () => fetchUser(1),
 *   }}
 *   prefetchDelay={200}
 * >
 *   View User
 * </PrefetchLink>
 * ```
 */
export function PrefetchLink({
  prefetch,
  prefetchDelay,
  children,
  onMouseEnter,
  onMouseLeave,
  ...props
}: PrefetchLinkProps) {
  const {
    onMouseEnter: prefetchMouseEnter,
    onMouseLeave: prefetchMouseLeave,
  } = usePrefetchOnHover({
    ...prefetch!,
    delay: prefetchDelay,
  });

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (prefetch) {
        prefetchMouseEnter();
      }
      onMouseEnter?.(e);
    },
    [prefetch, prefetchMouseEnter, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (prefetch) {
        prefetchMouseLeave();
      }
      onMouseLeave?.(e);
    },
    [prefetch, prefetchMouseLeave, onMouseLeave]
  );

  return (
    <a
      {...props}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </a>
  );
}

/**
 * Props for PrefetchButton component
 */
export interface PrefetchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Prefetch options */
  prefetch?: PrefetchOptions;

  /** Delay before prefetching (ms) */
  prefetchDelay?: number;
}

/**
 * Button component with automatic prefetching on hover
 *
 * @example
 * ```tsx
 * <PrefetchButton
 *   prefetch={{
 *     queryKey: 'modal-content',
 *     queryFn: fetchModalContent,
 *   }}
 * >
 *   Open Modal
 * </PrefetchButton>
 * ```
 */
export function PrefetchButton({
  prefetch,
  prefetchDelay,
  children,
  onMouseEnter,
  onMouseLeave,
  ...props
}: PrefetchButtonProps) {
  const {
    onMouseEnter: prefetchMouseEnter,
    onMouseLeave: prefetchMouseLeave,
  } = usePrefetchOnHover({
    ...prefetch!,
    delay: prefetchDelay,
  });

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (prefetch) {
        prefetchMouseEnter();
      }
      onMouseEnter?.(e);
    },
    [prefetch, prefetchMouseEnter, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (prefetch) {
        prefetchMouseLeave();
      }
      onMouseLeave?.(e);
    },
    [prefetch, prefetchMouseLeave, onMouseLeave]
  );

  return (
    <button
      {...props}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}
