/**
 * Delta Chain Manager Tests
 */

import { DeltaChainManager } from "../chain-manager";
import type { DeltaSnapshot, FullSnapshot } from "../types";

describe("DeltaChainManager", () => {
  let manager: DeltaChainManager;

  beforeEach(() => {
    manager = new DeltaChainManager({
      fullSnapshotInterval: 10,
      maxDeltaChainLength: 20,
      maxDeltaChainAge: 5 * 60 * 1000,
      maxDeltaChainSize: 1024 * 1024,
    });
  });

  describe("addDelta", () => {
    it("should add delta to chain", () => {
      const baseSnapshot: FullSnapshot = {
        id: "base-1",
        type: "full",
        state: {},
        metadata: {
          timestamp: Date.now(),
          action: "initial",
          atomCount: 0,
        },
        baseSnapshotId: null,
      };

      const delta1: DeltaSnapshot = {
        id: "delta-1",
        type: "delta",
        baseSnapshotId: "base-1",
        state: {},
        changes: new Map([
          [
            "counter",
            {
              atomId: "atom-counter",
              atomName: "counter",
              oldValue: 0,
              newValue: 1,
              changeType: "modified",
            },
          ],
        ]),
        metadata: {
          timestamp: Date.now() + 100,
          action: "increment",
          atomCount: 1,
          baseTimestamp: baseSnapshot.metadata.timestamp,
          changeCount: 1,
          compressedSize: 50,
          originalSize: 200,
        },
      };

      manager.addDelta(delta1);

      const chain = manager.getChain("base-1");
      expect(chain).toBeDefined();
      expect(chain?.deltas).toHaveLength(1);
    });

    it("should create new chain for new base", () => {
      const baseSnapshot1: FullSnapshot = {
        id: "base-1",
        type: "full",
        state: {},
        metadata: {
          timestamp: Date.now(),
          action: "initial",
          atomCount: 0,
        },
        baseSnapshotId: null,
      };

      const delta1: DeltaSnapshot = {
        id: "delta-1",
        type: "delta",
        baseSnapshotId: "base-1",
        state: {},
        changes: new Map([
          [
            "counter",
            {
              atomId: "atom-counter",
              atomName: "counter",
              oldValue: 0,
              newValue: 1,
              changeType: "modified",
            },
          ],
        ]),
        metadata: {
          timestamp: Date.now() + 100,
          action: "increment",
          atomCount: 1,
          baseTimestamp: baseSnapshot1.metadata.timestamp,
          changeCount: 1,
          compressedSize: 50,
          originalSize: 200,
        },
      };

      manager.addDelta(delta1);

      const baseSnapshot2: FullSnapshot = {
        id: "base-2",
        type: "full",
        state: {},
        metadata: {
          timestamp: Date.now() + 200,
          action: "new-base",
          atomCount: 0,
        },
        baseSnapshotId: null,
      };

      const delta2: DeltaSnapshot = {
        id: "delta-2",
        type: "delta",
        baseSnapshotId: "base-2",
        state: {},
        changes: new Map([
          [
            "user",
            {
              atomId: "atom-user",
              atomName: "user",
              oldValue: null,
              newValue: { name: "Alice" },
              changeType: "added",
            },
          ],
        ]),
        metadata: {
          timestamp: Date.now() + 300,
          action: "set user",
          atomCount: 1,
          baseTimestamp: baseSnapshot2.metadata.timestamp,
          changeCount: 1,
          compressedSize: 50,
          originalSize: 200,
        },
      };

      manager.addDelta(delta2);

      const chain1 = manager.getChain("base-1");
      const chain2 = manager.getChain("base-2");

      expect(chain1).toBeDefined();
      expect(chain2).toBeDefined();
      expect(manager.getActiveChainCount()).toBe(2);
    });
  });

  describe("validateChain", () => {
    it("should validate chain within limits", () => {
      const result = manager.validateChain({
        baseSnapshot: {
          id: "base-1",
          type: "full",
          state: {},
          metadata: {
            timestamp: Date.now(),
            action: "initial",
            atomCount: 0,
          },
          baseSnapshotId: null,
        },
        deltas: [],
        metadata: {
          deltaCount: 0,
          memoryUsage: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          maxDeltas: 20,
        },
      });

      expect(result.isValid).toBe(true);
      expect(result.action).toBe("keep");
    });

    it("should reject chain exceeding length", () => {
      const chain = {
        baseSnapshot: {
          id: "base-1",
          type: "full",
          state: {},
          metadata: {
            timestamp: Date.now(),
            action: "initial",
            atomCount: 0,
          },
          baseSnapshotId: null,
        },
        deltas: new Array(25).fill(null).map((_, i) => ({
          id: `delta-${i}`,
          type: "delta" as const,
          baseSnapshotId: "base-1",
          state: {},
          changes: new Map(),
          metadata: {
            timestamp: Date.now() + i * 100,
            action: `action-${i}`,
            atomCount: 0,
            baseTimestamp: Date.now(),
            changeCount: 0,
            compressedSize: 0,
            originalSize: 0,
          },
        })),
        metadata: {
          deltaCount: 25,
          memoryUsage: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          maxDeltas: 20,
        },
      };

      const result = manager.validateChain(chain);

      expect(result.isValid).toBe(false);
      expect(result.action).toBe("create_base");
      expect(result.reason).toContain("maximum length");
    });
  });

  describe("getStats", () => {
    it("should return chain statistics", () => {
      const delta: DeltaSnapshot = {
        id: "delta-1",
        type: "delta",
        baseSnapshotId: "base-1",
        state: {},
        changes: new Map([
          [
            "counter",
            {
              atomId: "atom-counter",
              atomName: "counter",
              oldValue: 0,
              newValue: 1,
              changeType: "modified",
            },
          ],
        ]),
        metadata: {
          timestamp: Date.now(),
          action: "increment",
          atomCount: 1,
          baseTimestamp: Date.now(),
          changeCount: 1,
          compressedSize: 50,
          originalSize: 200,
        },
      };

      manager.addDelta(delta);

      const stats = manager.getStats();

      expect(stats.activeChains).toBe(1);
      expect(stats.totalDeltasInChains).toBe(1);
      expect(stats.deltaCount).toBe(1);
    });
  });

  describe("reconstruct", () => {
    it("should reconstruct deltas up to target", () => {
      const delta1: DeltaSnapshot = {
        id: "delta-1",
        type: "delta",
        baseSnapshotId: "base-1",
        state: {},
        changes: new Map([
          [
            "counter",
            {
              atomId: "atom-counter",
              atomName: "counter",
              oldValue: 0,
              newValue: 1,
              changeType: "modified",
            },
          ],
        ]),
        metadata: {
          timestamp: Date.now(),
          action: "increment",
          atomCount: 1,
          baseTimestamp: Date.now(),
          changeCount: 1,
          compressedSize: 50,
          originalSize: 200,
        },
      };

      const delta2: DeltaSnapshot = {
        id: "delta-2",
        type: "delta",
        baseSnapshotId: "base-1",
        state: {},
        changes: new Map([
          [
            "counter",
            {
              atomId: "atom-counter",
              atomName: "counter",
              oldValue: 1,
              newValue: 2,
              changeType: "modified",
            },
          ],
        ]),
        metadata: {
          timestamp: Date.now() + 100,
          action: "increment",
          atomCount: 1,
          baseTimestamp: Date.now(),
          changeCount: 1,
          compressedSize: 50,
          originalSize: 200,
        },
      };

      const delta3: DeltaSnapshot = {
        id: "delta-3",
        type: "delta",
        baseSnapshotId: "base-1",
        state: {},
        changes: new Map([
          [
            "counter",
            {
              atomId: "atom-counter",
              atomName: "counter",
              oldValue: 2,
              newValue: 3,
              changeType: "modified",
            },
          ],
        ]),
        metadata: {
          timestamp: Date.now() + 200,
          action: "increment",
          atomCount: 1,
          baseTimestamp: Date.now(),
          changeCount: 1,
          compressedSize: 50,
          originalSize: 200,
        },
      };

      manager.addDelta(delta1);
      manager.addDelta(delta2);
      manager.addDelta(delta3);

      // Reconstruct up to delta-2
      const result = manager.reconstruct("base-1", "delta-2");

      expect(result).toBeDefined();
    });
  });
});
