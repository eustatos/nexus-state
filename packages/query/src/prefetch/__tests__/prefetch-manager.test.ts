import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrefetchManager } from '../prefetch-manager';
import { createQueryCache } from '../../cache';
import { getSuspenseCache } from '../../suspense-cache';

describe('PrefetchManager', () => {
  beforeEach(() => {
    // Reset suspense cache before each test
    const cache = getSuspenseCache();
    cache.clear();
  });

  it('should prefetch query', async () => {
    const manager = createPrefetchManager();
    const queryFn = vi.fn(async () => ({ data: 'test' }));

    await manager.prefetch({
      queryKey: 'test',
      queryFn,
    });

    expect(queryFn).toHaveBeenCalledTimes(1);

    const status = manager.getPrefetchStatus('test');
    expect(status?.status).toBe('success');
  });

  it('should skip prefetch if cached and fresh', async () => {
    const manager = createPrefetchManager();
    const queryFn = vi.fn(async () => ({ data: 'test' }));

    // First prefetch
    await manager.prefetch({
      queryKey: 'test',
      queryFn,
      staleTime: 5000,
    });

    // Second prefetch (should be skipped)
    await manager.prefetch({
      queryKey: 'test',
      queryFn,
      staleTime: 5000,
    });

    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('should force prefetch when force: true', async () => {
    const manager = createPrefetchManager();
    const queryFn = vi.fn(async () => ({ data: 'test' }));

    await manager.prefetch({
      queryKey: 'test',
      queryFn,
      staleTime: 0, // Make data immediately stale
    });

    // Small delay to ensure cache is updated
    await new Promise(resolve => setTimeout(resolve, 10));

    await manager.prefetch({
      queryKey: 'test',
      queryFn,
      force: true,
    });

    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('should cancel prefetch', async () => {
    const manager = createPrefetchManager();
    const queryFn = vi.fn(
      async () =>
        new Promise((resolve) => setTimeout(() => resolve({ data: 'test' }), 100))
    );

    const promise = manager.prefetch({
      queryKey: 'test',
      queryFn,
    });

    // Cancel immediately
    manager.cancel('test');

    await promise;

    const status = manager.getPrefetchStatus('test');
    expect(status?.status).toBe('cancelled');
  });

  it('should handle prefetch timeout', async () => {
    const manager = createPrefetchManager();
    const queryFn = vi.fn(
      async () =>
        new Promise((resolve) => setTimeout(() => resolve({ data: 'test' }), 200))
    );

    await manager.prefetch({
      queryKey: 'test-timeout',
      queryFn,
      timeout: 50,
    });

    const status = manager.getPrefetchStatus('test-timeout');
    expect(status?.status).toBe('error');
  });

  it('should cancel all prefetches', async () => {
    const manager = createPrefetchManager();
    const queryFn = vi.fn(
      async () =>
        new Promise((resolve) => setTimeout(() => resolve({ data: 'test' }), 200))
    );

    const promise1 = manager.prefetch({ queryKey: 'test-1', queryFn });
    const promise2 = manager.prefetch({ queryKey: 'test-2', queryFn });

    // Cancel immediately before they complete
    manager.cancelAll();

    await Promise.all([promise1, promise2]);

    const status1 = manager.getPrefetchStatus('test-1');
    const status2 = manager.getPrefetchStatus('test-2');

    expect(status1?.status).toBe('cancelled');
    expect(status2?.status).toBe('cancelled');
  });

  it('should get all prefetch results', async () => {
    const manager = createPrefetchManager();
    const queryFn = vi.fn(async () => ({ data: 'test' }));

    await manager.prefetch({ queryKey: 'test-1', queryFn });
    await manager.prefetch({ queryKey: 'test-2', queryFn });

    const results = manager.getAllPrefetchResults();

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.queryKey)).toEqual(
      expect.arrayContaining(['test-1', 'test-2'])
    );
  });

  it('should handle prefetch errors gracefully', async () => {
    const manager = createPrefetchManager();
    const error = new Error('Prefetch failed');
    const queryFn = vi.fn(async () => {
      throw error;
    });

    await manager.prefetch({
      queryKey: 'test-error',
      queryFn,
    });

    const status = manager.getPrefetchStatus('test-error');
    expect(status?.status).toBe('error');
    expect(status?.error).toBe(error);
  });

  it('should use array query keys', async () => {
    const manager = createPrefetchManager();
    const queryFn = vi.fn(async () => ({ data: 'test' }));

    await manager.prefetch({
      queryKey: ['users', { id: 1, status: 'active' }],
      queryFn,
    });

    const status = manager.getPrefetchStatus(['users', { id: 1, status: 'active' }]);
    expect(status?.status).toBe('success');
  });

  it('should return null for unknown query key', () => {
    const manager = createPrefetchManager();

    const status = manager.getPrefetchStatus('unknown');
    expect(status).toBeNull();
  });
});
