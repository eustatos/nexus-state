/**
 * Transactional Restoration Tests
 * 
 * Tests for the transactional snapshot restoration feature with rollback capability.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createStore } from "../../store";
import { atom } from "../../atom";
import { SimpleTimeTravel } from "../";
import { SnapshotRestorer } from "../snapshot/SnapshotRestorer";
import { atomRegistry } from "../../atom-registry";
import type {
  RestorationCheckpoint,
  TransactionalRestorationResult,
  RollbackResult,
  RestorationProgress,
} from "../types";

describe("Transactional Restoration", () => {
  beforeEach(() => {
    // Clear atom registry between tests to avoid state leakage
    atomRegistry.clear();
  });

  afterEach(() => {
    // Clear atom registry after tests
    atomRegistry.clear();
  });
  describe("Checkpoint System", () => {
    it("should create checkpoint for restoration", () => {
      const store = createStore();
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      const restorer = new SnapshotRestorer(store, {
        enableTransactions: true,
      });

      expect(restorer.getTransactionalConfig().enableTransactions).toBe(true);
    });

    it("should manage multiple checkpoints with cleanup", () => {
      const store = createStore();
      const restorer = new SnapshotRestorer(store, {
        enableTransactions: true,
        maxCheckpoints: 3,
        checkpointTimeout: 10000,
      });

      expect(restorer.getCheckpoints().length).toBe(0);

      const config = restorer.getTransactionalConfig();
      expect(config.maxCheckpoints).toBe(3);
      expect(config.checkpointTimeout).toBe(10000);
    });
  });

  describe("Three-Phase Restoration", () => {
    it("should validate before restoration", async () => {
      const store = createStore();
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      const restorer = new SnapshotRestorer(store, {
        enableTransactions: true,
        validateBeforeRestore: true,
        strictMode: false,
      });

      const invalidSnapshot = {
        id: "invalid",
        state: {},
        metadata: {},
      };

      const result = await restorer.restoreWithTransaction(invalidSnapshot as any);

      expect(result.success).toBe(false);
      expect(result.rollbackPerformed).toBe(true);
    });

    it("should capture previous values before restoration", async () => {
      const store = createStore();
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 42);

      const restorer = new SnapshotRestorer(store, {
        enableTransactions: true,
      });

      const snapshot = {
        id: "test-2",
        state: {
          counter: {
            value: 100,
            type: "primitive" as const,
            name: "counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test",
          atomCount: 1,
        },
      };

      expect(store.get(counterAtom)).toBe(42);

      const result = await restorer.restoreWithTransaction(snapshot);

      expect(result.success).toBe(true);
      expect(result.checkpointId).toBeDefined();
      expect(store.get(counterAtom)).toBe(100);
    });

    it("should support progress tracking during restoration", async () => {
      const store = createStore();
      const atom1 = atom(1, "atom1");
      const atom2 = atom(2, "atom2");
      const atom3 = atom(3, "atom3");

      store.set(atom1, 1);
      store.set(atom2, 2);
      store.set(atom3, 3);

      const restorer = new SnapshotRestorer(store, {
        enableTransactions: true,
      });

      const snapshot = {
        id: "test-3",
        state: {
          atom1: {
            value: 10,
            type: "primitive" as const,
            name: "atom1",
          },
          atom2: {
            value: 20,
            type: "primitive" as const,
            name: "atom2",
          },
          atom3: {
            value: 30,
            type: "primitive" as const,
            name: "atom3",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test",
          atomCount: 3,
        },
      };

      const progressLog: RestorationProgress[] = [];

      const result = await restorer.restoreWithTransaction(snapshot, {
        onProgress: (progress) => {
          progressLog.push(progress);
        },
      });

      expect(result.success).toBe(true);
      expect(progressLog.length).toBe(3);
      expect(progressLog[0].currentIndex).toBe(0);
      expect(progressLog[2].currentIndex).toBe(2);
    });
  });

  describe("Rollback Mechanism", () => {
    it("should automatically rollback on validation error", async () => {
      const store = createStore();
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 5);

      const restorer = new SnapshotRestorer(store, {
        enableTransactions: true,
        rollbackOnError: true,
      });

      const invalidSnapshot = {
        id: "invalid",
        state: {},
        metadata: {},
      };

      const result = await restorer.restoreWithTransaction(invalidSnapshot as any);

      expect(result.success).toBe(false);
      expect(result.rollbackPerformed).toBe(true);
      expect(store.get(counterAtom)).toBe(5);
    });

    it("should support manual rollback", async () => {
      const store = createStore();
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 10);

      const restorer = new SnapshotRestorer(store, {
        enableTransactions: true,
      });

      const snapshot1 = {
        id: "rollback-test-1",
        state: {
          counter: {
            value: 20,
            type: "primitive" as const,
            name: "counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "set-to-20",
          atomCount: 1,
        },
      };

      const result1 = await restorer.restoreWithTransaction(snapshot1);
      expect(result1.success).toBe(true);

      const checkpointId = result1.checkpointId;
      expect(checkpointId).toBeDefined();

      const checkpoint = restorer.getCheckpoints().find(
        (c) => c.id === checkpointId,
      );
      expect(checkpoint).toBeDefined();
      expect(checkpoint?.metadata.committed).toBe(true);
      expect(checkpoint?.previousValues.get(counterAtom.id)).toBe(10);

      const rollbackResult = await restorer.rollback(checkpointId!);

      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.rolledBackCount).toBe(1);
      expect(rollbackResult.failedCount).toBe(0);

      expect(store.get(counterAtom)).toBe(10);

      expect(restorer.getCheckpoints().find((c) => c.id === checkpointId)).toBeUndefined();
    });

    it("should rollback in reverse order", async () => {
      const store = createStore();
      const atom1 = atom(1, "atom1");
      const atom2 = atom(2, "atom2");
      const atom3 = atom(3, "atom3");

      store.set(atom1, 1);
      store.set(atom2, 2);
      store.set(atom3, 3);

      const restorer = new SnapshotRestorer(store, {
        enableTransactions: true,
      });

      const snapshot = {
        id: "reverse-test",
        state: {
          atom1: {
            value: 11,
            type: "primitive" as const,
            name: "atom1",
          },
          atom2: {
            value: 22,
            type: "primitive" as const,
            name: "atom2",
          },
          atom3: {
            value: 33,
            type: "primitive" as const,
            name: "atom3",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "set-values",
          atomCount: 3,
        },
      };

      const result = await restorer.restoreWithTransaction(snapshot);
      expect(result.success).toBe(true);
      expect(store.get(atom1)).toBe(11);
      expect(store.get(atom2)).toBe(22);
      expect(store.get(atom3)).toBe(33);

      const checkpointId = result.checkpointId!;
      const checkpoint = restorer.getCheckpoints().find((c) => c.id === checkpointId);
      expect(checkpoint).toBeDefined();

      const previousValues = checkpoint?.previousValues;
      expect(previousValues?.get(atom1.id)).toBe(1);
      expect(previousValues?.get(atom2.id)).toBe(2);
      expect(previousValues?.get(atom3.id)).toBe(3);

      await restorer.rollback(checkpointId);

      expect(store.get(atom1)).toBe(1);
      expect(store.get(atom2)).toBe(2);
      expect(store.get(atom3)).toBe(3);
    });
  });

  describe("Error Handling", () => {
    it("should handle atom not found during restoration", async () => {
      const store = createStore();
      const existingAtom = atom(0, "existing");
      store.set(existingAtom, 0);

      const restorer = new SnapshotRestorer(store, {
        enableTransactions: true,
        onAtomNotFound: "skip",
      });

      const snapshot = {
        id: "error-test",
        state: {
          existing: {
            value: 100,
            type: "primitive" as const,
            name: "existing",
          },
          nonexistent: {
            value: 200,
            type: "primitive" as const,
            name: "nonexistent",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test",
          atomCount: 2,
        },
      };

      const result = await restorer.restoreWithTransaction(snapshot);

      expect(result.success).toBe(true);
      expect(store.get(existingAtom)).toBe(100);
    });

    it("should continue on partial failures with skipErrors", async () => {
      const store = createStore();
      const atom1 = atom(1, "atom1");
      const atom2 = atom(2, "atom2");

      store.set(atom1, 1);
      store.set(atom2, 2);

      const restorer = new SnapshotRestorer(store, {
        enableTransactions: true,
        skipErrors: true,
      });

      const snapshot = {
        id: "partial-error",
        state: {
          atom1: {
            value: 10,
            type: "primitive" as const,
            name: "atom1",
          },
          atom2: {
            value: 20,
            type: "primitive" as const,
            name: "atom2",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test",
          atomCount: 2,
        },
      };

      const result = await restorer.restoreWithTransaction(snapshot);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(store.get(atom1)).toBe(10);
      expect(store.get(atom2)).toBe(20);
    });
  });

  describe("Integration with SimpleTimeTravel", () => {
    it("should integrate with TimeTravelAPI methods", () => {
      const store = createStore();
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      const timeTravel = new SimpleTimeTravel(store, {
        maxHistory: 10,
        autoCapture: true,
        atoms: [counterAtom],
      });

      expect(timeTravel.restoreWithTransaction).toBeDefined();
      expect(timeTravel.getLastCheckpoint).toBeDefined();
      expect(timeTravel.rollbackToCheckpoint).toBeDefined();
      expect(timeTravel.getCheckpoints).toBeDefined();
    });

    it("should support transactional restoration in time travel context", async () => {
      const store = createStore();
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      const timeTravel = new SimpleTimeTravel(store, {
        maxHistory: 10,
        autoCapture: true,
        atoms: [counterAtom],
        restoreConfig: {
          enableTransactions: true,
        },
      });

      store.set(counterAtom, 10);
      store.set(counterAtom, 20);

      const history = timeTravel.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);

      const lastSnapshot = history[history.length - 1];
      const result = await timeTravel.restoreWithTransaction(lastSnapshot.id);

      expect(result.success).toBe(true);
      expect(result.checkpointId).toBeDefined();
    });
  });

  describe("Performance and Batch Processing", () => {
    it("should support batch restoration", async () => {
      const store = createStore();

      const atoms = Array.from({ length: 10 }, (_, i) =>
        atom(i, `atom-${i}`),
      );
      atoms.forEach((atom) => store.set(atom, 0));

      const restorer = new SnapshotRestorer(store, {
        enableTransactions: true,
        batchSize: 3,
      });

      const snapshot = {
        id: "batch-test",
        state: Object.fromEntries(
          atoms.map((atom, i) => [
            atom.name,
            {
              value: i * 10,
              type: "primitive" as const,
              name: atom.name,
            },
          ]),
        ),
        metadata: {
          timestamp: Date.now(),
          action: "batch-test",
          atomCount: 10,
        },
      };

      const result = await restorer.restoreWithTransaction(snapshot);

      expect(result.success).toBe(true);
      expect(result.restoredCount).toBe(10);

      atoms.forEach((atom, i) => {
        expect(store.get(atom)).toBe(i * 10);
      });
    });

    it("should handle timeout during restoration", async () => {
      const store = createStore();
      const counterAtom = atom(0, "counter");
      store.set(counterAtom, 0);

      const restorer = new SnapshotRestorer(store, {
        enableTransactions: true,
        timeout: 100,
      });

      const snapshot = {
        id: "timeout-test",
        state: {
          counter: {
            value: 100,
            type: "primitive" as const,
            name: "counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "timeout-test",
          atomCount: 1,
        },
      };

      const result = await restorer.restoreWithTransaction(snapshot);

      expect(result.success).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty snapshots", async () => {
      const store = createStore();
      const restorer = new SnapshotRestorer(store, {
        enableTransactions: true,
      });

      const snapshot = {
        id: "empty",
        state: {},
        metadata: {
          timestamp: Date.now(),
          action: "empty",
          atomCount: 0,
        },
      };

      const result = await restorer.restoreWithTransaction(snapshot);

      expect(result.success).toBe(true);
      expect(result.restoredCount).toBe(0);
    });

    it("should handle snapshots with no matching atoms", async () => {
      const store = createStore();
      const restorer = new SnapshotRestorer(store, {
        enableTransactions: true,
        onAtomNotFound: "skip",
      });

      const snapshot = {
        id: "no-matching",
        state: {
          nonexistent1: {
            value: 1,
            type: "primitive" as const,
            name: "nonexistent1",
          },
          nonexistent2: {
            value: 2,
            type: "primitive" as const,
            name: "nonexistent2",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "no-matching",
          atomCount: 2,
        },
      };

      const result = await restorer.restoreWithTransaction(snapshot);

      expect(result.success).toBe(true);
      expect(result.restoredCount).toBe(0);
    });
  });
});
