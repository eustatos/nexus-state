import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createQueryCache } from '../cache';

describe('QueryCache', () => {
  let cache: ReturnType<typeof createQueryCache>;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = createQueryCache({
      defaultStaleTime: 1000,
      defaultCacheTime: 5000,
      gcInterval: 1000
    });
  });

  afterEach(() => {
    cache.dispose();
    vi.useRealTimers();
  });

  it('should set and get cache entries', () => {
    cache.set('test', 'data');
    const entry = cache.get('test');

    expect(entry?.data).toBe('data');
    expect(entry?.isStale).toBe(false);
  });

  it('should mark data as stale after staleTime', () => {
    cache.set('test', 'data', 1000);
    expect(cache.isStale('test')).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(cache.isStale('test')).toBe(true);
  });

  it('should remove entries', () => {
    cache.set('test', 'data');
    expect(cache.get('test')).toBeDefined();

    cache.remove('test');
    expect(cache.get('test')).toBeUndefined();
  });

  it('should clear all entries', () => {
    cache.set('test1', 'data1');
    cache.set('test2', 'data2');

    cache.clear();

    expect(cache.get('test1')).toBeUndefined();
    expect(cache.get('test2')).toBeUndefined();
  });

  it('should garbage collect old entries', () => {
    cache.set('test', 'data');

    // Advance past cache time
    vi.advanceTimersByTime(6000);

    // Trigger GC
    cache.gc();

    expect(cache.get('test')).toBeUndefined();
  });

  it('should update lastAccessedAt on get', () => {
    cache.set('test', 'data');

    vi.advanceTimersByTime(3000);
    cache.get('test'); // Access

    vi.advanceTimersByTime(3000);
    cache.gc();

    // Should still exist because we accessed it
    expect(cache.get('test')).toBeDefined();
  });

  it('should return undefined for non-existent key', () => {
    const entry = cache.get('nonexistent');
    expect(entry).toBeUndefined();
  });

  it('should return true for isStale on non-existent key', () => {
    expect(cache.isStale('nonexistent')).toBe(true);
  });

  it('should dispose and stop GC', () => {
    cache.set('test', 'data');
    cache.dispose();

    // After dispose, cache should be empty
    expect(cache.get('test')).toBeUndefined();
  });

  it('should handle default stale time correctly', () => {
    // With defaultStaleTime: 1000, data should be stale after 1001ms
    cache.set('test', 'data');
    
    // Initially not stale (staleTime 0 means immediately stale)
    expect(cache.isStale('test')).toBe(false);
  });

  it('should handle custom stale time per entry', () => {
    cache.set('quick', 'data1', 500);
    cache.set('slow', 'data2', 2000);

    vi.advanceTimersByTime(600);

    expect(cache.isStale('quick')).toBe(true);
    expect(cache.isStale('slow')).toBe(false);
  });
});
