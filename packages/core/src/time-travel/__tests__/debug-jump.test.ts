import { describe, it, expect } from "vitest";
import { createStore } from "../../store";
import { SimpleTimeTravel } from "../";
import { atom } from "../../atom";

describe("Debug Jump", () => {
  it("should debug jumpTo", () => {
    const store = createStore([]);
    const counterAtom = atom(0, "counter");
    store.get(counterAtom);

    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    console.log("=== Initial ===");
    console.log("History length:", timeTravel.getHistory().length);

    store.set(counterAtom, 1);
    timeTravel.capture("snap1");
    console.log("\n=== After snap1 ===");
    console.log("History length:", timeTravel.getHistory().length);
    timeTravel.getHistory().forEach((snap, i) => {
      console.log(`  [${i}] action=${snap.metadata.action}, value=${snap.state.counter?.value}`);
    });

    store.set(counterAtom, 2);
    timeTravel.capture("snap2");
    console.log("\n=== After snap2 ===");
    console.log("History length:", timeTravel.getHistory().length);
    timeTravel.getHistory().forEach((snap, i) => {
      console.log(`  [${i}] action=${snap.metadata.action}, value=${snap.state.counter?.value}`);
    });

    store.set(counterAtom, 3);
    timeTravel.capture("snap3");
    console.log("\n=== After snap3 ===");
    console.log("History length:", timeTravel.getHistory().length);
    timeTravel.getHistory().forEach((snap, i) => {
      console.log(`  [${i}] action=${snap.metadata.action}, value=${snap.state.counter?.value}`);
    });

    console.log("\n=== Before jumpTo(1) ===");
    console.log("Current counter value:", store.get(counterAtom));

    timeTravel.jumpTo(1);
    console.log("\n=== After jumpTo(1) ===");
    console.log("Current counter value:", store.get(counterAtom));
    console.log("History length:", timeTravel.getHistory().length);
    timeTravel.getHistory().forEach((snap, i) => {
      console.log(`  [${i}] action=${snap.metadata.action}, value=${snap.state.counter?.value}`);
    });
    console.log("canUndo:", timeTravel.canUndo());
    console.log("canRedo:", timeTravel.canRedo());

    timeTravel.undo();
    console.log("\n=== After undo ===");
    console.log("Current counter value:", store.get(counterAtom));

    timeTravel.redo();
    console.log("\n=== After redo ===");
    console.log("Current counter value:", store.get(counterAtom));

    expect(store.get(counterAtom)).toBe(2);
  });
});
