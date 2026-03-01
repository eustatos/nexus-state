import { describe, it, expect, beforeEach } from "vitest";
import { createEnhancedStore, atom } from "../index";

describe("enhancedStore - time travel operations", () => {
  let store: any;
  let countAtom: any;

  beforeEach(() => {
    store = createEnhancedStore([], { enableTimeTravel: true });
    countAtom = atom(0);
  });

  it("should have captureSnapshot method that creates snapshot", () => {
    expect(store.captureSnapshot).toBeDefined();
    expect(typeof store.captureSnapshot).toBe("function");

    store.set(countAtom, 5);

    const snapshot = store.captureSnapshot?.("set value");
    expect(snapshot).toBeDefined();
    expect(snapshot?.id).toBeDefined();
    expect(snapshot?.metadata.action).toBe("set value");
  });

  it("should have undo method that can be called", () => {
    expect(store.undo).toBeDefined();
    expect(typeof store.undo).toBe("function");

    store.set(countAtom, 10);
    store.captureSnapshot?.("set to 10");

    store.set(countAtom, 20);

    const result = store.undo?.();
    expect(typeof result).toBe("boolean");
  });

  it("should have redo method that can be called", () => {
    expect(store.redo).toBeDefined();
    expect(typeof store.redo).toBe("function");

    store.set(countAtom, 5);
    store.captureSnapshot?.("set to 5");

    store.set(countAtom, 10);
    store.undo?.();

    const result = store.redo?.();
    expect(typeof result).toBe("boolean");
  });

  it("should have canUndo/canRedo methods that return boolean", () => {
    expect(store.canUndo).toBeDefined();
    expect(typeof store.canUndo).toBe("function");
    expect(store.canRedo).toBeDefined();
    expect(typeof store.canRedo).toBe("function");

    const canUndoResult = store.canUndo?.();
    expect(typeof canUndoResult).toBe("boolean");

    store.set(countAtom, 5);
    store.captureSnapshot?.("set to 5");

    const canUndoResult2 = store.canUndo?.();
    expect(typeof canUndoResult2).toBe("boolean");

    const canRedoResult = store.canRedo?.();
    expect(typeof canRedoResult).toBe("boolean");

    store.set(countAtom, 10);
    const canRedoResult2 = store.canRedo?.();
    expect(typeof canRedoResult2).toBe("boolean");

    store.undo?.();
    const canRedoResult3 = store.canRedo?.();
    expect(typeof canRedoResult3).toBe("boolean");
  });

  it("should have undo method that can be called multiple times", () => {
    store.set(countAtom, 1);
    store.captureSnapshot?.("snap1");
    store.set(countAtom, 2);
    store.captureSnapshot?.("snap2");
    store.set(countAtom, 3);
    store.captureSnapshot?.("snap3");

    const result1 = store.undo?.();
    expect(typeof result1).toBe("boolean");

    const result2 = store.undo?.();
    expect(typeof result2).toBe("boolean");

    const result3 = store.undo?.();
    expect(typeof result3).toBe("boolean");
  });

  it("should have redo method that can be called multiple times", () => {
    store.set(countAtom, 1);
    store.captureSnapshot?.("snap1");
    store.set(countAtom, 2);
    store.captureSnapshot?.("snap2");
    store.set(countAtom, 3);
    store.captureSnapshot?.("snap3");

    store.undo?.();
    store.undo?.();

    const result1 = store.redo?.();
    expect(typeof result1).toBe("boolean");

    const result2 = store.redo?.();
    expect(typeof result2).toBe("boolean");
  });
});
