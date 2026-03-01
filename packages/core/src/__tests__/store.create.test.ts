import { describe, it, expect, vi } from "vitest";
import { createStore } from "../index";

describe("store - createStore", () => {
  it("should create a store without plugins", () => {
    const store = createStore();
    expect(store).toBeDefined();
    expect(typeof store.get).toBe("function");
    expect(typeof store.set).toBe("function");
    expect(typeof store.subscribe).toBe("function");
    expect(typeof store.getState).toBe("function");
  });

  it("should create a store with plugins", () => {
    const plugin = vi.fn((store) => {
      store.applyPlugin = (p) => {
        console.log("Plugin applied");
      };
    });
    const store = createStore([plugin]);
    expect(store).toBeDefined();
    expect(plugin).toHaveBeenCalled();
  });

  it("should create enhanced store with isolated mode", () => {
    const store = createStore([]);
    expect(store).toBeDefined();
    expect(store.getState()).toBeDefined();
  });
});
