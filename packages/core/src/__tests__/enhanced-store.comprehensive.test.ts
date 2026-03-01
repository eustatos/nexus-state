import { describe, it, expect } from "vitest";
import { createEnhancedStore, atom } from "../index";

describe("enhancedStore - comprehensive scenarios", () => {
  it("should work with multiple atoms and time travel", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });

    const counterAtom = atom(0, "counter");
    const textAtom = atom("hello", "text");

    store.set(counterAtom, 5);
    store.set(textAtom, "world");
    store.captureSnapshot?.("initial update");

    store.set(counterAtom, 10);
    store.set(textAtom, "updated");
    store.captureSnapshot?.("second update");

    // Check that time travel methods exist
    expect(store.undo).toBeDefined();
    expect(store.redo).toBeDefined();
    expect(store.captureSnapshot).toBeDefined();
    
    // Check that we can call undo without errors
    expect(() => store.undo?.()).not.toThrow();
  });

  it("should maintain history integrity across operations", () => {
    const store = createEnhancedStore([], {
      enableTimeTravel: true,
      maxHistory: 3,
    });
    const counterAtom = atom(0);

    for (let i = 1; i <= 5; i++) {
      store.set(counterAtom, i);
      store.captureSnapshot?.(`step ${i}`);
    }

    const history = store.getHistory?.() ?? [];
    expect(history.length).toBe(3);
    // History should contain the most recent actions due to maxHistory limit
    expect(history.length).toBeGreaterThan(0);
    expect(history[history.length - 1].metadata.action).toBe("step 5");

    // Check that navigation methods exist
    expect(store.jumpTo).toBeDefined();
    expect(store.undo).toBeDefined();
  });

  it("should work with DevTools and time travel together", () => {
    const consoleSpy = vi.spyOn(console, "log");
    const store = createEnhancedStore([], {
      enableDevTools: true,
      enableTimeTravel: true,
      devToolsName: "TestStore",
    });

    store.connectDevTools?.();
    expect(consoleSpy).toHaveBeenCalled();

    const counterAtom = atom(0);
    store.set(counterAtom, 5);
    store.captureSnapshot?.("test");
    store.undo?.();

    consoleSpy.mockRestore();
  });
});
