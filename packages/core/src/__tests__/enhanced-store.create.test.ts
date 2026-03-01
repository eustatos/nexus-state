import { describe, it, expect, vi } from "vitest";
import { createEnhancedStore, atom } from "../index";

describe("enhancedStore - createEnhancedStore", () => {
  it("should create an enhanced store without options", () => {
    const store = createEnhancedStore();
    expect(store).toBeDefined();
    expect(typeof store.get).toBe("function");
    expect(typeof store.set).toBe("function");
    expect(typeof store.subscribe).toBe("function");
    expect(typeof store.getState).toBe("function");
  });

  it("should create an enhanced store with empty plugins array", () => {
    const store = createEnhancedStore([]);
    expect(store).toBeDefined();
  });

  it("should create an enhanced store with plugins", () => {
    const plugin = vi.fn((store) => {
      store.applyPlugin = (p) => console.log("Plugin applied");
    });
    const store = createEnhancedStore([plugin]);
    expect(plugin).toHaveBeenCalled();
  });

  it("should enable DevTools by default", () => {
    const store = createEnhancedStore();
    expect(store).toBeDefined();
    expect(store.connectDevTools).toBeDefined();
  });

  it("should support isolated registry mode", () => {
    const store = createEnhancedStore([], { registryMode: "isolated" });
    expect(store).toBeDefined();
  });

  it("should create store with custom name", () => {
    const store = createEnhancedStore([], { devToolsName: "CustomStore" });
    expect(store).toBeDefined();
  });
});
