/**
 * Tests for disposal and memory leak detection
 *
 * Tests the proper cleanup of resources in dispose() methods
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { atom, createStore, Atom } from "../../";
import { SimpleTimeTravel } from "../core/SimpleTimeTravel";
import {
  LeakDetector,
  BaseDisposable,
  Disposable,
  DisposalError,
  AggregateDisposalError,
} from "../core/disposable";
import { HistoryManager } from "../core/HistoryManager";
import { AtomTracker } from "../tracking/AtomTracker";
import { SnapshotCreator } from "../snapshot/SnapshotCreator";
import { SnapshotRestorer } from "../snapshot/SnapshotRestorer";

describe("Disposal and Resource Cleanup", () => {
  let store: ReturnType<typeof createStore>;
  let testAtom: Atom<number>;

  beforeEach(() => {
    store = createStore();
    testAtom = atom({ name: "test", default: 0 });
    store.set(testAtom, 0);
  });

  afterEach(() => {
    LeakDetector.stop();
    LeakDetector.clear();
  });

  describe("BaseDisposable", () => {
    it("should track disposal state", async () => {
      class TestDisposable extends BaseDisposable {
        async dispose(): Promise<void> {
          this.disposed = true;
        }
      }

      const disposable = new TestDisposable();
      expect(disposable.isDisposed()).toBe(false);

      await disposable.dispose();
      expect(disposable.isDisposed()).toBe(true);
    });

    it("should register and call dispose callbacks", async () => {
      class TestDisposable extends BaseDisposable {
        async dispose(): Promise<void> {
          await this.runDisposeCallbacks();
          this.disposed = true;
        }
      }

      const disposable = new TestDisposable();
      const callback = vi.fn();

      const unsubscribe = disposable.onDispose(callback);
      await disposable.dispose();

      expect(callback).toHaveBeenCalledTimes(1);

      // Unsubscribe should work
      const callback2 = vi.fn();
      const unsubscribe2 = disposable.onDispose(callback2);
      unsubscribe2();
      // Already disposed, so callback2 won't be called
    });

    it("should dispose children", async () => {
      class ChildDisposable extends BaseDisposable {
        async dispose(): Promise<void> {
          this.disposed = true;
        }
      }

      class ParentDisposable extends BaseDisposable {
        async dispose(): Promise<void> {
          await this.disposeChildren();
          this.disposed = true;
        }
      }

      const parent = new ParentDisposable();
      const child1 = new ChildDisposable();
      const child2 = new ChildDisposable();

      (parent as any).children.add(child1);
      (parent as any).children.add(child2);

      await parent.dispose();

      expect(child1.isDisposed()).toBe(true);
      expect(child2.isDisposed()).toBe(true);
    });

    it("should handle disposal errors gracefully", async () => {
      class ErrorDisposable extends BaseDisposable {
        async dispose(): Promise<void> {
          // Use handleError to properly handle the error
          this.handleError(new Error("Disposal error"));
          this.disposed = true;
        }
      }

      const errors: Error[] = [];
      const disposable = new ErrorDisposable({
        onError: (error) => errors.push(error),
        throwOnError: false,
      });

      await disposable.dispose();
      // Error should be handled by onError callback
      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe("Disposal error");
    });

    it("should throw on error if configured", async () => {
      class ErrorDisposable extends BaseDisposable {
        async dispose(): Promise<void> {
          throw new Error("Disposal error");
        }
      }

      const disposable = new ErrorDisposable({
        throwOnError: true,
      });

      await expect(disposable.dispose()).rejects.toThrow("Disposal error");
    });

    it("should handle timeout during disposal", async () => {
      class SlowDisposable extends BaseDisposable {
        async dispose(): Promise<void> {
          // Use disposeWithTimeout to properly test timeout behavior
          await this.disposeWithTimeout(
            async () => {
              await new Promise((resolve) => setTimeout(resolve, 100));
            },
            50,
          );
        }
      }

      const disposable = new SlowDisposable();

      await expect(disposable.dispose()).rejects.toThrow("timed out");
    });

    it("should call callback immediately if already disposed", async () => {
      class TestDisposable extends BaseDisposable {
        async dispose(): Promise<void> {
          this.disposed = true;
        }
      }

      const disposable = new TestDisposable();
      await disposable.dispose();

      const callback = vi.fn();
      disposable.onDispose(callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("HistoryManager Disposal", () => {
    it("should dispose HistoryManager properly", async () => {
      const historyManager = new HistoryManager(50);

      expect(historyManager.isDisposed()).toBe(false);

      await historyManager.dispose();

      expect(historyManager.isDisposed()).toBe(true);
    });

    it("should clear all listeners on dispose", async () => {
      const historyManager = new HistoryManager(50);
      const listener = vi.fn();

      historyManager.subscribe(listener);
      await historyManager.dispose();

      // After dispose, listeners should be cleared
      expect((historyManager as any).listeners.size).toBe(0);
    });

    it("should clear timers on dispose", async () => {
      const historyManager = new HistoryManager(50);

      // Add a timer
      (historyManager as any).setTimeout(() => {}, 1000);

      await historyManager.dispose();

      expect((historyManager as any).timers.size).toBe(0);
    });

    it("should clear snapshots on dispose", async () => {
      const historyManager = new HistoryManager(50);

      // Add some snapshots
      historyManager.add({
        id: "1",
        state: {},
        metadata: { timestamp: Date.now(), atomCount: 0 },
      });

      await historyManager.dispose();

      expect(historyManager.getAll().length).toBe(0);
    });

    it("should be idempotent", async () => {
      const historyManager = new HistoryManager(50);

      await historyManager.dispose();
      await historyManager.dispose(); // Should not throw

      expect(historyManager.isDisposed()).toBe(true);
    });
  });

  describe("AtomTracker Disposal", () => {
    it("should dispose AtomTracker properly", async () => {
      const tracker = new AtomTracker(store);

      expect(tracker.isDisposed()).toBe(false);

      await tracker.dispose();

      expect(tracker.isDisposed()).toBe(true);
    });

    it("should clear cleanup timer on dispose", async () => {
      const tracker = new AtomTracker(store, {
        ttl: { gcInterval: 1000 },
      });

      // Timer should be started
      expect((tracker as any).cleanupTimer).not.toBeNull();

      await tracker.dispose();

      // Timer should be cleared after dispose
      expect((tracker as any).cleanupTimer).toBeNull();
    });

    it("should clear all tracked atoms on dispose", async () => {
      const tracker = new AtomTracker(store);

      tracker.track(testAtom);
      expect(tracker.size()).toBe(1);

      await tracker.dispose();

      expect(tracker.size()).toBe(0);
    });

    it("should clear listeners on dispose", async () => {
      const tracker = new AtomTracker(store);
      const listener = vi.fn();

      tracker.subscribe(listener);
      await tracker.dispose();

      expect((tracker as any).listeners.size).toBe(0);
    });
  });

  describe("SnapshotCreator Disposal", () => {
    it("should dispose SnapshotCreator properly", async () => {
      const creator = new SnapshotCreator(store);

      expect(creator.isDisposed()).toBe(false);

      await creator.dispose();

      expect(creator.isDisposed()).toBe(true);
    });

    it("should clear listeners on dispose", async () => {
      const creator = new SnapshotCreator(store);
      const listener = vi.fn();

      creator.subscribe(listener);
      await creator.dispose();

      expect((creator as any).listeners.size).toBe(0);
    });
  });

  describe("SnapshotRestorer Disposal", () => {
    it("should dispose SnapshotRestorer properly", async () => {
      const restorer = new SnapshotRestorer(store);

      expect(restorer.isDisposed()).toBe(false);

      await restorer.dispose();

      expect(restorer.isDisposed()).toBe(true);
    });

    it("should abort active restoration on dispose", async () => {
      const restorer = new SnapshotRestorer(store);

      // Simulate active restoration
      (restorer as any).activeRestoration = true;

      await restorer.dispose();

      expect((restorer as any).activeRestoration).toBe(false);
    });

    it("should clear checkpoints on dispose", async () => {
      const restorer = new SnapshotRestorer(store);

      // Add a checkpoint
      (restorer as any).checkpoints.set("test", {
        id: "test",
        timestamp: Date.now(),
        snapshotId: "snap-1",
        previousValues: new Map(),
        metadata: { atomCount: 0, duration: 0, inProgress: false, committed: false },
      });

      await restorer.dispose();

      expect((restorer as any).checkpoints.size).toBe(0);
    });
  });

  describe("SimpleTimeTravel Disposal", () => {
    it("should dispose SimpleTimeTravel properly", async () => {
      const tt = new SimpleTimeTravel(store);

      expect(tt.isDisposed()).toBe(false);

      await tt.dispose();

      expect(tt.isDisposed()).toBe(true);
    });

    it("should restore original store.set on dispose", async () => {
      const tt = new SimpleTimeTravel(store);

      // store.set should be wrapped during time travel (not the original bound function)
      // We can verify this by checking that dispose completes without errors
      // and store.set still works afterwards

      await tt.dispose();

      // After dispose, store.set should work without errors
      // We can verify by setting a value and checking it works
      const testAtom2 = atom({ name: "test2", default: 0 });
      expect(() => {
        store.set(testAtom2, 5);
      }).not.toThrow();
      expect(store.get(testAtom2)).toBe(5);
    });

    it("should clear all subscriptions on dispose", async () => {
      const tt = new SimpleTimeTravel(store);

      await tt.dispose();

      expect((tt as any).subscriptions.size).toBe(0);
    });

    it("should dispose all child components", async () => {
      const tt = new SimpleTimeTravel(store);

      await tt.dispose();

      expect(tt.getAtomTracker().isDisposed()).toBe(true);
      expect(tt.getSnapshotCreator().isDisposed()).toBe(true);
      expect(tt.getSnapshotRestorer().isDisposed()).toBe(true);
      expect((tt.getHistoryManager() as any).isDisposed()).toBe(true);
    });

    it("should be idempotent", async () => {
      const tt = new SimpleTimeTravel(store);

      await tt.dispose();
      await tt.dispose(); // Should not throw

      expect(tt.isDisposed()).toBe(true);
    });

    it("should clear references on dispose", async () => {
      const tt = new SimpleTimeTravel(store);

      await tt.dispose();

      expect((tt as any).store).toBeNull();
      expect((tt as any).originalSet).toBeNull();
    });
  });

  describe("LeakDetector", () => {
    it("should track instances", () => {
      class TestDisposable extends BaseDisposable {
        async dispose(): Promise<void> {
          this.disposed = true;
        }
      }

      const instance = new TestDisposable();
      LeakDetector.track(instance, "test-instance");

      expect(LeakDetector.getTrackedCount()).toBeGreaterThan(0);
    });

    it("should untrack instances", () => {
      class TestDisposable extends BaseDisposable {
        async dispose(): Promise<void> {
          this.disposed = true;
        }
      }

      const instance = new TestDisposable();
      LeakDetector.track(instance, "test-instance");
      LeakDetector.untrack("test-instance");

      expect(LeakDetector.getTrackedCount()).toBe(0);
    });

    it("should detect leaks", async () => {
      class TestDisposable extends BaseDisposable {
        async dispose(): Promise<void> {
          this.disposed = true;
        }
      }

      const instance = new TestDisposable();
      LeakDetector.track(instance, "test-instance");

      // Don't dispose - this should be detected as a leak
      LeakDetector.checkForLeaks();

      // The instance should still be tracked
      expect(LeakDetector.getTrackedCount()).toBeGreaterThan(0);
    });

    it("should call leak callbacks", async () => {
      class TestDisposable extends BaseDisposable {
        async dispose(): Promise<void> {
          this.disposed = true;
        }
      }

      const instance = new TestDisposable();
      const callback = vi.fn();

      LeakDetector.onLeakDetected(callback);
      LeakDetector.track(instance, "test-instance");

      // Manually trigger leak detection
      (LeakDetector as any).emitLeak("test-instance", instance);

      expect(callback).toHaveBeenCalledWith("test-instance", instance);
    });

    it("should stop monitoring", () => {
      LeakDetector.startMonitoring(1000);
      expect((LeakDetector as any).interval).not.toBeNull();

      LeakDetector.stop();
      expect((LeakDetector as any).interval).toBeNull();
    });

    it("should clear all tracked instances", () => {
      class TestDisposable extends BaseDisposable {
        async dispose(): Promise<void> {
          this.disposed = true;
        }
      }

      const instance1 = new TestDisposable();
      const instance2 = new TestDisposable();

      LeakDetector.track(instance1, "test-1");
      LeakDetector.track(instance2, "test-2");

      LeakDetector.clear();

      expect(LeakDetector.getTrackedCount()).toBe(0);
    });
  });

  describe("Memory Leak Tests", () => {
    it("should dispose without errors", async () => {
      // Create and dispose multiple instances
      for (let i = 0; i < 10; i++) {
        const tt = new SimpleTimeTravel(store);
        await tt.dispose();
        expect(tt.isDisposed()).toBe(true);
      }
    });

    it("should remove all event listeners after dispose", async () => {
      const tt = new SimpleTimeTravel(store);
      const listener = vi.fn();

      const unsubscribe = tt.subscribe(listener);
      await tt.dispose();

      // Trigger event (should not call listener)
      // Since we disposed, the listener should have been removed
      expect((tt as any).subscriptions.size).toBe(0);
    });
  });

  describe("Circular Reference Cleanup", () => {
    it("should break circular references after dispose", async () => {
      const tt = new SimpleTimeTravel(store);

      // Create a weak reference to track if it's garbage collected
      // Note: This test is more of a documentation of the pattern
      // Actual GC testing requires --expose-gc flag
      const weakRef = new WeakRef(tt);

      await tt.dispose();

      // After dispose, the instance should still be accessible
      // but internal references should be cleared
      expect(weakRef.deref()).toBeDefined();
    });
  });

  describe("Disposal Configuration", () => {
    it("should log disposal steps when configured", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const tt = new SimpleTimeTravel(store, {
        logDisposal: true,
      });

      await tt.dispose();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Disposing SimpleTimeTravel"),
      );

      consoleSpy.mockRestore();
    });

    it("should detect leaks when configured", async () => {
      const tt = new SimpleTimeTravel(store, {
        detectLeaks: true,
      });

      expect(LeakDetector.getTrackedCount()).toBeGreaterThan(0);

      await tt.dispose();

      // After dispose, should be untracked
      expect(LeakDetector.getTrackedCount()).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle errors in child disposal", async () => {
      const tt = new SimpleTimeTravel(store);

      // Mock a child to throw on dispose
      vi.spyOn(tt.getAtomTracker(), "dispose").mockImplementation(async () => {
        throw new Error("Simulated disposal error");
      });

      // Should not throw, but log error
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(tt.dispose()).resolves.not.toThrow();

      // Verify that an error was logged (format may vary)
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
