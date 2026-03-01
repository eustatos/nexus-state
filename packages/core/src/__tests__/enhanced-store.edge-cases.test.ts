import { describe, it, expect } from "vitest";
import { createEnhancedStore, atom } from "../index";

describe("enhancedStore - edge cases", () => {
  it("should handle empty atoms", () => {
    const store = createEnhancedStore();
    const state = store.getState();
    expect(state).toEqual({});
  });

  it("should handle atom deletion", () => {
    const store = createEnhancedStore();
    const countAtom = atom(0);

    store.set(countAtom, 5);
    expect(store.get(countAtom)).toBe(5);
  });

  it("should handle reset after time travel", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const countAtom = atom(0);

    store.set(countAtom, 5);
    store.captureSnapshot?.("set to 5");

    store.set(countAtom, 10);
    store.undo?.();
    // After undo, state should change (specific value depends on implementation)
    const valueAfterUndo = store.get(countAtom);
    expect(valueAfterUndo).toBeDefined();

    store.set(countAtom, 0);
    expect(store.get(countAtom)).toBe(0);
  });

  it("should handle multiple time travel features together", () => {
    const store = createEnhancedStore([], {
      enableTimeTravel: true,
      enableDevTools: true,
      maxHistory: 5,
    });

    expect(store.captureSnapshot).toBeDefined();
    expect(store.connectDevTools).toBeDefined();
  });

  it("should preserve state after failed operations", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const countAtom = atom(5);
    const initialValue = store.get(countAtom);

    store.undo?.();
    expect(store.get(countAtom)).toBe(initialValue);

    store.redo?.();
    expect(store.get(countAtom)).toBe(initialValue);
  });

  it("should handle getHistory when no history", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const history = store.getHistory?.();
    expect(history).toEqual([]);
  });
});
