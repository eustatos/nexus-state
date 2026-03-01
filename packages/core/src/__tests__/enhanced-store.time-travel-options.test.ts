import { describe, it, expect } from "vitest";
import { createEnhancedStore, atom } from "../index";

describe("enhancedStore - time travel options", () => {
  it("should have getHistory method that returns array", () => {
    const store = createEnhancedStore([], {
      enableTimeTravel: true,
      maxHistory: 3,
    });
    const countAtom = atom(0);

    for (let i = 0; i < 5; i++) {
      store.set(countAtom, i);
      store.captureSnapshot?.(`step ${i}`);
    }

    expect(store.getHistory).toBeDefined();
    expect(typeof store.getHistory).toBe("function");

    const history = store.getHistory?.() ?? [];
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it("should handle auto capture disabled", () => {
    const store = createEnhancedStore([], {
      enableTimeTravel: true,
      autoCapture: false,
    });
    const countAtom = atom(0);

    store.set(countAtom, 5);
    const history = store.getHistory?.() ?? [];
    expect(Array.isArray(history)).toBe(true);

    store.captureSnapshot?.("manual capture");
    const history2 = store.getHistory?.() ?? [];
    expect(Array.isArray(history2)).toBe(true);
    expect(history2.length).toBeGreaterThan(0);
  });

  it("should handle auto capture enabled by default", () => {
    const store = createEnhancedStore([], {
      enableTimeTravel: true,
    });
    const countAtom = atom(0);

    store.set(countAtom, 5);
    const history = store.getHistory?.() ?? [];
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it("should have captureSnapshot and getHistory methods", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const countAtom = atom(0);

    expect(store.captureSnapshot).toBeDefined();
    expect(store.getHistory).toBeDefined();

    for (let i = 0; i < 5; i++) {
      store.set(countAtom, i);
      store.captureSnapshot?.(`step ${i}`);
    }

    const history = store.getHistory?.() ?? [];
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });
});
