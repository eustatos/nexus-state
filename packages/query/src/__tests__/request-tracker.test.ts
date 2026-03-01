import { describe, it, expect, beforeEach } from 'vitest';
import { createRequestTracker } from '../request-tracker';

describe('RequestTracker', () => {
  let tracker: ReturnType<typeof createRequestTracker>;

  beforeEach(() => {
    tracker = createRequestTracker();
  });

  it('should track and get requests', async () => {
    const promise = Promise.resolve('data');
    tracker.set('test', promise);

    const result = tracker.get<string>('test');
    expect(result).toBe(promise);
  });

  it('should return undefined for non-existent key', () => {
    const result = tracker.get<string>('nonexistent');
    expect(result).toBeUndefined();
  });

  it('should check if request exists with has()', () => {
    const promise = Promise.resolve('data');
    tracker.set('test', promise);

    expect(tracker.has('test')).toBe(true);
    expect(tracker.has('nonexistent')).toBe(false);
  });

  it('should remove tracked request', () => {
    const promise = Promise.resolve('data');
    tracker.set('test', promise);

    expect(tracker.has('test')).toBe(true);
    tracker.remove('test');
    expect(tracker.has('test')).toBe(false);
  });

  it('should clear all tracked requests', () => {
    tracker.set('test1', Promise.resolve('data1'));
    tracker.set('test2', Promise.resolve('data2'));

    expect(tracker.has('test1')).toBe(true);
    expect(tracker.has('test2')).toBe(true);

    tracker.clear();

    expect(tracker.has('test1')).toBe(false);
    expect(tracker.has('test2')).toBe(false);
  });

  it('should auto-cleanup on promise resolve', async () => {
    const promise = Promise.resolve('data');
    tracker.set('test', promise);

    expect(tracker.has('test')).toBe(true);

    await promise;

    // Give microtask queue time to process
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(tracker.has('test')).toBe(false);
  });

  it('should auto-cleanup on promise reject', async () => {
    const promise = Promise.reject(new Error('test error'));
    tracker.set('test', promise);

    expect(tracker.has('test')).toBe(true);

    // Wait for promise to settle
    await promise.catch(() => {});

    // Give microtask queue time to process
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(tracker.has('test')).toBe(false);
  });

  it('should handle multiple concurrent requests', async () => {
    const promise1 = Promise.resolve('data1');
    const promise2 = Promise.resolve('data2');
    const promise3 = Promise.resolve('data3');

    tracker.set('key1', promise1);
    tracker.set('key2', promise2);
    tracker.set('key3', promise3);

    expect(tracker.has('key1')).toBe(true);
    expect(tracker.has('key2')).toBe(true);
    expect(tracker.has('key3')).toBe(true);

    await Promise.all([promise1, promise2, promise3]);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(tracker.has('key1')).toBe(false);
    expect(tracker.has('key2')).toBe(false);
    expect(tracker.has('key3')).toBe(false);
  });

  it('should preserve promise type through get', () => {
    const promise = Promise.resolve({ id: 1, name: 'test' });
    tracker.set('test', promise);

    const result = tracker.get<{ id: number; name: string }>('test');
    expect(result).toBe(promise);
  });
});
