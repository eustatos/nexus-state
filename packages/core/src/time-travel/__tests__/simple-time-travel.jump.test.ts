import { describe, it, expect } from "vitest";
import { createStore } from "../../store";
import { SimpleTimeTravel } from "../";
import { atom } from "../../atom";

describe("SimpleTimeTravel - Jump", () => {
  const createTimeTravelStore = (maxHistory = 10, autoCapture = false) => {
    const store = createStore([]);

    const counterAtom = atom(0, "counter");

    store.get(counterAtom);

    const timeTravel = new SimpleTimeTravel(store, { maxHistory, autoCapture });

    (timeTravel as any).atoms = { counterAtom };

    return { store, timeTravel };
  };

  it("should jump to specific snapshot by index", () => {
    const { store, timeTravel } = createTimeTravelStore();
    const { counterAtom } = (timeTravel as any).atoms;

    store.set(counterAtom, 1);
    timeTravel.capture("snap1");
    store.set(counterAtom, 2);
    timeTravel.capture("snap2");
    store.set(counterAtom, 3);
    timeTravel.capture("snap3");

    const result = timeTravel.jumpTo(0);

    expect(result).toBe(true);
    expect(store.get(counterAtom)).toBe(1);

    timeTravel.jumpTo(2);
    expect(store.get(counterAtom)).toBe(3);
  });

  it("should return false for invalid index", () => {
    const { store, timeTravel } = createTimeTravelStore();
    const { counterAtom } = (timeTravel as any).atoms;

    store.set(counterAtom, 1);
    timeTravel.capture("snap1");

    expect(timeTravel.jumpTo(-1)).toBe(false);
    expect(timeTravel.jumpTo(5)).toBe(false);
  });

  it("should reconstruct past and future correctly after jump", () => {
    const { store, timeTravel } = createTimeTravelStore();
    const { counterAtom } = (timeTravel as any).atoms;

    store.set(counterAtom, 1);
    timeTravel.capture("snap1");
    store.set(counterAtom, 2);
    timeTravel.capture("snap2");
    store.set(counterAtom, 3);
    timeTravel.capture("snap3");

    timeTravel.jumpTo(1);

    expect(timeTravel.canUndo()).toBe(true);
    expect(timeTravel.canRedo()).toBe(true);
  });

  it("should handle jump to first snapshot", () => {
    const { store, timeTravel } = createTimeTravelStore();
    const { counterAtom } = (timeTravel as any).atoms;

    store.set(counterAtom, 1);
    timeTravel.capture("snap1");
    store.set(counterAtom, 2);
    timeTravel.capture("snap2");

    const jumpResult = timeTravel.jumpTo(0);

    expect(jumpResult).toBe(true);
    expect(timeTravel.canUndo()).toBe(false);
    expect(timeTravel.canRedo()).toBe(true);
  });

  it("should handle jump to last snapshot", () => {
    const { store, timeTravel } = createTimeTravelStore();
    const { counterAtom } = (timeTravel as any).atoms;

    store.set(counterAtom, 1);
    timeTravel.capture("snap1");
    store.set(counterAtom, 2);
    timeTravel.capture("snap2");

    timeTravel.jumpTo(1);

    expect(store.get(counterAtom)).toBe(2);
    expect(timeTravel.canUndo()).toBe(true);
    expect(timeTravel.canRedo()).toBe(false);
  });
});
