import { describe, it, expect, vi } from "vitest";
import { createEnhancedStore } from "../index";

describe("enhancedStore - DevTools connection", () => {
  it("should have connectDevTools method when enabled", () => {
    const store = createEnhancedStore([], { enableDevTools: true });
    expect(store.connectDevTools).toBeDefined();
    expect(typeof store.connectDevTools).toBe("function");
  });

  it("should not have connectDevTools method when disabled", () => {
    const store = createEnhancedStore([], { enableDevTools: false });
    expect(store.connectDevTools).toBeUndefined();
  });

  it("should connect to DevTools without error", () => {
    const store = createEnhancedStore([], {
      enableDevTools: true,
      devToolsName: "Test Store",
    });

    expect(() => store.connectDevTools?.()).not.toThrow();
  });

  it("should log connection message", () => {
    const consoleSpy = vi.spyOn(console, "log");
    const store = createEnhancedStore([], {
      enableDevTools: true,
      devToolsName: "CustomStore",
    });

    store.connectDevTools?.();
    expect(consoleSpy).toHaveBeenCalledWith(
      "DevTools connected for store:",
      "CustomStore",
    );

    consoleSpy.mockRestore();
  });

  it("should use default name when not provided", () => {
    const consoleSpy = vi.spyOn(console, "log");
    const store = createEnhancedStore([], { enableDevTools: true });

    store.connectDevTools?.();
    expect(consoleSpy).toHaveBeenCalledWith(
      "DevTools connected for store:",
      "EnhancedStore",
    );

    consoleSpy.mockRestore();
  });
});
