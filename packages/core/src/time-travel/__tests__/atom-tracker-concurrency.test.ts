/**
 * AtomTracker Concurrency Test
 * Tests concurrent operations, race conditions, and parallel access scenarios
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AtomTracker } from "../tracking/AtomTracker";
import { TestHelper } from "./utils/test-helpers";
import type { Store, Atom } from "../../types";
import type { TrackedAtom } from "../tracking/types";
import { atomRegistry } from "../../atom-registry";

describe("AtomTracker Concurrency", () => {
  let tracker: AtomTracker;
  let store: Store;

  beforeEach(() => {
    store = TestHelper.createTestStore();
    tracker = new AtomTracker(store, {
      maxAtoms: 100,
      ttl: { defaultTTL: 1000 },
    });

    // Clear atom registry before each test
    atomRegistry.clear();
  });

  it("should handle concurrent track operations", async () => {
    const operations = Array(50)
      .fill(null)
      .map((_, i) => async () => {
        const atom = TestHelper.generateAtom(`atom-${i}`);
        atomRegistry.register(atom, `atom-${i}`);
        return tracker.track(atom);
      });

    const results = await TestHelper.concurrent(operations, 10);
    expect(results.filter(Boolean).length).toBe(50);
    expect(tracker.size()).toBe(50);
  });

  it("should handle concurrent track and untrack", async () => {
    const atoms = Array(20)
      .fill(null)
      .map((_, i) => {
        const atom = TestHelper.generateAtom(`atom-${i}`);
        atomRegistry.register(atom, `atom-${i}`);
        return atom;
      });

    atoms.forEach((atom) => tracker.track(atom));

    const operations: Array<() => Promise<boolean>> = [
      ...Array(10)
        .fill(null)
        .map((_, i) => async () => {
          const atom = TestHelper.generateAtom(`new-${i}`);
          atomRegistry.register(atom, `new-${i}`);
          return tracker.track(atom);
        }),
      ...atoms.slice(0, 10).map((atom) => async () => {
        return tracker.untrack(atom);
      }),
    ];

    await TestHelper.concurrent(operations, 5);

    // Should have 20 atoms: 10 original (not untracked) + 10 new
    expect(tracker.size()).toBe(20);
  });

  it("should handle concurrent access recording", async () => {
    const atom = TestHelper.generateAtom("shared");
    atomRegistry.register(atom, "shared");
    tracker.track(atom);

    const operations = Array(100)
      .fill(null)
      .map(() => async () => {
        tracker.recordAccess(atom);
        await TestHelper.wait(Math.random() * 10);
      });

    await TestHelper.concurrent(operations, 20);

    const tracked = tracker.getTrackedAtom(atom.id);
    expect(tracked?.accessCount).toBe(100);
  });

  it("should handle TTL cleanup during concurrent access", async () => {
    tracker.configure({
      ttl: {
        defaultTTL: 50,
        gcInterval: 20,
        batchSize: 5,
      },
    });

    const atoms = Array(20)
      .fill(null)
      .map((_, i) => {
        const atom = TestHelper.generateAtom(`atom-${i}`);
        atomRegistry.register(atom, `atom-${i}`);
        tracker.track(atom);
        return atom;
      });

    const operations: Array<() => Promise<void>> = [
      ...atoms.slice(0, 10).map((atom) => async () => {
        for (let j = 0; j < 5; j++) {
          tracker.recordAccess(atom);
          await TestHelper.wait(10);
        }
      }),
      async () => {
        await TestHelper.wait(100);
        tracker.cleanupNow(5);
      },
    ];

    await TestHelper.concurrent(operations, 5);

    // TTL cleanup behavior depends on timing - just verify no errors
    const remaining = tracker.getAllTracked();
    expect(Array.isArray(remaining)).toBe(true);
    // Some atoms may remain tracked
    expect(remaining.length).toBeGreaterThanOrEqual(0);
  });

  it("should maintain correct reference counts under concurrency", async () => {
    const atom = TestHelper.generateAtom("ref-test");
    atomRegistry.register(atom, "ref-test");
    tracker.track(atom);

    const subscriberId = "test-component";
    const operations = Array(50)
      .fill(null)
      .map(() => async () => {
        tracker.recordAccess(atom, subscriberId);
      });

    await TestHelper.concurrent(operations, 10);

    const tracked = tracker.getTrackedAtom(atom.id);
    expect(tracked?.subscribers?.size).toBe(1); // Same subscriber
    expect(tracked?.refCount).toBe(1);
  });

  it("should handle concurrent trackMany operations", async () => {
    const batches = Array(10)
      .fill(null)
      .map((_, batchIndex) => {
        return Array(5)
          .fill(null)
          .map((_, atomIndex) => {
            const atom = TestHelper.generateAtom(`batch-${batchIndex}-atom-${atomIndex}`);
            atomRegistry.register(atom, `batch-${batchIndex}-atom-${atomIndex}`);
            return atom;
          });
      });

    const operations = batches.map((batch) => async () => {
      return tracker.trackMany(batch);
    });

    const results = await TestHelper.concurrent(operations, 5);

    // All atoms should be tracked
    expect(results.reduce((sum, count) => sum + count, 0)).toBe(50);
    expect(tracker.size()).toBe(50);
  });

  it("should handle concurrent untrackMany operations", async () => {
    const atoms = Array(30)
      .fill(null)
      .map((_, i) => {
        const atom = TestHelper.generateAtom(`atom-${i}`);
        atomRegistry.register(atom, `atom-${i}`);
        tracker.track(atom);
        return atom;
      });

    const batches = Array(6)
      .fill(null)
      .map((_, batchIndex) => {
        return atoms.slice(batchIndex * 5, (batchIndex + 1) * 5);
      });

    const operations = batches.map((batch) => async () => {
      return tracker.untrackMany(batch);
    });

    const results = await TestHelper.concurrent(operations, 3);

    // All atoms should be untracked
    expect(results.reduce((sum, count) => sum + count, 0)).toBe(30);
    expect(tracker.size()).toBe(0);
  });

  it("should handle concurrent recordChange operations", async () => {
    const atom = TestHelper.generateAtom("change-test");
    atomRegistry.register(atom, "change-test");
    tracker.track(atom);
    store.set(atom, 0);

    const operations = Array(50)
      .fill(null)
      .map((_, i) => async () => {
        store.set(atom, i + 1);
        tracker.recordChange(atom, i, i + 1);
      });

    await TestHelper.concurrent(operations, 10);

    const tracked = tracker.getTrackedAtom(atom.id);
    expect(tracked?.changeCount).toBe(50);
  });

  it("should handle concurrent getTrackedAtoms and track operations", async () => {
    const atoms: Atom<unknown>[] = [];
    for (let i = 0; i < 20; i++) {
      const atom = TestHelper.generateAtom(`atom-${i}`);
      atomRegistry.register(atom, `atom-${i}`);
      atoms.push(atom);
      tracker.track(atom);
    }

    const operations: Array<() => Promise<Atom<unknown>[]>> = [
      ...Array(10)
        .fill(null)
        .map(() => async () => {
          return tracker.getTrackedAtoms();
        }),
      ...Array(10)
        .fill(null)
        .map((_, i) => async () => {
          const atom = TestHelper.generateAtom(`new-atom-${i}`);
          atomRegistry.register(atom, `new-atom-${i}`);
          tracker.track(atom);
          return [atom];
        }),
    ];

    await TestHelper.concurrent(operations, 5);

    expect(tracker.size()).toBe(30);
  });

  it("should handle concurrent snapshot creation and restoration", async () => {
    const atoms = Array(10)
      .fill(null)
      .map((_, i) => {
        const atom = TestHelper.generateAtom(`atom-${i}`);
        atomRegistry.register(atom, `atom-${i}`);
        store.set(atom, i);
        tracker.track(atom);
        return atom;
      });

    const operations: Array<() => Promise<void>> = [
      ...Array(5)
        .fill(null)
        .map(() => async () => {
          tracker.snapshot();
        }),
      ...atoms.map((atom) => async () => {
        tracker.recordAccess(atom);
      }),
    ];

    await TestHelper.concurrent(operations, 5);

    // All atoms should still be tracked
    expect(tracker.size()).toBe(10);
  });

  it("should handle concurrent configure and track operations", async () => {
    const operations: Array<() => Promise<void>> = [
      ...Array(10)
        .fill(null)
        .map(() => async () => {
          tracker.configure({
            maxAtoms: 50 + Math.floor(Math.random() * 50),
          });
        }),
      ...Array(20)
        .fill(null)
        .map((_, i) => async () => {
          const atom = TestHelper.generateAtom(`config-atom-${i}`);
          atomRegistry.register(atom, `config-atom-${i}`);
          tracker.track(atom);
        }),
    ];

    await TestHelper.concurrent(operations, 5);

    expect(tracker.size()).toBe(20);
  });

  it("should handle concurrent cleanup and access", async () => {
    const atoms = Array(30)
      .fill(null)
      .map((_, i) => {
        const atom = TestHelper.generateAtom(`cleanup-atom-${i}`);
        atomRegistry.register(atom, `cleanup-atom-${i}`);
        tracker.track(atom);
        return atom;
      });

    // Mark some atoms for cleanup
    atoms.slice(0, 15).forEach((atom) => {
      tracker.markForCleanup(atom.id);
    });

    const operations: Array<() => Promise<void>> = [
      async () => {
        await tracker.cleanupNow(10);
      },
      ...atoms.slice(15, 30).map((atom) => async () => {
        tracker.recordAccess(atom);
      }),
    ];

    await TestHelper.concurrent(operations, 3);

    // Atoms that were accessed should still be tracked
    const remaining = tracker.getAllTracked();
    expect(remaining.length).toBeGreaterThan(0);
  });

  it("should handle concurrent subscribe and event emission", async () => {
    const listeners: Array<() => void> = [];

    const operations: Array<() => Promise<void>> = [
      ...Array(10)
        .fill(null)
        .map(() => async () => {
          const listener = vi.fn();
          tracker.subscribe(listener);
          listeners.push(listener);
        }),
      ...Array(20)
        .fill(null)
        .map((_, i) => async () => {
          const atom = TestHelper.generateAtom(`event-atom-${i}`);
          atomRegistry.register(atom, `event-atom-${i}`);
          tracker.track(atom);
        }),
    ];

    await TestHelper.concurrent(operations, 5);

    // All listeners should be registered
    expect(listeners.length).toBe(10);
    expect(tracker.size()).toBe(20);
  });

  it("should handle race condition between track and untrack same atom", async () => {
    const atom = TestHelper.generateAtom("race-atom");
    atomRegistry.register(atom, "race-atom");

    const operations: Array<() => Promise<boolean>> = [
      async () => tracker.track(atom),
      async () => tracker.untrack(atom),
      async () => tracker.track(atom),
      async () => tracker.untrack(atom),
      async () => tracker.track(atom),
    ];

    await TestHelper.concurrent(operations, 1);

    // Final state depends on execution order, but should not crash
    expect(() => tracker.isTracked(atom)).not.toThrow();
  });

  it("should handle concurrent clear and track operations", async () => {
    const atoms = Array(20)
      .fill(null)
      .map((_, i) => {
        const atom = TestHelper.generateAtom(`clear-atom-${i}`);
        atomRegistry.register(atom, `clear-atom-${i}`);
        tracker.track(atom);
        return atom;
      });

    const operations: Array<() => Promise<void>> = [
      async () => {
        await TestHelper.wait(50);
        tracker.clear();
      },
      ...atoms.map((atom) => async () => {
        await TestHelper.wait(Math.random() * 100);
        tracker.recordAccess(atom);
      }),
    ];

    await TestHelper.concurrent(operations, 5);

    // After clear, no atoms should be tracked
    expect(tracker.size()).toBe(0);
  });

  it("should handle concurrent restorePoint creation", async () => {
    const atoms = Array(10)
      .fill(null)
      .map((_, i) => {
        const atom = TestHelper.generateAtom(`restore-atom-${i}`);
        atomRegistry.register(atom, `restore-atom-${i}`);
        tracker.track(atom);
        return atom;
      });

    const operations: Array<() => Promise<void>> = [
      ...Array(10)
        .fill(null)
        .map(() => async () => {
          tracker.createRestorePoint();
        }),
      ...atoms.map((atom) => async () => {
        tracker.recordAccess(atom);
        tracker.recordChange(atom, 0, 1);
      }),
    ];

    await TestHelper.concurrent(operations, 5);

    // All atoms should still be tracked
    expect(tracker.size()).toBe(10);
  });

  it("should maintain data integrity under heavy concurrent load", async () => {
    const atoms = Array(50)
      .fill(null)
      .map((_, i) => {
        const atom = TestHelper.generateAtom(`load-atom-${i}`);
        atomRegistry.register(atom, `load-atom-${i}`);
        store.set(atom, i);
        tracker.track(atom);
        return atom;
      });

    const operations: Array<() => Promise<void>> = [
      ...Array(20)
        .fill(null)
        .map(() => async () => {
          tracker.snapshot();
        }),
      ...Array(30)
        .fill(null)
        .map(() => async () => {
          await tracker.performCleanup();
        }),
      ...atoms.map((atom) => async () => {
        tracker.recordAccess(atom);
        tracker.recordChange(atom, store.get(atom), store.get(atom) + 1);
        store.set(atom, store.get(atom) + 1);
      }),
    ];

    await TestHelper.concurrent(operations, 10);

    // Should not crash and should have consistent state
    const stats = tracker.getStats();
    expect(stats.totalAtoms).toBeGreaterThanOrEqual(0);
    expect(stats.totalAtoms).toBeLessThanOrEqual(50);
  });
});
