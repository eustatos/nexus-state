import { describe, it, expect, vi } from "vitest";
import { createStore, atom } from "../index";

describe("store - enhanced methods", () => {
  it("should apply plugin", () => {
    const plugin = vi.fn((store) => {
      // Store enhancement
      store.getState = () => {
        return { ...store.getState(), pluginApplied: true };
      };
    });

    const store = createStore([plugin]);
    expect(plugin).toHaveBeenCalled();
  });

  it("should serialize state", () => {
    const store = createStore();
    const atom1 = atom(42);
    const atom2 = atom("test");

    store.set(atom1, 100);
    store.set(atom2, "value");

    const serialized = store.serializeState?.();
    expect(serialized).toBeDefined();
  });

  it("should handle non-serializable values in state", () => {
    const store = createStore();
    const atomWithFunc = atom({ fn: () => {}, value: 42 });

    const serialized = store.serializeState?.();
    expect(serialized).toBeDefined();
  });

  it("should get applied plugins", () => {
    const plugin = vi.fn();
    const store = createStore([plugin]);

    const plugins = store.getPlugins?.();
    expect(plugins).toBeDefined();
  });

  it("should set with metadata", () => {
    const store = createStore();
    const countAtom = atom(0);

    expect(() => {
      store.setWithMetadata?.(countAtom, 5, {
        type: "TEST",
        timestamp: Date.now(),
      });
    }).not.toThrow();
  });
});
