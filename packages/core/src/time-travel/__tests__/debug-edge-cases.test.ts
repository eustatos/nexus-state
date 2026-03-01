import { describe, it, expect } from "vitest";
import { createStore } from "../../store";
import { SimpleTimeTravel } from "../";
import { atom } from "../../atom";

describe("Debug Edge Cases", () => {
  it("should debug multiple undos", () => {
    const store = createStore([]);
    const counterAtom = atom(0, "counter");
    store.get(counterAtom);

    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    console.log("=== Initial ===");
    console.log("Atom tracked?", timeTravel.getAtomTracker().isTracked(counterAtom));

    const values = [1, 2, 3, 4, 5];

    values.forEach((value) => {
      store.set(counterAtom, value);
      timeTravel.capture(`snap${value}`);
    });

    console.log("\n=== After captures ===");
    console.log("History length:", timeTravel.getHistory().length);
    timeTravel.getHistory().forEach((snap, i) => {
      console.log(`  [${i}] action=${snap.metadata.action}, value=${snap.state.counter?.value}`);
    });
    console.log("Current counter value:", store.get(counterAtom));

    timeTravel.undo();
    timeTravel.undo();
    timeTravel.undo();

    console.log("\n=== After 3 undos ===");
    console.log("Current counter value:", store.get(counterAtom));

    expect(store.get(counterAtom)).toBe(2);
  });
});
