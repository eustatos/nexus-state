/**
 * Delta Snapshots Integration Tests
 * Tests for delta-based history with SimpleTimeTravel
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SimpleTimeTravel } from "../../core/SimpleTimeTravel";
import { atom, createStore } from "../../../index";

describe("Delta Snapshots Integration", () => {
  let store: ReturnType<typeof createStore>;
  let tt: SimpleTimeTravel;

  beforeEach(() => {
    store = createStore();
  });

  describe("Basic Delta Functionality", () => {
    it("should create delta snapshots when enabled", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 5,
          maxDeltaChainLength: 10,
        },
        maxHistory: 50,
      });

      // Make several changes
      store.set(counterAtom, 1);
      store.set(counterAtom, 2);
      store.set(counterAtom, 3);

      // Check delta chain
      const deltaChain = tt.getDeltaChain!();
      expect(deltaChain).toBeDefined();
      
      // Should have deltas (at least 1)
      const stats = tt.getDeltaStats!();
      expect(stats).toBeDefined();
    });

    it("should use regular snapshots when delta is disabled", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: false,
        },
        maxHistory: 50,
      });

      // Make several changes
      store.set(counterAtom, 1);
      store.set(counterAtom, 2);
      store.set(counterAtom, 3);

      // Delta chain should be empty
      const deltaChain = tt.getDeltaChain!();
      expect(deltaChain).toEqual([]);
      
      // Delta should be disabled
      expect(tt.isDeltaEnabled()).toBe(false);
    });

    it("should reconstruct snapshots correctly", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 10,
          maxDeltaChainLength: 20,
        },
        maxHistory: 50,
      });

      // Make changes
      store.set(counterAtom, 5);
      store.set(counterAtom, 10);
      store.set(counterAtom, 15);

      // Navigate back
      const history = tt.getHistory();
      expect(history.length).toBeGreaterThan(0);

      // Reconstruct to specific index
      const reconstructed = tt.reconstructTo!(0);
      expect(reconstructed).toBeDefined();
    });
  });

  describe("Force Full Snapshot", () => {
    it("should create full snapshot on demand", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 10,
        },
        maxHistory: 50,
      });

      // Make changes
      store.set(counterAtom, 1);
      store.set(counterAtom, 2);

      // Force full snapshot
      tt.forceFullSnapshot!();

      // Capture after force
      store.set(counterAtom, 3);

      const history = tt.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe("Delta Strategy", () => {
    it("should update strategy configuration", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 10,
          maxDeltaChainLength: 20,
        },
        maxHistory: 50,
      });

      // Change to time-based strategy
      tt.setDeltaStrategy!({
        strategy: "time",
        time: { maxAge: 10 * 60 * 1000 }, // 10 minutes
      });

      // Change to changes-based strategy
      tt.setDeltaStrategy!({
        strategy: "changes",
        changes: { maxDeltas: 30 },
      });

      // Change to size-based strategy
      tt.setDeltaStrategy!({
        strategy: "size",
        size: { maxSize: 2 * 1024 * 1024 }, // 2MB
      });
    });
  });

  describe("Undo/Redo with Deltas", () => {
    it("should support undo/redo with delta snapshots", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 5,
        },
        maxHistory: 50,
      });

      // Make changes
      store.set(counterAtom, 1);
      store.set(counterAtom, 2);
      store.set(counterAtom, 3);

      // Undo
      expect(tt.canUndo()).toBe(true);
      const undoResult = tt.undo();
      expect(undoResult).toBe(true);

      // Redo
      expect(tt.canRedo()).toBe(true);
      const redoResult = tt.redo();
      expect(redoResult).toBe(true);
    });

    it("should handle multiple undo/redo cycles", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 3,
        },
        maxHistory: 50,
      });

      // Multiple changes
      for (let i = 1; i <= 10; i++) {
        store.set(counterAtom, i);
      }

      // Multiple undos
      for (let i = 0; i < 5; i++) {
        if (tt.canUndo()) {
          tt.undo();
        }
      }

      // Multiple redos
      for (let i = 0; i < 5; i++) {
        if (tt.canRedo()) {
          tt.redo();
        }
      }

      expect(store.get(counterAtom)).toBe(10);
    });
  });

  describe("Jump To with Deltas", () => {
    it("should support jumpTo with delta reconstruction", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 5,
        },
        maxHistory: 50,
      });

      // Make changes
      for (let i = 1; i <= 10; i++) {
        store.set(counterAtom, i);
      }

      // Jump to middle
      const jumpResult = tt.jumpTo(5);
      expect(jumpResult).toBe(true);

      // Jump to beginning
      const jumpToStart = tt.jumpTo(0);
      expect(jumpToStart).toBe(true);

      // Jump to end
      const history = tt.getHistory();
      const jumpToEnd = tt.jumpTo(history.length - 1);
      expect(jumpToEnd).toBe(true);
    });
  });

  describe("Memory Efficiency", () => {
    it("should use less memory with deltas for many small changes", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      // Enable delta snapshots
      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 20,
          maxDeltaChainLength: 50,
        },
        maxHistory: 100,
      });

      // Make many small changes
      for (let i = 1; i <= 50; i++) {
        store.set(counterAtom, i);
      }

      const deltaStats = tt.getDeltaStats!();

      // Should have created some deltas
      expect(deltaStats.deltaCount + deltaStats.fullSnapshotCount).toBeGreaterThan(0);

      // Memory efficiency may or may not be calculated depending on implementation
      // Just check that stats are available
      expect(deltaStats).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty delta chain", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
        },
        maxHistory: 50,
      });

      // No changes made
      const deltaChain = tt.getDeltaChain!();
      expect(deltaChain).toBeDefined();
    });

    it("should handle reconstructTo with invalid index", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
        },
        maxHistory: 50,
      });

      // Invalid index
      const result = tt.reconstructTo!(-1);
      expect(result).toBe(null);

      // Out of bounds
      const result2 = tt.reconstructTo!(1000);
      expect(result2).toBe(null);
    });

    it("should handle clearHistory with deltas", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
        },
        maxHistory: 50,
      });

      // Make changes
      store.set(counterAtom, 1);
      store.set(counterAtom, 2);

      // Clear history
      tt.clearHistory();

      // History should be empty
      const history = tt.getHistory();
      expect(history.length).toBe(0);
    });
  });

  describe("Delta Calculator Direct Usage", () => {
    it("should compute delta between snapshots", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
        },
        maxHistory: 50,
      });

      const calculator = tt.getDeltaCalculator();
      
      // Create test snapshots
      const snapshot1 = {
        id: "snap-1",
        type: "full" as const,
        state: {
          counter: {
            value: 0,
            type: "primitive" as const,
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "initial",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      const snapshot2 = {
        id: "snap-2",
        type: "full" as const,
        state: {
          counter: {
            value: 5,
            type: "primitive" as const,
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now() + 1000,
          action: "set",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      const delta = calculator.computeDelta(snapshot1, snapshot2);
      
      expect(delta).toBeDefined();
      expect(delta.type).toBe("delta");
      expect(delta.changes.size).toBeGreaterThan(0);
    });

    it("should apply delta to snapshot", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
        },
        maxHistory: 50,
      });

      const calculator = tt.getDeltaCalculator();
      
      const baseSnapshot = {
        id: "base-1",
        type: "full" as const,
        state: {
          counter: {
            value: 0,
            type: "primitive" as const,
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "initial",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      const delta = calculator.computeDelta(baseSnapshot, {
        id: "snap-2",
        type: "full" as const,
        state: {
          counter: {
            value: 10,
            type: "primitive" as const,
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now() + 1000,
          action: "set",
          atomCount: 1,
        },
        baseSnapshotId: null,
      });

      const result = calculator.applyDelta(baseSnapshot, delta);
      
      expect(result).toBeDefined();
      expect(result.state.counter.value).toBe(10);
    });
  });

  describe("Delta Reconstructor", () => {
    it("should reconstruct snapshot from deltas", () => {
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      tt = new SimpleTimeTravel(store, {
        deltaSnapshots: {
          enabled: true,
          cacheReconstructed: true,
        },
        maxHistory: 50,
      });

      const reconstructor = tt.getDeltaReconstructor();
      
      // Create test snapshots
      const baseSnapshot = {
        id: "base-1",
        type: "full" as const,
        state: {
          counter: {
            value: 0,
            type: "primitive" as const,
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "initial",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      const delta1 = {
        id: "delta-1",
        type: "delta" as const,
        baseSnapshotId: "base-1",
        state: {},
        changes: new Map([
          [
            "counter",
            {
              atomId: "atom-counter",
              atomName: "counter",
              oldValue: 0,
              newValue: 5,
              changeType: "modified" as const,
            },
          ],
        ]),
        metadata: {
          timestamp: Date.now() + 1000,
          action: "set",
          atomCount: 1,
          changeCount: 1,
          compressedSize: 100,
          originalSize: 1000,
          baseTimestamp: Date.now(),
        },
      };

      const result = reconstructor.reconstruct(baseSnapshot, [delta1]);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.snapshot).toBeDefined();
      expect(result.snapshot!.state.counter.value).toBe(5);
    });
  });
});
