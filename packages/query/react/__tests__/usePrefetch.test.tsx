import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePrefetch, usePrefetchOnHover, usePrefetchOnViewport, usePrefetchOnIdle } from '../usePrefetch';
import { resetPrefetchManager } from '../../src/prefetch/prefetch-manager';

describe('usePrefetch', () => {
  beforeEach(() => {
    resetPrefetchManager();
  });

  it('should prefetch query', async () => {
    const queryFn = vi.fn(async () => ({ data: 'test' }));

    const { result } = renderHook(() => usePrefetch());

    await result.current({
      queryKey: 'test',
      queryFn,
    });

    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('should be stable across renders', () => {
    const { result, rerender } = renderHook(() => usePrefetch());

    const firstPrefetch = result.current;
    rerender();
    const secondPrefetch = result.current;

    expect(firstPrefetch).toBe(secondPrefetch);
  });
});

describe('usePrefetchOnHover', () => {
  beforeEach(() => {
    resetPrefetchManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should prefetch on mouse enter after delay', async () => {
    const queryFn = vi.fn(async () => ({ data: 'test' }));

    const { result } = renderHook(() =>
      usePrefetchOnHover({
        queryKey: 'test',
        queryFn,
        delay: 100,
      })
    );

    result.current.onMouseEnter();

    // Before delay
    expect(queryFn).not.toHaveBeenCalled();

    // After delay
    vi.advanceTimersByTime(100);

    // Wait for async prefetch
    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });
  });

  it('should cancel prefetch on mouse leave', async () => {
    const queryFn = vi.fn(
      async () => new Promise((resolve) => setTimeout(() => resolve({ data: 'test' }), 100))
    );

    const { result } = renderHook(() =>
      usePrefetchOnHover({
        queryKey: 'test',
        queryFn,
        delay: 0,
      })
    );

    result.current.onMouseEnter();
    vi.advanceTimersByTime(0);

    result.current.onMouseLeave();

    // Wait for async prefetch
    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });
  });

  it('should use default delay', () => {
    const queryFn = vi.fn(async () => ({ data: 'test' }));

    const { result } = renderHook(() =>
      usePrefetchOnHover({
        queryKey: 'test',
        queryFn,
      })
    );

    result.current.onMouseEnter();

    vi.advanceTimersByTime(149);
    expect(queryFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(queryFn).toHaveBeenCalled();
  });
});

describe('usePrefetchOnViewport', () => {
  beforeEach(() => {
    resetPrefetchManager();
  });

  it('should prefetch when element is in viewport', async () => {
    const queryFn = vi.fn(async () => ({ data: 'test' }));

    // Mock IntersectionObserver
    let observerCallback: ((entries: any[]) => void) | null = null;
    const disconnectMock = vi.fn();
    const IntersectionObserverMock = vi.fn((callback) => {
      observerCallback = callback;
      return {
        observe: vi.fn(() => {
          // Trigger callback asynchronously
          setTimeout(() => {
            if (observerCallback) {
              observerCallback([{ isIntersecting: true }]);
            }
          }, 0);
        }),
        disconnect: disconnectMock,
      };
    });

    const originalIntersectionObserver = global.IntersectionObserver;
    global.IntersectionObserver = IntersectionObserverMock as any;

    const { result } = renderHook(() =>
      usePrefetchOnViewport<HTMLDivElement>({
        queryKey: 'test',
        queryFn,
        threshold: 0.5,
      })
    );

    // Attach ref to a div
    const div = document.createElement('div');
    result.current.current = div;

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    expect(disconnectMock).toHaveBeenCalled();

    // Restore
    global.IntersectionObserver = originalIntersectionObserver;
  });

  it('should use default threshold', async () => {
    const queryFn = vi.fn(async () => ({ data: 'test' }));

    let observerCallback: ((entries: any[]) => void) | null = null;
    const IntersectionObserverMock = vi.fn((callback) => {
      observerCallback = callback;
      return {
        observe: vi.fn(() => {
          setTimeout(() => {
            if (observerCallback) {
              observerCallback([{ isIntersecting: true }]);
            }
          }, 0);
        }),
        disconnect: vi.fn(),
      };
    });

    const originalIntersectionObserver = global.IntersectionObserver;
    global.IntersectionObserver = IntersectionObserverMock as any;

    renderHook(() =>
      usePrefetchOnViewport<HTMLDivElement>({
        queryKey: 'test',
        queryFn,
      })
    );

    expect(IntersectionObserverMock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ threshold: 0.1 })
    );

    global.IntersectionObserver = originalIntersectionObserver;
  });
});

describe('usePrefetchOnIdle', () => {
  beforeEach(() => {
    resetPrefetchManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should prefetch queries on idle', async () => {
    const queryFn1 = vi.fn(async () => ({ data: 'test1' }));
    const queryFn2 = vi.fn(async () => ({ data: 'test2' }));

    // Mock requestIdleCallback
    const originalRIC = (window as any).requestIdleCallback;
    (window as any).requestIdleCallback = vi.fn((cb) => {
      setTimeout(cb, 0);
      return 0;
    });

    renderHook(() =>
      usePrefetchOnIdle([
        { queryKey: 'test-1', queryFn: queryFn1 },
        { queryKey: 'test-2', queryFn: queryFn2 },
      ])
    );

    vi.advanceTimersByTime(0);

    await waitFor(() => {
      expect(queryFn1).toHaveBeenCalledTimes(1);
      expect(queryFn2).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });

    // Restore
    (window as any).requestIdleCallback = originalRIC;
  });

  it('should cleanup on unmount', async () => {
    const queryFn = vi.fn(async () => ({ data: 'test' }));

    const originalRIC = (window as any).requestIdleCallback;
    const originalCIC = (window as any).cancelIdleCallback;

    const cancelMock = vi.fn();
    (window as any).requestIdleCallback = vi.fn((cb) => {
      return setTimeout(cb, 100);
    });
    (window as any).cancelIdleCallback = cancelMock;

    const { unmount } = renderHook(() =>
      usePrefetchOnIdle([{ queryKey: 'test', queryFn }])
    );

    unmount();

    expect(cancelMock).toHaveBeenCalled();

    // Restore
    (window as any).requestIdleCallback = originalRIC;
    (window as any).cancelIdleCallback = originalCIC;
  });
});
