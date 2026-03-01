import { describe, it, expect } from "vitest";
import { createStore } from "../../store";
import { atom } from "../../atom";
import { SimpleTimeTravel } from "../";

describe("Debug Full", () => {
  it("should debug full undo flow", async () => {
    const store = createStore();
    const counterAtom = atom(0, "counter");
    store.set(counterAtom, 0);
    
    const timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 10,
      autoCapture: true,
      atoms: [counterAtom],
    });

    console.log("=== Initial ===");
    console.log("Atom tracked?", timeTravel.getAtomTracker().isTracked(counterAtom));
    console.log("History length:", timeTravel.getHistory().length);
    timeTravel.getHistory().forEach((snap, i) => {
      console.log(`  [${i}] action=${snap.metadata.action}, value=${snap.state.counter?.value}`);
    });
    console.log("Current counter value:", store.get(counterAtom));

    store.set(counterAtom, 5);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log("\n=== After set to 5 ===");
    console.log("History length:", timeTravel.getHistory().length);
    timeTravel.getHistory().forEach((snap, i) => {
      console.log(`  [${i}] action=${snap.metadata.action}, value=${snap.state.counter?.value}`);
    });
    console.log("Current counter value:", store.get(counterAtom));

    const undoResult = timeTravel.undo();
    
    console.log("\n=== After undo ===");
    console.log("Undo result:", undoResult);
    console.log("History length:", timeTravel.getHistory().length);
    timeTravel.getHistory().forEach((snap, i) => {
      console.log(`  [${i}] action=${snap.metadata.action}, value=${snap.state.counter?.value}`);
    });
    console.log("Current counter value:", store.get(counterAtom));
    console.log("canUndo:", timeTravel.canUndo());
    console.log("canRedo:", timeTravel.canRedo());

    expect(store.get(counterAtom)).toBe(0);
  });
});
