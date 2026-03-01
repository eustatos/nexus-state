import { describe, it, expect, beforeEach, vi } from "vitest";
import { createStore } from "../../store";
import { atom } from "../../atom";
import { SimpleTimeTravel } from "../";
import { atomRegistry } from "../../atom-registry";

// Wait for auto-capture to happen (replaces setTimeout)
function waitForAutoCapture(
  timeTravel: SimpleTimeTravel,
  expectedHistoryLength: number,
  timeout = 500,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      if (timeTravel.getHistory().length >= expectedHistoryLength) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(
          new Error(
            `Timeout waiting for history length ${expectedHistoryLength} after ${timeout}ms`,
          ),
        );
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
}

describe("SimpleTimeTravel - Undo/Redo", () => {
  beforeEach(() => {
    atomRegistry.clear();
  });
  const createTimeTravelStore = (maxHistory = 10, autoCapture = false) => {
    const store = createStore();

    // Create atoms with proper initialization
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

  describe("undo", () => {
    it("should undo to previous state", async () => {
      const { store, timeTravel, counterAtom } = createTimeTravelStore(
        10,
        true,
      );

      store.set(counterAtom, 5);

      // Wait for auto-capture to happen
      await waitForAutoCapture(timeTravel, 2);

      const result = timeTravel.undo();

      expect(result).toBe(true);
      expect(store.get(counterAtom)).toBe(0);
    });

    it("should return false when no undo available", () => {
      const { timeTravel } = createTimeTravelStore(10, false);

      expect(timeTravel.undo()).toBe(false);
    });

    it("should move current snapshot to future after undo", async () => {
      const { store, timeTravel, counterAtom } = createTimeTravelStore(
        10,
        true,
      );

      store.set(counterAtom, 5);

      await waitForAutoCapture(timeTravel, 2);
      timeTravel.undo();

      expect(timeTravel.canRedo()).toBe(true);
      expect(timeTravel.getHistory().length).toBe(2); // initial + snapshot after set
    });

    it("should handle multiple undos", async () => {
      const { store, timeTravel, counterAtom } = createTimeTravelStore(
        10,
        true,
      );

      // Set values with waits for auto-capture
      store.set(counterAtom, 1);
      await waitForAutoCapture(timeTravel, 2);

      store.set(counterAtom, 2);
      await waitForAutoCapture(timeTravel, 3);

      store.set(counterAtom, 3);
      await waitForAutoCapture(timeTravel, 4);

      timeTravel.undo();
      expect(store.get(counterAtom)).toBe(2);

      timeTravel.undo();
      expect(store.get(counterAtom)).toBe(1);

      timeTravel.undo();
      expect(store.get(counterAtom)).toBe(0);
    });
  });

  describe("redo", () => {
    it("should redo after undo", async () => {
      const { store, timeTravel, counterAtom } = createTimeTravelStore(
        10,
        true,
      );

      store.set(counterAtom, 5);

      await waitForAutoCapture(timeTravel, 2);
      timeTravel.undo();
      expect(store.get(counterAtom)).toBe(0);

      const result = timeTravel.redo();

      expect(result).toBe(true);
      expect(store.get(counterAtom)).toBe(5);
    });

    it("should return false when no redo available", () => {
      const { timeTravel } = createTimeTravelStore(10, false);

      expect(timeTravel.redo()).toBe(false);
    });

    it("should handle multiple redos", async () => {
      const { store, timeTravel, counterAtom } = createTimeTravelStore(
        10,
        true,
      );

      // Set values with waits for auto-capture
      store.set(counterAtom, 1);
      await waitForAutoCapture(timeTravel, 2);

      store.set(counterAtom, 2);
      await waitForAutoCapture(timeTravel, 3);

      store.set(counterAtom, 3);
      await waitForAutoCapture(timeTravel, 4);

      timeTravel.undo();
      timeTravel.undo();
      expect(store.get(counterAtom)).toBe(1);

      timeTravel.redo();
      expect(store.get(counterAtom)).toBe(2);

      timeTravel.redo();
      expect(store.get(counterAtom)).toBe(3);
    });
  });
});
