import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStore } from "../../store";
import { SimpleTimeTravel } from "../";
import { atom } from "../../atom";

/**
 * Tests for debugging state restoration issues
 * These tests reproduce the bugs found in E2E tests
 */
describe("State Restoration Debug", () => {
  let store: ReturnType<typeof createStore>;
  let timeTravel: SimpleTimeTravel;
  let contentAtom: ReturnType<typeof atom<string>>;
  let testId: string;

  beforeEach(() => {
    testId = Math.random().toString(36).substring(2, 9);
    store = createStore([]);
    contentAtom = atom("", `debug.content.${testId}`);
    store.get(contentAtom);
    
    timeTravel = new SimpleTimeTravel(store, { 
      maxHistory: 100, 
      autoCapture: false 
    });
  });

  describe("Store Subscription on Restore", () => {
    it("should notify store subscribers on restore", () => {
      const listener = vi.fn();
      
      // Subscribe to contentAtom changes
      const unsubscribe = store.subscribe(contentAtom, listener);
      
      // Create snapshots
      store.set(contentAtom, "Original");
      timeTravel.capture("snap1");
      
      store.set(contentAtom, "Modified");
      timeTravel.capture("snap2");
      
      // Clear listener calls from initial setup
      listener.mockClear();
      
      // Restore - listener SHOULD be called
      timeTravel.jumpTo(0);
      
      expect(listener).toHaveBeenCalled();
      expect(store.get(contentAtom)).toBe("Original");
      
      unsubscribe();
    });

    it("should notify subscribers on undo", () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(contentAtom, listener);
      
      store.set(contentAtom, "A");
      timeTravel.capture("snap1");
      
      store.set(contentAtom, "B");
      timeTravel.capture("snap2");
      
      listener.mockClear();
      
      // Undo - listener SHOULD be called
      timeTravel.undo();
      
      expect(listener).toHaveBeenCalled();
      expect(store.get(contentAtom)).toBe("A");
      
      unsubscribe();
    });

    it("should notify subscribers on redo", () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(contentAtom, listener);
      
      store.set(contentAtom, "A");
      timeTravel.capture("snap1");
      
      store.set(contentAtom, "B");
      timeTravel.capture("snap2");
      
      // Undo first
      timeTravel.undo();
      listener.mockClear();
      
      // Redo - listener SHOULD be called
      timeTravel.redo();
      
      expect(listener).toHaveBeenCalled();
      expect(store.get(contentAtom)).toBe("B");
      
      unsubscribe();
    });

    it("should notify subscribers on multiple jumps", () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(contentAtom, listener);
      
      // Create multiple snapshots
      for (let i = 1; i <= 3; i++) {
        store.set(contentAtom, `State ${i}`);
        timeTravel.capture(`snap${i}`);
      }
      
      listener.mockClear();
      
      // Jump to first
      timeTravel.jumpTo(0);
      expect(listener).toHaveBeenCalled();
      expect(store.get(contentAtom)).toBe("State 1");
      
      listener.mockClear();
      
      // Jump to last - listener SHOULD be called
      timeTravel.jumpTo(2);
      expect(listener).toHaveBeenCalled();
      expect(store.get(contentAtom)).toBe("State 3");
      
      unsubscribe();
    });
  });

  describe("SnapshotRestorer Atom Lookup", () => {
    it("should find atom by name during restore", () => {
      const namedAtom = atom("initial", `debug.named.${testId}`);
      store.get(namedAtom);
      
      store.set(namedAtom, "Value1");
      timeTravel.capture("snap1");
      
      store.set(namedAtom, "Value2");
      timeTravel.capture("snap2");
      
      // Restore
      timeTravel.jumpTo(0);
      
      expect(store.get(namedAtom)).toBe("Value1");
    });

    it("should restore multiple atoms", () => {
      const atom1 = atom("", `debug.atom1.${testId}`);
      const atom2 = atom(0, `debug.atom2.${testId}`);
      store.get(atom1);
      store.get(atom2);
      
      // Create snapshot
      store.set(atom1, "Text");
      store.set(atom2, 42);
      timeTravel.capture("snap1");
      
      // Change values
      store.set(atom1, "Modified");
      store.set(atom2, 100);
      timeTravel.capture("snap2");
      
      // Restore
      timeTravel.jumpTo(0);
      
      expect(store.get(atom1)).toBe("Text");
      expect(store.get(atom2)).toBe(42);
    });

    it("should restore atom with object value", () => {
      const lineAtom = atom(0, `debug.obj.line.${testId}`);
      const colAtom = atom(0, `debug.obj.col.${testId}`);
      store.get(lineAtom);
      store.get(colAtom);
      
      store.set(lineAtom, 0);
      store.set(colAtom, 5);
      timeTravel.capture("snap1");
      
      store.set(lineAtom, 1);
      store.set(colAtom, 10);
      timeTravel.capture("snap2");
      
      // Restore
      timeTravel.jumpTo(0);
      
      expect(store.get(lineAtom)).toBe(0);
      expect(store.get(colAtom)).toBe(5);
    });
  });

  describe("History State After Navigation", () => {
    it("should maintain correct history after jump", () => {
      for (let i = 1; i <= 5; i++) {
        store.set(contentAtom, `State ${i}`);
        timeTravel.capture(`snap${i}`);
      }
      
      // Jump to middle
      timeTravel.jumpTo(2);
      
      // Check history is intact
      const history = timeTravel.getHistory();
      expect(history.length).toBe(5);
      
      // Check canUndo/canRedo
      expect(timeTravel.canUndo()).toBe(true);
      expect(timeTravel.canRedo()).toBe(true);
      
      // Jump to last
      timeTravel.jumpTo(4);
      
      expect(timeTravel.canUndo()).toBe(true);
      expect(timeTravel.canRedo()).toBe(false);
      
      // Jump to first
      timeTravel.jumpTo(0);
      
      expect(timeTravel.canUndo()).toBe(false);
      expect(timeTravel.canRedo()).toBe(true);
    });

    it("should update canUndo/canRedo after undo/redo", () => {
      store.set(contentAtom, "A");
      timeTravel.capture("snap1");
      
      store.set(contentAtom, "B");
      timeTravel.capture("snap2");
      
      // Initially at last
      expect(timeTravel.canUndo()).toBe(true);
      expect(timeTravel.canRedo()).toBe(false);
      
      // Undo
      timeTravel.undo();
      expect(timeTravel.canUndo()).toBe(false);
      expect(timeTravel.canRedo()).toBe(true);
      
      // Redo
      timeTravel.redo();
      expect(timeTravel.canUndo()).toBe(true);
      expect(timeTravel.canRedo()).toBe(false);
    });
  });

  describe("Rapid Navigation", () => {
    it("should handle rapid jumps correctly", () => {
      for (let i = 1; i <= 5; i++) {
        store.set(contentAtom, `State ${i}`);
        timeTravel.capture(`snap${i}`);
      }
      
      // Rapid jumps
      timeTravel.jumpTo(0);
      expect(store.get(contentAtom)).toBe("State 1");
      
      timeTravel.jumpTo(4);
      expect(store.get(contentAtom)).toBe("State 5");
      
      timeTravel.jumpTo(2);
      expect(store.get(contentAtom)).toBe("State 3");
      
      timeTravel.jumpTo(1);
      expect(store.get(contentAtom)).toBe("State 2");
    });

    it("should handle rapid undo/redo", () => {
      store.set(contentAtom, "A");
      timeTravel.capture("snap1");
      
      store.set(contentAtom, "B");
      timeTravel.capture("snap2");
      
      store.set(contentAtom, "C");
      timeTravel.capture("snap3");
      
      // Rapid undo
      timeTravel.undo();
      expect(store.get(contentAtom)).toBe("B");
      
      timeTravel.undo();
      expect(store.get(contentAtom)).toBe("A");
      
      // Rapid redo
      timeTravel.redo();
      expect(store.get(contentAtom)).toBe("B");
      
      timeTravel.redo();
      expect(store.get(contentAtom)).toBe("C");
    });
  });

  describe("Edge Cases", () => {
    it("should handle jump to current position", () => {
      store.set(contentAtom, "Test");
      timeTravel.capture("snap1");
      
      // Jump to same position (we're already at index 0)
      const result = timeTravel.jumpTo(0);
      
      expect(result).toBe(true);
      expect(store.get(contentAtom)).toBe("Test");
    });

    it("should handle jump with invalid index", () => {
      store.set(contentAtom, "Test");
      timeTravel.capture("snap1");
      
      // Invalid indices
      expect(timeTravel.jumpTo(-1)).toBe(false);
      expect(timeTravel.jumpTo(100)).toBe(false);
      
      // State should be unchanged
      expect(store.get(contentAtom)).toBe("Test");
    });

    it("should handle undo with no history", () => {
      const result = timeTravel.undo();
      expect(result).toBe(false);
    });

    it("should handle redo with no future", () => {
      store.set(contentAtom, "Test");
      timeTravel.capture("snap1");
      
      const result = timeTravel.redo();
      expect(result).toBe(false);
    });
  });
});
