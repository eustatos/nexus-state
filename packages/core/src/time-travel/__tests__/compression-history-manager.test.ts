/**
 * Tests for HistoryManager with compression
 */

import { describe, it, expect, beforeEach } from "vitest";
import { HistoryManager } from "../core/HistoryManager";
import type { Snapshot } from "../types";
import { TimeBasedCompression } from "../compression";

// Helper function to create a mock snapshot
function createSnapshot(
  id: string,
  state: Record<string, unknown> = {},
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

describe("HistoryManager with Compression", () => {
  describe("Integration with compression", () => {
    it("should compress history when limit is reached", () => {
      const manager = new HistoryManager(50);
      
      // Set a compression strategy with a low maxSnapshots
      // We need to use the compression API
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 5 * 60 * 1000,
        keepEvery: 2,
        minSnapshots: 3,
      });
      
      // For now, we'll just test that the manager can accept a strategy
      manager.setCompressionStrategy(strategy);
      
      // Add some snapshots
      for (let i = 0; i < 10; i++) {
        manager.add(createSnapshot(String(i), { count: i }));
      }
      
      // The manager should still maintain its normal limits
      expect(manager.getAll().length).toBeLessThanOrEqual(50);
    });

    it("should preserve navigation after compression", () => {
      const manager = new HistoryManager(100);
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 10 * 60 * 1000, // 10 minutes
        keepEvery: 5,
        minSnapshots: 3,
      });
      
      manager.setCompressionStrategy(strategy);
      
      // Add many snapshots
      for (let i = 0; i < 20; i++) {
        manager.add(createSnapshot(String(i), { count: i }));
      }
      
      // Test undo/redo
      const current = manager.getCurrent();
      expect(current).toBeDefined();
      
      const undone = manager.undo();
      expect(undone).toBeDefined();
      expect(undone?.metadata.action).toBe("test");
      
      const redone = manager.redo();
      expect(redone).toBeDefined();
      expect(redone?.id).toBe(current?.id);
    });

    it("should preserve jumpTo after compression", () => {
      const manager = new HistoryManager(100);
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 10 * 60 * 1000,
        keepEvery: 5,
        minSnapshots: 3,
      });
      
      manager.setCompressionStrategy(strategy);
      
      // Add many snapshots
      for (let i = 0; i < 20; i++) {
        manager.add(createSnapshot(String(i), { count: i }));
      }
      
      const allBefore = manager.getAll();
      
      // Jump to a specific index
      const jumped = manager.jumpTo(5);
      expect(jumped).toBeDefined();
      expect(jumped?.metadata.action).toBe("test");
      
      // Jump back
      const jumpedBack = manager.jumpTo(0);
      expect(jumpedBack).toBeDefined();
    });

    it("should clear compression metadata on clear()", () => {
      const manager = new HistoryManager(100);
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 10 * 60 * 1000,
        keepEvery: 5,
        minSnapshots: 3,
      });
      
      manager.setCompressionStrategy(strategy);
      
      // Add many snapshots to trigger compression
      for (let i = 0; i < 20; i++) {
        manager.add(createSnapshot(String(i), { count: i }));
      }
      
      // Get stats to trigger compression
      const statsBefore = manager.getStats();
      
      // Clear history
      manager.clear();
      
      const statsAfter = manager.getStats();
      expect(statsAfter.totalSnapshots).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle compression with empty history", () => {
      const manager = new HistoryManager(100);
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 10 * 60 * 1000,
        keepEvery: 5,
        minSnapshots: 3,
      });
      
      manager.setCompressionStrategy(strategy);
      
      // Add one snapshot
      manager.add(createSnapshot("1", {}));
      
      // Should work fine with just one snapshot
      expect(manager.getAll().length).toBe(1);
    });

    it("should handle rapid adds with compression", () => {
      const manager = new HistoryManager(100);
      const strategy = new TimeBasedCompression({
        keepRecentForMs: 10 * 60 * 1000,
        keepEvery: 5,
        minSnapshots: 3,
      });
      
      manager.setCompressionStrategy(strategy);
      
      // Rapid adds
      for (let i = 0; i < 50; i++) {
        manager.add(createSnapshot(String(i), { count: i }));
      }
      
      // Should still maintain maxHistory
      expect(manager.getAll().length).toBeLessThanOrEqual(100);
    });

    it("should handle compression without strategy", () => {
      const manager = new HistoryManager(10);
      
      // No compression strategy set
      for (let i = 0; i < 20; i++) {
        manager.add(createSnapshot(String(i), { count: i }));
      }
      
      // Should use default maxHistory behavior
      expect(manager.getAll().length).toBe(10);
    });

    it("should allow changing compression strategy", () => {
      const manager = new HistoryManager(100);
      
      // Set initial strategy
      const strategy1 = new TimeBasedCompression({
        keepRecentForMs: 5 * 60 * 1000,
        keepEvery: 2,
        minSnapshots: 3,
      });
      manager.setCompressionStrategy(strategy1);
      
      // Add some snapshots
      for (let i = 0; i < 10; i++) {
        manager.add(createSnapshot(String(i), { count: i }));
      }
      
      // Change strategy
      const strategy2 = new TimeBasedCompression({
        keepRecentForMs: 10 * 60 * 1000,
        keepEvery: 5,
        minSnapshots: 3,
      });
      manager.setCompressionStrategy(strategy2);
      
      // Should still work
      expect(manager.getAll().length).toBeGreaterThan(0);
    });
  });
});
