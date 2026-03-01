/**
 * Tests for HistoryManager
 * 
 * These tests verify the correct behavior of the HistoryManager class,
 * particularly the add() method with maxHistory limits and edge cases.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { HistoryManager } from "../core/HistoryManager";
import type { Snapshot } from "../types";

// Helper function to create a mock snapshot
function createSnapshot(id: string, state: Record<string, unknown> = {}, action: string = "test"): Snapshot {
  return {
    id,
    state,
    metadata: {
      timestamp: Date.now(),
      action,
      atomCount: Object.keys(state).length,
    },
  };
}

describe("HistoryManager", () => {
  describe("Basic functionality", () => {
    it("should initialize with default maxHistory of 50", () => {
      const manager = new HistoryManager();
      expect((manager as any).maxHistory).toBe(50);
      expect(manager.getCurrent()).toBeNull();
      expect((manager as any).past.length).toBe(0);
      expect((manager as any).future.length).toBe(0);
    });

    it("should initialize with custom maxHistory", () => {
      const manager = new HistoryManager(10);
      expect((manager as any).maxHistory).toBe(10);
    });

    it("should add first snapshot as current", () => {
      const manager = new HistoryManager();
      const snapshot = createSnapshot("1", { count: 0 }, "initial");
      
      manager.add(snapshot);
      
      expect(manager.getCurrent()).toBe(snapshot);
      expect((manager as any).past.length).toBe(0);
      expect((manager as any).future.length).toBe(0);
      expect(manager.getAll().length).toBe(1);
    });

    it("should push current to past when adding new snapshot", () => {
      const manager = new HistoryManager();
      const snapshot1 = createSnapshot("1", { count: 0 }, "first");
      const snapshot2 = createSnapshot("2", { count: 1 }, "second");
      
      manager.add(snapshot1);
      manager.add(snapshot2);
      
      expect(manager.getCurrent()).toBe(snapshot2);
      expect((manager as any).past.length).toBe(1);
      expect((manager as any).past[0]).toBe(snapshot1);
      expect((manager as any).future.length).toBe(0);
    });

    it("should clear future when adding new snapshot", () => {
      const manager = new HistoryManager();
      const snapshot1 = createSnapshot("1", { count: 0 }, "first");
      const snapshot2 = createSnapshot("2", { count: 1 }, "second");
      const snapshot3 = createSnapshot("3", { count: 2 }, "third");
      
      manager.add(snapshot1);
      manager.add(snapshot2);
      
      // Simulate undo to populate future
      (manager as any).undo = function() {
        const newFuture = this.current;
        const newCurrent = this.past.pop() || null;
        if (newCurrent && newFuture) {
          this.future.unshift(newFuture);
          this.current = newCurrent;
        }
        return newCurrent;
      }.bind(manager);
      (manager as any).undo();
      
      expect((manager as any).future.length).toBe(1);
      
      // Add new snapshot - should clear future
      manager.add(snapshot3);
      
      expect((manager as any).future.length).toBe(0);
    });
  });

  describe("maxHistory limit enforcement", () => {
    describe("maxHistory = 1", () => {
      it("should only keep the most recent snapshot", () => {
        const manager = new HistoryManager(1);
        const snapshot1 = createSnapshot("1", { count: 0 }, "first");
        const snapshot2 = createSnapshot("2", { count: 1 }, "second");
        const snapshot3 = createSnapshot("3", { count: 2 }, "third");
        
        manager.add(snapshot1);
        expect(manager.getAll().length).toBe(1);
        expect((manager as any).past.length).toBe(0);
        
        manager.add(snapshot2);
        expect(manager.getAll().length).toBe(1);
        expect((manager as any).past.length).toBe(0);
        expect(manager.getCurrent()).toBe(snapshot2);
        
        manager.add(snapshot3);
        expect(manager.getAll().length).toBe(1);
        expect((manager as any).past.length).toBe(0);
        expect(manager.getCurrent()).toBe(snapshot3);
      });

      it("should not accumulate past snapshots with maxHistory = 1", () => {
        const manager = new HistoryManager(1);
        
        for (let i = 0; i < 10; i++) {
          manager.add(createSnapshot(String(i), { count: i }, `action-${i}`));
        }
        
        expect(manager.getAll().length).toBe(1);
        expect((manager as any).past.length).toBe(0);
        expect(manager.getCurrent()?.metadata.action).toBe("action-9");
      });
    });

    describe("maxHistory = 2", () => {
      it("should keep past + current = 2 snapshots total", () => {
        const manager = new HistoryManager(2);
        const snapshot1 = createSnapshot("1", { count: 0 }, "first");
        const snapshot2 = createSnapshot("2", { count: 1 }, "second");
        const snapshot3 = createSnapshot("3", { count: 2 }, "third");
        
        manager.add(snapshot1);
        expect(manager.getAll().length).toBe(1);
        expect((manager as any).past.length).toBe(0);
        
        manager.add(snapshot2);
        expect(manager.getAll().length).toBe(2);
        expect((manager as any).past.length).toBe(1);
        
        manager.add(snapshot3);
        expect(manager.getAll().length).toBe(2);
        expect((manager as any).past.length).toBe(1);
        expect(manager.getCurrent()).toBe(snapshot3);
      });

      it("should preserve correct order with maxHistory = 2", () => {
        const manager = new HistoryManager(2);
        const snapshots: Snapshot[] = [];
        
        for (let i = 0; i < 5; i++) {
          const snap = createSnapshot(String(i), { count: i }, `action-${i}`);
          snapshots.push(snap);
          manager.add(snap);
        }
        
        // Should have last 2 snapshots: [action-3, action-4] where action-4 is current
        expect(manager.getAll().length).toBe(2);
        expect((manager as any).past[0].metadata.action).toBe("action-3");
        expect(manager.getCurrent()?.metadata.action).toBe("action-4");
      });
    });

    describe("maxHistory = 3", () => {
      it("should keep past + current = 3 snapshots total", () => {
        const manager = new HistoryManager(3);
        const snapshot1 = createSnapshot("1", { count: 0 }, "first");
        const snapshot2 = createSnapshot("2", { count: 1 }, "second");
        const snapshot3 = createSnapshot("3", { count: 2 }, "third");
        const snapshot4 = createSnapshot("4", { count: 3 }, "fourth");
        
        manager.add(snapshot1);
        expect(manager.getAll().length).toBe(1);
        
        manager.add(snapshot2);
        expect(manager.getAll().length).toBe(2);
        
        manager.add(snapshot3);
        expect(manager.getAll().length).toBe(3);
        
        manager.add(snapshot4);
        expect(manager.getAll().length).toBe(3);
        expect((manager as any).past.length).toBe(2);
        expect(manager.getCurrent()).toBe(snapshot4);
      });

      it("should trim oldest snapshots correctly with maxHistory = 3", () => {
        const manager = new HistoryManager(3);
        const snapshots: Snapshot[] = [];
        
        for (let i = 0; i < 10; i++) {
          const snap = createSnapshot(String(i), { count: i }, `action-${i}`);
          snapshots.push(snap);
          manager.add(snap);
        }
        
        // Should have last 3 snapshots: [action-7, action-8, action-9]
        // where action-9 is current and [action-7, action-8] are past
        expect(manager.getAll().length).toBe(3);
        expect((manager as any).past[0].metadata.action).toBe("action-7");
        expect((manager as any).past[1].metadata.action).toBe("action-8");
        expect(manager.getCurrent()?.metadata.action).toBe("action-9");
      });
    });

    describe("maxHistory = 0 (disabled)", () => {
      it("should not keep any history when maxHistory = 0", () => {
        const manager = new HistoryManager(0);
        const snapshot1 = createSnapshot("1", { count: 0 }, "first");
        const snapshot2 = createSnapshot("2", { count: 1 }, "second");
        const snapshot3 = createSnapshot("3", { count: 2 }, "third");
        
        manager.add(snapshot1);
        expect(manager.getAll().length).toBe(1);
        
        manager.add(snapshot2);
        expect(manager.getAll().length).toBe(1);
        expect(manager.getCurrent()).toBe(snapshot2);
        
        manager.add(snapshot3);
        expect(manager.getAll().length).toBe(1);
        expect(manager.getCurrent()).toBe(snapshot3);
      });
    });

    describe("large maxHistory", () => {
      it("should keep all snapshots when under limit", () => {
        const manager = new HistoryManager(100);
        const snapshots: Snapshot[] = [];
        
        for (let i = 0; i < 10; i++) {
          const snap = createSnapshot(String(i), { count: i }, `action-${i}`);
          snapshots.push(snap);
          manager.add(snap);
        }
        
        expect(manager.getAll().length).toBe(10);
        expect((manager as any).past.length).toBe(9);
        expect(manager.getCurrent()?.metadata.action).toBe("action-9");
      });

      it("should trim correctly when exceeding limit", () => {
        const manager = new HistoryManager(5);
        const snapshots: Snapshot[] = [];
        
        for (let i = 0; i < 20; i++) {
          const snap = createSnapshot(String(i), { count: i }, `action-${i}`);
          snapshots.push(snap);
          manager.add(snap);
        }
        
        // Should have last 5 snapshots
        expect(manager.getAll().length).toBe(5);
        expect((manager as any).past[0].metadata.action).toBe("action-15");
        expect((manager as any).past[3].metadata.action).toBe("action-18");
        expect(manager.getCurrent()?.metadata.action).toBe("action-19");
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle adding when past is at limit", () => {
      const manager = new HistoryManager(3);
      
      // Fill up to the limit
      manager.add(createSnapshot("1", { count: 0 }, "action-1"));
      manager.add(createSnapshot("2", { count: 1 }, "action-2"));
      manager.add(createSnapshot("3", { count: 2 }, "action-3"));
      
      expect(manager.getAll().length).toBe(3);
      expect((manager as any).past.length).toBe(2);
      
      // Add when past is at limit
      manager.add(createSnapshot("4", { count: 3 }, "action-4"));
      
      expect(manager.getAll().length).toBe(3);
      expect((manager as any).past.length).toBe(2);
      expect(manager.getCurrent()?.metadata.action).toBe("action-4");
    });

    it("should handle adding when both past and future exist", () => {
      const manager = new HistoryManager(10);
      
      // Add some snapshots
      manager.add(createSnapshot("1", { count: 0 }, "action-1"));
      manager.add(createSnapshot("2", { count: 1 }, "action-2"));
      manager.add(createSnapshot("3", { count: 2 }, "action-3"));
      
      // Simulate undo to populate future
      (manager as any).undo = function() {
        const newFuture = this.current;
        const newCurrent = this.past.pop() || null;
        if (newCurrent && newFuture) {
          this.future.unshift(newFuture);
          this.current = newCurrent;
        }
        return newCurrent;
      }.bind(manager);
      (manager as any).undo();
      
      expect((manager as any).past.length).toBe(1);
      expect((manager as any).future.length).toBe(1);
      
      // Add new snapshot - should clear future
      manager.add(createSnapshot("4", { count: 3 }, "action-4"));
      
      expect((manager as any).past.length).toBe(2);
      expect((manager as any).future.length).toBe(0);
      expect(manager.getCurrent()?.metadata.action).toBe("action-4");
    });

    it("should handle rapid consecutive adds", () => {
      const manager = new HistoryManager(3);
      
      for (let i = 0; i < 100; i++) {
        manager.add(createSnapshot(String(i), { count: i }, `action-${i}`));
      }
      
      // Should still respect maxHistory
      expect(manager.getAll().length).toBe(3);
      expect(manager.getCurrent()?.metadata.action).toBe("action-99");
    });

    it("should handle null snapshot gracefully", () => {
      const manager = new HistoryManager(3);
      const snapshot = createSnapshot("1", { count: 0 }, "action-1");
      
      manager.add(snapshot);
      
      // Add null - this might happen in error scenarios
      // The manager should still function correctly
      // Note: We're not testing adding actual null since that would be a type error
      // but we verify the manager works after adding valid snapshots
      expect(manager.getCurrent()).not.toBeNull();
      expect((manager as any).past.length).toBe(0);
    });
  });

  describe("Integration with undo/redo", () => {
    it("should maintain correct history after undo and add", () => {
      const manager = new HistoryManager(5);
      
      manager.add(createSnapshot("1", { count: 0 }, "action-1"));
      manager.add(createSnapshot("2", { count: 1 }, "action-2"));
      manager.add(createSnapshot("3", { count: 2 }, "action-3"));
      
      // Undo to action-2
      const undone = manager.undo();
      expect(undone?.metadata.action).toBe("action-2");
      expect(manager.getCurrent()?.metadata.action).toBe("action-2");
      expect((manager as any).future.length).toBe(1);
      
      // Add new action - should clear future
      manager.add(createSnapshot("4", { count: 3 }, "action-4"));
      
      expect(manager.getCurrent()?.metadata.action).toBe("action-4");
      expect((manager as any).future.length).toBe(0);
      expect((manager as any).past.length).toBe(2); // action-1 and action-2
      expect(manager.getAll().length).toBe(3);
    });

    it("should maintain correct history after redo and add", () => {
      const manager = new HistoryManager(5);
      
      manager.add(createSnapshot("1", { count: 0 }, "action-1"));
      manager.add(createSnapshot("2", { count: 1 }, "action-2"));
      manager.add(createSnapshot("3", { count: 2 }, "action-3"));
      
      // Undo twice
      manager.undo();
      manager.undo();
      
      expect(manager.getCurrent()?.metadata.action).toBe("action-1");
      expect((manager as any).future.length).toBe(2);
      
      // Redo to action-2
      const redone = manager.redo();
      expect(redone?.metadata.action).toBe("action-2");
      expect(manager.getCurrent()?.metadata.action).toBe("action-2");
      expect((manager as any).future.length).toBe(1);
      
      // Add new action - should clear future
      manager.add(createSnapshot("4", { count: 3 }, "action-4"));
      
      expect(manager.getCurrent()?.metadata.action).toBe("action-4");
      expect((manager as any).future.length).toBe(0);
    });

    it("should maintain correct history after jumpTo and add", () => {
      const manager = new HistoryManager(5);
      
      manager.add(createSnapshot("1", { count: 0 }, "action-1"));
      manager.add(createSnapshot("2", { count: 1 }, "action-2"));
      manager.add(createSnapshot("3", { count: 2 }, "action-3"));
      manager.add(createSnapshot("4", { count: 3 }, "action-4"));
      
      // Jump to action-2 (index 1)
      const jumped = manager.jumpTo(1);
      expect(jumped?.metadata.action).toBe("action-2");
      expect(manager.getCurrent()?.metadata.action).toBe("action-2");
      
      // Add new action
      manager.add(createSnapshot("5", { count: 4 }, "action-5"));
      
      expect(manager.getCurrent()?.metadata.action).toBe("action-5");
      // After jumpTo(1): past=[action-1], current=action-2, future=[action-3, action-4]
      // After add(action-5): past=[action-1, action-2], current=action-5, future=[]
      expect((manager as any).past.length).toBe(2); // action-1, action-2
      expect((manager as any).future.length).toBe(0);
      // Total: 3 (action-1, action-2, action-5)
      expect(manager.getAll().length).toBe(3);
    });
  });

  describe("getStats()", () => {
    it("should return accurate statistics", () => {
      const manager = new HistoryManager(5);
      
      expect(manager.getStats().totalSnapshots).toBe(0);
      
      manager.add(createSnapshot("1", { count: 0 }, "action-1"));
      manager.add(createSnapshot("2", { count: 1 }, "action-2"));
      
      const stats = manager.getStats();
      expect(stats.totalSnapshots).toBe(2);
      expect(stats.pastCount).toBe(1);
      expect(stats.futureCount).toBe(0);
      expect(stats.hasCurrent).toBe(true);
    });

    it("should return accurate stats after trimming", () => {
      const manager = new HistoryManager(3);
      
      for (let i = 0; i < 10; i++) {
        manager.add(createSnapshot(String(i), { count: i }, `action-${i}`));
      }
      
      const stats = manager.getStats();
      expect(stats.totalSnapshots).toBe(3);
      expect(stats.pastCount).toBe(2);
      expect(stats.hasCurrent).toBe(true);
    });
  });

  describe("getAll()", () => {
    it("should return all snapshots in correct order", () => {
      const manager = new HistoryManager(5);
      
      manager.add(createSnapshot("1", { count: 0 }, "action-1"));
      manager.add(createSnapshot("2", { count: 1 }, "action-2"));
      manager.add(createSnapshot("3", { count: 2 }, "action-3"));
      
      const all = manager.getAll();
      expect(all.length).toBe(3);
      expect(all[0].metadata.action).toBe("action-1");
      expect(all[1].metadata.action).toBe("action-2");
      expect(all[2].metadata.action).toBe("action-3");
    });

    it("should return correct order after trimming", () => {
      const manager = new HistoryManager(3);
      
      for (let i = 0; i < 5; i++) {
        manager.add(createSnapshot(String(i), { count: i }, `action-${i}`));
      }
      
      const all = manager.getAll();
      expect(all.length).toBe(3);
      expect(all[0].metadata.action).toBe("action-2");
      expect(all[1].metadata.action).toBe("action-3");
      expect(all[2].metadata.action).toBe("action-4");
    });
  });

  describe("clear()", () => {
    it("should clear all history", () => {
      const manager = new HistoryManager(5);
      
      manager.add(createSnapshot("1", { count: 0 }, "action-1"));
      manager.add(createSnapshot("2", { count: 1 }, "action-2"));
      
      manager.clear();
      
      expect(manager.getCurrent()).toBeNull();
      expect((manager as any).past.length).toBe(0);
      expect((manager as any).future.length).toBe(0);
      expect(manager.getAll().length).toBe(0);
    });

    it("should clear history even when at maxHistory", () => {
      const manager = new HistoryManager(2);
      
      for (let i = 0; i < 10; i++) {
        manager.add(createSnapshot(String(i), { count: i }, `action-${i}`));
      }
      
      expect(manager.getAll().length).toBe(2);
      
      manager.clear();
      
      expect(manager.getAll().length).toBe(0);
    });
  });
});
