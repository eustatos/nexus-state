/**
 * Batching Edge Cases Tests
 * Tests for edge cases and error handling in batching
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { batch, batcher } from '../../batching';

describe('batcher.reset', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should clear all pending callbacks', () => {
    batcher.startBatch();
    batcher.schedule(() => {});
    batcher.schedule(() => {});

    expect(batcher.getPendingCount()).toBe(2);

    batcher.reset();

    expect(batcher.getPendingCount()).toBe(0);
  });

  it('should reset depth to zero', () => {
    batcher.startBatch();
    batcher.startBatch();
    expect(batcher.getDepth()).toBe(2);

    batcher.reset();

    expect(batcher.getDepth()).toBe(0);
  });

  it('should reset isBatching flag', () => {
    batcher.startBatch();
    expect(batcher.getIsBatching()).toBe(true);

    batcher.reset();

    expect(batcher.getIsBatching()).toBe(false);
  });
});

describe('error handling in batch', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should propagate error from batch callback', () => {
    const error = new Error('Test error');

    expect(() => {
      batch(() => {
        throw error;
      });
    }).toThrow(error);
  });

  it('should clean up batch state after error', () => {
    try {
      batch(() => {
        throw new Error('Test error');
      });
    } catch {
      // Expected
    }

    expect(batcher.getDepth()).toBe(0);
    expect(batcher.getIsBatching()).toBe(false);
  });

  it('should handle error in scheduled callback', () => {
    batcher.startBatch();
    batcher.schedule(() => {
      throw new Error('Scheduled error');
    });

    expect(() => batcher.endBatch()).toThrow('Scheduled error');
  });
});

describe('empty batch operations', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should handle batch with no operations', () => {
    const result = batch(() => {
      // no operations
    });

    expect(result).toBeUndefined();
  });

  it('should handle flush with empty queue', () => {
    batcher.startBatch();
    batcher.endBatch();

    expect(batcher.getPendingCount()).toBe(0);
  });

  it('should handle multiple consecutive empty batches', () => {
    batch(() => {});
    batch(() => {});
    batch(() => {});

    expect(batcher.getDepth()).toBe(0);
  });
});

describe('callback that modifies batch state', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should handle callback that calls startBatch', () => {
    const results: string[] = [];

    batcher.startBatch();
    batcher.schedule(() => {
      results.push('callback-start');
      batcher.startBatch();
      results.push('callback-inner-batch');
      batcher.endBatch();
    });
    batcher.endBatch();

    expect(results).toEqual(['callback-start', 'callback-inner-batch']);
  });

  it('should handle callback that calls endBatch', () => {
    // Callback's endBatch is called during flush when depth is already 0
    // So it has no effect (depth doesn't go negative)
    batcher.startBatch();  // depth = 1
    batcher.startBatch();  // depth = 2

    batcher.schedule(() => {
      // This endBatch is called during flush when depth = 0
      // So it has no effect
      batcher.endBatch();
    });

    batcher.endBatch();  // depth = 1
    batcher.endBatch();  // depth = 0, triggers flush

    // Callback's endBatch has no effect because depth was already 0
    // So we need one more endBatch to match the initial 2 startBatch
    expect(batcher.getDepth()).toBe(0);
  });
});

describe('concurrent batch scheduling', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should handle same callback scheduled multiple times', () => {
    let callCount = 0;
    const callback = () => {
      callCount++;
    };

    batcher.startBatch();
    batcher.schedule(callback);
    batcher.schedule(callback);
    batcher.schedule(callback);
    batcher.endBatch();

    // Set should deduplicate callbacks
    expect(callCount).toBe(1);
  });

  it('should handle callback that schedules itself', () => {
    let callCount = 0;

    batcher.startBatch();
    const recursiveCallback = () => {
      callCount++;
      if (callCount < 3) {
        batcher.schedule(recursiveCallback);
      }
    };
    batcher.schedule(recursiveCallback);
    batcher.endBatch();

    expect(callCount).toBe(3);
  });
});
