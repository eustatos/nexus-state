import { describe, it, expect, beforeEach } from "vitest";
import { createStore } from "../../store";
import { SimpleTimeTravel } from "../";
import { atom } from "../../atom";

describe("SimpleTimeTravel - Editor Restore", () => {
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

  it("should restore content atom after jumpTo", () => {
    store.set(contentAtom, "Hello");
    timeTravel.capture("edit-1");
    
    store.set(contentAtom, "Hello World");
    timeTravel.capture("edit-2");
    
    store.set(contentAtom, "Hello World!");
    timeTravel.capture("edit-3");
    
    expect(store.get(contentAtom)).toBe("Hello World!");
    
    const result = timeTravel.jumpTo(0);
    
    expect(result).toBe(true);
    expect(store.get(contentAtom)).toBe("Hello");
  });

  it("should handle undo after jumpTo", () => {
    store.set(contentAtom, "A");
    timeTravel.capture("edit-1");
    
    store.set(contentAtom, "B");
    timeTravel.capture("edit-2");
    
    store.set(contentAtom, "C");
    timeTravel.capture("edit-3");
    
    // Jump to middle (index 1 = "B")
    timeTravel.jumpTo(1);
    expect(store.get(contentAtom)).toBe("B");
    
    // Undo should work
    const undoResult = timeTravel.undo();
    expect(undoResult).toBe(true);
    expect(store.get(contentAtom)).toBe("A");
  });

  it("should handle redo after jumpTo", () => {
    store.set(contentAtom, "A");
    timeTravel.capture("edit-1");
    
    store.set(contentAtom, "B");
    timeTravel.capture("edit-2");
    
    // Jump to first
    timeTravel.jumpTo(0);
    
    // Redo should work
    const redoResult = timeTravel.redo();
    expect(redoResult).toBe(true);
    expect(store.get(contentAtom)).toBe("B");
  });

  it("should maintain history structure after multiple jumps", () => {
    for (let i = 1; i <= 5; i++) {
      store.set(contentAtom, `State ${i}`);
      timeTravel.capture(`edit-${i}`);
    }
    
    const history = timeTravel.getHistory();
    expect(history.length).toBe(5);
    
    // Jump to middle (index 2 = "State 3")
    timeTravel.jumpTo(2);
    expect(store.get(contentAtom)).toBe("State 3");
    
    timeTravel.jumpTo(0);
    expect(store.get(contentAtom)).toBe("State 1");
    
    timeTravel.jumpTo(4);
    expect(store.get(contentAtom)).toBe("State 5");
    
    const finalHistory = timeTravel.getHistory();
    expect(finalHistory.length).toBe(5);
  });

  it("should restore state with named atoms correctly", () => {
    const namedAtom = atom("initial", `test.named.atom.${testId}`);
    store.get(namedAtom);
    
    store.set(namedAtom, "value1");
    timeTravel.capture("snap1");
    
    store.set(namedAtom, "value2");
    timeTravel.capture("snap2");
    
    timeTravel.jumpTo(0);
    expect(store.get(namedAtom)).toBe("value1");
  });
});
