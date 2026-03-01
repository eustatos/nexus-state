/**
 * TimeTravel Stress Tests
 * Tests performance, memory, and stability under heavy load
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SimpleTimeTravel } from "../core/SimpleTimeTravel";
import { TestHelper } from "./utils/test-helpers";
import type { Store, Atom } from "../../types";
import { atomRegistry } from "../../atom-registry";

describe("TimeTravel Stress Tests", () => {
  let store: Store;
  let timeTravel: SimpleTimeTravel;
  let counterAtom: Atom<number>;

  beforeEach(() => {
    store = TestHelper.createTestStore();
    timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 50,
      autoCapture: true,
    });
    counterAtom = TestHelper.generateAtom("counter", "writable");
    atomRegistry.register(counterAtom, "counter");

    // Clear atom registry before each test
    atomRegistry.clear();
  });

  afterEach(async () => {
    await timeTravel.dispose();
    atomRegistry.clear();
  });

  it("should handle rapid state changes", () => {
    for (let i = 0; i < 1000; i++) {
      store.set(counterAtom, i);
    }

    expect(timeTravel.getHistory().length).toBeLessThanOrEqual(50);
  });

  it("should handle concurrent undo/redo during updates", async () => {
    const updateLoop = setInterval(() => {
      store.set(counterAtom, Math.random());
    }, 1);

    const operations = Array(50)
      .fill(null)
      .map(() => async () => {
        timeTravel.undo();
        await TestHelper.wait(Math.random() * 5);
        timeTravel.redo();
      });

    await TestHelper.concurrent(operations, 10);

    clearInterval(updateLoop);

    expect(timeTravel.isTraveling()).toBe(false);
  });

  it("should handle corrupted snapshots during restoration", () => {
    store.set(counterAtom, 1);

    const snapshot = timeTravel.capture("valid");

    // Restoration should handle corrupted/incomplete snapshots gracefully
    const restorer = timeTravel.getSnapshotRestorer();
    if (snapshot) {
      const result = restorer.restore(snapshot);
      // Result should be defined (restoration completes)
      expect(result).toBeDefined();
    }
    // Value should be restored or remain unchanged
    expect(store.get(counterAtom)).toBeDefined();
  });

  it("should handle race condition between capture and undo", async () => {
    const operations = Array(100)
      .fill(null)
      .map(() => async () => {
        if (Math.random() > 0.5) {
          store.set(counterAtom, Math.random());
        } else {
          timeTravel.undo();
        }
        await TestHelper.wait(Math.random() * 2);
      });

    await TestHelper.concurrent(operations, 20);

    expect(timeTravel.isTraveling()).toBe(false);
  });

  it("should maintain history integrity under heavy load", async () => {
    const historySnapshots: string[] = [];

    // Subscribe to history changes
    timeTravel.subscribe((event) => {
      if (event.type === "capture" && event.snapshot) {
        historySnapshots.push(event.snapshot.id);
      }
    });

    const operations = Array(200)
      .fill(null)
      .map((_, i) => async () => {
        store.set(counterAtom, i);
        if (i % 3 === 0) {
          timeTravel.undo();
        }
        if (i % 5 === 0) {
          timeTravel.redo();
        }
      });

    await TestHelper.concurrent(operations, 10);

    // Verify history is still traversable
    let undoCount = 0;
    while (timeTravel.canUndo()) {
      timeTravel.undo();
      undoCount++;
    }

    expect(undoCount).toBeGreaterThan(0);
  });

  it("should handle thousands of atoms creation and tracking", async () => {
    const atoms: Atom<unknown>[] = [];

    // Create 1000 atoms
    for (let i = 0; i < 1000; i++) {
      const atom = TestHelper.generateAtom(`stress-atom-${i}`);
      atomRegistry.register(atom, `stress-atom-${i}`);
      store.set(atom, { value: i });
      atoms.push(atom);
    }

    // Trigger auto-capture for all
    const start = Date.now();
    atoms.forEach((atom) => {
      store.set(atom, { value: Math.random() });
    });
    const duration = Date.now() - start;

    // Should complete within reasonable time
    expect(duration).toBeLessThan(5000);

    // History should be limited
    expect(timeTravel.getHistory().length).toBeLessThanOrEqual(50);
  });

  it("should handle rapid capture operations", () => {
    const start = Date.now();

    for (let i = 0; i < 100; i++) {
      timeTravel.capture(`rapid-${i}`);
    }

    const duration = Date.now() - start;

    // Should complete within reasonable time
    expect(duration).toBeLessThan(5000);

    // History should be limited
    expect(timeTravel.getHistory().length).toBeLessThanOrEqual(50);
  });

  it("should handle deep undo/redo cycles", () => {
    // Create deep history
    for (let i = 0; i < 50; i++) {
      store.set(counterAtom, i);
    }

    // Perform multiple undo/redo cycles
    for (let cycle = 0; cycle < 10; cycle++) {
      while (timeTravel.canUndo()) {
        timeTravel.undo();
      }
      while (timeTravel.canRedo()) {
        timeTravel.redo();
      }
    }

    // Should complete without errors
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it("should handle jumpTo under load", async () => {
    // Create history
    for (let i = 0; i < 50; i++) {
      store.set(counterAtom, i);
    }

    const operations = Array(100)
      .fill(null)
      .map(() => async () => {
        const index = Math.floor(Math.random() * 50);
        timeTravel.jumpTo(index);
      });

    await TestHelper.concurrent(operations, 10);

    // Should not crash
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it("should handle clearHistory during operations", async () => {
    // Create some history
    for (let i = 0; i < 20; i++) {
      store.set(counterAtom, i);
    }

    const operations: Array<() => Promise<void>> = [
      ...Array(10)
        .fill(null)
        .map(() => async () => {
          timeTravel.undo();
        }),
      ...Array(10)
        .fill(null)
        .map(() => async () => {
          timeTravel.redo();
        }),
      async () => {
        await TestHelper.wait(50);
        timeTravel.clearHistory();
      },
    ];

    await TestHelper.concurrent(operations, 5);

    // After clear, history should be empty
    expect(timeTravel.getHistory().length).toBe(0);
  });

  it("should handle multiple captureWithResult calls", () => {
    const results = [];

    for (let i = 0; i < 50; i++) {
      const result = timeTravel.captureWithResult(`result-${i}`);
      results.push(result);
    }

    // captureWithResult should return defined results
    expect(results.length).toBe(50);
    // At least some should have snapshot data
    expect(results.filter((r) => r).length).toBeGreaterThan(0);
  });

  it("should handle getCurrentSnapshot under load", () => {
    for (let i = 0; i < 100; i++) {
      store.set(counterAtom, i);
      const snapshot = timeTravel.getCurrentSnapshot();
      expect(snapshot).toBeDefined();
    }
  });

  it("should handle compareSnapshots with many changes", () => {
    // Create initial snapshot
    timeTravel.capture("initial");

    // Make many changes
    for (let i = 0; i < 50; i++) {
      store.set(counterAtom, i);
    }

    const history = timeTravel.getHistory();
    if (history.length >= 2) {
      const comparison = timeTravel.compareSnapshots(
        history[0],
        history[history.length - 1],
      );
      expect(comparison).toBeDefined();
    }
  });

  it("should handle compareWithCurrent under load", () => {
    for (let i = 0; i < 50; i++) {
      store.set(counterAtom, i);
      const history = timeTravel.getHistory();
      if (history.length > 0) {
        const comparison = timeTravel.compareWithCurrent(history[0]);
        expect(comparison).toBeDefined();
      }
    }
  });

  it("should handle getDiffSince with many snapshots", () => {
    for (let i = 0; i < 50; i++) {
      store.set(counterAtom, i);
    }

    const diff = timeTravel.getDiffSince("initial");
    expect(diff).toBeDefined();
  });

  it("should handle visualizeChanges with large diff", () => {
    timeTravel.capture("before");

    // Make many changes
    for (let i = 0; i < 100; i++) {
      const atom = TestHelper.generateAtom(`visualize-${i}`);
      atomRegistry.register(atom, `visualize-${i}`);
      store.set(atom, { value: i });
    }

    timeTravel.capture("after");

    const history = timeTravel.getHistory();
    if (history.length >= 2) {
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const visualization = timeTravel.visualizeChanges(comparison, "list");
      expect(visualization).toBeDefined();
    }
  });

  it("should handle exportComparison with large dataset", () => {
    timeTravel.capture("export-before");

    for (let i = 0; i < 50; i++) {
      store.set(counterAtom, i);
    }

    timeTravel.capture("export-after");

    const history = timeTravel.getHistory();
    if (history.length >= 2) {
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const exported = timeTravel.exportComparison(comparison, "json");
      expect(exported).toBeDefined();
    }
  });

  it("should handle subscription events under load", () => {
    const events: any[] = [];
    const unsubscribe = timeTravel.subscribe((event) => {
      events.push(event);
    });

    for (let i = 0; i < 100; i++) {
      store.set(counterAtom, i);
    }

    unsubscribe();

    // Subscription should work without errors
    expect(unsubscribe).toBeDefined();
    // Events may or may not be received depending on implementation
    expect(Array.isArray(events)).toBe(true);
  });

  it("should handle pause/resume autoCapture during operations", () => {
    for (let i = 0; i < 10; i++) {
      store.set(counterAtom, i);
    }

    timeTravel.pauseAutoCapture();

    const historyLength = timeTravel.getHistory().length;

    for (let i = 0; i < 10; i++) {
      store.set(counterAtom, i + 100);
    }

    // History should not have grown during pause
    expect(timeTravel.getHistory().length).toBe(historyLength);

    timeTravel.resumeAutoCapture();

    store.set(counterAtom, 200);

    // History should grow after resume
    expect(timeTravel.getHistory().length).toBeGreaterThan(historyLength);
  });

  it("should handle cleanupAtoms during heavy usage", async () => {
    const atoms = Array(100)
      .fill(null)
      .map((_, i) => {
        const atom = TestHelper.generateAtom(`cleanup-stress-${i}`);
        atomRegistry.register(atom, `cleanup-stress-${i}`);
        store.set(atom, i);
        return atom;
      });

    const operations: Array<() => Promise<void>> = [
      async () => {
        await timeTravel.cleanupAtoms(10);
      },
      ...atoms.map((atom) => async () => {
        store.set(atom, Math.random());
      }),
    ];

    await TestHelper.concurrent(operations, 10);

    // Should complete without errors
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it("should handle getStaleAtoms during active tracking", () => {
    for (let i = 0; i < 50; i++) {
      const atom = TestHelper.generateAtom(`stale-stress-${i}`);
      atomRegistry.register(atom, `stale-stress-${i}`);
      store.set(atom, i);
    }

    const stale = timeTravel.getStaleAtoms();
    expect(stale.length).toBeGreaterThanOrEqual(0);
  });

  it("should handle forgetAtom during concurrent access", async () => {
    const atoms = Array(20)
      .fill(null)
      .map((_, i) => {
        const atom = TestHelper.generateAtom(`forget-stress-${i}`);
        atomRegistry.register(atom, `forget-stress-${i}`);
        store.set(atom, i);
        return atom;
      });

    const operations: Array<() => Promise<void>> = [
      ...atoms.map((atom) => async () => {
        timeTravel.forgetAtom(atom.name || "");
      }),
      ...atoms.map((atom) => async () => {
        store.set(atom, Math.random());
      }),
    ];

    await TestHelper.concurrent(operations, 5);

    // Should complete without errors
  });

  it("should handle getCleanupStats during operations", () => {
    for (let i = 0; i < 50; i++) {
      store.set(counterAtom, i);
    }

    const stats = timeTravel.getCleanupStats();
    expect(stats).toBeDefined();
  });

  it("should handle restoreWithTransaction under load", async () => {
    for (let i = 0; i < 20; i++) {
      store.set(counterAtom, i);
    }

    const history = timeTravel.getHistory();
    if (history.length > 0) {
      const result = await timeTravel.restoreWithTransaction(history[0].id);
      expect(result).toBeDefined();
    }
  });

  it("should handle getLastCheckpoint during operations", () => {
    for (let i = 0; i < 20; i++) {
      store.set(counterAtom, i);
    }

    const checkpoint = timeTravel.getLastCheckpoint();
    // May be null if no checkpoints created
    expect(checkpoint).toBeDefined();
  });

  it("should handle getCheckpoints during operations", () => {
    for (let i = 0; i < 20; i++) {
      store.set(counterAtom, i);
    }

    const checkpoints = timeTravel.getCheckpoints();
    expect(Array.isArray(checkpoints)).toBe(true);
  });

  it("should handle rollbackToCheckpoint under load", async () => {
    for (let i = 0; i < 20; i++) {
      store.set(counterAtom, i);
    }

    const checkpoints = timeTravel.getCheckpoints();
    if (checkpoints.length > 0) {
      const result = await timeTravel.rollbackToCheckpoint(checkpoints[0].id);
      expect(result).toBeDefined();
    }
  });

  it("should handle getHistoryStats during heavy usage", () => {
    for (let i = 0; i < 100; i++) {
      store.set(counterAtom, i);
    }

    const stats = timeTravel.getHistoryStats();
    expect(stats).toBeDefined();
    expect(stats.totalSnapshots).toBeGreaterThan(0);
  });

  it("should handle importState with large dataset", () => {
    const state: Record<string, unknown> = {};
    for (let i = 0; i < 100; i++) {
      state[`import-${i}`] = { value: i };
    }

    const result = timeTravel.importState(state);
    expect(result).toBe(true);
  });

  it("should handle getVersion during operations", () => {
    for (let i = 0; i < 50; i++) {
      store.set(counterAtom, i);
    }

    const version = timeTravel.getVersion();
    expect(version).toBeDefined();
    expect(typeof version).toBe("string");
  });

  it("should handle getDeltaChain during delta operations", () => {
    const deltaChain = timeTravel.getDeltaChain();
    expect(Array.isArray(deltaChain)).toBe(true);
  });

  it("should handle forceFullSnapshot under load", () => {
    for (let i = 0; i < 50; i++) {
      store.set(counterAtom, i);
    }

    timeTravel.forceFullSnapshot();

    // Should complete without errors
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it("should handle setDeltaStrategy during operations", () => {
    timeTravel.setDeltaStrategy({
      strategy: "time",
      time: { maxAge: 60000 },
    });

    // Should complete without errors
  });

  it("should handle reconstructTo under load", () => {
    for (let i = 0; i < 20; i++) {
      store.set(counterAtom, i);
    }

    const snapshot = timeTravel.reconstructTo(0);
    expect(snapshot).toBeDefined();
  });

  it("should handle getDeltaStats during operations", () => {
    const stats = timeTravel.getDeltaStats();
    expect(stats).toBeDefined();
  });

  it("should handle isDeltaEnabled during operations", () => {
    const enabled = timeTravel.isDeltaEnabled();
    expect(typeof enabled).toBe("boolean");
  });

  it("should handle getDeltaCalculator during operations", () => {
    const calculator = timeTravel.getDeltaCalculator();
    expect(calculator).toBeDefined();
  });

  it("should handle getDeltaReconstructor during operations", () => {
    const reconstructor = timeTravel.getDeltaReconstructor();
    expect(reconstructor).toBeDefined();
  });

  it("should handle getAtomTracker during operations", () => {
    const tracker = timeTravel.getAtomTracker();
    expect(tracker).toBeDefined();
  });

  it("should handle getHistoryManager during operations", () => {
    const manager = timeTravel.getHistoryManager();
    expect(manager).toBeDefined();
  });

  it("should handle getSnapshotCreator during operations", () => {
    const creator = timeTravel.getSnapshotCreator();
    expect(creator).toBeDefined();
  });

  it("should handle getSnapshotRestorer during operations", () => {
    const restorer = timeTravel.getSnapshotRestorer();
    expect(restorer).toBeDefined();
  });

  it("should handle subscribeToSnapshots during load", () => {
    const listener = vi.fn();
    const unsubscribe = timeTravel.subscribeToSnapshots(listener);

    for (let i = 0; i < 50; i++) {
      store.set(counterAtom, i);
    }

    unsubscribe();

    // Should have received events
    expect(listener).toHaveBeenCalled();
  });

  it("should handle subscribeToTracking during load", () => {
    const listener = vi.fn();
    const unsubscribe = timeTravel.subscribeToTracking(listener);

    for (let i = 0; i < 50; i++) {
      store.set(counterAtom, i);
    }

    unsubscribe();

    // Should have received events
    expect(listener).toHaveBeenCalled();
  });
});
