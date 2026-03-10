import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BatchProcessor } from './BatchProcessor';
import { batcher } from '../batching';

describe('BatchProcessor', () => {
  let processor: BatchProcessor;

  beforeEach(() => {
    processor = new BatchProcessor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any pending batches
    if (batcher.getIsBatching()) {
      batcher.flush();
    }
  });

  describe('schedule', () => {
    it('should execute task immediately when not batching', () => {
      const task = vi.fn();
      processor.schedule(task);
      
      // Task executes immediately when not batching
      expect(task).toHaveBeenCalledTimes(1);
    });

    it('should batch tasks when in batch mode', () => {
      const task = vi.fn();
      
      processor.batch(() => {
        processor.schedule(task);
        // Task should not be executed yet during batching
        expect(task).not.toHaveBeenCalled();
      });
      
      // After batch ends, task should be executed
      expect(task).toHaveBeenCalledTimes(1);
    });

    it('should increment task count when task is executed', () => {
      processor.batch(() => {
        processor.schedule(() => {});
        processor.schedule(() => {});
      });
      
      const stats = processor.getStats();
      expect(stats.totalTasks).toBe(2);
    });

    it('should handle multiple tasks in batch', () => {
      const results: number[] = [];
      
      processor.batch(() => {
        processor.schedule(() => results.push(1));
        processor.schedule(() => results.push(2));
        processor.schedule(() => results.push(3));
      });
      
      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe('flush', () => {
    it('should flush pending batches immediately', () => {
      const task = vi.fn();
      
      processor.batch(() => {
        processor.schedule(task);
        expect(task).not.toHaveBeenCalled();
      });
      
      // Batch should have flushed automatically
      expect(task).toHaveBeenCalledTimes(1);
    });

    it('should increment batch count after flush', () => {
      processor.flush();
      processor.flush();
      
      const stats = processor.getStats();
      expect(stats.totalBatches).toBe(2);
    });

    it('should flush multiple scheduled tasks', () => {
      const task1 = vi.fn();
      const task2 = vi.fn();
      
      processor.batch(() => {
        processor.schedule(task1);
        processor.schedule(task2);
      });
      
      expect(task1).toHaveBeenCalledTimes(1);
      expect(task2).toHaveBeenCalledTimes(1);
    });
  });

  describe('batch', () => {
    it('should execute function in batch mode', () => {
      const result = processor.batch(() => {
        return 42;
      });
      
      expect(result).toBe(42);
      expect(processor.isBatching()).toBe(false);
    });

    it('should increment batch count after execution', () => {
      processor.batch(() => {});
      processor.batch(() => {});
      
      const stats = processor.getStats();
      expect(stats.totalBatches).toBe(2);
    });

    it('should end batch even if function throws', () => {
      expect(() => {
        processor.batch(() => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');
      
      expect(processor.isBatching()).toBe(false);
    });

    it('should handle nested batch operations', () => {
      const results: string[] = [];
      
      processor.batch(() => {
        results.push('outer-start');
        processor.batch(() => {
          results.push('inner');
        });
        results.push('outer-end');
      });
      
      expect(results).toEqual(['outer-start', 'inner', 'outer-end']);
    });

    it('should return value from batch function', () => {
      const result = processor.batch(() => {
        return { value: 'test' };
      });
      
      expect(result).toEqual({ value: 'test' });
    });
  });

  describe('isBatching', () => {
    it('should return false when not batching', () => {
      expect(processor.isBatching()).toBe(false);
    });

    it('should return true during batch execution', () => {
      let isBatchingDuringCall = false;
      
      processor.batch(() => {
        isBatchingDuringCall = processor.isBatching();
      });
      
      expect(isBatchingDuringCall).toBe(true);
    });

    it('should return false after batch completes', () => {
      processor.batch(() => {});
      expect(processor.isBatching()).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return initial stats', () => {
      const stats = processor.getStats();
      
      expect(stats).toEqual({
        totalBatches: 0,
        totalTasks: 0,
        currentBatchSize: 0,
      });
    });

    it('should return stats after batch operations', () => {
      processor.batch(() => {});
      processor.schedule(() => {});
      batcher.flush();
      
      const stats = processor.getStats();
      expect(stats.totalBatches).toBeGreaterThanOrEqual(1);
      expect(stats.totalTasks).toBeGreaterThanOrEqual(1);
    });

    it('should track multiple batches', () => {
      processor.batch(() => {});
      processor.batch(() => {});
      processor.batch(() => {});
      
      const stats = processor.getStats();
      expect(stats.totalBatches).toBe(3);
    });
  });

  describe('resetStats', () => {
    it('should reset all statistics', () => {
      processor.batch(() => {});
      processor.schedule(() => {});
      batcher.flush();
      
      processor.resetStats();
      
      const stats = processor.getStats();
      expect(stats.totalBatches).toBe(0);
      expect(stats.totalTasks).toBe(0);
    });

    it('should reset stats multiple times', () => {
      processor.batch(() => {});
      processor.resetStats();
      processor.batch(() => {});
      processor.resetStats();
      
      const stats = processor.getStats();
      expect(stats.totalBatches).toBe(0);
      expect(stats.totalTasks).toBe(0);
    });
  });

  describe('integration', () => {
    it('should handle complex batch workflow', () => {
      const executionOrder: string[] = [];
      
      // Schedule some tasks
      processor.schedule(() => executionOrder.push('scheduled-1'));
      processor.schedule(() => executionOrder.push('scheduled-2'));
      
      // Execute a batch
      processor.batch(() => {
        executionOrder.push('batch-start');
        processor.schedule(() => executionOrder.push('scheduled-in-batch'));
        executionOrder.push('batch-end');
      });
      
      // Flush remaining
      processor.flush();
      
      expect(executionOrder).toContain('batch-start');
      expect(executionOrder).toContain('batch-end');
      expect(executionOrder).toContain('scheduled-1');
      expect(executionOrder).toContain('scheduled-2');
    });

    it('should maintain stats across operations', () => {
      processor.batch(() => {});
      const stats1 = processor.getStats();
      
      processor.batch(() => {});
      const stats2 = processor.getStats();
      
      expect(stats2.totalBatches).toBe(stats1.totalBatches + 1);
    });
  });
});
