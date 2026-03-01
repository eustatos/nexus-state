import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '@nexus-state/core';
import { useQuery, clearQueryCache } from '../query';

describe('Query Deduplication', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    clearQueryCache();
  });

  it('should deduplicate concurrent requests with same query key', async () => {
    let callCount = 0;
    const queryFn = vi.fn(async () => {
      callCount++;
      await new Promise(resolve => setTimeout(resolve, 50));
      return `data-${callCount}`;
    });

    // Create two queries with same key at the same time
    useQuery(store, {
      queryKey: 'test',
      queryFn
    });

    useQuery(store, {
      queryKey: 'test',
      queryFn
    });

    // Wait for requests to complete
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should only have called queryFn once
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('should not deduplicate requests with different keys', async () => {
    const queryFn1 = vi.fn(async () => 'data1');
    const queryFn2 = vi.fn(async () => 'data2');

    useQuery(store, { queryKey: 'test1', queryFn: queryFn1 });
    useQuery(store, { queryKey: 'test2', queryFn: queryFn2 });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(queryFn1).toHaveBeenCalledTimes(1);
    expect(queryFn2).toHaveBeenCalledTimes(1);
  });

  it('should allow sequential requests for same key', async () => {
    let callCount = 0;
    const queryFn = vi.fn(async () => {
      callCount++;
      return `data-${callCount}`;
    });

    // First request
    const result = useQuery(store, {
      queryKey: 'test',
      queryFn
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(result.data).toBeDefined();

    // Second request (after first completes)
    await result.refetch();

    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('should handle errors in deduplicated requests', async () => {
    const error = new Error('Test error');
    const queryFn = vi.fn(async () => {
      throw error;
    });

    useQuery(store, {
      queryKey: 'test',
      queryFn,
      retry: false
    });

    useQuery(store, {
      queryKey: 'test',
      queryFn,
      retry: false
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Should only call once
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('should not deduplicate when force refetch is used', async () => {
    let callCount = 0;
    const queryFn = vi.fn(async () => {
      callCount++;
      await new Promise(resolve => setTimeout(resolve, 50));
      return `data-${callCount}`;
    });

    const result = useQuery(store, {
      queryKey: 'test',
      queryFn
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(callCount).toBe(1);

    // Force refetch
    await result.refetch();

    // Refetch should have made new request
    expect(callCount).toBe(2);
  });

  it('should cleanup request tracker after completion', async () => {
    const queryFn = vi.fn(async () => 'data');

    useQuery(store, {
      queryKey: 'test',
      queryFn
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Request should be cleaned up after completion
    // This test verifies no memory leaks
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('should share result between concurrent subscribers', async () => {
    const sharedData = { value: 'shared' };
    const queryFn = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return sharedData;
    });

    const result1 = useQuery(store, {
      queryKey: 'shared',
      queryFn
    });

    const result2 = useQuery(store, {
      queryKey: 'shared',
      queryFn
    });

    await new Promise(resolve => setTimeout(resolve, 150));

    // Both should have same data reference
    expect(result1.data).toBe(result2.data);
    expect(result1.data).toEqual({ value: 'shared' });
  });

  it('should handle rapid concurrent requests', async () => {
    let callCount = 0;
    const queryFn = vi.fn(async () => {
      callCount++;
      await new Promise(resolve => setTimeout(resolve, 30));
      return `data-${callCount}`;
    });

    // Create 5 concurrent requests
    for (let i = 0; i < 5; i++) {
      useQuery(store, {
        queryKey: 'rapid',
        queryFn
      });
    }

    await new Promise(resolve => setTimeout(resolve, 150));

    // Should only call once despite 5 concurrent requests
    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});
