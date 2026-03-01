import { describe, it, expect } from "vitest";
import { createStore } from "../../store";
import { SimpleTimeTravel } from "../";
import { atom } from "../../atom";

describe("SimpleTimeTravel - History Management", () => {
  const createTimeTravelStore = (maxHistory = 10, autoCapture = false) => {
    const store = createStore([]);

    const counterAtom = atom(0, "counter");

    store.get(counterAtom);

    const timeTravel = new SimpleTimeTravel(store, { maxHistory, autoCapture });

    (timeTravel as any).atoms = { counterAtom };

    return { store, timeTravel };
  };

  describe("clearHistory", () => {
    it("should clear all snapshots", () => {
      const { store, timeTravel } = createTimeTravelStore();
      const { counterAtom } = (timeTravel as any).atoms;

      store.set(counterAtom, 1);
      timeTravel.capture("snap1");
      store.set(counterAtom, 2);
      timeTravel.capture("snap2");

      expect(timeTravel.getHistory().length).toBe(2);

      timeTravel.clearHistory();

      expect(timeTravel.getHistory().length).toBe(0);
      expect(timeTravel.canUndo()).toBe(false);
      expect(timeTravel.canRedo()).toBe(false);
    });

    it("should not capture new initial state after clear by default", () => {
      const { store, timeTravel } = createTimeTravelStore();
      const { counterAtom } = (timeTravel as any).atoms;

      store.set(counterAtom, 1);
      timeTravel.capture("snap1");

      timeTravel.clearHistory();

      expect(timeTravel.getHistory().length).toBe(0);
    });
  });

  describe("getHistory", () => {
    it("should return all snapshots in correct order", () => {
      const { store, timeTravel } = createTimeTravelStore();
      const { counterAtom } = (timeTravel as any).atoms;

      store.set(counterAtom, 1);
      timeTravel.capture("snap1");
      store.set(counterAtom, 2);
      timeTravel.capture("snap2");
      store.set(counterAtom, 3);
      timeTravel.capture("snap3");

      const history = timeTravel.getHistory();

      expect(history.length).toBe(3);
      expect(history[0].metadata.action).toBe("snap1");
      expect(history[1].metadata.action).toBe("snap2");
      expect(history[2].metadata.action).toBe("snap3");
    });

    it("should include past, current, and future snapshots", () => {
      const { store, timeTravel } = createTimeTravelStore();
      const { counterAtom } = (timeTravel as any).atoms;

      store.set(counterAtom, 1);
      timeTravel.capture("snap1");
      store.set(counterAtom, 2);
      timeTravel.capture("snap2");
      store.set(counterAtom, 3);
      timeTravel.capture("snap3");

      timeTravel.undo();

      const history = timeTravel.getHistory();

      expect(history.length).toBe(3);
      expect(history[0].metadata.action).toBe("snap1");
      expect(history[1].metadata.action).toBe("snap2");
      expect(history[2].metadata.action).toBe("snap3");
    });

    it("should return empty array when no history", () => {
      const { timeTravel } = createTimeTravelStore(10, false);

      const history = timeTravel.getHistory();
      expect(history).toEqual([]);
    });
  });
});
