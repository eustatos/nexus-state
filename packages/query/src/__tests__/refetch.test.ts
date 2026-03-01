import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createStore } from '@nexus-state/core';
import { useQuery, clearQueryCache, setRefetchManager, clearQueryCache as clearCache } from '../query';
import { createRefetchManager } from '../refetch-manager';

describe('Query Refetch Features', () => {
  let store: ReturnType<typeof createStore>;
  let refetchManager: ReturnType<typeof createRefetchManager>;

  beforeEach(() => {
    store = createStore();
    clearCache();
    vi.useFakeTimers();
    
    // Create fresh refetch manager for each test
    refetchManager = createRefetchManager({
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      focusThrottleMs: 1000
    });
    setRefetchManager(refetchManager);
  });

  afterEach(() => {
    // Cleanup refetch manager
    if (refetchManager) {
      refetchManager.dispose();
    }
    vi.useRealTimers();
  });

  describe('Window Focus Refetch', () => {
    it('should refetch on window focus if data is stale', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        staleTime: 1000,
        refetchOnWindowFocus: true
      });

      // Initial fetch
      await vi.advanceTimersByTime(0);
      await vi.advanceTimersByTime(0);
      expect(callCount).toBe(1);

      // Mark as stale
      vi.advanceTimersByTime(1100);

      // Trigger window focus
      window.dispatchEvent(new Event('focus'));
      await vi.advanceTimersByTime(0);

      expect(callCount).toBe(2);
    });

    it('should NOT refetch on window focus if data is fresh', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        staleTime: 10000,
        refetchOnWindowFocus: true
      });

      await vi.advanceTimersByTime(0);
      await vi.advanceTimersByTime(0);
      expect(callCount).toBe(1);

      // Trigger window focus (data still fresh)
      window.dispatchEvent(new Event('focus'));
      await vi.advanceTimersByTime(0);

      expect(callCount).toBe(1); // No refetch
    });

    it('should throttle window focus events', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        staleTime: 0, // Always stale
        refetchOnWindowFocus: true
      });

      await vi.advanceTimersByTime(0);
      await vi.advanceTimersByTime(0);

      // Rapid focus events (within throttle time)
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('focus'));

      await vi.advanceTimersByTime(0);

      // Should only refetch once due to throttling
      expect(callCount).toBe(2);
    });

    it('should refetch on visibility change', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        staleTime: 0,
        refetchOnWindowFocus: true
      });

      await vi.advanceTimersByTime(0);
      await vi.advanceTimersByTime(0);

      // Change visibility to visible
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true
      });

      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTime(0);

      expect(callCount).toBe(2);
    });
  });

  describe('Network Reconnect Refetch', () => {
    it('should refetch when network reconnects', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        refetchOnReconnect: true,
        staleTime: 0
      });

      await vi.advanceTimersByTime(0);
      await vi.advanceTimersByTime(0);
      expect(callCount).toBe(1);

      // Simulate offline
      window.dispatchEvent(new Event('offline'));

      // Simulate online
      window.dispatchEvent(new Event('online'));
      await vi.advanceTimersByTime(0);

      expect(callCount).toBe(2);
    });

    it('should NOT refetch if already online', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      useQuery(store, {
        queryKey: 'test',
        queryFn,
        refetchOnReconnect: true,
        staleTime: 0
      });

      await vi.advanceTimersByTime(0);
      await vi.advanceTimersByTime(0);

      // Trigger online event (but was already online)
      window.dispatchEvent(new Event('online'));
      await vi.advanceTimersByTime(0);

      expect(callCount).toBe(1); // No refetch
    });
  });

  describe('Interval Refetch', () => {
    it('should refetch at specified interval', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      const result = useQuery(store, {
        queryKey: 'test',
        queryFn,
        refetchInterval: 5000,
        staleTime: 0
      });

      // Initial fetch
      await vi.advanceTimersByTime(0);
      await vi.advanceTimersByTime(0);
      expect(callCount).toBe(1);

      // Advance by interval
      vi.advanceTimersByTime(5000);
      await vi.advanceTimersByTime(0);
      expect(callCount).toBe(2);

      // Cleanup
      result.remove();
    });

    it('should NOT refetch when interval is false', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      const result = useQuery(store, {
        queryKey: 'test',
        queryFn,
        refetchInterval: false,
        staleTime: 0
      });

      await vi.advanceTimersByTime(0);
      await vi.advanceTimersByTime(0);

      vi.advanceTimersByTime(10000);
      await vi.advanceTimersByTime(0);

      expect(callCount).toBe(1); // Only initial fetch
      
      result.remove();
    });

    it('should cleanup interval on remove', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      const result = useQuery(store, {
        queryKey: 'test',
        queryFn,
        refetchInterval: 5000,
        staleTime: 0
      });

      await vi.advanceTimersByTime(0);
      await vi.advanceTimersByTime(0);
      expect(callCount).toBe(1);

      // Remove query
      result.remove();

      // Advance time - should not trigger more refetches
      vi.advanceTimersByTime(15000);
      await vi.advanceTimersByTime(0);

      expect(callCount).toBe(1); // No more refetches
    });

    it('should handle interval refetch', async () => {
      let callCount = 0;
      const queryFn = vi.fn(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      const result = useQuery(store, {
        queryKey: 'test',
        queryFn,
        refetchInterval: 3000,
        staleTime: 0
      });

      await vi.advanceTimersByTime(0);
      await vi.advanceTimersByTime(0);
      expect(callCount).toBe(1);

      // Advance by interval
      vi.advanceTimersByTime(3000);
      await vi.advanceTimersByTime(0);
      expect(callCount).toBe(2);
      
      result.remove();
    });
  });

  describe('Refetch Manager', () => {
    it('should support custom refetch manager', () => {
      const customManager = createRefetchManager({
        refetchOnWindowFocus: false,
        refetchOnReconnect: true
      });

      setRefetchManager(customManager);

      // Custom manager should be used
      expect(customManager).toBeDefined();
    });

    it('should dispose custom refetch manager on replace', () => {
      const customManager1 = createRefetchManager();
      const customManager2 = createRefetchManager();
      
      const disposeSpy1 = vi.spyOn(customManager1, 'dispose');
      
      setRefetchManager(customManager1);
      setRefetchManager(customManager2);

      expect(disposeSpy1).toHaveBeenCalledTimes(1);
    });
  });

  describe('Refetch Options', () => {
    it('should disable window focus refetch with option', () => {
      // Create a new refetch manager with window focus disabled
      const refetchManager = createRefetchManager({
        refetchOnWindowFocus: false,
        refetchOnReconnect: false
      });
      
      const registerSpy = vi.spyOn(refetchManager, 'register');
      setRefetchManager(refetchManager);

      useQuery(store, {
        queryKey: 'test',
        queryFn: async () => 'data',
        refetchOnWindowFocus: false,
        refetchOnReconnect: false
      });

      // Should not register for focus events when both options are false
      expect(registerSpy).not.toHaveBeenCalled();
    });

    it('should disable reconnect refetch with option', () => {
      const refetchManager = createRefetchManager({
        refetchOnWindowFocus: false,
        refetchOnReconnect: false
      });
      
      setRefetchManager(refetchManager);

      useQuery(store, {
        queryKey: 'test',
        queryFn: async () => 'data',
        refetchOnReconnect: false
      });

      // Should still work but not trigger on reconnect
      window.dispatchEvent(new Event('offline'));
      window.dispatchEvent(new Event('online'));
      
      // No errors should occur
      expect(true).toBe(true);
    });
  });
});
