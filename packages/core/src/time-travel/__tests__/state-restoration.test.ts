import { describe, it, expect, beforeEach } from "vitest";
import { createStore } from "../../store";
import { SimpleTimeTravel } from "../";
import { atom } from "../../atom";

describe("SimpleTimeTravel - State Restoration on Navigation", () => {
  let store: ReturnType<typeof createStore>;
  let timeTravel: SimpleTimeTravel;
  let contentAtom: ReturnType<typeof atom<string>>;
  let testId: string;

  beforeEach(() => {
    testId = Math.random().toString(36).substring(2, 9);
    store = createStore([]);
    contentAtom = atom("", `editor.content.${testId}`);
    store.get(contentAtom);
    
    timeTravel = new SimpleTimeTravel(store, { 
      maxHistory: 100, 
      autoCapture: false 
    });
  });

  describe("jumpTo - State Restoration", () => {
    it("should restore state when jumping from last to first snapshot", () => {
      // Create snapshots
      store.set(contentAtom, "First");
      timeTravel.capture("snap1");
      
      store.set(contentAtom, "Second");
      timeTravel.capture("snap2");
      
      store.set(contentAtom, "Third");
      timeTravel.capture("snap3");
      
      // Verify current state
      expect(store.get(contentAtom)).toBe("Third");
      
      // Jump to first
      const result = timeTravel.jumpTo(0);
      
      expect(result).toBe(true);
      expect(store.get(contentAtom)).toBe("First");
    });

    it("should restore state when jumping from last to middle snapshot", () => {
      store.set(contentAtom, "A");
      timeTravel.capture("snap1");
      
      store.set(contentAtom, "B");
      timeTravel.capture("snap2");
      
      store.set(contentAtom, "C");
      timeTravel.capture("snap3");
      
      // Jump to middle (index 1)
      const result = timeTravel.jumpTo(1);
      
      expect(result).toBe(true);
      expect(store.get(contentAtom)).toBe("B");
    });

    it("should restore state when jumping multiple times", () => {
      for (let i = 1; i <= 5; i++) {
        store.set(contentAtom, `State ${i}`);
        timeTravel.capture(`snap${i}`);
      }
      
      // Jump around
      timeTravel.jumpTo(2);
      expect(store.get(contentAtom)).toBe("State 3");
      
      timeTravel.jumpTo(0);
      expect(store.get(contentAtom)).toBe("State 1");
      
      timeTravel.jumpTo(4);
      expect(store.get(contentAtom)).toBe("State 5");
      
      timeTravel.jumpTo(1);
      expect(store.get(contentAtom)).toBe("State 2");
    });

    it("should restore state when jumping to current position", () => {
      store.set(contentAtom, "Initial");
      timeTravel.capture("snap1");
      
      store.set(contentAtom, "Modified");
      timeTravel.capture("snap2");
      
      // Currently at index 1 (last snapshot)
      // Jump to same position should still restore
      const result = timeTravel.jumpTo(1);
      
      expect(result).toBe(true);
      expect(store.get(contentAtom)).toBe("Modified");
    });

    it("should restore state after undo then jump", () => {
      store.set(contentAtom, "A");
      timeTravel.capture("snap1");
      
      store.set(contentAtom, "B");
      timeTravel.capture("snap2");
      
      store.set(contentAtom, "C");
      timeTravel.capture("snap3");
      
      // Undo to B
      timeTravel.undo();
      expect(store.get(contentAtom)).toBe("B");
      
      // Jump to A
      timeTravel.jumpTo(0);
      expect(store.get(contentAtom)).toBe("A");
      
      // Jump back to C
      timeTravel.jumpTo(2);
      expect(store.get(contentAtom)).toBe("C");
    });

    it("should restore state after redo then jump", () => {
      store.set(contentAtom, "A");
      timeTravel.capture("snap1");
      
      store.set(contentAtom, "B");
      timeTravel.capture("snap2");
      
      // Undo to A
      timeTravel.undo();
      expect(store.get(contentAtom)).toBe("A");
      
      // Redo to B
      timeTravel.redo();
      expect(store.get(contentAtom)).toBe("B");
      
      // Jump to A explicitly
      timeTravel.jumpTo(0);
      expect(store.get(contentAtom)).toBe("A");
    });
  });

  describe("undo/redo - State Restoration", () => {
    it("should restore state on undo", () => {
      store.set(contentAtom, "First");
      timeTravel.capture("snap1");
      
      store.set(contentAtom, "Second");
      timeTravel.capture("snap2");
      
      // Undo
      const result = timeTravel.undo();
      
      expect(result).toBe(true);
      expect(store.get(contentAtom)).toBe("First");
    });

    it("should restore state on redo", () => {
      store.set(contentAtom, "First");
      timeTravel.capture("snap1");
      
      store.set(contentAtom, "Second");
      timeTravel.capture("snap2");
      
      // Undo then redo
      timeTravel.undo();
      expect(store.get(contentAtom)).toBe("First");
      
      const result = timeTravel.redo();
      
      expect(result).toBe(true);
      expect(store.get(contentAtom)).toBe("Second");
    });

    it("should restore state through multiple undo operations", () => {
      for (let i = 1; i <= 5; i++) {
        store.set(contentAtom, `State ${i}`);
        timeTravel.capture(`snap${i}`);
      }
      
      // Undo multiple times
      timeTravel.undo();
      expect(store.get(contentAtom)).toBe("State 4");
      
      timeTravel.undo();
      expect(store.get(contentAtom)).toBe("State 3");
      
      timeTravel.undo();
      expect(store.get(contentAtom)).toBe("State 2");
      
      timeTravel.undo();
      expect(store.get(contentAtom)).toBe("State 1");
    });

    it("should restore state through undo-redo sequence", () => {
      store.set(contentAtom, "A");
      timeTravel.capture("snap1");
      
      store.set(contentAtom, "B");
      timeTravel.capture("snap2");
      
      store.set(contentAtom, "C");
      timeTravel.capture("snap3");
      
      // Undo to B
      timeTravel.undo();
      expect(store.get(contentAtom)).toBe("B");
      
      // Redo to C
      timeTravel.redo();
      expect(store.get(contentAtom)).toBe("C");
      
      // Undo to B again
      timeTravel.undo();
      expect(store.get(contentAtom)).toBe("B");
      
      // Undo to A
      timeTravel.undo();
      expect(store.get(contentAtom)).toBe("A");
    });
  });

  describe("Multiple Atoms Restoration", () => {
    let cursorLineAtom: ReturnType<typeof atom<number>>;
    let cursorColAtom: ReturnType<typeof atom<number>>;

    beforeEach(() => {
      cursorLineAtom = atom(0, `editor.cursor.line.${testId}`);
      cursorColAtom = atom(0, `editor.cursor.col.${testId}`);
      store.get(cursorLineAtom);
      store.get(cursorColAtom);
    });

    it("should restore multiple atoms on jumpTo", () => {
      // Create snapshot with specific state
      store.set(contentAtom, "Hello");
      store.set(cursorLineAtom, 0);
      store.set(cursorColAtom, 5);
      timeTravel.capture("snap1");
      
      // Change state
      store.set(contentAtom, "Hello World");
      store.set(cursorLineAtom, 0);
      store.set(cursorColAtom, 11);
      timeTravel.capture("snap2");
      
      // Jump back
      timeTravel.jumpTo(0);
      
      expect(store.get(contentAtom)).toBe("Hello");
      expect(store.get(cursorLineAtom)).toBe(0);
      expect(store.get(cursorColAtom)).toBe(5);
    });

    it("should restore multiple atoms on undo", () => {
      store.set(contentAtom, "First");
      store.set(cursorLineAtom, 0);
      store.set(cursorColAtom, 0);
      timeTravel.capture("snap1");
      
      store.set(contentAtom, "Second");
      store.set(cursorLineAtom, 1);
      store.set(cursorColAtom, 5);
      timeTravel.capture("snap2");
      
      // Undo
      timeTravel.undo();
      
      expect(store.get(contentAtom)).toBe("First");
      expect(store.get(cursorLineAtom)).toBe(0);
      expect(store.get(cursorColAtom)).toBe(0);
    });

    it("should restore multiple atoms through navigation sequence", () => {
      // State 1
      store.set(contentAtom, "A");
      store.set(cursorLineAtom, 0);
      store.set(cursorColAtom, 0);
      timeTravel.capture("snap1");
      
      // State 2
      store.set(contentAtom, "B");
      store.set(cursorLineAtom, 1);
      store.set(cursorColAtom, 0);
      timeTravel.capture("snap2");
      
      // State 3
      store.set(contentAtom, "C");
      store.set(cursorLineAtom, 2);
      store.set(cursorColAtom, 0);
      timeTravel.capture("snap3");
      
      // Navigate: 3 -> 1 -> 2
      timeTravel.jumpTo(0);
      expect(store.get(contentAtom)).toBe("A");
      expect(store.get(cursorLineAtom)).toBe(0);
      expect(store.get(cursorColAtom)).toBe(0);
      
      timeTravel.jumpTo(1);
      expect(store.get(contentAtom)).toBe("B");
      expect(store.get(cursorLineAtom)).toBe(1);
      expect(store.get(cursorColAtom)).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle jumpTo with empty history", () => {
      const result = timeTravel.jumpTo(0);
      expect(result).toBe(false);
    });

    it("should handle jumpTo with invalid index", () => {
      store.set(contentAtom, "Test");
      timeTravel.capture("snap1");
      
      expect(timeTravel.jumpTo(-1)).toBe(false);
      expect(timeTravel.jumpTo(100)).toBe(false);
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

    it("should maintain state consistency after rapid navigation", () => {
      for (let i = 1; i <= 10; i++) {
        store.set(contentAtom, `State ${i}`);
        timeTravel.capture(`snap${i}`);
      }
      
      // Rapid navigation
      timeTravel.jumpTo(5);
      timeTravel.jumpTo(2);
      timeTravel.jumpTo(8);
      timeTravel.jumpTo(0);
      timeTravel.jumpTo(9);
      
      expect(store.get(contentAtom)).toBe("State 10");
      
      timeTravel.jumpTo(4);
      expect(store.get(contentAtom)).toBe("State 5");
    });
  });
});
