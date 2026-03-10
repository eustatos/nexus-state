/**
 * Batching Basic Tests
 * Tests for batch() function and isBatching() utility
 */

import { describe, it, expect } from 'vitest';
import { batch, isBatching, batcher } from '../../batching';

describe('batch', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should execute function immediately when not batching', () => {
    let executed = false;
    const result = batch(() => {
      executed = true;
      return 42;
    });

    expect(executed).toBe(true);
    expect(result).toBe(42);
  });

  it('should return value from batch function', () => {
    const obj = { value: 'test' };
    const result = batch(() => obj);

    expect(result).toBe(obj);
  });

  it('should return undefined when function returns nothing', () => {
    const result = batch(() => {
      // no return
    });

    expect(result).toBeUndefined();
  });

  it('should throw error from batch function', () => {
    expect(() => {
      batch(() => {
        throw new Error('Test error');
      });
    }).toThrow('Test error');
  });

  it('should end batch even when function throws', () => {
    expect(() => {
      batch(() => {
        throw new Error('Test error');
      });
    }).toThrow();

    expect(isBatching()).toBe(false);
    expect(batcher.getDepth()).toBe(0);
  });
});

describe('isBatching', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should return false outside of batch', () => {
    expect(isBatching()).toBe(false);
  });

  it('should return true inside batch', () => {
    let batchingInside = false;
    batch(() => {
      batchingInside = isBatching();
    });

    expect(batchingInside).toBe(true);
  });

  it('should return false after batch completes', () => {
    batch(() => {
      // inside batch
    });

    expect(isBatching()).toBe(false);
  });

  it('should return true in nested batch', () => {
    let batchingNested = false;
    batch(() => {
      batch(() => {
        batchingNested = isBatching();
      });
    });

    expect(batchingNested).toBe(true);
  });
});
