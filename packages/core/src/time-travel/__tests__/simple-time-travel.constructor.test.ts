import { describe, it, expect, beforeEach } from "vitest";
import { createStore } from "../../store";
import { SimpleTimeTravel } from "../";
import { atom } from "../../atom";
import { atomRegistry } from "../../atom-registry";

describe("SimpleTimeTravel - Constructor", () => {
  beforeEach(() => {
    atomRegistry.clear();
  });
  // Helper to create a test store with time travel
  const createTimeTravelStore = (maxHistory = 10, autoCapture = true) => {
    const store = createStore([]);

    const counterAtom = atom(0, "counter");
    const textAtom = atom("hello", "text");

    store.get(counterAtom);
    store.get(textAtom);

    const timeTravel = new SimpleTimeTravel(store, {
      maxHistory,
      autoCapture,
      atoms: [counterAtom, textAtom],
    });

    return { store, timeTravel, counterAtom, textAtom };
  };

  // Helper to convert atom values to SnapshotStateEntry format
  const toSnapshotEntry = (
    value: any,
    type: "primitive" | "computed" | "writable" = "primitive",
    name?: string,
  ) => ({
    value,
    type,
    name,
  });

  it("should capture initial state when autoCapture is true", () => {
    const { timeTravel } = createTimeTravelStore(10, true);

    const history = timeTravel.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].metadata).toMatchObject({
      action: "initial",
      atomCount: 2,
    });
  });

  it("should capture initial state even when autoCapture is false", () => {
    const { timeTravel } = createTimeTravelStore(10, false);

    const history = timeTravel.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].metadata).toMatchObject({
      action: "initial",
      atomCount: 2,
    });
  });

  it("should wrap store.set for auto-capture", () => {
    const { store, timeTravel } = createTimeTravelStore(10, true);
    const { counterAtom } = createTimeTravelStore(10, true);

    timeTravel.clearHistory();

    store.set(counterAtom, 5);

    const history = timeTravel.getHistory();
    expect(history.length).toBe(1); // only snapshot after set
    expect(history[0].metadata.action).toBe("set counter");
  });

  it("should not capture during time travel operations", () => {
    const { store, timeTravel, counterAtom } = createTimeTravelStore(10, true);

    timeTravel.clearHistory();

    store.set(counterAtom, 5);
    expect(timeTravel.getHistory().length).toBe(1);

    // Undo requires at least 2 snapshots in history
    // First, capture again to have something to undo to
    timeTravel.capture("snap2");
    expect(timeTravel.getHistory().length).toBe(2);

    timeTravel.undo();

    expect(timeTravel.getHistory().length).toBe(2); // history unchanged after undo (just navigates)
});
});
