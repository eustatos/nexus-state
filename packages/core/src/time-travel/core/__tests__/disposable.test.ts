/**
 * Disposable tests - BaseDisposable class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BaseDisposable,
  DisposalError,
  AggregateDisposalError,
  LeakDetector,
  FinalizationHelper,
  type Disposable,
} from '../disposable';

describe('DisposalError', () => {
  it('should create error with message', () => {
    const error = new DisposalError('Test error');

    expect(error.name).toBe('DisposalError');
    expect(error.message).toBe('Test error');
    expect(error.cause).toBeUndefined();
  });

  it('should create error with cause', () => {
    const cause = new Error('Cause error');
    const error = new DisposalError('Test error', cause);

    expect(error.cause).toBe(cause);
  });
});

describe('AggregateDisposalError', () => {
  it('should create error with multiple errors', () => {
    const errors = [new Error('Error 1'), new Error('Error 2')];
    const error = new AggregateDisposalError(errors);

    expect(error.name).toBe('AggregateDisposalError');
    expect(error.errors).toHaveLength(2);
    expect(error.message).toContain('2 errors');
  });
});

describe('BaseDisposable', () => {
  class TestDisposable extends BaseDisposable {
    disposeCallCount = 0;

    dispose(): void {
      this.disposeCallCount++;
      this.disposed = true;
    }
  }

  let disposable: TestDisposable;

  beforeEach(() => {
    disposable = new TestDisposable();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const d = new TestDisposable();

      expect(d.isDisposed()).toBe(false);
    });

    it('should create with custom config', () => {
      const d = new TestDisposable({
        autoDisposeChildren: false,
        timeout: 5000,
        throwOnError: true,
        logDisposal: true,
      });

      expect(d.isDisposed()).toBe(false);
    });
  });

  describe('isDisposed', () => {
    it('should return false before disposal', () => {
      expect(disposable.isDisposed()).toBe(false);
    });

    it('should return true after disposal', () => {
      disposable.dispose();
      expect(disposable.isDisposed()).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should increment dispose call count', () => {
      disposable.dispose();
      expect(disposable.disposeCallCount).toBe(1);
    });
  });

  describe('onDispose', () => {
    it('should register callback', async () => {
      const callback = vi.fn();
      disposable.onDispose(callback);

      await disposable.dispose();

      expect(callback).toHaveBeenCalled();
    });

    it('should call callback immediately if already disposed', () => {
      const callback = vi.fn();
      disposable.dispose();

      disposable.onDispose(callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = disposable.onDispose(callback);

      unsubscribe();
      disposable.dispose();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', () => {
      const callback = vi.fn(() => {
        throw new Error('Callback error');
      });

      disposable.onDispose(callback);

      expect(() => disposable.dispose()).not.toThrow();
    });
  });

  describe('registerChild', () => {
    it('should dispose child immediately if parent already disposed', () => {
      const child = new TestDisposable();
      const parent = new TestDisposable();

      parent.dispose();
      (parent as any).registerChild(child);

      expect(child.isDisposed()).toBe(true);
    });

    it('should handle child disposal errors', async () => {
      const child = new TestDisposable();
      const parent = new TestDisposable({ throwOnError: true });

      child.dispose = () => {
        throw new Error('Child disposal error');
      };

      (parent as any).registerChild(child);

      await expect(async () => {
        await parent.dispose();
      }).rejects.toThrow();
    });
  });

  describe('unregisterChild', () => {
    it('should unregister child', async () => {
      const child = new TestDisposable();
      const parent = new TestDisposable();

      (parent as any).registerChild(child);
      (parent as any).unregisterChild(child);

      await parent.dispose();

      expect(child.isDisposed()).toBe(false);
    });
  });

  describe('disposeChildren', () => {
    it('should dispose all children', async () => {
      const child1 = new TestDisposable();
      const child2 = new TestDisposable();
      const parent = new TestDisposable();

      (parent as any).registerChild(child1);
      (parent as any).registerChild(child2);

      await (parent as any).disposeChildren();

      expect(child1.isDisposed()).toBe(true);
      expect(child2.isDisposed()).toBe(true);
    });

    it('should skip already disposed children', async () => {
      const child = new TestDisposable();
      const parent = new TestDisposable();

      child.dispose();
      (parent as any).registerChild(child);

      await (parent as any).disposeChildren();

      expect(child.isDisposed()).toBe(true);
    });
  });

  describe('runDisposeCallbacks', () => {
    it('should run all callbacks', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const parent = new TestDisposable();

      parent.onDispose(callback1);
      parent.onDispose(callback2);

      await (parent as any).runDisposeCallbacks();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should handle callback errors gracefully', async () => {
      const callback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const parent = new TestDisposable();

      parent.onDispose(callback);

      await expect((parent as any).runDisposeCallbacks()).resolves.toBeUndefined();
    });
  });

  describe('handleError', () => {
    it('should call onError callback', () => {
      const onError = vi.fn();
      const d = new TestDisposable({ onError });

      (d as any).handleError(new Error('Test error'));

      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('should log to console if no onError callback', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const d = new TestDisposable();

      (d as any).handleError(new Error('Test error'));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should throw error if throwOnError is true', () => {
      const d = new TestDisposable({ throwOnError: true });

      expect(() => (d as any).handleError(new Error('Test error'))).toThrow('Test error');
    });
  });

  describe('log', () => {
    it('should log if logDisposal is true', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const d = new TestDisposable({ logDisposal: true });

      (d as any).log('Test message');

      expect(consoleSpy).toHaveBeenCalledWith('[DISPOSAL] Test message');
      consoleSpy.mockRestore();
    });

    it('should not log if logDisposal is false', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const d = new TestDisposable({ logDisposal: false });

      (d as any).log('Test message');

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('disposeWithTimeout', () => {
    it('should complete disposal within timeout', async () => {
      const d = new TestDisposable({ timeout: 1000 });

      const disposeFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await (d as any).disposeWithTimeout(disposeFn, 100);

      expect(disposeFn).toHaveBeenCalledTimes(1);
    });

    it('should throw on timeout', async () => {
      const d = new TestDisposable({ timeout: 10 });

      const disposeFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await expect((d as any).disposeWithTimeout(disposeFn, 10))
        .rejects.toThrow('Disposal timed out');
    });

    it('should work without timeout', async () => {
      const d = new TestDisposable();

      const disposeFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await (d as any).disposeWithTimeout(disposeFn, 0);

      expect(disposeFn).toHaveBeenCalledTimes(1);
    });
  });
});

describe('LeakDetector', () => {
  beforeEach(() => {
    LeakDetector.clear();
  });

  describe('track/untrack', () => {
    it('should track instance', () => {
      const instance = new (class extends BaseDisposable {
        dispose() {}
      })();

      LeakDetector.track(instance, 'test-id');

      expect(LeakDetector.getTrackedCount()).toBe(1);

      LeakDetector.untrack('test-id');
      expect(LeakDetector.getTrackedCount()).toBe(0);
    });
  });

  describe('startMonitoring/stop', () => {
    it('should start and stop monitoring', () => {
      LeakDetector.startMonitoring(100);
      LeakDetector.stop();

      // Should not throw
      expect(() => LeakDetector.stop()).not.toThrow();
    });
  });

  describe('onLeakDetected', () => {
    it('should register leak callback', () => {
      const callback = vi.fn();
      const unsubscribe = LeakDetector.onLeakDetected(callback);

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('clear', () => {
    it('should clear all tracked instances', () => {
      const instance = new (class extends BaseDisposable {
        dispose() {}
      })();

      LeakDetector.track(instance, 'test-id');
      LeakDetector.clear();

      expect(LeakDetector.getTrackedCount()).toBe(0);
    });
  });
});

describe('FinalizationHelper', () => {
  describe('track/untrack', () => {
    it('should track instance', () => {
      const helper = new FinalizationHelper();
      const instance = { foo: 'bar' };

      helper.track(instance, 'test-id');

      expect(helper.getTrackedCount()).toBe(1);

      helper.untrack('test-id');
      expect(helper.getTrackedCount()).toBe(0);
    });
  });

  describe('constructor with logCallback', () => {
    it('should use logCallback', () => {
      const logCallback = vi.fn();
      const helper = new FinalizationHelper(logCallback);

      expect(helper).toBeDefined();
    });
  });
});
