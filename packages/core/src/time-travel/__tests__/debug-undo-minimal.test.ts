import { describe, it, expect } from "vitest";
import { createStore } from "../../store";
import { atom } from "../../atom";
import { SimpleTimeTravel } from "../";

describe("Debug Minimal Undo", () => {
  it("should restore previous value after undo", () => {
    const store = createStore();
    const counter = atom(0, "counter");
    
    // Initialize
    store.set(counter, 0);
    
    const timeTravel = new SimpleTimeTravel(store, {
      autoCapture: false,
      atoms: [counter]
    });
    
    // Capture initial state
    const snap1 = timeTravel.capture("initial");
    console.log("=== After initial capture ===");
    console.log("History length:", timeTravel.getHistory().length);
    console.log("Snapshot 1:", snap1?.metadata.action, "counter value:", snap1?.state.counter?.value);
    
    // Update value
    store.set(counter, 5);
    const snap2 = timeTravel.capture("after set");
    console.log("\n=== After set capture ===");
    console.log("History length:", timeTravel.getHistory().length);
    console.log("Snapshot 2:", snap2?.metadata.action, "counter value:", snap2?.state.counter?.value);
    console.log("Current value:", store.get(counter));
    
    // Undo
    console.log("\n=== Before undo ===");
    console.log("canUndo:", timeTravel.canUndo());
    console.log("Current value:", store.get(counter));
    
    const undoResult = timeTravel.undo();
    
    console.log("\n=== After undo ===");
    console.log("Undo result:", undoResult);
    console.log("Value after undo:", store.get(counter));
    console.log("History length:", timeTravel.getHistory().length);
    
    expect(undoResult).toBe(true);
    expect(store.get(counter)).toBe(0);
  });
});
