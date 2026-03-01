import { describe, it, expect } from "vitest";
import { createEnhancedStore, atom } from "../index";

describe("enhancedStore - time travel API", () => {
  it("should have captureSnapshot method when enabled", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    expect(store.captureSnapshot).toBeDefined();
  });

  it("should not have captureSnapshot method when disabled", () => {
    const store = createEnhancedStore([], { enableTimeTravel: false });
    expect(store.captureSnapshot).toBeUndefined();
  });

  it("should have undo method when enabled", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    expect(store.undo).toBeDefined();
  });

  it("should have redo method when enabled", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    expect(store.redo).toBeDefined();
  });

  it("should have canUndo method when enabled", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    expect(store.canUndo).toBeDefined();
  });

  it("should have canRedo method when enabled", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    expect(store.canRedo).toBeDefined();
  });

  it("should have jumpTo method when enabled", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    expect(store.jumpTo).toBeDefined();
  });

  it("should have clearHistory method when enabled", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    expect(store.clearHistory).toBeDefined();
  });

  it("should have getHistory method when enabled", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    expect(store.getHistory).toBeDefined();
  });

  it("should not have time travel methods when disabled", () => {
    const store = createEnhancedStore([], { enableTimeTravel: false });
    expect(store.captureSnapshot).toBeUndefined();
    expect(store.undo).toBeUndefined();
    expect(store.redo).toBeUndefined();
    expect(store.canUndo).toBeUndefined();
    expect(store.canRedo).toBeUndefined();
    expect(store.jumpTo).toBeUndefined();
    expect(store.clearHistory).toBeUndefined();
    expect(store.getHistory).toBeUndefined();
  });
});
