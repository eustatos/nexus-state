/**
 * Nested Batches Tests
 * Tests for nested batch behavior and depth management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Batcher } from '../../batching';

describe('nested batches', () => {
  let batcher: Batcher;
  beforeEach(() => {
    batcher = new Batcher();
  });

  it('should handle nested batch calls', () => {
    const results: string[] = [];

    batcher.startBatch();
    try {
      results.push('outer-start');
      batcher.startBatch();
      try {
        results.push('inner');
      } finally {
        batcher.endBatch();
      }
      results.push('outer-end');
    } finally {
      batcher.endBatch();
    }

    expect(results).toEqual(['outer-start', 'inner', 'outer-end']);
  });

  it('should not flush until outermost batch ends', () => {
    const results: string[] = [];

    batcher.startBatch();
    try {
      batcher.startBatch();
      try {
        batcher.startBatch();
        try {
          results.push('deep-nested');
        } finally {
          batcher.endBatch();
        }
        // Should not flush yet
        expect(batcher.getPendingCount()).toBe(0);
      } finally {
        batcher.endBatch();
      }
      // Should not flush yet
      expect(batcher.getPendingCount()).toBe(0);
    } finally {
      batcher.endBatch();
    }

    // Should flush after outermost ends
    expect(results).toEqual(['deep-nested']);
  });

  it('should track depth correctly with nested batches', () => {
    const depths: number[] = [];

    batcher.startBatch();
    try {
      depths.push(batcher.getDepth());
      batcher.startBatch();
      try {
        depths.push(batcher.getDepth());
        batcher.startBatch();
        try {
          depths.push(batcher.getDepth());
        } finally {
          batcher.endBatch();
        }
        depths.push(batcher.getDepth());
      } finally {
        batcher.endBatch();
      }
      depths.push(batcher.getDepth());
    } finally {
      batcher.endBatch();
    }

    expect(depths).toEqual([1, 2, 3, 2, 1]);
  });
});

describe('batch within batch scheduling', () => {
  let batcher: Batcher;
  beforeEach(() => {
    batcher = new Batcher();
  });

  it('should schedule callback in nested batch', () => {
    const results: number[] = [];

    batcher.startBatch();
    try {
      batcher.schedule(() => results.push(1));
      batcher.startBatch();
      try {
        batcher.schedule(() => results.push(2));
      } finally {
        batcher.endBatch();
      }
    } finally {
      batcher.endBatch();
    }

    expect(results).toEqual([1, 2]);
  });

  it('should collect all nested schedules before flush', () => {
    const results: string[] = [];

    batcher.startBatch();
    try {
      batcher.schedule(() => results.push('outer-1'));
      batcher.startBatch();
      try {
        batcher.schedule(() => results.push('inner-1'));
        batcher.startBatch();
        try {
          batcher.schedule(() => results.push('deep-1'));
        } finally {
          batcher.endBatch();
        }
        batcher.schedule(() => results.push('inner-2'));
      } finally {
        batcher.endBatch();
      }
      batcher.schedule(() => results.push('outer-2'));
    } finally {
      batcher.endBatch();
    }

    expect(results).toEqual(['outer-1', 'inner-1', 'deep-1', 'inner-2', 'outer-2']);
  });
});

describe('multiple nested batch trees', () => {
  let batcher: Batcher;
  beforeEach(() => {
    batcher = new Batcher();
  });

  it('should handle separate batch trees', () => {
    const results: string[] = [];

    batcher.startBatch();
    try {
      results.push('tree1-start');
      batcher.startBatch();
      try {
        results.push('tree1-inner');
      } finally {
        batcher.endBatch();
      }
      results.push('tree1-end');
    } finally {
      batcher.endBatch();
    }

    batcher.startBatch();
    try {
      results.push('tree2-start');
      batcher.startBatch();
      try {
        results.push('tree2-inner');
      } finally {
        batcher.endBatch();
      }
      results.push('tree2-end');
    } finally {
      batcher.endBatch();
    }

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
