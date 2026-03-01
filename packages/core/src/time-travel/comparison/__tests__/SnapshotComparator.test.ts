/**
 * Tests for SnapshotComparator
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SnapshotComparator } from "../SnapshotComparator";
import type { Snapshot, SnapshotStateEntry } from "../../types";
import type { ComparisonOptions } from "../types";

/**
 * Helper to create a test snapshot
 */
function createSnapshot(
  state: Record<string, any>,
  action?: string,
  id?: string,
): Snapshot {
  const snapshotState: Record<string, SnapshotStateEntry> = {};

  Object.entries(state).forEach(([key, value]) => {
    snapshotState[key] = {
      value,
      type: "primitive",
      name: key,
      atomId: `atom_${key}`,
    };
  });

  return {
    id: id || `snap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    state: snapshotState,
    metadata: {
      timestamp: Date.now(),
      action,
      atomCount: Object.keys(state).length,
    },
  };
}

describe("SnapshotComparator", () => {
  let comparator: SnapshotComparator;

  beforeEach(() => {
    comparator = new SnapshotComparator();
  });

  describe("compare - Basic comparisons", () => {
    it("should detect added atoms", () => {
      const snapshot1 = createSnapshot({});
      const snapshot2 = createSnapshot({ counter: 1 });

      const result = comparator.compare(snapshot1, snapshot2);

      expect(result.summary.addedAtoms).toBe(1);
      expect(result.atoms[0].status).toBe("added");
      expect(result.atoms[0].atomName).toBe("counter");
      expect(result.atoms[0].newValue).toBe(1);
    });

    it("should detect removed atoms", () => {
      const snapshot1 = createSnapshot({ counter: 1 });
      const snapshot2 = createSnapshot({});

      const result = comparator.compare(snapshot1, snapshot2);

      expect(result.summary.removedAtoms).toBe(1);
      expect(result.atoms[0].status).toBe("removed");
      expect(result.atoms[0].atomName).toBe("counter");
      expect(result.atoms[0].oldValue).toBe(1);
    });

    it("should detect modified values", () => {
      const snapshot1 = createSnapshot({ counter: 1 });
      const snapshot2 = createSnapshot({ counter: 2 });

      const result = comparator.compare(snapshot1, snapshot2);

      expect(result.summary.changedAtoms).toBe(1);
      expect(result.atoms[0].status).toBe("modified");
      expect(result.atoms[0].valueDiff).toBeDefined();
      expect(result.atoms[0].valueDiff?.equal).toBe(false);
    });

    it("should detect unchanged atoms", () => {
      const snapshot1 = createSnapshot({ counter: 1 });
      const snapshot2 = createSnapshot({ counter: 1 });

      const result = comparator.compare(snapshot1, snapshot2);

      expect(result.summary.unchangedAtoms).toBe(1);
      expect(result.atoms[0].status).toBe("unchanged");
      expect(result.summary.hasChanges).toBe(false);
    });

    it("should handle multiple atoms", () => {
      const snapshot1 = createSnapshot({ a: 1, b: 2, c: 3 });
      const snapshot2 = createSnapshot({ a: 1, b: 5, d: 4 });

      const result = comparator.compare(snapshot1, snapshot2);

      expect(result.summary.totalAtoms).toBe(4);
      expect(result.summary.unchangedAtoms).toBe(1); // a
      expect(result.summary.changedAtoms).toBe(3); // b modified, c removed, d added
      expect(result.summary.removedAtoms).toBe(1); // c
      expect(result.summary.addedAtoms).toBe(1); // d
    });
  });

  describe("compare - Summary calculation", () => {
    it("should calculate correct summary", () => {
      const snapshot1 = createSnapshot({ a: 1, b: 2, c: 3, d: 4 });
      const snapshot2 = createSnapshot({ a: 1, b: 5, e: 6 });

      const result = comparator.compare(snapshot1, snapshot2);

      expect(result.summary.totalAtoms).toBe(5); // a, b, c, d, e
      expect(result.summary.changedAtoms).toBe(4); // b modified, c removed, d removed, e added
      expect(result.summary.changePercentage).toBe(80); // 4/5 * 100
      expect(result.summary.hasChanges).toBe(true);
    });

    it("should handle empty snapshots", () => {
      const snapshot1 = createSnapshot({});
      const snapshot2 = createSnapshot({});

      const result = comparator.compare(snapshot1, snapshot2);

      expect(result.summary.totalAtoms).toBe(0);
      expect(result.summary.changedAtoms).toBe(0);
      expect(result.summary.changePercentage).toBe(0);
      expect(result.summary.hasChanges).toBe(false);
    });
  });

  describe("compare - Complex value comparisons", () => {
    it("should deep compare nested objects", () => {
      const snapshot1 = createSnapshot({
        user: { name: "John", age: 30, address: { city: "NYC" } },
      });
      const snapshot2 = createSnapshot({
        user: { name: "John", age: 31, address: { city: "NYC" } },
      });

      const result = comparator.compare(snapshot1, snapshot2);

      expect(result.atoms[0].status).toBe("modified");
      expect(result.atoms[0].valueDiff?.objectChanges?.["age"]).toBeDefined();
    });

    it("should compare arrays", () => {
      const snapshot1 = createSnapshot({ items: [1, 2, 3] });
      const snapshot2 = createSnapshot({ items: [1, 2, 3, 4] });

      const result = comparator.compare(snapshot1, snapshot2);

      expect(result.atoms[0].status).toBe("modified");
      expect(result.atoms[0].valueDiff?.arrayChanges).toBeDefined();
    });

    it("should handle circular references", () => {
      const obj: any = { name: "circular" };
      obj.self = obj;

      const snapshot1 = createSnapshot({ data: obj });
      const snapshot2 = createSnapshot({ data: obj });

      const result = comparator.compare(snapshot1, snapshot2);

      // Should not throw and should handle circular refs
      expect(result.atoms[0].status).toBe("unchanged");
    });
  });

  describe("compare - Metadata comparison", () => {
    it("should detect metadata changes", () => {
      const snapshot1: Snapshot = {
        id: "s1",
        state: {
          counter: { value: 1, type: "primitive", name: "counter", atomId: "a1" },
        },
        metadata: { timestamp: 1000, action: "init", atomCount: 1 },
      };

      const snapshot2: Snapshot = {
        id: "s2",
        state: {
          counter: { value: 1, type: "writable", name: "counter", atomId: "a1" },
        },
        metadata: { timestamp: 2000, action: "update", atomCount: 1 },
      };

      const result = comparator.compare(snapshot1, snapshot2);

      expect(result.atoms[0].status).toBe("modified");
      expect(result.atoms[0].metadataChanges).toBeDefined();
      expect(result.atoms[0].metadataChanges).toContain("type: primitive -> writable");
    });
  });

  describe("compare - Statistics", () => {
    it("should track comparison statistics", () => {
      const snapshot1 = createSnapshot({ a: 1, b: 2, c: 3 });
      const snapshot2 = createSnapshot({ a: 1, b: 5, d: 4 });

      const result = comparator.compare(snapshot1, snapshot2);

      expect(result.statistics.duration).toBeGreaterThanOrEqual(0);
      expect(result.statistics.totalComparisons).toBe(4); // a, b, c, d
      expect(result.statistics.depth).toBeGreaterThanOrEqual(0);
    });
  });

  describe("compare - Metadata", () => {
    it("should include comparison metadata", () => {
      const snapshot1 = createSnapshot({ a: 1 }, "action1", "snap1");
      const snapshot2 = createSnapshot({ a: 2 }, "action2", "snap2");

      const result = comparator.compare(snapshot1, snapshot2);

      expect(result.metadata.snapshotA.id).toBe("snap1");
      expect(result.metadata.snapshotB.id).toBe("snap2");
      expect(result.metadata.snapshotA.action).toBe("action1");
      expect(result.metadata.snapshotB.action).toBe("action2");
      expect(result.metadata.timeDifference).toBeGreaterThanOrEqual(0);
    });
  });

  describe("compare - Caching", () => {
    it("should cache comparison results", () => {
      const snapshot1 = createSnapshot({ a: 1 });
      const snapshot2 = createSnapshot({ a: 2 });

      // First comparison
      const result1 = comparator.compare(snapshot1, snapshot2);

      // Second comparison (should use cache)
      const result2 = comparator.compare(snapshot1, snapshot2);

      expect(result1.summary.changedAtoms).toBe(result2.summary.changedAtoms);
      expect(comparator.getCacheSize()).toBe(1);
    });

    it("should respect cache size limit", () => {
      const limitedComparator = new SnapshotComparator({ cacheSize: 2 });

      const snap1 = createSnapshot({ a: 1 }, undefined, "s1");
      const snap2 = createSnapshot({ a: 2 }, undefined, "s2");
      const snap3 = createSnapshot({ a: 3 }, undefined, "s3");
      const snap4 = createSnapshot({ a: 4 }, undefined, "s4");

      limitedComparator.compare(snap1, snap2);
      limitedComparator.compare(snap2, snap3);
      limitedComparator.compare(snap3, snap4);

      // Cache should have max 2 entries
      expect(limitedComparator.getCacheSize()).toBeLessThanOrEqual(2);
    });

    it("should clear cache", () => {
      const snapshot1 = createSnapshot({ a: 1 });
      const snapshot2 = createSnapshot({ a: 2 });

      comparator.compare(snapshot1, snapshot2);
      expect(comparator.getCacheSize()).toBe(1);

      comparator.clearCache();
      expect(comparator.getCacheSize()).toBe(0);
    });
  });

  describe("compare - Options", () => {
    it("should use custom options", () => {
      const snapshot1 = createSnapshot({ a: 1 });
      const snapshot2 = createSnapshot({ a: 2 });

      const result = comparator.compare(snapshot1, snapshot2, {
        deepCompare: false,
        maxDepth: 10,
      });

      expect(result.metadata.options.deepCompare).toBe(false);
      expect(result.metadata.options.maxDepth).toBe(10);
    });

    it("should update options", () => {
      comparator.updateOptions({ cacheSize: 50 });
      expect(comparator.getOptions().cacheSize).toBe(50);
    });
  });

  describe("compare - Edge cases", () => {
    it("should handle snapshots with same ID", () => {
      const snapshot = createSnapshot({ a: 1 }, "action", "same-id");

      const result = comparator.compare(snapshot, snapshot);

      expect(result.summary.hasChanges).toBe(false);
      expect(result.summary.unchangedAtoms).toBe(1);
    });

    it("should handle different atom types", () => {
      const snapshot1: Snapshot = {
        id: "s1",
        state: {
          computed: { value: 1, type: "computed", name: "computed", atomId: "c1" },
        },
        metadata: { timestamp: 1000, action: "init", atomCount: 1 },
      };

      const snapshot2: Snapshot = {
        id: "s2",
        state: {
          computed: { value: 1, type: "writable", name: "computed", atomId: "c1" },
        },
        metadata: { timestamp: 2000, action: "update", atomCount: 1 },
      };

      const result = comparator.compare(snapshot1, snapshot2);

      expect(result.atoms[0].atomType).toBe("writable");
    });
  });
});
