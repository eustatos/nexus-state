import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStore } from "../../store";
import { SimpleTimeTravel } from "../";
import { atom } from "../../atom";
import { atomRegistry } from "../../atom-registry";

describe("SimpleTimeTravel - Metadata", () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  const createTimeTravelStore = (maxHistory = 10, autoCapture = true) => {
    const store = createStore();

    // Create atoms with unique names
    const counterAtom = atom(0, "counter");
    const textAtom = atom("hello", "text");

    // Initialize atoms in store
    store.set(counterAtom, 0);
    store.set(textAtom, "hello");

    const timeTravel = new SimpleTimeTravel(store, {
      maxHistory,
      autoCapture,
      atoms: [counterAtom, textAtom],
    });

    return { store, timeTravel, counterAtom, textAtom };
  };

  it("should track atom count in metadata", () => {
    const { store, timeTravel, counterAtom, textAtom } = createTimeTravelStore(
      10,
      false,
    );

    // Set values
    store.set(counterAtom, 5);
    store.set(textAtom, "updated");

    // Manually capture
    const snapshot = timeTravel.capture("test capture");

    expect(snapshot).toBeDefined();
    expect(snapshot?.metadata.atomCount).toBe(2);
  });

  it("should include timestamp in metadata", () => {
    const { store, timeTravel, counterAtom } = createTimeTravelStore(10, false);

    store.set(counterAtom, 5);

    const before = Date.now();
    const snapshot = timeTravel.capture("test");
    const after = Date.now();

    expect(snapshot).toBeDefined();
    expect(snapshot?.metadata.timestamp).toBeGreaterThanOrEqual(before);
    expect(snapshot?.metadata.timestamp).toBeLessThanOrEqual(after);
  });

  it("should include action name in metadata when provided", () => {
    const { store, timeTravel, counterAtom } = createTimeTravelStore(10, false);

    store.set(counterAtom, 5);
    const snapshot = timeTravel.capture("custom action");

    expect(snapshot).toBeDefined();
    expect(snapshot?.metadata.action).toBe("custom action");
  });

  it("should have undefined action when not provided", () => {
    const { store, timeTravel, counterAtom } = createTimeTravelStore(10, false);

    store.set(counterAtom, 5);
    const snapshot = timeTravel.capture();

    expect(snapshot).toBeDefined();
    expect(snapshot?.metadata.action).toBeUndefined();
  });

  it("should auto-capture when autoCapture is enabled", () => {
    const { store, timeTravel, counterAtom } = createTimeTravelStore(10, true);

    const captureSpy = vi.spyOn(timeTravel, "capture");

    store.set(counterAtom, 5);

    expect(captureSpy).toHaveBeenCalled();
  });

  it("should not auto-capture when autoCapture is disabled", () => {
    const { store, timeTravel, counterAtom } = createTimeTravelStore(10, false);

    const captureSpy = vi.spyOn(timeTravel, "capture");

    store.set(counterAtom, 5);

    expect(captureSpy).not.toHaveBeenCalled();
  });

  it("should not capture during time travel", () => {
    const { store, timeTravel, counterAtom } = createTimeTravelStore(10, true);

    // Create spy on capture method BEFORE any operations
    const captureSpy = vi.spyOn(timeTravel, "capture");

    // Clear any previous calls
    captureSpy.mockClear();

    // Create two snapshots to enable undo
    store.set(counterAtom, 5); // First snapshot (auto-captured)
    store.set(counterAtom, 7); // Second snapshot (auto-captured)

    // Verify that capture was called for the sets
    expect(captureSpy).toHaveBeenCalledTimes(2);

    // Clear the spy to reset call count
    captureSpy.mockClear();

    // Now perform undo - this should set isTimeTraveling=true during restoration
    const undoResult = timeTravel.undo();
    expect(undoResult).toBe(true);

    // During undo, capture should not be called for the restoration
    expect(captureSpy).not.toHaveBeenCalled();

    // Clear spy again
    captureSpy.mockClear();

    // Now try to change state - this should NOT capture because we're still in time travel?
    // Actually, undo is complete, so this should capture
    store.set(counterAtom, 10);

    // This should capture because undo is complete
    expect(captureSpy).toHaveBeenCalledTimes(1);
  });
});
