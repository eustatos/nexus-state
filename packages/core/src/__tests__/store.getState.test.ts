import { describe, it, expect } from "vitest";
import { createStore, atom } from "../index";

describe("store - getState", () => {
  it("should return all atom states", () => {
    const store = createStore();
    const atom1 = atom(1);
    const atom2 = atom("test");

    store.set(atom1, 10);
    store.set(atom2, "value");

    const state = store.getState();
    expect(Object.keys(state).length).toBe(2);
    // Check that state contains the values (keys are symbol string representations)
    const stateValues = Object.values(state);
    expect(stateValues).toContain(10);
    expect(stateValues).toContain("value");
  });

  it("should handle empty store", () => {
    const store = createStore();
    const state = store.getState();
    expect(state).toEqual({});
  });

  it("should include atom names in state keys", () => {
    const store = createStore();
    const countAtom = atom(0, "count");
    store.set(countAtom, 42);

    const state = store.getState();
    expect(state).toHaveProperty("count");
    expect(state.count).toBe(42);
  });

  it("should include all atoms after multiple operations", () => {
    const store = createStore();
    const atom1 = atom(1, "first");
    const atom2 = atom(2, "second");

    store.set(atom1, 10);
    store.set(atom2, 20);

    const state = store.getState();
    expect(state.first).toBe(10);
    expect(state.second).toBe(20);
  });
});
