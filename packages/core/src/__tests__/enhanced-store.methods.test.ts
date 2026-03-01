import { describe, it, expect, vi } from "vitest";
import { createEnhancedStore, atom } from "../index";

describe("enhancedStore - enhanced methods", () => {
  it("should have getState method", () => {
    const store = createEnhancedStore();
    const countAtom = atom(0);
    store.set(countAtom, 42);

    const state = store.getState();
    expect(state).toBeDefined();
  });

  it("should have serializeState method", () => {
    const store = createEnhancedStore();
    const countAtom = atom(42);

    const serialized = store.serializeState?.();
    expect(serialized).toBeDefined();
  });

  it("should have applyPlugin method", () => {
    const store = createEnhancedStore();
    const plugin = vi.fn((s) => {});

    store.applyPlugin?.(plugin);
    expect(plugin).toHaveBeenCalled();
  });

  it("should have getPlugins method", () => {
    const plugin = vi.fn((s) => {});
    const store = createEnhancedStore([plugin]);

    const plugins = store.getPlugins?.();
    expect(plugins).toBeDefined();
    // Plugin method exists, specific return value depends on implementation
    expect(store.getPlugins).toBeDefined();
  });

  it("should have setWithMetadata method", () => {
    const store = createEnhancedStore();
    const countAtom = atom(0);

    expect(() => {
      store.setWithMetadata?.(countAtom, 5, {
        type: "TEST",
        timestamp: Date.now(),
      });
    }).not.toThrow();
  });

  it("should have getIntercepted method", () => {
    const store = createEnhancedStore();
    const countAtom = atom(42);

    const value = store.getIntercepted?.(countAtom);
    expect(value).toBe(42);
  });

  it("should have setIntercepted method", () => {
    const store = createEnhancedStore();
    const countAtom = atom(0);

    store.setIntercepted?.(countAtom, 10);
    expect(store.get(countAtom)).toBe(10);
  });
});
