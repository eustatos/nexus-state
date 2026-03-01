/**
 * Tests for compression strategies
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { Snapshot } from "../types";
import { NoCompressionStrategy } from "../compression";
import { TimeBasedCompression } from "../compression";
import { SizeBasedCompression } from "../compression";
import { SignificanceBasedCompression } from "../compression";

// Helper function to create a mock snapshot
function createSnapshot(
  id: string,
  state: Record<string, { value: unknown; type: string }> = {},
  action: string = "test",
  timestamp: number = Date.now(),
): Snapshot {
  return {
    id,
    state,
    metadata: {
      timestamp,
      action,
      atomCount: Object.keys(state).length,
    },
  };
}

describe("Compression Strategies", () => {
  describe("NoCompressionStrategy", () => {
    it("should not compress any history", () => {
      const strategy = new NoCompressionStrategy();
      
      const history = [
        createSnapshot("1", { count: { value: 0, type: "primitive" } }),
        createSnapshot("2", { count: { value: 1, type: "primitive" } }),
        createSnapshot("3", { count: { value: 2, type: "primitive" } }),
      ];
      
      expect(strategy.shouldCompress(history, 2)).toBe(false);
      
      const result = strategy.compress(history);
      expect(result).toHaveLength(3);
      expect(result).toEqual(history);
    });
  });

  describe("TimeBasedCompression", () => {
    it("should keep recent snapshots at full resolution", () => {
      const now = Date.now();
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 5 * 60 * 1000, // 5 minutes
        keepEvery: 2,
        minSnapshots: 3, // Lower for testing
      });

      const history = [
        createSnapshot("1", {}, "old-1", now - 10 * 60 * 1000), // 10 minutes ago
        createSnapshot("2", {}, "old-2", now - 8 * 60 * 1000),  // 8 minutes ago
        createSnapshot("3", {}, "old-3", now - 6 * 60 * 1000),  // 6 minutes ago
        createSnapshot("4", {}, "recent-1", now - 30 * 1000),   // 30 seconds ago
        createSnapshot("5", {}, "recent-2", now - 10 * 1000),   // 10 seconds ago
      ];

      // With minSnapshots=3, should compress since we have 5 snapshots
      expect(strategy.shouldCompress(history, 4)).toBe(true);

      const result = strategy.compress(history);
      
      // Should keep all recent snapshots + every 2nd old snapshot
      expect(result.length).toBeLessThan(history.length);
      
      // Recent snapshots (should all be kept)
      const recent = result.filter((s) => s.metadata.timestamp > now - 5 * 60 * 1000);
      expect(recent).toHaveLength(2);
    });

    it("should not compress if below minSnapshots", () => {
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 60 * 1000,
        keepEvery: 5,
        minSnapshots: 10,
      });

      const history = [
        createSnapshot("1", {}),
        createSnapshot("2", {}),
        createSnapshot("3", {}),
      ];

      expect(strategy.shouldCompress(history, 2)).toBe(false);
      
      const result = strategy.compress(history);
      expect(result).toHaveLength(3);
    });
  });

  describe("SizeBasedCompression", () => {
    it("should compress when history exceeds maxSnapshots", () => {
      const strategy = new SizeBasedCompression({
        maxSnapshots: 5,
        keepEvery: 2,
        minSnapshots: 3, // Lower for testing
      });

      const history = [];
      for (let i = 0; i < 10; i++) {
        history.push(createSnapshot(String(i), { count: { value: i, type: "primitive" } }));
      }

      expect(strategy.shouldCompress(history, 9)).toBe(true);

      const result = strategy.compress(history);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it("should not compress if below maxSnapshots", () => {
      const strategy = new SizeBasedCompression({
        maxSnapshots: 10,
        keepEvery: 2,
        minSnapshots: 3, // Lower for testing
      });

      const history = [
        createSnapshot("1", {}),
        createSnapshot("2", {}),
        createSnapshot("3", {}),
      ];

      expect(strategy.shouldCompress(history, 2)).toBe(false);
    });
  });

  describe("SignificanceBasedCompression", () => {
    it("should compare snapshots for significance", () => {
      const snapshot1 = createSnapshot("1", {
        count: { value: 10, type: "primitive" },
      });

      const snapshot2 = createSnapshot("2", {
        count: { value: 20, type: "primitive" },
      });

      // Use the public compareSnapshots method from the class
      const strategy = new SignificanceBasedCompression();
      const comparison = strategy.compareSnapshots(snapshot1, snapshot2);
      
      expect(comparison.different).toBe(true);
      expect(comparison.changedAtoms).toBe(1);
    });

    it("should keep snapshots with significant changes", () => {
      const strategy = new SignificanceBasedCompression({
        minChangeThreshold: 0.5,
        maxConsecutiveSimilar: 2,
        minSnapshots: 3, // Lower for testing
      });

      const now = Date.now();
      const history = [
        createSnapshot("1", { count: { value: 0, type: "primitive" } }, "action-1", now - 5000),
        createSnapshot("2", { count: { value: 0, type: "primitive" } }, "action-2", now - 4000),
        createSnapshot("3", { count: { value: 0, type: "primitive" } }, "action-3", now - 3000),
        createSnapshot("4", { count: { value: 10, type: "primitive" } }, "action-4", now - 2000),
        createSnapshot("5", { count: { value: 10, type: "primitive" } }, "action-5", now - 1000),
        createSnapshot("6", { count: { value: 20, type: "primitive" } }, "action-6", now),
      ];

      const result = strategy.compress(history);
      
      // Should keep first snapshot, snapshots with changes, and maxConsecutiveSimilar
      expect(result.length).toBeLessThanOrEqual(history.length);
      
      // Should have the first snapshot
      expect(result[0].id).toBe("1");
      
      // Should have the last snapshot
      expect(result[result.length - 1].id).toBe("6");
    });

    it("should record compression metadata", () => {
      const strategy = new SignificanceBasedCompression();

      const history = [
        createSnapshot("1", {}),
        createSnapshot("2", {}),
        createSnapshot("3", {}),
        createSnapshot("4", {}),
        createSnapshot("5", {}),
      ];

      strategy.compress(history);

      const metadata = strategy.getMetadata();
      expect(metadata).toBeDefined();
      expect(metadata?.strategy).toBe("significance");
      expect(metadata?.originalCount).toBe(5);
      expect(metadata?.compressionRatio).toBeLessThan(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty history", () => {
      const strategies = [
        new NoCompressionStrategy(),
        new TimeBasedCompression({ minSnapshots: 3 }),
        new SizeBasedCompression({ minSnapshots: 3 }),
        new SignificanceBasedCompression({ minSnapshots: 3 }),
      ];

      for (const strategy of strategies) {
        const result = strategy.compress([]);
        expect(result).toEqual([]);
      }
    });

    it("should handle single snapshot", () => {
      const snapshot = createSnapshot("1", {});
      const strategies = [
        new NoCompressionStrategy(),
        new TimeBasedCompression({ minSnapshots: 3 }),
        new SizeBasedCompression({ minSnapshots: 3 }),
        new SignificanceBasedCompression({ minSnapshots: 3 }),
      ];

      for (const strategy of strategies) {
        const result = strategy.compress([snapshot]);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("1");
      }
    });

    it("should reset compression strategy", () => {
      const strategy = new SizeBasedCompression({
        maxSnapshots: 10,
        keepEvery: 2,
        minSnapshots: 3, // Lower for testing
      });

      const history = Array.from({ length: 20 }, (_, i) =>
        createSnapshot(String(i), {}),
      );

      strategy.compress(history);
      expect(strategy.getMetadata()).toBeDefined();

      strategy.reset();
      expect(strategy.getMetadata()).toBeNull();
    });
  });
});
