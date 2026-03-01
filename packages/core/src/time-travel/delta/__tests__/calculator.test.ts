/**
 * Delta Calculator Tests
 */

import { DeltaCalculatorImpl } from "../calculator";
import type { Snapshot, DeltaSnapshot } from "../types";

describe("DeltaCalculator", () => {
  let calculator: DeltaCalculatorImpl;

  beforeEach(() => {
    calculator = new DeltaCalculatorImpl({
      deepEqual: true,
      skipEmpty: true,
    });
  });

  describe("computeDelta", () => {
    it("should detect modified atoms", () => {
      const previous: Snapshot = {
        id: "prev-1",
        type: "full",
        state: {
          counter: {
            value: 0,
            type: "primitive",
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now() - 1000,
          action: "initial",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      const current: Snapshot = {
        id: "current-1",
        type: "full",
        state: {
          counter: {
            value: 5,
            type: "primitive",
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "increment",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      const delta = calculator.computeDelta(previous, current);

      expect(delta).toBeDefined();
      expect(delta?.type).toBe("delta");
      expect(delta?.changes.size).toBe(1);
      
      const change = delta?.changes.get("counter");
      expect(change).toBeDefined();
      expect(change?.changeType).toBe("modified");
      expect(change?.oldValue).toBe(0);
      expect(change?.newValue).toBe(5);
    });

    it("should detect added atoms", () => {
      const previous: Snapshot = {
        id: "prev-2",
        type: "full",
        state: {},
        metadata: {
          timestamp: Date.now() - 1000,
          action: "initial",
          atomCount: 0,
        },
        baseSnapshotId: null,
      };

      const current: Snapshot = {
        id: "current-2",
        type: "full",
        state: {
          user: {
            value: { name: "Alice" },
            type: "primitive",
            name: "user",
            atomId: "atom-user",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "set user",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      const delta = calculator.computeDelta(previous, current);

      expect(delta).toBeDefined();
      expect(delta?.changes.size).toBe(1);
      
      const change = delta?.changes.get("user");
      expect(change?.changeType).toBe("added");
      expect(change?.oldValue).toBeNull();
    });

    it("should detect deleted atoms", () => {
      const previous: Snapshot = {
        id: "prev-3",
        type: "full",
        state: {
          user: {
            value: { name: "Alice" },
            type: "primitive",
            name: "user",
            atomId: "atom-user",
          },
        },
        metadata: {
          timestamp: Date.now() - 1000,
          action: "set user",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      const current: Snapshot = {
        id: "current-3",
        type: "full",
        state: {},
        metadata: {
          timestamp: Date.now(),
          action: "delete user",
          atomCount: 0,
        },
        baseSnapshotId: null,
      };

      const delta = calculator.computeDelta(previous, current);

      expect(delta).toBeDefined();
      expect(delta?.changes.size).toBe(1);
      
      const change = delta?.changes.get("user");
      expect(change?.changeType).toBe("deleted");
      expect(change?.newValue).toBeNull();
    });

    it("should return null for empty delta when skipEmpty is true", () => {
      const previous: Snapshot = {
        id: "prev-4",
        type: "full",
        state: {
          counter: {
            value: 0,
            type: "primitive",
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now() - 1000,
          action: "initial",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      const current: Snapshot = {
        id: "current-4",
        type: "full",
        state: {
          counter: {
            value: 0,
            type: "primitive",
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "same",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      const delta = calculator.computeDelta(previous, current);

      expect(delta).toBeNull();
    });
  });

  describe("applyDelta", () => {
    it("should apply delta to base snapshot", () => {
      const base: Snapshot = {
        id: "base-1",
        type: "full",
        state: {
          counter: {
            value: 0,
            type: "primitive",
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now() - 2000,
          action: "initial",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

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
              newValue: 5,
              changeType: "modified",
            },
          ],
        ]),
        metadata: {
          timestamp: Date.now() - 1000,
          action: "increment",
          atomCount: 1,
          baseTimestamp: base.metadata.timestamp,
          changeCount: 1,
          compressedSize: 100,
          originalSize: 500,
        },
      };

      const result = calculator.applyDelta(base, delta);

      expect(result).toBeDefined();
      expect(result?.state["counter"].value).toBe(5);
      expect(result?.metadata.timestamp).toBe(delta.metadata.timestamp);
    });

    it("should not mutate base snapshot when immutable is true", () => {
      const base: Snapshot = {
        id: "base-2",
        type: "full",
        state: {
          counter: {
            value: 0,
            type: "primitive",
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now() - 2000,
          action: "initial",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      const delta: DeltaSnapshot = {
        id: "delta-2",
        type: "delta",
        baseSnapshotId: "base-2",
        state: {},
        changes: new Map([
          [
            "counter",
            {
              atomId: "atom-counter",
              atomName: "counter",
              oldValue: 0,
              newValue: 5,
              changeType: "modified",
            },
          ],
        ]),
        metadata: {
          timestamp: Date.now() - 1000,
          action: "increment",
          atomCount: 1,
          baseTimestamp: base.metadata.timestamp,
          changeCount: 1,
          compressedSize: 100,
          originalSize: 500,
        },
      };

      // Store original value
      const originalValue = base.state["counter"].value;

      const result = calculator.applyDelta(base, delta, { immutable: true });

      // Check that base wasn't mutated
      expect(base.state["counter"].value).toBe(originalValue);
      // Check that result has the new value
      expect(result?.state["counter"].value).toBe(5);
    });
  });

  describe("areSnapshotsEqual", () => {
    it("should return true for equal snapshots", () => {
      const snapshot1: Snapshot = {
        id: "snap-1",
        type: "full",
        state: {
          counter: {
            value: 5,
            type: "primitive",
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      const snapshot2: Snapshot = {
        id: "snap-2",
        type: "full",
        state: {
          counter: {
            value: 5,
            type: "primitive",
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now() + 100,
          action: "test",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      expect(calculator.areSnapshotsEqual(snapshot1, snapshot2)).toBe(true);
    });

    it("should return false for different snapshots", () => {
      const snapshot1: Snapshot = {
        id: "snap-1",
        type: "full",
        state: {
          counter: {
            value: 5,
            type: "primitive",
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      const snapshot2: Snapshot = {
        id: "snap-2",
        type: "full",
        state: {
          counter: {
            value: 10,
            type: "primitive",
            name: "counter",
            atomId: "atom-counter",
          },
        },
        metadata: {
          timestamp: Date.now(),
          action: "test",
          atomCount: 1,
        },
        baseSnapshotId: null,
      };

      expect(calculator.areSnapshotsEqual(snapshot1, snapshot2)).toBe(false);
    });
  });
});
