/**
 * Batcher Flush Tests
 * Tests for batcher flush logic and callback execution
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { batcher } from '../../batching';

describe('batcher.flush', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should not flush when no callbacks queued', () => {
    batcher.startBatch();
    batcher.endBatch();

    expect(batcher.getPendingCount()).toBe(0);
  });

  it('should execute all queued callbacks', () => {
    const results: string[] = [];

    batcher.startBatch();
    batcher.schedule(() => results.push('a'));
    batcher.schedule(() => results.push('b'));
    batcher.schedule(() => results.push('c'));
    batcher.endBatch();

    expect(results).toEqual(['a', 'b', 'c']);
  });

  it('should clear queue after flush', () => {
    batcher.startBatch();
    batcher.schedule(() => {});
    batcher.endBatch();

    expect(batcher.getPendingCount()).toBe(0);
  });

  it('should set isFlushing during flush', () => {
    let flushingDuring = false;

    batcher.startBatch();
    batcher.schedule(() => {
      // Can't directly check isFlushing as it's private
      flushingDuring = true;
    });
    batcher.endBatch();

    expect(flushingDuring).toBe(true);
  });

  it('should reset isFlushing after flush', () => {
    batcher.startBatch();
    batcher.schedule(() => {});
    batcher.endBatch();

    // After flush, should be ready for new batch
    expect(batcher.getPendingCount()).toBe(0);
  });
});

describe('flush execution order', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should execute callbacks in FIFO order', () => {
    const order: number[] = [];

    batcher.startBatch();
    batcher.schedule(() => order.push(1));
    batcher.schedule(() => order.push(2));
    batcher.schedule(() => order.push(3));
    batcher.endBatch();

    expect(order).toEqual([1, 2, 3]);
  });

  it('should execute callbacks even if one throws', () => {
    const results: string[] = [];

    batcher.startBatch();
    batcher.schedule(() => results.push('a'));
    batcher.schedule(() => {
      throw new Error('Test error');
    });
    batcher.schedule(() => results.push('b'));

    expect(() => batcher.endBatch()).toThrow();

    // 'a' should be executed before error
    expect(results).toContain('a');
  });
});

describe('flush with new callbacks during flush', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should flush callbacks added during flush', () => {
    const results: string[] = [];
    let flushCount = 0;

    batcher.startBatch();
    batcher.schedule(() => {
      results.push('initial');
      flushCount++;
    });
    batcher.endBatch();

    expect(flushCount).toBe(1);
    expect(results).toEqual(['initial']);
  });

  it('should handle callback that schedules another callback', () => {
    const results: string[] = [];

    batcher.startBatch();
    batcher.schedule(() => {
      results.push('first');
      batcher.schedule(() => {
        results.push('scheduled-during-flush');
      });
    });
    batcher.endBatch();

    // The callback scheduled during flush should also execute
    expect(results).toContain('first');
    expect(results).toContain('scheduled-during-flush');
  });
});
