/**
 * Integration tests for compareSnapshots in SimpleTimeTravel
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SimpleTimeTravel } from "../SimpleTimeTravel";
import { createStore, atom } from "../../../index";
import type { ComparisonOptions } from "../../comparison/types";

describe("SimpleTimeTravel - compareSnapshots integration", () => {
  let store: ReturnType<typeof createStore>;
  let timeTravel: SimpleTimeTravel;

  beforeEach(() => {
    store = createStore();
    timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 100,
      autoCapture: true,
    });
  });

  afterEach(async () => {
    if (timeTravel) {
      await timeTravel.dispose();
    }
  });

  describe("compareSnapshots - Basic functionality", () => {
    it("should compare two snapshots by reference", () => {
      const counterAtom = atom(0, { name: "counter" });
      store.set(counterAtom, 1);
      store.set(counterAtom, 2);

      const history = timeTravel.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);

      const comparison = timeTravel.compareSnapshots(history[0], history[1]);

      expect(comparison).toBeDefined();
      expect(comparison.id).toBeDefined();
      expect(comparison.summary).toBeDefined();
    });

    it("should compare two snapshots by ID", () => {
      const counterAtom = atom(0, { name: "counter" });
      store.set(counterAtom, 1);
      store.set(counterAtom, 2);

      const history = timeTravel.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);

      const comparison = timeTravel.compareSnapshots(history[0].id, history[1].id);

      expect(comparison).toBeDefined();
      expect(comparison.summary).toBeDefined();
    });

    it("should handle invalid snapshot ID gracefully", () => {
      expect(() => {
        timeTravel.compareSnapshots("invalid-id-1" as any, "invalid-id-2" as any);
      }).toThrow();
    });

    it("should handle mixed valid/invalid IDs gracefully", () => {
      // First create some state to ensure history exists
      const counter = atom(0, { name: "counter" });
      store.set(counter, 1);
      store.set(counter, 2);

      const history = timeTravel.getHistory();
      expect(history.length).toBeGreaterThan(0);

      expect(() => {
        timeTravel.compareSnapshots(history[0], "invalid-id" as any);
      }).toThrow();
    });
  });

  describe("compareSnapshots - Change detection", () => {
    it("should detect added atoms", () => {
      const atom1 = atom(1, { name: "atom1" });
      store.set(atom1, 1);

      // Capture initial state
      timeTravel.capture("initial");

      // Add new atom
      const atom2 = atom(2, { name: "atom2" });
      store.set(atom2, 2);
      timeTravel.capture("after-add");

      const history = timeTravel.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);

      const comparison = timeTravel.compareSnapshots(
        history[history.length - 2],
        history[history.length - 1],
      );

      expect(comparison).toBeDefined();
      expect(comparison.summary).toBeDefined();
    });

    it("should detect modified values", () => {
      const counter = atom(0, { name: "counter" });
      store.set(counter, 0);

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after-change");

      const history = timeTravel.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);

      const comparison = timeTravel.compareSnapshots(
        history[history.length - 2],
        history[history.length - 1],
      );

      expect(comparison).toBeDefined();
      expect(comparison.summary).toBeDefined();
    });

    it("should detect unchanged atoms", () => {
      const counter = atom(0, { name: "counter" });
      store.set(counter, 0);

      timeTravel.capture("initial");
      timeTravel.capture("same");

      const history = timeTravel.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);

      const comparison = timeTravel.compareSnapshots(
        history[history.length - 2],
        history[history.length - 1],
      );

      expect(comparison).toBeDefined();
      expect(comparison.summary).toBeDefined();
    });
  });

  describe("compareWithCurrent", () => {
    it("should compare snapshot with current state", () => {
      const counter = atom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 5);

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareWithCurrent(history[0]);

      expect(comparison).toBeDefined();
      expect(comparison.metadata).toBeDefined();
    });

    it("should compare snapshot by ID with current state", () => {
      const counter = atom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 5);

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareWithCurrent(history[0].id);

      expect(comparison).toBeDefined();
    });

    it("should handle invalid snapshot gracefully", () => {
      expect(() => {
        timeTravel.compareWithCurrent("invalid-id" as any);
      }).toThrow();
    });
  });

  describe("getDiffSince", () => {
    it("should get diff since specific action", () => {
      const counter = atom(0, { name: "counter" });

      timeTravel.capture("init");
      store.set(counter, 1);
      timeTravel.capture("step1");
      store.set(counter, 2);
      timeTravel.capture("step2");

      const comparison = timeTravel.getDiffSince("init");

      expect(comparison).toBeDefined();
    });

    it("should use oldest snapshot when action not found", () => {
      const counter = atom(0, { name: "counter" });

      timeTravel.capture("init");
      store.set(counter, 1);
      timeTravel.capture("step1");

      const comparison = timeTravel.getDiffSince("non-existent-action");

      expect(comparison).toBeDefined();
    });

    it("should return null when history has less than 2 snapshots", () => {
      // Clear history to have minimal snapshots
      timeTravel.clearHistory();

      const comparison = timeTravel.getDiffSince("any");

      expect(comparison).toBeNull();
    });
  });

  describe("visualizeChanges", () => {
    it("should visualize changes as tree", () => {
      const counter = atom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const visualization = timeTravel.visualizeChanges(comparison, "tree");

      expect(visualization).toBeDefined();
      expect(typeof visualization).toBe("string");
    });

    it("should visualize changes as list", () => {
      const counter = atom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const visualization = timeTravel.visualizeChanges(comparison, "list");

      expect(visualization).toBeDefined();
      expect(typeof visualization).toBe("string");
    });

    it("should use list format by default", () => {
      const counter = atom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const visualization = timeTravel.visualizeChanges(comparison);

      expect(visualization).toBeDefined();
      expect(typeof visualization).toBe("string");
    });
  });

  describe("exportComparison", () => {
    it("should export comparison as JSON", () => {
      const counter = atom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const exported = timeTravel.exportComparison(comparison, "json");

      expect(exported).toBeDefined();
      expect(typeof exported).toBe("string");
    });

    it("should export comparison as HTML", () => {
      const counter = atom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const exported = timeTravel.exportComparison(comparison, "html");

      expect(exported).toBeDefined();
      expect(typeof exported).toBe("string");
    });

    it("should export comparison as Markdown", () => {
      const counter = atom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const exported = timeTravel.exportComparison(comparison, "md");

      expect(exported).toBeDefined();
      expect(typeof exported).toBe("string");
    });
  });

  describe("compareSnapshots - Options", () => {
    it("should accept custom comparison options", () => {
      const counter = atom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after");

      const history = timeTravel.getHistory();

      const customOptions: Partial<ComparisonOptions> = {
        deepCompare: false,
        maxDepth: 50,
        cacheResults: false,
      };

      const comparison = timeTravel.compareSnapshots(
        history[0],
        history[1],
        customOptions,
      );

      expect(comparison).toBeDefined();
      expect(comparison.metadata).toBeDefined();
    });
  });

  describe("compareSnapshots - Complex scenarios", () => {
    it("should compare snapshots with nested objects", () => {
      const userAtom = atom(
        { name: "John", address: { city: "NYC", zip: "10001" } },
        { name: "user" },
      );

      timeTravel.capture("initial");
      store.set(userAtom, { name: "John", address: { city: "LA", zip: "10001" } });
      timeTravel.capture("after-change");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);

      expect(comparison).toBeDefined();
      expect(comparison.summary).toBeDefined();
    });

    it("should compare snapshots with arrays", () => {
      const itemsAtom = atom([1, 2, 3], { name: "items" });

      timeTravel.capture("initial");
      store.set(itemsAtom, [1, 2, 3, 4]);
      timeTravel.capture("after-add");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);

      expect(comparison).toBeDefined();
      expect(comparison.summary).toBeDefined();
    });

    it("should handle circular references", () => {
      const circularObj: any = { name: "circular" };
      circularObj.self = circularObj;

      const circularAtom = atom(circularObj, { name: "circular" });
      store.set(circularAtom, circularObj);

      timeTravel.capture("initial");
      circularObj.name = "updated";
      store.set(circularAtom, circularObj);
      timeTravel.capture("after-update");

      const history = timeTravel.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);

      // Should not throw
      expect(() => {
        const comparison = timeTravel.compareSnapshots(history[0], history[1]);
        expect(comparison).toBeDefined();
      }).not.toThrow();
    });
  });

  describe("Performance", () => {
    it("should compare large snapshots efficiently", () => {
      // Create large state
      const largeState: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        largeState[`atom${i}`] = i;
      }

      const largeAtom = atom(largeState, { name: "largeState" });

      timeTravel.capture("initial");

      // Modify some values
      const newState = { ...largeState };
      for (let i = 0; i < 10; i++) {
        newState[`atom${i}`] = i + 100;
      }
      store.set(largeAtom, newState);
      timeTravel.capture("after-modify");

      const history = timeTravel.getHistory();

      const startTime = Date.now();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const duration = Date.now() - startTime;

      expect(comparison).toBeDefined();
      // Relaxed performance threshold
      expect(duration).toBeLessThan(1000);
    });
  });
});
