/**
 * Nested Batches Tests
 * Tests for nested batch behavior and depth management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { batch, batcher } from '../../batching';

describe('nested batches', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should handle nested batch calls', () => {
    const results: string[] = [];

    batch(() => {
      results.push('outer-start');
      batch(() => {
        results.push('inner');
      });
      results.push('outer-end');
    });

    expect(results).toEqual(['outer-start', 'inner', 'outer-end']);
  });

  it('should not flush until outermost batch ends', () => {
    const results: string[] = [];

    batch(() => {
      batch(() => {
        batch(() => {
          results.push('deep-nested');
        });
        // Should not flush yet
        expect(batcher.getPendingCount()).toBe(0);
      });
      // Should not flush yet
      expect(batcher.getPendingCount()).toBe(0);
    });

    // Should flush after outermost ends
    expect(results).toEqual(['deep-nested']);
  });

  it('should track depth correctly with nested batches', () => {
    const depths: number[] = [];

    batch(() => {
      depths.push(batcher.getDepth());
      batch(() => {
        depths.push(batcher.getDepth());
        batch(() => {
          depths.push(batcher.getDepth());
        });
        depths.push(batcher.getDepth());
      });
      depths.push(batcher.getDepth());
    });

    expect(depths).toEqual([1, 2, 3, 2, 1]);
  });
});

describe('batch within batch scheduling', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should schedule callback in nested batch', () => {
    const results: number[] = [];

    batch(() => {
      batcher.schedule(() => results.push(1));
      batch(() => {
        batcher.schedule(() => results.push(2));
      });
    });

    expect(results).toEqual([1, 2]);
  });

  it('should collect all nested schedules before flush', () => {
    const results: string[] = [];

    batch(() => {
      batcher.schedule(() => results.push('outer-1'));
      batch(() => {
        batcher.schedule(() => results.push('inner-1'));
        batch(() => {
          batcher.schedule(() => results.push('deep-1'));
        });
        batcher.schedule(() => results.push('inner-2'));
      });
      batcher.schedule(() => results.push('outer-2'));
    });

    expect(results).toEqual(['outer-1', 'inner-1', 'deep-1', 'inner-2', 'outer-2']);
  });
});

describe('multiple nested batch trees', () => {
  beforeEach(() => {
    batcher.reset();
  });

  it('should handle separate batch trees', () => {
    const results: string[] = [];

    batch(() => {
      results.push('tree1-start');
      batch(() => {
        results.push('tree1-inner');
      });
      results.push('tree1-end');
    });

    batch(() => {
      results.push('tree2-start');
      batch(() => {
        results.push('tree2-inner');
      });
      results.push('tree2-end');
    });

    expect(results).toEqual([
      'tree1-start',
      'tree1-inner',
      'tree1-end',
      'tree2-start',
      'tree2-inner',
      'tree2-end',
    ]);
  });
});
