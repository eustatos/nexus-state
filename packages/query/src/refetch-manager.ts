import type { RefetchManager, RefetchManagerOptions, RefetchListener } from './types';

const DEFAULT_FOCUS_THROTTLE_MS = 1000;

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Create a refetch manager
 */
export function createRefetchManager(
  options: RefetchManagerOptions = {}
): RefetchManager {
  const {
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    focusThrottleMs = DEFAULT_FOCUS_THROTTLE_MS
  } = options;

  const listeners = new Map<string, RefetchListener>();
  let lastFocusTime = 0;
  let isOnline = isBrowser() ? navigator.onLine : true;

  // Event handlers
  const handleWindowFocus = (): void => {
    if (!refetchOnWindowFocus) return;

    const now = Date.now();
    if (now - lastFocusTime < focusThrottleMs) {
      return; // Throttle
    }

    lastFocusTime = now;
    refetchAll();
  };

  const handleVisibilityChange = (): void => {
    if (!refetchOnWindowFocus) return;

    if (document.visibilityState === 'visible') {
      handleWindowFocus();
    }
  };

  const handleOnline = (): void => {
    if (!refetchOnReconnect) return;

    const wasOffline = !isOnline;
    isOnline = true;

    if (wasOffline) {
      refetchAll();
    }
  };

  const handleOffline = (): void => {
    isOnline = false;
  };

  // Setup event listeners (browser only)
  if (isBrowser()) {
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  // Register query for refetch
  const register = (queryKey: string, listener: RefetchListener): (() => void) => {
    listeners.set(queryKey, listener);

    // Return unregister function
    return () => {
      listeners.delete(queryKey);
    };
  };

  // Unregister query
  const unregister = (queryKey: string): void => {
    listeners.delete(queryKey);
  };

  // Trigger refetch for all
  const refetchAll = (): void => {
    for (const [queryKey, listener] of listeners.entries()) {
      listener(queryKey);
    }
  };

  // Dispose and cleanup
  const dispose = (): void => {
    if (isBrowser()) {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }

    listeners.clear();
  };

  return {
    register,
    unregister,
    refetchAll,
    dispose
  };
}

/**
 * Create interval refetch
 */
export function createIntervalRefetch(
  callback: () => void,
  intervalMs: number
): () => void {
  const timerId = setInterval(callback, intervalMs);

  // Return cleanup function
  return () => {
    clearInterval(timerId);
  };
}
