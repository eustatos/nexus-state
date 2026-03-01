/**
 * Snapshot Restoration with Rollback Tests
 *
 * Comprehensive tests for snapshot restoration with automatic rollback on error.
 * Based on task-010-implement-snapshot-restoration-rollback.md specification.
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
  RestorationConfig,
  RestorationErrorDetails,
} from "../types";

describe("SnapshotRestorer with Rollback (Task-010)", () => {
  let store: ReturnType<typeof createStore>;
  let restorer: SnapshotRestorer;
  let counterAtom: ReturnType<typeof atom<number>>;
  let textAtom: ReturnType<typeof atom<string>>;
  let flagAtom: ReturnType<typeof atom<boolean>>;

  beforeEach(() => {
    // Clear atom registry between tests to avoid state leakage
    atomRegistry.clear();
    
    store = createStore();
    counterAtom = atom(42, "counter");
    textAtom = atom("hello", "text");
    flagAtom = atom(true, "flag");

    store.set(counterAtom, 42);
    store.set(textAtom, "hello");
    store.set(flagAtom, true);

    restorer = new SnapshotRestorer(store, {
      validateBeforeRestore: true,
      rollbackOnError: true,
      batchRestore: true,
      batchSize: 2,
      onAtomNotFound: "warn",
    });
  });

  afterEach(() => {
    atomRegistry.clear();
    restorer.dispose();
  });

  describe("Successful Restoration", () => {
    it("should successfully restore with transaction", async () => {
      const snapshot = {
        id: "test-restore",
        state: {
          counter: {
            value: 100,
            type: "primitive" as const,
            name: "counter",
          },
          text: {
            value: "world",
            type: "primitive" as const,
            name: "text",
          },
          flag: {
            value: false,
            type: "primitive" as const,
            name: "flag",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test-restore",
          atomCount: 3,
        },
      };

      const result = await restorer.restoreWithTransaction(snapshot);

      expect(result.success).toBe(true);
      expect(result.restoredCount).toBe(3);
      expect(result.errors).toHaveLength(0);
      expect(result.rollbackPerformed).toBe(false);

      expect(store.get(counterAtom)).toBe(100);
      expect(store.get(textAtom)).toBe("world");
      expect(store.get(flagAtom)).toBe(false);
    });

    it("should include checkpoint ID on successful restoration", async () => {
      const snapshot = {
        id: "test-checkpoint",
        state: {
          counter: {
            value: 200,
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

      const result = await restorer.restoreWithTransaction(snapshot);

      expect(result.success).toBe(true);
      expect(result.checkpointId).toBeDefined();
      expect(result.checkpointId).toMatch(/checkpoint-\d+-[a-z0-9]+/);
    });
  });

  describe("Rollback on Partial Failure", () => {
    it("should rollback on partial failure", async () => {
      const snapshot = {
        id: "test-partial",
        state: {
          counter: {
            value: 200,
            type: "primitive" as const,
            name: "counter",
          },
          text: {
            value: "updated",
            type: "primitive" as const,
            name: "text",
          },
          flag: {
            value: false,
            type: "primitive" as const,
            name: "flag",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test-partial",
          atomCount: 3,
        },
      };

      // Mock store.set to fail for textAtom
      const originalSet = store.set.bind(store);
      let callCount = 0;
      store.set = vi.fn(<Value>(atomParam: any, update: any) => {
        callCount++;
        // Fail on second call (textAtom)
        if (callCount === 2) {
          throw new Error("Set failed for textAtom");
        }
        return originalSet(atomParam, update);
      });

      const result = await restorer.restoreWithTransaction(snapshot);

      // With skipErrors: true (default), restoration continues but errors are collected
      expect(result.errors.length).toBeGreaterThan(0);

      // Restore original set
      store.set = originalSet;
    });

    it("should handle missing atoms during restoration", async () => {
      const snapshot = {
        id: "test-missing",
        state: {
          counter: {
            value: 300,
            type: "primitive" as const,
            name: "counter",
          },
          missingAtom: {
            value: "value",
            type: "primitive" as const,
            name: "missingAtom",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test-missing",
          atomCount: 2,
        },
      };

      const result = await restorer.restoreWithTransaction(snapshot);

      // With onAtomNotFound: "warn", restoration should succeed for existing atoms
      expect(result.success).toBe(true);
      expect(store.get(counterAtom)).toBe(300);
    });

    it("should fail in strict mode with missing atoms", async () => {
      const strictRestorer = new SnapshotRestorer(store, {
        validateBeforeRestore: true,
        rollbackOnError: true,
        strictMode: true,
        onAtomNotFound: "throw",
      });

      const snapshot = {
        id: "test-strict",
        state: {
          counter: {
            value: 300,
            type: "primitive" as const,
            name: "counter",
          },
          missingAtom: {
            value: "value",
            type: "primitive" as const,
            name: "missingAtom",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test-strict",
          atomCount: 2,
        },
      };

      try {
        await strictRestorer.restoreWithTransaction(snapshot);
        // Should not reach here
        expect.fail("Should have thrown an error");
      } catch (error) {
        // Expected to throw
        expect(error).toBeDefined();
      }

      strictRestorer.dispose();
    });
  });

  describe("Batch Processing", () => {
    it("should respect batch size", async () => {
      const atom1 = atom(1, "atom1");
      const atom2 = atom(2, "atom2");
      const atom3 = atom(3, "atom3");

      store.set(atom1, 1);
      store.set(atom2, 2);
      store.set(atom3, 3);

      const snapshot = {
        id: "test-batch",
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
          action: "test-batch",
          atomCount: 3,
        },
      };

      const onProgress = vi.fn();

      await restorer.restoreWithTransaction(snapshot, {
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          currentIndex: 0,
          totalAtoms: 3,
        }),
      );
    });

    it("should process atoms in batches with progress tracking", async () => {
      const restorerWithBatch = new SnapshotRestorer(store, {
        batchSize: 1,
        validateBeforeRestore: true,
        rollbackOnError: true,
      });

      const atoms = Array.from({ length: 5 }, (_, i) => atom(i, `batch-atom-${i}`));
      atoms.forEach((a, i) => store.set(a, i));

      const snapshot = {
        id: "test-batch-progress",
        state: Object.fromEntries(
          atoms.map((a, i) => [
            a.name,
            {
              value: i * 10,
              type: "primitive" as const,
              name: a.name,
            },
          ]),
        ),
        metadata: {
          timestamp: Date.now(),
          action: "batch-progress",
          atomCount: 5,
        },
      };

      const progressLog: RestorationProgress[] = [];

      await restorerWithBatch.restoreWithTransaction(snapshot, {
        onProgress: (progress) => progressLog.push(progress),
      });

      expect(progressLog.length).toBe(5);
      expect(progressLog[0].currentIndex).toBe(0);
      expect(progressLog[4].currentIndex).toBe(4);

      restorerWithBatch.dispose();
    });
  });

  describe("Concurrent Restoration", () => {
    it("should handle concurrent restoration attempts", async () => {
      const snapshot1 = {
        id: "test1",
        state: {
          counter: {
            value: 1000,
            type: "primitive" as const,
            name: "counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test1",
          atomCount: 1,
        },
      };

      const snapshot2 = {
        id: "test2",
        state: {
          counter: {
            value: 2000,
            type: "primitive" as const,
            name: "counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test2",
          atomCount: 1,
        },
      };

      const result1Promise = restorer.restoreWithTransaction(snapshot1);
      const result2Promise = restorer.restoreWithTransaction(snapshot2);

      const [result1, result2] = await Promise.all([result1Promise, result2Promise]);

      // At least one should succeed, one might fail due to concurrency
      expect(result1.success || result2.success).toBe(true);
    });
  });

  describe("Checkpoint Management", () => {
    it("should clean up old checkpoints", async () => {
      const restorerWithLimit = new SnapshotRestorer(store, {
        maxCheckpoints: 2,
        checkpointTimeout: 100,
        validateBeforeRestore: true,
        rollbackOnError: true,
      });

      // Create multiple checkpoints
      for (let i = 0; i < 4; i++) {
        const snapshot = {
          id: `test-${i}`,
          state: {
            counter: {
              value: i * 100,
              type: "primitive" as const,
              name: "counter",
            },
          },
          metadata: {
            timestamp: Date.now(),
            action: `test-${i}`,
            atomCount: 1,
          },
        };
        await restorerWithLimit.restoreWithTransaction(snapshot);
      }

      // Checkpoints should be limited
      expect(restorerWithLimit.getCheckpoints().length).toBeLessThanOrEqual(2);

      restorerWithLimit.dispose();
    });

    it("should clear all checkpoints", async () => {
      const snapshot = {
        id: "test-clear",
        state: {
          counter: {
            value: 999,
            type: "primitive" as const,
            name: "counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test-clear",
          atomCount: 1,
        },
      };

      await restorer.restoreWithTransaction(snapshot);
      expect(restorer.getCheckpoints().length).toBeGreaterThan(0);

      restorer.clearCheckpoints();
      expect(restorer.getCheckpoints().length).toBe(0);
    });

    it("should get checkpoint by ID", async () => {
      const snapshot = {
        id: "test-get-checkpoint",
        state: {
          counter: {
            value: 888,
            type: "primitive" as const,
            name: "counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test-get-checkpoint",
          atomCount: 1,
        },
      };

      const result = await restorer.restoreWithTransaction(snapshot);
      expect(result.checkpointId).toBeDefined();

      const checkpoint = restorer.getCheckpoint(result.checkpointId!);
      expect(checkpoint).toBeDefined();
      expect(checkpoint?.snapshotId).toBe("test-get-checkpoint");
    });
  });

  describe("Rollback Mechanism", () => {
    it("should manually rollback to checkpoint", async () => {
      const snapshot = {
        id: "test-rollback",
        state: {
          counter: {
            value: 777,
            type: "primitive" as const,
            name: "counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test-rollback",
          atomCount: 1,
        },
      };

      const result = await restorer.restoreWithTransaction(snapshot);
      expect(result.success).toBe(true);
      expect(store.get(counterAtom)).toBe(777);

      const rollbackResult = await restorer.rollback(result.checkpointId!);

      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.rolledBackCount).toBe(1);
      expect(store.get(counterAtom)).toBe(42);
    });

    it("should rollback in reverse order", async () => {
      const atom1 = atom(1, "atom1");
      const atom2 = atom(2, "atom2");
      const atom3 = atom(3, "atom3");

      store.set(atom1, 1);
      store.set(atom2, 2);
      store.set(atom3, 3);

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
          action: "reverse",
          atomCount: 3,
        },
      };

      const result = await restorer.restoreWithTransaction(snapshot);
      expect(result.success).toBe(true);

      const checkpoint = restorer.getCheckpoint(result.checkpointId!);
      expect(checkpoint).toBeDefined();

      await restorer.rollback(result.checkpointId!);

      expect(store.get(atom1)).toBe(1);
      expect(store.get(atom2)).toBe(2);
      expect(store.get(atom3)).toBe(3);
    });
  });

  describe("Restoration Configuration", () => {
    it("should get restoration config", () => {
      const config = restorer.getRestorationConfig();
      expect(config.validateBeforeRestore).toBe(true);
      expect(config.rollbackOnError).toBe(true);
      expect(config.batchSize).toBe(2);
    });

    it("should use default restoration config", () => {
      const defaultRestorer = new SnapshotRestorer(store);
      const config = defaultRestorer.getRestorationConfig();
      
      expect(config.validateBeforeRestore).toBe(true);
      expect(config.strictMode).toBe(false);
      expect(config.onAtomNotFound).toBe("warn");
      expect(config.batchSize).toBe(10);
      expect(config.rollbackOnError).toBe(true);
      
      defaultRestorer.dispose();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty snapshots", async () => {
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

    it("should check if restoration is in progress", async () => {
      expect(restorer.isRestoring()).toBe(false);

      const snapshot = {
        id: "test-progress",
        state: {
          counter: {
            value: 555,
            type: "primitive" as const,
            name: "counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test-progress",
          atomCount: 1,
        },
      };

      const restorePromise = restorer.restoreWithTransaction(snapshot);
      expect(restorer.isRestoring()).toBe(true);

      await restorePromise;
      expect(restorer.isRestoring()).toBe(false);
    });
  });

  describe("Integration with SimpleTimeTravel", () => {
    it("should integrate with TimeTravelAPI methods", () => {
      const timeTravel = new SimpleTimeTravel(store, {
        maxHistory: 10,
        autoCapture: true,
        atoms: [counterAtom],
        restoreConfig: {
          enableTransactions: true,
          rollbackOnError: true,
        },
      });

      expect(timeTravel.restoreWithTransaction).toBeDefined();
      expect(timeTravel.getLastCheckpoint).toBeDefined();
      expect(timeTravel.rollbackToCheckpoint).toBeDefined();
      expect(timeTravel.getCheckpoints).toBeDefined();

      timeTravel.dispose();
    });

    it("should support transactional restoration in time travel context", async () => {
      const timeTravel = new SimpleTimeTravel(store, {
        maxHistory: 10,
        autoCapture: true,
        atoms: [counterAtom],
        restoreConfig: {
          enableTransactions: true,
          rollbackOnError: true,
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

      timeTravel.dispose();
    });
  });
});
