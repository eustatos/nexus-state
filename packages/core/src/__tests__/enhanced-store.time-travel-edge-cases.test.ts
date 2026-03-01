import { describe, it, expect } from "vitest";
import { createEnhancedStore, atom } from "../index";

describe("enhancedStore - time travel edge cases", () => {
  it("should have undo method that can be called", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });

    expect(store.undo).toBeDefined();
    expect(typeof store.undo).toBe("function");

    const result = store.undo?.();
    expect(typeof result).toBe("boolean");
  });

  it("should have redo method that can be called", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const countAtom = atom(0);

    expect(store.redo).toBeDefined();
    expect(typeof store.redo).toBe("function");

    store.set(countAtom, 5);
    store.captureSnapshot?.("set to 5");

    store.undo?.();
    const result = store.redo?.();
    expect(typeof result).toBe("boolean");

    const result2 = store.redo?.();
    expect(typeof result2).toBe("boolean");
  });

  it("should have jumpTo method that returns boolean", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const countAtom = atom(0);

    expect(store.jumpTo).toBeDefined();
    expect(typeof store.jumpTo).toBe("function");

    store.set(countAtom, 1);
    store.captureSnapshot?.("snap1");
    store.set(countAtom, 2);
    store.captureSnapshot?.("snap2");
    store.set(countAtom, 3);
    store.captureSnapshot?.("snap3");

    const result = store.jumpTo?.(1);
    expect(typeof result).toBe("boolean");
  });

  it("should have jumpTo method that handles invalid index", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const countAtom = atom(0);

    store.set(countAtom, 5);
    store.captureSnapshot?.("set to 5");

    const result = store.jumpTo?.(100);
    expect(typeof result).toBe("boolean");
  });

  it("should have jumpTo method that handles negative index", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const countAtom = atom(0);

    store.set(countAtom, 5);
    store.captureSnapshot?.("set to 5");

    const result = store.jumpTo?.(-1);
    expect(typeof result).toBe("boolean");
  });

  it("should have clearHistory method that can be called", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const countAtom = atom(0);

    expect(store.clearHistory).toBeDefined();
    expect(typeof store.clearHistory).toBe("function");

    store.set(countAtom, 5);
    store.captureSnapshot?.("set to 5");
    store.set(countAtom, 10);
    store.captureSnapshot?.("set to 10");

    expect(store.getHistory).toBeDefined();
    expect(typeof store.getHistory).toBe("function");

    store.clearHistory?.();
    expect(store.getHistory?.()).toBeDefined();
    expect(Array.isArray(store.getHistory?.())).toBe(true);
  });

  it("should have captureSnapshot method that can be called", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const countAtom = atom(0);

    expect(store.captureSnapshot).toBeDefined();
    expect(typeof store.captureSnapshot).toBe("function");

    store.set(countAtom, 5);
    const snapshot = store.captureSnapshot?.("set to 5");
    expect(snapshot).toBeDefined();
  });
});
