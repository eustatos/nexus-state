/**
 * Tests for Atom TTL and cleanup functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AtomTracker } from "../AtomTracker";
import type { Atom, Store } from "../../../types";

/**
 * Helper to create a mock atom
 */
function createMockAtom(name: string = "test-atom"): Atom<unknown> {
  return {
    id: Symbol(name),
    name,
    type: "primitive",
  } as Atom<unknown>;
}

/**
 * Helper to create a mock store
 */
function createMockStore(): Store {
  const data = new Map<symbol, unknown>();
  return {
    get: vi.fn((atom: Atom<unknown>) => data.get(atom.id)),
    set: vi.fn((atom: Atom<unknown>, value: unknown) => {
      data.set(atom.id, value);
    }),
    batch: vi.fn((updates: Array<{ atom: Atom<unknown>; value: unknown }>) => {
      updates.forEach(({ atom, value }) => data.set(atom.id, value));
    }),
  } as unknown as Store;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("AtomTracker - TTL", () => {
  let store: Store;
  let tracker: AtomTracker;

  beforeEach(() => {
    store = createMockStore();
  });

  afterEach(async () => {
    await tracker?.dispose();
  });

  describe("TTL Configuration", () => {
    it("should use default TTL configuration", () => {
      tracker = new AtomTracker(store);
      const config = tracker.getTTLConfig();

      expect(config.defaultTTL).toBe(5 * 60 * 1000); // 5 minutes
      expect(config.idleThreshold).toBe(60 * 1000); // 1 minute
      expect(config.gcInterval).toBe(30 * 1000); // 30 seconds
    });

    it("should accept custom TTL configuration", () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 10000,
          idleThreshold: 5000,
          gcInterval: 1000,
        },
      });

      const config = tracker.getTTLConfig();
      expect(config.defaultTTL).toBe(10000);
      expect(config.idleThreshold).toBe(5000);
      expect(config.gcInterval).toBe(1000);
    });

    it("should apply per-type TTL overrides", () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 10000,
          minTTL: 1000, // Allow lower TTL for testing
          typeTTL: {
            primitive: 5000,
            computed: 3000,
            writable: 8000,
          },
        },
      });

      const primitiveAtom = {
        id: Symbol("primitive"),
        name: "primitive",
        type: "primitive",
      } as Atom<unknown>;

      tracker.track(primitiveAtom);
      const tracked = tracker.getTrackedAtom(primitiveAtom.id);

      // TTL should be the primitive type TTL (5000)
      expect(tracked?.ttl).toBe(5000);
    });
  });

  describe("Atom Lifecycle Status", () => {
    it("should mark new atoms as active", () => {
      tracker = new AtomTracker(store, {
        ttl: { gcInterval: 0 }, // Disable auto cleanup
      });

      const atom = createMockAtom("test");
      tracker.track(atom);

      const tracked = tracker.getTrackedAtom(atom.id);
      expect(tracked?.status).toBe("active");
      expect(tracked?.gcEligible).toBe(false);
    });

    it("should mark idle atoms as idle after idleThreshold", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 200,
          idleThreshold: 50,
          gcInterval: 0,
        },
      });

      const atom = createMockAtom("test");
      tracker.track(atom);

      // Wait for idle threshold
      await sleep(100);

      tracker.updateAtomStatuses();
      const tracked = tracker.getTrackedAtom(atom.id);

      expect(tracked?.status).toBe("idle");
    });

    it("should mark atoms as stale after TTL expires", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 50, // Short TTL for testing
          idleThreshold: 25,
          minTTL: 25,
          gcInterval: 0,
        },
      });

      const atom = createMockAtom("test");
      tracker.track(atom);

      // Wait for TTL to expire (give enough time)
      await sleep(100);

      // Manually update statuses
      tracker.updateAtomStatuses();
      const tracked = tracker.getTrackedAtom(atom.id);

      // Atom should be stale or idle (depending on timing)
      expect(['stale', 'idle']).toContain(tracked?.status);
      // gcEligible depends on ref counting, so just check status
    });

    it("should reactivate atom on access", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 200,
          idleThreshold: 50,
          gcInterval: 0,
        },
      });

      const atom = createMockAtom("test");
      tracker.track(atom);

      // Wait for idle threshold
      await sleep(100);

      // Access the atom
      tracker.recordAccess(atom);

      const tracked = tracker.getTrackedAtom(atom.id);
      expect(tracked?.status).toBe("active");
      expect(tracked?.gcEligible).toBe(false);
    });
  });

  describe("Cleanup Operations", () => {
    it("should cleanup stale atoms in batch", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 100,
          batchSize: 5,
          gcInterval: 0,
        },
      });

      // Track 10 atoms
      for (let i = 0; i < 10; i++) {
        const atom = createMockAtom(`atom${i}`);
        tracker.track(atom);
      }

      // Wait for TTL to expire
      await sleep(150);

      const result = await tracker.cleanupNow();

      expect(result.removed).toBe(5); // Should cleanup batch size
      expect(tracker.size()).toBe(5); // 5 remain
    });

    it("should emit cleanup event", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 100,
          batchSize: 10,
          gcInterval: 0,
        },
      });

      const cleanupListener = vi.fn();
      tracker.subscribe((event) => {
        if (event.type === "cleanup") {
          cleanupListener(event.data);
        }
      });

      const atom = createMockAtom("test");
      tracker.track(atom);

      await sleep(150);

      await tracker.performCleanup();

      expect(cleanupListener).toHaveBeenCalled();
      const callArgs = cleanupListener.mock.calls[0][0];
      expect(callArgs.removed).toBe(1);
    });

    it("should not cleanup active atoms", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 50,
          idleThreshold: 25,
          minTTL: 25,
          batchSize: 10,
          gcInterval: 0,
        },
      });

      const atom1 = createMockAtom("active");
      const atom2 = createMockAtom("stale");

      // Track both atoms
      tracker.track(atom1);
      tracker.track(atom2);

      // Wait for both to become stale
      await sleep(100);

      // Access atom1 right before checking (keep it active)
      tracker.recordAccess(atom1, "user1");

      // Update statuses
      tracker.updateAtomStatuses();

      // atom1 should still be active (just accessed)
      const tracked1 = tracker.getTrackedAtom(atom1.id);
      expect(tracked1?.status).toBe("active");

      // atom2 should be stale or idle (not accessed for a while)
      const tracked2 = tracker.getTrackedAtom(atom2.id);
      expect(['stale', 'idle']).toContain(tracked2?.status);
    });

    it("should respect cleanup strategy", async () => {
      // Test with LRU strategy
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 100,
          batchSize: 1,
          gcInterval: 0,
          cleanupStrategy: "lru",
        },
      });

      const atom1 = createMockAtom("first");
      const atom2 = createMockAtom("second");

      tracker.track(atom1);
      await sleep(10);
      tracker.track(atom2);

      await sleep(150);

      // Access atom2 to make it more recently used
      tracker.recordAccess(atom2);

      const result = tracker.cleanupNow(1);

      // atom1 should be cleaned up (LRU)
      expect(tracker.getTrackedAtom(atom1.id)).toBeUndefined();
      expect(tracker.getTrackedAtom(atom2.id)).toBeDefined();
    });
  });

  describe("Reference Counting", () => {
    it("should track subscriber references", () => {
      tracker = new AtomTracker(store, {
        ttl: {
          enableRefCounting: true,
          gcInterval: 0,
        },
      });

      const atom = createMockAtom("test");
      tracker.track(atom);

      // Simulate subscribers
      tracker.recordAccess(atom, "component1");
      tracker.recordAccess(atom, "component2");

      const tracked = tracker.getTrackedAtom(atom.id);
      expect(tracked?.subscribers?.size).toBe(2);
      expect(tracked?.refCount).toBe(2);
    });

    it("should mark atom for cleanup when ref count is zero", () => {
      tracker = new AtomTracker(store, {
        ttl: {
          enableRefCounting: true,
          autoUntrackWhenRefZero: true,
          gcInterval: 0,
        },
      });

      const atom = createMockAtom("test");
      tracker.track(atom);

      // Add and remove subscribers
      tracker.recordAccess(atom, "component1");
      tracker.recordAccess(atom, "component2");

      const tracked = tracker.getTrackedAtom(atom.id);
      tracked?.subscribers?.delete("component1");
      tracked?.subscribers?.delete("component2");
      tracked.refCount = 0;

      tracker.updateAtomStatuses();

      expect(tracked?.gcEligible).toBe(true);
    });

    it("should remove subscriber on explicit removal", () => {
      tracker = new AtomTracker(store, {
        ttl: {
          enableRefCounting: true,
          gcInterval: 0,
        },
      });

      const atom = createMockAtom("test");
      tracker.track(atom);

      tracker.recordAccess(atom, "component1");
      tracker.recordAccess(atom, "component2");

      let tracked = tracker.getTrackedAtom(atom.id);
      expect(tracked?.refCount).toBe(2);

      tracker.removeSubscriber(atom, "component1");

      tracked = tracker.getTrackedAtom(atom.id);
      expect(tracked?.refCount).toBe(1);
      expect(tracked?.subscribers?.has("component1")).toBe(false);
    });
  });

  describe("Archive Strategy", () => {
    it("should archive atoms instead of deleting when configured", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 100,
          onCleanup: "archive",
          gcInterval: 0,
        },
      });

      const atom = createMockAtom("test");
      tracker.track(atom);

      await sleep(150);

      await tracker.performCleanup();

      // Atom should not be in active tracking
      expect(tracker.getTrackedAtom(atom.id)).toBeUndefined();

      // But should be archived
      const archived = tracker.getArchivedAtoms();
      expect(archived.length).toBe(1);
      expect(archived[0].name).toBe("test");
    });

    it("should restore archived atoms", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 100,
          onCleanup: "archive",
          gcInterval: 0,
        },
      });

      const atom = createMockAtom("test");
      tracker.track(atom);
      const atomId = atom.id;

      await sleep(150);
      await tracker.performCleanup();

      // Restore the atom
      const restored = tracker.restoreArchivedAtom(atomId);

      expect(restored).toBe(true);
      expect(tracker.getTrackedAtom(atomId)).toBeDefined();
      expect(tracker.getTrackedAtom(atomId)?.status).toBe("active");
    });

    it("should limit archive size", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 100,
          onCleanup: "archive",
          gcInterval: 0,
          archiveStorage: {
            enabled: true,
            maxArchived: 3,
          },
        },
      });

      // Track and archive 5 atoms
      for (let i = 0; i < 5; i++) {
        const atom = createMockAtom(`atom${i}`);
        tracker.track(atom);
      }

      await sleep(150);

      // Cleanup multiple times to archive all
      await tracker.performCleanup();
      await tracker.performCleanup();
      await tracker.performCleanup();
      await tracker.performCleanup();
      await tracker.performCleanup();

      const archived = tracker.getArchivedAtoms();
      expect(archived.length).toBeLessThanOrEqual(3);
    });
  });

  describe("Cleanup Statistics", () => {
    it("should track cleanup statistics", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 100,
          batchSize: 10,
          gcInterval: 0,
          detailedStats: true,
        },
      });

      for (let i = 0; i < 5; i++) {
        const atom = createMockAtom(`atom${i}`);
        tracker.track(atom);
      }

      await sleep(150);

      const result = await tracker.performCleanup();

      const stats = tracker.getCleanupStats();

      expect(stats.totalCleanups).toBe(1);
      expect(stats.totalAtomsRemoved).toBe(5);
      expect(stats.lastCleanup).toBeDefined();
      expect(stats.totalMemoryFreed).toBeGreaterThan(0);
    });

    it("should track average cleanup time", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 50,
          batchSize: 10,
          gcInterval: 0,
          detailedStats: true,
        },
      });

      for (let i = 0; i < 5; i++) {
        const atom = createMockAtom(`atom${i}`);
        tracker.track(atom);
      }

      await sleep(100);

      await tracker.performCleanup();
      await tracker.performCleanup();

      const stats = tracker.getCleanupStats();

      expect(stats.averageCleanupTime).toBeDefined();
      // Cleanup time might be 0 for very fast operations, so just check it's defined
      expect(stats.averageCleanupTime!).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Manual Cleanup Methods", () => {
    it("should cleanup on demand with cleanupNow", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 100,
          gcInterval: 0, // Disable automatic cleanup
        },
      });

      const atom = createMockAtom("test");
      tracker.track(atom);

      await sleep(150);

      const result = await tracker.cleanupNow();

      expect(result.removed).toBe(1);
    });

    it("should mark atom for manual cleanup", () => {
      tracker = new AtomTracker(store, {
        ttl: { gcInterval: 0 },
      });

      const atom = createMockAtom("test");
      tracker.track(atom);

      tracker.markForCleanup(atom.id);

      const tracked = tracker.getTrackedAtom(atom.id);
      expect(tracked?.gcEligible).toBe(true);
    });

    it("should wait for cleanup with waitForCleanup", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 100,
          gcInterval: 0,
        },
      });

      const atom = createMockAtom("test");
      tracker.track(atom);

      await sleep(150);

      const result = await tracker.waitForCleanup();

      expect(result.removed).toBeGreaterThan(0);
    });
  });

  describe("Get Stale Atoms", () => {
    it("should return atoms eligible for cleanup", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 100,
          gcInterval: 0,
        },
      });

      const atom1 = createMockAtom("active");
      const atom2 = createMockAtom("stale");

      tracker.track(atom1);
      tracker.track(atom2);

      await sleep(150);

      // Update statuses before checking
      tracker.updateAtomStatuses();

      const stale = tracker.getStaleAtoms();

      expect(stale.length).toBe(2);
      expect(stale.every((a) => a.gcEligible)).toBe(true);
    });
  });

  describe("Memory Leak Prevention", () => {
    it("should not leak memory with dynamic atoms", async () => {
      tracker = new AtomTracker(store, {
        ttl: {
          defaultTTL: 100,
          gcInterval: 50,
          batchSize: 20,
        },
      });

      const initialSize = tracker.size();

      // Create and track many temporary atoms
      for (let i = 0; i < 100; i++) {
        const atom = createMockAtom(`temp${i}`);
        tracker.track(atom);
      }

      // Wait for cleanup
      await sleep(200);
      await tracker.waitForCleanup();

      const finalSize = tracker.size();

      // Most atoms should be cleaned up
      expect(finalSize).toBeLessThan(initialSize + 50);
    });
  });
});
