import { describe, it, expect } from "vitest";
import { createToggle, createHistoryAtom, createSyncedAtoms } from "../writable-helpers";
import { createStore } from "../../index";

describe("createToggle - basic", () => {
  it("should create toggle with default initial value", () => {
    const toggle = createToggle();
    const store = createStore();
    expect(store.get(toggle)).toBe(false);
  });

  it("should create toggle with custom initial value", () => {
    const toggle = createToggle({ initial: true });
    const store = createStore();
    expect(store.get(toggle)).toBe(true);
  });

  it("should set to true", () => {
    const toggle = createToggle();
    const store = createStore();
    store.set(toggle, true);
    expect(store.get(toggle)).toBe(true);
  });

  it("should set to false", () => {
    const toggle = createToggle({ initial: true });
    const store = createStore();
    store.set(toggle, false);
    expect(store.get(toggle)).toBe(false);
  });
});

describe("createHistoryAtom - basic", () => {
  it("should create history atom with initial value", () => {
    const historyAtom = createHistoryAtom({ initial: "" });
    const store = createStore();
    expect(store.get(historyAtom)).toBe("");
  });

  it("should set value", () => {
    const historyAtom = createHistoryAtom({ initial: "" });
    const store = createStore();
    store.set(historyAtom, "first");
    expect(store.get(historyAtom)).toBe("first");
  });

  it("should update value", () => {
    const historyAtom = createHistoryAtom({ initial: "" });
    const store = createStore();
    store.set(historyAtom, "first");
    store.set(historyAtom, "second");
    expect(store.get(historyAtom)).toBe("second");
  });

  it("should handle clear", () => {
    const historyAtom = createHistoryAtom({ initial: "initial" });
    const store = createStore();
    store.set(historyAtom, "modified");
    store.set(historyAtom, "initial");
    expect(store.get(historyAtom)).toBe("initial");
  });
});

describe("createHistoryAtom - max history", () => {
  it("should accept maxHistory option", () => {
    const historyAtom = createHistoryAtom({ initial: 0, maxHistory: 3 });
    const store = createStore();
    expect(store.get(historyAtom)).toBe(0);
  });
});

describe("createSyncedAtoms - basic", () => {
  it("should create master and slave atoms", () => {
    const { master, slaves } = createSyncedAtoms({ initial: 0, slaveCount: 2 });
    const store = createStore();
    expect(store.get(master)).toBe(0);
    expect(slaves.length).toBe(2);
    expect(store.get(slaves[0])).toBe(0);
    expect(store.get(slaves[1])).toBe(0);
  });

  it("should set all atoms with setAll", () => {
    const { master, slaves, setAll } = createSyncedAtoms({
      initial: 0,
      slaveCount: 2,
    });
    const store = createStore();
    setAll(store, 10);
    expect(store.get(master)).toBe(10);
    expect(store.get(slaves[0])).toBe(10);
    expect(store.get(slaves[1])).toBe(10);
  });

  it("should update master independently", () => {
    const { master, slaves } = createSyncedAtoms({ initial: 0, slaveCount: 2 });
    const store = createStore();
    store.set(master, 5);
    expect(store.get(master)).toBe(5);
    expect(store.get(slaves[0])).toBe(5);
  });
});
