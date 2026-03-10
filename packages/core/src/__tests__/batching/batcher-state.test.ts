/**
 * Batcher State Tests
 * Tests for batcher startBatch/endBatch and state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { batcher } from '../../batching';

describe('batcher.startBatch / endBatch', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should increase batch depth on startBatch', () => {
    expect(batcher.getDepth()).toBe(0);

    batcher.startBatch();
    expect(batcher.getDepth()).toBe(1);

    batcher.startBatch();
    expect(batcher.getDepth()).toBe(2);
  });

  it('should decrease batch depth on endBatch', () => {
    batcher.startBatch();
    batcher.startBatch();
    expect(batcher.getDepth()).toBe(2);

    batcher.endBatch();
    expect(batcher.getDepth()).toBe(1);

    batcher.endBatch();
    expect(batcher.getDepth()).toBe(0);
  });

  it('should not go below zero depth', () => {
    batcher.startBatch();
    batcher.endBatch();
    batcher.endBatch(); // Should not go negative

    expect(batcher.getDepth()).toBe(0);
  });

  it('should set isBatching to true during batch', () => {
    expect(batcher.getIsBatching()).toBe(false);

    batcher.startBatch();
    expect(batcher.getIsBatching()).toBe(true);

    batcher.endBatch();
    expect(batcher.getIsBatching()).toBe(false);
  });
});

describe('batcher.schedule', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should execute callback immediately when not batching', () => {
    let executed = false;
    batcher.schedule(() => {
      executed = true;
    });

    expect(executed).toBe(true);
  });

  it('should queue callback when batching', () => {
    let executed = false;

    batcher.startBatch();
    batcher.schedule(() => {
      executed = true;
    });

    expect(executed).toBe(false);
    expect(batcher.getPendingCount()).toBe(1);

    batcher.endBatch();
    expect(executed).toBe(true);
  });

  it('should queue multiple callbacks', () => {
    const results: number[] = [];

    batcher.startBatch();
    batcher.schedule(() => results.push(1));
    batcher.schedule(() => results.push(2));
    batcher.schedule(() => results.push(3));

    expect(results).toEqual([]);
    expect(batcher.getPendingCount()).toBe(3);

    batcher.endBatch();
    expect(results).toEqual([1, 2, 3]);
  });
});

describe('batcher.getPendingCount', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should return 0 when no pending callbacks', () => {
    expect(batcher.getPendingCount()).toBe(0);
  });

  it('should return count of queued callbacks', () => {
    batcher.startBatch();
    batcher.schedule(() => {});
    batcher.schedule(() => {});

    expect(batcher.getPendingCount()).toBe(2);
  });

  it('should return 0 after flush', () => {
    batcher.startBatch();
    batcher.schedule(() => {});
    batcher.endBatch();

    expect(batcher.getPendingCount()).toBe(0);
  });
});
