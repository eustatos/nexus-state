import { describe, it, expect, vi } from "vitest";
import { createEnhancedStore } from "../index";

describe("enhancedStore - plugins", () => {
  it("should apply multiple plugins", () => {
    const plugin1 = vi.fn((store) => {});
    const plugin2 = vi.fn((store) => {});

    const store = createEnhancedStore([plugin1, plugin2]);

    expect(plugin1).toHaveBeenCalled();
    expect(plugin2).toHaveBeenCalled();
  });

  it("should pass same store instance to all plugins", () => {
    const storeInstances: any[] = [];

    const plugin1 = (store: any) => storeInstances.push(store);
    const plugin2 = (store: any) => storeInstances.push(store);

    const store = createEnhancedStore([plugin1, plugin2]);

    expect(storeInstances.length).toBe(2);
    expect(storeInstances[0]).toBe(storeInstances[1]);
  });

  it("should allow plugins to enhance store", () => {
    const plugin = (store: any) => {
      store.customMethod = () => "enhanced";
    };

    const store = createEnhancedStore([plugin]);
    expect((store as any).customMethod?.()).toBe("enhanced");
  });

  it("should apply plugins before time travel initialization", () => {
    const plugin = vi.fn();
    const store = createEnhancedStore([plugin], { enableTimeTravel: true });

    expect(plugin).toHaveBeenCalled();
  });

  it("should apply plugins before DevTools initialization", () => {
    const plugin = vi.fn();
    const store = createEnhancedStore([plugin], { enableDevTools: true });

    expect(plugin).toHaveBeenCalled();
  });
});
