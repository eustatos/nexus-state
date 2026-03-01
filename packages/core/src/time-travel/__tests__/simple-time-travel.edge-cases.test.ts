import { describe, it, expect } from "vitest";
import { createStore } from "../../store";
import { SimpleTimeTravel } from "../";
import { atom } from "../../atom";

describe("SimpleTimeTravel - Edge Cases", () => {
  it("should handle capture with no atoms in store", () => {
    const store = createStore([]);
    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    const snapshot = timeTravel.capture("empty");

    expect(snapshot).toBeUndefined();
  });

  it("should handle rapid snapshots with max history", () => {
    const store = createStore([]);
    const counterAtom = atom(0, "counter");
    store.get(counterAtom);

    const timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 5,
      autoCapture: false,
    });

    for (let i = 0; i < 10; i++) {
      store.set(counterAtom, i);
      timeTravel.capture(`snap${i}`);
    }

    const history = timeTravel.getHistory();
    expect(history.length).toBe(5);
    expect(history[0].metadata.action).toBe("snap5");
    expect(history[4].metadata.action).toBe("snap9");
  });

  it("should preserve state after failed operations", () => {
    const store = createStore([]);
    const counterAtom = atom(0, "counter");
    store.get(counterAtom);

    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    store.set(counterAtom, 5);
    const currentValue = store.get(counterAtom);

    timeTravel.undo();

    expect(store.get(counterAtom)).toBe(currentValue);

    timeTravel.redo();

    expect(store.get(counterAtom)).toBe(currentValue);
  });

  it("should handle multiple undos and redos correctly", () => {
    const store = createStore([]);
    const counterAtom = atom(0, "counter");
    store.get(counterAtom);

    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    const values = [1, 2, 3, 4, 5];

    values.forEach((value) => {
      store.set(counterAtom, value);
      timeTravel.capture(`snap${value}`);
    });

    // Verify undo works
    timeTravel.undo();
    expect(timeTravel.canRedo()).toBe(true);

    timeTravel.undo();
    timeTravel.undo();

    // Verify redo works
    timeTravel.redo();
    expect(timeTravel.canRedo()).toBe(true);
    timeTravel.redo();

    // New capture after undo should clear redo history
    store.set(counterAtom, 10);
    timeTravel.capture("new");

    expect(timeTravel.canRedo()).toBe(false);
  });

  it("should handle capture when no changes occurred", () => {
    const store = createStore([]);
    const counterAtom = atom(0, "counter");

    // Pass atoms to constructor so they are tracked before initial capture
    const timeTravel = new SimpleTimeTravel(store, { 
      autoCapture: false,
      atoms: [counterAtom],
    });

    // First capture creates initial snapshot
    const snap1 = timeTravel.capture("snap1");

    // Second capture also creates snapshot (implementation always creates snapshot when action is provided)
    const snap2 = timeTravel.capture("snap2");

    // Both snapshots should be defined when action names are provided and atoms are tracked
    expect(snap1).toBeDefined();
    expect(snap2).toBeDefined();
  });
});
